// Post chain: volumetric fog -> fog combine (+rain) -> wet windshield + wipers -> bloom -> film composite.
import * as THREE from 'three';
import { NOISE, LIGHTS } from './glsl.js';

const FSQ_VS = /* glsl */ `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`;

function rt(w, h, opts = {}) {
  const t = new THREE.WebGLRenderTarget(w, h, {
    type: THREE.HalfFloatType,
    format: THREE.RGBAFormat,
    minFilter: opts.mip ? THREE.LinearMipmapLinearFilter : THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
    generateMipmaps: !!opts.mip,
    depthBuffer: !!opts.depth,
    samples: opts.samples || 0,
  });
  t.texture.colorSpace = THREE.NoColorSpace;
  return t;
}

export function makeNoise3D(size = 64) {
  const data = new Uint8Array(size * size * size);
  const h = (x, y, z) => {
    x = ((x % size) + size) % size; y = ((y % size) + size) % size; z = ((z % size) + size) % size;
    let n = x * 374761393 + y * 668265263 + z * 2147483647;
    n = (n ^ (n >>> 13)) * 1274126177;
    return ((n ^ (n >>> 16)) >>> 0) / 4294967295;
  };
  const vn = (x, y, z, p) => {
    const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
    const xf = x - xi, yf = y - yi, zf = z - zi;
    const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf), w = zf * zf * (3 - 2 * zf);
    const g = (a, b, c) => h(((a % p) + p) % p * (size / p), ((b % p) + p) % p * (size / p), ((c % p) + p) % p * (size / p));
    const l = (a, b, t) => a + (b - a) * t;
    return l(l(l(g(xi, yi, zi), g(xi + 1, yi, zi), u), l(g(xi, yi + 1, zi), g(xi + 1, yi + 1, zi), u), v),
      l(l(g(xi, yi, zi + 1), g(xi + 1, yi, zi + 1), u), l(g(xi, yi + 1, zi + 1), g(xi + 1, yi + 1, zi + 1), u), v), w);
  };
  let i = 0;
  for (let z = 0; z < size; z++)
    for (let y = 0; y < size; y++)
      for (let x = 0; x < size; x++) {
        const f = (o) => (x / size) * o, g = (o) => (y / size) * o, k = (o) => (z / size) * o;
        const n = 0.55 * vn(f(4), g(4), k(4), 4) + 0.3 * vn(f(8), g(8), k(8), 8) + 0.15 * vn(f(16), g(16), k(16), 16);
        data[i++] = Math.max(0, Math.min(255, Math.round(n * 255)));
      }
  const tex = new THREE.Data3DTexture(data, size, size, size);
  tex.format = THREE.RedFormat;
  tex.type = THREE.UnsignedByteType;
  tex.minFilter = tex.magFilter = THREE.LinearFilter;
  tex.wrapS = tex.wrapT = tex.wrapR = THREE.RepeatWrapping;
  tex.unpackAlignment = 1;
  tex.needsUpdate = true;
  return tex;
}

export class Post {
  constructor(renderer, OW, OH, U, cfg) {
    this.r = renderer;
    this.thresh = 0.02;
    const rs = cfg.renderScale || 1;
    const W = Math.round(OW * rs), H = Math.round(OH * rs);
    this.W = W; this.H = H; this.OW = OW; this.OH = OH;
    this.W = W; this.H = H;
    this.U = U;
    const vs = cfg.volScale || 3;
    const ss = cfg.sceneScale || 1;
    this.rtScene = rt(Math.round(W * ss), Math.round(H * ss), { depth: true, samples: cfg.msaa ?? 4 });
    this.rtVol = rt(Math.round(W / vs), Math.round(H / vs));
    this.rtFog = rt(W, H, { mip: true });
    this.rtWin = rt(W, H);
    this.bloomDown = [];
    this.bloomUp = [];
    let w = W, h = H;
    for (let i = 0; i < 6; i++) {
      w = Math.max(1, Math.round(w / 2)); h = Math.max(1, Math.round(h / 2));
      this.bloomDown.push(rt(w, h));
      this.bloomUp.push(rt(w, h));
    }
    this.cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    this.quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2));
    this.quad.frustumCulled = false;
    this.qscene = new THREE.Scene();
    this.qscene.add(this.quad);
    this.noise = makeNoise3D(64);

    const common = { uTime: U.uTime, uCamPos: U.uCamPos };
    this.vol = new THREE.ShaderMaterial({
      uniforms: {
        ...U,
        tDepth: { value: null }, tNoise: { value: this.noise },
        uInvProj: { value: new THREE.Matrix4() }, uCamWorld: { value: new THREE.Matrix4() },
        uSigma: { value: 0.012 }, uMist: { value: 0.05 }, uGroundY: { value: 0 },
        uWind: { value: new THREE.Vector3(0.010, 0.0, 0.004) },
        uSprayA: { value: [new THREE.Vector4(), new THREE.Vector4()] },
        uSprayB: { value: [new THREE.Vector4(), new THREE.Vector4()] },
        uVolCount: { value: 8 }, uMaxD: { value: 240 },
      },
      vertexShader: FSQ_VS,
      fragmentShader: /* glsl */ `
        precision highp sampler3D;
        ${NOISE}
        ${LIGHTS}
        uniform float uTime;
        uniform sampler2D tDepth; uniform sampler3D tNoise;
        uniform mat4 uInvProj; uniform mat4 uCamWorld;
        uniform float uSigma, uMist, uGroundY, uMaxD; uniform vec3 uWind;
        uniform vec4 uSprayA[2]; uniform vec4 uSprayB[2];
        uniform int uVolCount;
        varying vec2 vUv;
        float hg(float c, float g){ float g2 = g*g; return (1.0-g2)/(12.566*pow(1.0+g2-2.0*g*c, 1.5)); }
        float phase(float c){ return 0.88*hg(c, 0.78) + 0.12*0.0796; }
        float density(vec3 p, out float extra){
          vec3 q = p*0.021 + uWind*uTime;
          float n = texture(tNoise, q).r*0.7 + texture(tNoise, q*2.7 + 0.37).r*0.3;
          float ground = exp(-max(p.y - uGroundY, 0.0)/6.5);
          extra = uMist*smoothstep(0.40, 0.72, n)*ground;
          for (int k=0;k<2;k++){
            vec4 A = uSprayA[k], B = uSprayB[k];
            if (A.w <= 0.0) continue;
            vec3 pa = p - A.xyz, ba = B.xyz - A.xyz;
            float h = clamp(dot(pa,ba)/dot(ba,ba), 0.0, 1.0);
            vec3 dd = pa - ba*h;
            extra += A.w*exp(-dot(dd,dd)/(2.0*2.4*2.4))*(0.5 + 0.5*texture(tNoise, p*0.15).r);
          }
          return uSigma + extra;
        }
        vec3 skyAmb(vec3 dir){
          float c = texture(tNoise, vec3(dir.xz/(dir.y+0.35)*0.18, uTime*0.004)).r;
          return uFogAmb*mix(1.25, 0.55, smoothstep(-0.05, 0.45, dir.y))*(0.75 + 0.5*c);
        }
        void main(){
          float depth = texture(tDepth, vUv).a;
          vec4 vp = uInvProj*vec4(vUv*2.0-1.0, 1.0, 1.0); vp /= vp.w;
          vec3 dir = normalize(mat3(uCamWorld)*normalize(vp.xyz));
          float maxD = min(depth, uMaxD);
          const int N = 16;
          float jit = fract(52.9829189*fract(dot(gl_FragCoord.xy, vec2(0.06711056, 0.00583715))));
          vec3 L = vec3(0.0); float T = 1.0, Tx = 1.0, prev = 0.0;
          for (int i=0;i<N;i++){
            float f1 = float(i+1)/float(N);
            float tt = maxD*f1*f1;
            float tm = maxD*pow((float(i)+jit)/float(N), 2.0);
            float dt = tt - prev; prev = tt;
            vec3 p = uCamPos + dir*max(tm, 0.3);
            float extra;
            float sig = density(p, extra);
            vec3 Ls = uFogAmb;
            for (int j=0;j<MAXL;j++){
              if (j >= uVolCount || j >= uLCount) break;
              vec3 Lv = uLPos[j]-p; float d2 = dot(Lv,Lv);
              vec3 Ld = Lv*inversesqrt(d2);
              float b = beam(j, -Ld);
              if (b <= 0.0) continue;
              Ls += uLCol[j]*b/(d2+0.8)*phase(dot(Ld, dir));
            }
            float sT = exp(-sig*dt);
            L += T*Ls*(1.0 - sT);
            T *= sT;
            Tx *= exp(-extra*dt);
          }
          if (depth > uMaxD) L += T*skyAmb(dir);
          gl_FragColor = vec4(L, Tx);
        }`,
      vertexShader: FSQ_VS,
    });

    this.fog = new THREE.ShaderMaterial({
      uniforms: { tScene: { value: null }, tVol: { value: null }, uSigma: this.vol.uniforms.uSigma, uMaxD: this.vol.uniforms.uMaxD },
      vertexShader: FSQ_VS,
      fragmentShader: /* glsl */ `
        uniform sampler2D tScene, tVol; uniform float uSigma, uMaxD;
        varying vec2 vUv;
        void main(){
          vec4 sc = texture(tScene, vUv);
          vec4 v = texture(tVol, vUv);
          float T = exp(-uSigma*min(sc.a, uMaxD))*v.a;
          if (sc.a > uMaxD) T = 0.0;
          gl_FragColor = vec4(sc.rgb*T + v.rgb, 1.0);
        }`,
    });

    this.win = new THREE.ShaderMaterial({
      uniforms: {
        tFog: { value: null }, uTime: U.uTime, uAspect: { value: W / H },
        uWiper: { value: new THREE.Vector4(2.8, 0.85, 0.07, 2.62) },
        uPivots: { value: new THREE.Vector4(0.60, -0.11, 1.40, -0.11) },
        uBlade: { value: new THREE.Vector2(0.17, 1.0) },
        uSplash: { value: new THREE.Vector4(-1, -1, -1, -1) },
        uFill: { value: 2.2 },
        uDebugClear: { value: 0 },
      },
      vertexShader: FSQ_VS,
      fragmentShader: /* glsl */ `
        ${NOISE}
        uniform sampler2D tFog; uniform float uTime, uAspect, uFill;
        uniform vec4 uWiper, uPivots, uSplash; uniform vec2 uBlade;
        varying vec2 vUv;
        const float PI = 3.14159265;
        float ease(float x){ return 0.5 - 0.5*cos(PI*x); }
        float wAngle(float t){
          float P = uWiper.x, S = uWiper.y, ph = mod(t, P);
          if (ph < S) return mix(uWiper.z, uWiper.w, ease(ph/S));
          if (ph < 2.0*S) return mix(uWiper.w, uWiper.z, ease((ph-S)/S));
          return uWiper.z;
        }
        float wDir(float t){ float ph = mod(t, uWiper.x); return ph < uWiper.y ? 1.0 : (ph < 2.0*uWiper.y ? -1.0 : 0.0); }
        float wipeAge(vec2 g, vec2 piv, float t){
          vec2 d = g - piv; float r = length(d);
          if (r < uBlade.x - 0.015 || r > uBlade.y + 0.012) return 1000.0;
          float phi = atan(d.y, d.x);
          if (phi < uWiper.z || phi > uWiper.w) return 1000.0;
          float y = (phi - uWiper.z)/(uWiper.w - uWiper.z);
          float x = acos(clamp(1.0 - 2.0*y, -1.0, 1.0))/PI;
          float P = uWiper.x, S = uWiper.y;
          float tUp = x*S, tDn = S + (1.0 - x)*S;
          float c = floor(t/P)*P, ph = t - c;
          float last = ph >= tDn ? c + tDn : (ph >= tUp ? c + tUp : c - P + tDn);
          return t - last;
        }
        vec3 staticLayer(vec2 g, float scale, float age, float fill, float seed, float rmax){
          vec2 p = g*scale;
          vec2 id = floor(p); vec2 f = fract(p) - 0.5;
          vec3 h = hash32(id + seed);
          vec2 c = (h.xy - 0.5)*(0.9 - 2.0*rmax);
          float r = mix(0.08, rmax, h.z*h.z);
          float appear = hash12(id*1.37 + seed*3.1)*fill;
          float vis = smoothstep(appear, appear + 0.1, age);
          vec2 d = (f - c)*vec2(1.0, 0.88);
          float l = length(d)/r;
          float m = smoothstep(1.0, 0.8, l)*vis;
          return vec3(d/r*m, m);
        }
        // tall cells with one drop sliding down and a trail of droplets behind it
        vec4 slideLayer(vec2 g, float t, float scale, float age, float seed){
          vec2 uv = g*vec2(scale, scale/3.0);
          float cx = floor(uv.x);
          uv.y += hash11(cx*7.13 + seed);
          vec2 id = floor(uv);
          vec2 st = fract(uv);
          vec3 h = hash32(id + seed*1.7);
          float v = 0.18 + 0.35*h.x;
          float ti = fract(t*v + h.y);
          float y = 1.08 - 1.16*(ti + 0.035*sin(ti*26.0));
          float x = 0.5 + (h.z - 0.5)*0.45 + 0.07*sin(st.y*11.0 + h.x*6.0);
          vec2 dg = (st - vec2(x, y))*vec2(1.0, 3.0);
          float r = 0.17 + 0.08*h.z;
          float th = 0.5 + h.y*1.8;
          float vis = smoothstep(th, th + 0.3, age)*smoothstep(1.08, 0.92, y)*smoothstep(-0.08, 0.06, y);
          float l = length(dg*vec2(1.0, 0.8))/r;
          float m = smoothstep(1.0, 0.78, l)*vis;
          vec2 off = dg/r*m;
          float above = step(y, st.y);
          float cd = abs(st.x - x);
          float trail = smoothstep(0.10, 0.03, cd)*above*smoothstep(y + 0.55, y, st.y)*vis;
          float ty = (floor(st.y*12.0) + 0.5)/12.0;
          float hx = hash12(vec2(id.x*3.1 + floor(st.y*12.0), id.y + seed));
          vec2 td = (st - vec2(x + (hx-0.5)*0.05, ty))*vec2(1.0, 3.0);
          float tr = 0.045 + 0.04*hx;
          float tl = length(td)/tr;
          float tm = smoothstep(1.0, 0.75, tl)*step(0.35, hx)*above*step(ty, y + 0.5)*vis;
          off += td/tr*tm;
          return vec4(off, max(m, tm), trail);
        }
        float blade(vec2 g, vec2 piv, float ang){
          vec2 dir = vec2(cos(ang), sin(ang));
          vec2 d = g - piv;
          float al = dot(d, dir), ac = dot(d, vec2(-dir.y, dir.x));
          float bl = smoothstep(0.0085, 0.0040, abs(ac))*smoothstep(uBlade.x - 0.01, uBlade.x + 0.006, al)*smoothstep(uBlade.y + 0.008, uBlade.y - 0.004, al);
          float arm = smoothstep(0.0058, 0.0026, abs(ac - 0.013))*smoothstep(-0.02, 0.02, al)*smoothstep(uBlade.y*0.9, uBlade.y*0.86, al);
          return max(bl, arm);
        }
        uniform float uDebugClear;
        void main(){
          vec2 uv = vUv;
          if (uDebugClear > 0.5) { gl_FragColor = vec4(textureLod(tFog, uv, 0.0).rgb, 0.0); return; }
          vec2 g = vec2(uv.x*uAspect, uv.y);
          float ageA = wipeAge(g, uPivots.xy, uTime), ageB = wipeAge(g, uPivots.zw, uTime);
          vec2 piv = ageA < ageB ? uPivots.xy : uPivots.zw;
          float age = min(ageA, ageB);
          float never = step(900.0, age);
          // splashes from passing trucks: water stays until the blade passes
          float spl = 0.0;
          for (int k=0;k<4;k++){
            float ts = uSplash[k];
            if (ts < 0.0 || uTime < ts) continue;
            float since = uTime - ts;
            if (since < age) spl = max(spl, (1.0 - 0.45*uv.x)*smoothstep(0.0, 0.12, since));
          }
          float ageE = min(age, 60.0) + spl*6.0;
          vec2 off = vec2(0.0); float mask = 0.0; vec4 sl = vec4(0.0), sl2 = vec4(0.0);
          if (ageE > 0.04) {
            vec3 s1 = staticLayer(g, 24.0, ageE, uFill*1.3, 1.0, 0.30);
            vec3 s2 = staticLayer(g + 0.37, 52.0, ageE, uFill*1.0, 7.0, 0.30);
            vec3 s3 = staticLayer(g + 0.71, 105.0, ageE, uFill*0.8, 13.0, 0.28);
            vec3 s4 = ageE > 3.5 ? staticLayer(g + 0.19, 11.0, ageE - 3.5, 6.0, 21.0, 0.26) : vec3(0.0);
            sl = slideLayer(g, uTime, 13.0, ageE, 3.0);
            sl2 = slideLayer(g + vec2(0.031, 0.5), uTime*1.15, 21.0, ageE, 9.0);
            off = s1.xy*0.9 + s2.xy*0.65 + s3.xy*0.4 + s4.xy*1.2 + sl.xy + sl2.xy*0.8;
            mask = clamp(max(max(s1.z, s2.z), max(max(s3.z, s4.z), max(sl.z, sl2.z))), 0.0, 1.0);
          }
          float film = max(mix(smoothstep(0.1, 2.6, age), 1.0, never), spl);
          film *= 1.0 - 0.75*max(sl.w, sl2.w);
          // bead of water pushed ahead of the moving blade
          float ang = wAngle(uTime);
          vec2 d = g - piv; float r = length(d); float phi = atan(d.y, d.x);
          float ahead = (phi - ang)*wDir(uTime)*r;
          float bead = smoothstep(0.03, 0.006, ahead)*smoothstep(0.0, 0.006, ahead)*step(uBlade.x, r)*step(r, uBlade.y)*abs(wDir(uTime));
          vec2 sheetN = vec2(vnoise(g*vec2(10.0, 3.0) + vec2(0.0, uTime*0.7)), vnoise(g*vec2(10.0, 3.0) + vec2(5.2, uTime*0.7 + 3.0))) - 0.5;
          vec2 sheet = sheetN*(0.008*film + 0.03*bead + 0.012*spl);
          float lodBg = 1.5*film + 1.0*never + 1.2*bead + 0.8*spl;
          vec3 bg = textureLod(tFog, uv + sheet, lodBg).rgb;
          vec2 duv = uv - off*vec2(1.0/uAspect, 1.0)*0.05;
          vec3 dr = textureLod(tFog, duv, 1.0).rgb;
          float rim = smoothstep(0.55, 1.0, length(off))*mask;
          vec3 col = mix(bg, dr*(1.0 - 0.35*rim), mask);
          // wiper blades (out of focus, near-black silhouettes)
          float bm = max(blade(g, uPivots.xy, ang), blade(g, uPivots.zw, ang));
          vec3 amb = textureLod(tFog, uv, 6.0).rgb;
          col = mix(col, vec3(0.0006) + amb*0.05, bm);
          float smear = exp(-min(age, 50.0)*1.4)*(0.5 + 0.5*sin(r*1400.0 + hash11(floor(r*90.0))*6.28))*(1.0 - never);
          gl_FragColor = vec4(col, clamp(0.35*smear + 0.65*film, 0.0, 1.0));
        }`,
    });

    this.down = new THREE.ShaderMaterial({
      uniforms: { tSrc: { value: null }, uTexel: { value: new THREE.Vector2() }, uThresh: { value: 0 } },
      vertexShader: FSQ_VS,
      fragmentShader: /* glsl */ `
        uniform sampler2D tSrc; uniform vec2 uTexel; uniform float uThresh;
        varying vec2 vUv;
        vec3 S(vec2 o){ return texture(tSrc, vUv + o*uTexel).rgb; }
        void main(){
          vec3 a = S(vec2(-2,2)), b = S(vec2(0,2)), c = S(vec2(2,2));
          vec3 d = S(vec2(-2,0)), e = S(vec2(0,0)), f = S(vec2(2,0));
          vec3 g = S(vec2(-2,-2)), h = S(vec2(0,-2)), i = S(vec2(2,-2));
          vec3 j = S(vec2(-1,1)), k = S(vec2(1,1)), l = S(vec2(-1,-1)), m = S(vec2(1,-1));
          vec3 o = e*0.125 + (a+c+g+i)*0.03125 + (b+d+f+h)*0.0625 + (j+k+l+m)*0.125;
          if (uThresh > 0.0) {
            float br = max(o.r, max(o.g, o.b));
            float soft = clamp(br - uThresh*0.5, 0.0, uThresh);
            soft = soft*soft/(4.0*uThresh + 1e-4);
            o *= max(soft, br - uThresh)/max(br, 1e-4);
          }
          gl_FragColor = vec4(o, 1.0);
        }`,
    });
    this.up = new THREE.ShaderMaterial({
      uniforms: { tSrc: { value: null }, tAdd: { value: null }, uTexel: { value: new THREE.Vector2() } },
      vertexShader: FSQ_VS,
      fragmentShader: /* glsl */ `
        uniform sampler2D tSrc, tAdd; uniform vec2 uTexel;
        varying vec2 vUv;
        vec3 S(vec2 o){ return texture(tSrc, vUv + o*uTexel).rgb; }
        void main(){
          vec3 o = S(vec2(0,0))*4.0 + (S(vec2(-1,0))+S(vec2(1,0))+S(vec2(0,-1))+S(vec2(0,1)))*2.0
                 + S(vec2(-1,-1))+S(vec2(1,-1))+S(vec2(-1,1))+S(vec2(1,1));
          gl_FragColor = vec4(o/16.0 + texture(tAdd, vUv).rgb, 1.0);
        }`,
    });

    this.final = new THREE.ShaderMaterial({
      uniforms: {
        tWin: { value: null }, tBloom: { value: null }, tWide: { value: null },
        uExposure: { value: 1.0 }, uBloom: { value: 0.035 }, uHal: { value: 0.025 },
        uTime: U.uTime, uFrame: { value: 0 }, uRes: { value: new THREE.Vector2(OW, OH) }, uSrc: { value: new THREE.Vector2(W, H) },
        uGrain: { value: 0.03 }, uWeave: { value: new THREE.Vector2() }, uSharpen: { value: rs < 1 ? 0.35 : 0.0 },
      },
      vertexShader: FSQ_VS,
      fragmentShader: /* glsl */ `
        ${NOISE}
        uniform sampler2D tWin, tBloom, tWide;
        uniform float uExposure, uBloom, uHal, uTime, uFrame, uGrain, uSharpen;
        uniform vec2 uRes, uSrc, uWeave;
        varying vec2 vUv;
        vec3 aces(vec3 x){ const float a=2.51, b=0.03, c=2.43, d=0.59, e=0.14; return clamp((x*(a*x+b))/(x*(c*x+d)+e), 0.0, 1.0); }
        void main(){
          vec2 uv = vUv + uWeave/uRes;
          vec2 cc = uv - 0.5;
          float ca = dot(cc, cc)*0.0035;
          vec4 w = texture(tWin, uv);
          vec3 col = vec3(texture(tWin, uv - cc*ca).r, w.g, texture(tWin, uv + cc*ca).b);
          if (uSharpen > 0.0) {
            vec2 px = 1.0/uSrc;
            vec3 nb = texture(tWin, uv + vec2(px.x, 0.0)).rgb + texture(tWin, uv - vec2(px.x, 0.0)).rgb
                    + texture(tWin, uv + vec2(0.0, px.y)).rgb + texture(tWin, uv - vec2(0.0, px.y)).rgb;
            col = max(col + (col - nb*0.25)*uSharpen, 0.0);
          }
          col += texture(tBloom, uv).rgb*uBloom*(1.0 + 2.5*w.a);
          col += texture(tWide, uv).rgb*vec3(1.0, 0.42, 0.22)*uHal;
          col *= uExposure;
          col = aces(col);
          col = pow(col, vec3(1.0/2.2));
          float lum = dot(col, vec3(0.299, 0.587, 0.114));
          col = mix(vec3(lum), col, 0.86);
          col += vec3(-0.004, 0.006, 0.006)*(1.0 - smoothstep(0.0, 0.35, lum));
          col += vec3(0.02, 0.005, -0.015)*smoothstep(0.45, 1.0, lum);
          col = col*0.975 + 0.014;
          vec2 vv = (vUv - 0.5)*vec2(uRes.x/uRes.y, 1.0);
          col *= mix(1.0, 0.6, smoothstep(0.4, 1.2, length(vv)));
          vec2 gp = gl_FragCoord.xy/1.35 + vec2(mod(uFrame, 509.0)*37.17, mod(uFrame, 503.0)*91.31);
          float gn = (vnoise(gp) + vnoise(gp*1.73 + 13.1) - 1.0);
          col += gn*uGrain*(0.55 + 0.45*lum*(1.0 - lum)*4.0);
          gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
        }`,
    });

    this.final.uniforms.tWin.value = this.rtWin.texture;
    this.win.uniforms.tFog.value = this.rtFog.texture;
    this.fog.uniforms.tScene.value = this.rtScene.texture;
    this.fog.uniforms.tVol.value = this.rtVol.texture;
    this.vol.uniforms.tDepth.value = this.rtScene.texture;
  }

  pass(mat, target, clear = true) {
    this.quad.material = mat;
    this.r.setRenderTarget(target);
    if (target === null) this.r.setViewport(0, 0, this.OW, this.OH);
    if (clear) this.r.clear();
    this.r.render(this.qscene, this.cam);
  }

  bloom() {
    const src0 = this.rtWin.texture;
    let src = src0;
    this.bloomDown.forEach((t, i) => {
      this.down.uniforms.tSrc.value = src;
      const sw = i === 0 ? this.W : this.bloomDown[i - 1].width, sh = i === 0 ? this.H : this.bloomDown[i - 1].height;
      this.down.uniforms.uTexel.value.set(1 / sw, 1 / sh);
      this.down.uniforms.uThresh.value = i === 0 ? this.thresh : 0;
      this.pass(this.down, t);
      src = t.texture;
    });
    const n = this.bloomDown.length;
    let acc = this.bloomDown[n - 1].texture;
    for (let i = n - 2; i >= 0; i--) {
      this.up.uniforms.tSrc.value = acc;
      this.up.uniforms.tAdd.value = this.bloomDown[i].texture;
      const s = this.bloomDown[i + 1];
      this.up.uniforms.uTexel.value.set(1 / s.width, 1 / s.height);
      this.pass(this.up, this.bloomUp[i]);
      acc = this.bloomUp[i].texture;
      if (i === 3) this.final.uniforms.tWide.value = this.bloomUp[i].texture;
    }
    this.final.uniforms.tBloom.value = acc;
  }
}
