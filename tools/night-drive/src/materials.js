// Scene materials. Every scene shader writes vec4(radiance, distance-to-camera).
import * as THREE from 'three';
import { NOISE, LIGHTS, MAXL } from './glsl.js';

export function lightUniforms() {
  return {
    uLCount: { value: 0 },
    uLPos: { value: Array.from({ length: MAXL }, () => new THREE.Vector3()) },
    uLCol: { value: Array.from({ length: MAXL }, () => new THREE.Vector3()) },
    uLDir: { value: Array.from({ length: MAXL }, () => new THREE.Vector4(0, 0, -1, 0)) },
    uLCone: { value: Array.from({ length: MAXL }, () => new THREE.Vector2(-2, -1)) },
    uLRt: { value: Array.from({ length: MAXL }, () => new THREE.Vector3(1, 0, 0)) },
    uFogAmb: { value: new THREE.Vector3(0.0012, 0.00132, 0.00148) },
    uCamPos: { value: new THREE.Vector3() },
    uTime: { value: 0 },
    uFlicker: { value: 1 },
    uBlink: { value: 1 },
  };
}

const HEAD = /* glsl */ `
${NOISE}
${LIGHTS}
uniform float uTime;
uniform float uFlicker;
uniform float uBlink;
float band(float x, float a, float b, float w){ return smoothstep(a-w, a+w, x) * (1.0 - smoothstep(b-w, b+w, x)); }
`;

function make(U, vs, fs, extra = {}) {
  return new THREE.ShaderMaterial({ uniforms: U, vertexShader: vs, fragmentShader: fs, ...extra });
}

export function makeMaterials(U) {
  const road = make(U, /* glsl */ `
    attribute vec2 aSU; attribute float aZone;
    varying vec3 vP; varying vec3 vN; varying vec2 vSU; varying float vZone;
    void main(){
      vec4 wp = modelMatrix*vec4(position,1.0);
      vP = wp.xyz; vN = normalize(mat3(modelMatrix)*normal); vSU = aSU; vZone = aZone;
      gl_Position = projectionMatrix*viewMatrix*wp;
    }`, /* glsl */ `
    ${HEAD}
    varying vec3 vP; varying vec3 vN; varying vec2 vSU; varying float vZone;
    void main(){
      float s = vSU.x, u = vSU.y, au = abs(u);
      vec3 V = normalize(uCamPos - vP);
      vec3 N = normalize(vN);
      vec2 q = vec2(s, u);
      float n1 = fbm2(q*vec2(0.35, 0.9));
      float n2 = vnoise(q*vec2(6.0, 9.0));
      vec3 alb = vec3(0.062, 0.062, 0.066) * (0.7 + 0.6*n1) * (0.85 + 0.3*n2);
      // patched repairs: darker, smoother tar
      float patchm = smoothstep(0.66, 0.70, fbm2(q*vec2(0.08, 0.25) + 9.3));
      alb *= mix(1.0, 0.65, patchm);
      // tar snakes (crack sealant)
      float cr = abs(vnoise(q*vec2(0.9, 2.2) + 4.0) - 0.5);
      float tar = smoothstep(0.018, 0.0, cr) * smoothstep(0.55, 0.75, vnoise(q*0.21 + 2.0));
      alb = mix(alb, vec3(0.018), tar);
      // polished wheel tracks hold more water
      float track = exp(-pow((au-0.95)/0.38, 2.0)) + exp(-pow((au-2.65)/0.38, 2.0));
      float pud = smoothstep(0.60, 0.74, fbm2(q*vec2(0.22, 0.5) + 3.1) + track*0.06);
      float rough = mix(0.30, 0.14, clamp(track*0.8, 0.0, 1.0));
      rough = mix(rough, 0.04, max(pud, tar*0.7));
      alb *= mix(1.0, 0.55, pud);
      // markings
      float wU = fwidth(u)*0.75 + 0.002, wS = fwidth(s)*0.75 + 0.002;
      float dbl = max(band(u, -0.21, -0.11, wU), band(u, 0.11, 0.21, wU));
      float dashm = band(mod(s, 12.0), 0.0, 3.0, wS);
      float sgl = band(u, -0.055, 0.055, wU) * dashm;
      float yel = mix(dbl, sgl, vZone);
      float wht = band(au, 3.42, 3.56, wU);
      float wear = smoothstep(0.15, 0.55, vnoise(q*vec2(1.7, 14.0)));
      yel *= mix(0.45, 1.0, wear); wht *= mix(0.5, 1.0, wear);
      alb = mix(alb, vec3(0.50, 0.33, 0.05), yel);
      alb = mix(alb, vec3(0.55, 0.55, 0.52), wht);
      rough = mix(rough, 0.28, max(yel, wht));
      float retro = yel*1.1 + wht*1.1;
      // raised pavement markers on the centre line every 24 m
      vec2 rp = vec2(mod(s + 6.0, 24.0) - 12.0, u);
      float rpm = band(rp.x, -0.06, 0.06, wS) * band(rp.y, -0.08, 0.08, wU) * (1.0 - vZone*0.0);
      alb = mix(alb, vec3(0.6, 0.45, 0.1), rpm);
      retro += rpm * 70.0;
      // rain ripples on the water film
      mat2 rot = mat2(0.8, 0.6, -0.6, 0.8);
      vec2 rq = rot*q*vec2(7.0, 9.0);
      vec2 rip = vec2(vnoise(rq + uTime*2.7), vnoise(rq.yx + 5.0 - uTime*2.9)) - 0.5;
      float near = 1.0 - smoothstep(0.02, 0.12, fwidth(s));
      N = normalize(N + vec3(rip.x, 0.0, rip.y)*mix(0.03, 0.012, pud)*near);
      vec3 col = shade(vP, N, V, alb, rough, 1.0, 0.0, retro);
      // sky/fog sheen at grazing angles
      float fr = 0.02 + 0.98*pow(1.0 - max(dot(N,V),0.0), 5.0);
      col += uFogAmb * fr * 1.2;
      // splash sparkles
      vec2 cell = floor(q*vec2(4.0, 6.0));
      float fi = floor(uTime*24.0);
      float h = hash12(cell + fi*vec2(0.371, 1.137));
      if (h > 0.975) {
        vec2 fp = fract(q*vec2(4.0, 6.0)) - 0.5;
        float sp = smoothstep(0.16, 0.0, length(fp));
        col += sp * 0.5 * shade(vP, vec3(0.0,1.0,0.0), V, vec3(1.0), 1.0, 0.0, 1.0, 0.0);
      }
      gl_FragColor = vec4(col, length(uCamPos - vP));
    }`);

  const terrain = make(U, /* glsl */ `
    attribute vec2 aSU;
    varying vec3 vP; varying vec3 vN; varying vec2 vSU; varying vec3 vL;
    void main(){
      vec4 wp = modelMatrix*vec4(position,1.0);
      vP = wp.xyz; vN = normalize(mat3(modelMatrix)*normal); vSU = aSU; vL = position;
      gl_Position = projectionMatrix*viewMatrix*wp;
    }`, /* glsl */ `
    ${HEAD}
    varying vec3 vP; varying vec3 vN; varying vec2 vSU; varying vec3 vL;
    void main(){
      float au = abs(vSU.y);
      vec3 V = normalize(uCamPos - vP);
      vec3 N = normalize(vN);
      vec2 q = vL.xz;
      float n = vnoise(q*3.0), n2 = vnoise(q*17.0), n3 = fbm2(q*0.4);
      vec3 gravel = vec3(0.09, 0.085, 0.08)*(0.6+0.8*n2);
      vec3 grass = mix(vec3(0.020, 0.032, 0.012), vec3(0.045, 0.050, 0.020), n)*(0.55+0.9*n2);
      vec3 litter = mix(vec3(0.030, 0.022, 0.014), vec3(0.020, 0.028, 0.012), n3)*(0.6+0.8*n2);
      vec3 alb = gravel; float rough = 0.55; float spec = 0.4;
      float g = smoothstep(4.9, 5.3, au);
      alb = mix(alb, grass, g); rough = mix(rough, 0.45, g);
      float f = smoothstep(9.0, 12.0, au);
      alb = mix(alb, litter, f);
      // standing water in the ditch
      float ditch = band(au, 6.25, 7.15, 0.15) * smoothstep(0.35, 0.6, n3 + 0.25);
      alb = mix(alb, vec3(0.01), ditch); rough = mix(rough, 0.05, ditch); spec = mix(spec, 1.0, ditch);
      // grass blades: sparkly normals
      vec3 rn = hash33(floor(vL*9.0))*2.0 - 1.0;
      N = normalize(N + rn*0.55*(1.0 - ditch));
      vec3 col = shade(vP, N, V, alb, rough, spec, 0.35, 0.0);
      gl_FragColor = vec4(col, length(uCamPos - vP));
    }`);

  const TREE_VS = /* glsl */ `
    attribute float aPart; attribute float aSeed; attribute vec3 aLocal;
    varying vec3 vP; varying vec3 vN; varying vec3 vO; varying float vPart; varying float vSeed;
    void main(){
      vec4 wp = modelMatrix*vec4(position,1.0);
      vP = wp.xyz; vN = normal; vO = aLocal; vPart = aPart; vSeed = aSeed;
      gl_Position = projectionMatrix*viewMatrix*wp;
    }`;
  const LEAF_CUT = /* glsl */ `
    bool leafHole(vec3 N, vec3 V){
      if (vPart < 0.5) return false;
      vec3 q = vO*2.6 + vSeed*31.0;
      float nn = 0.5*vnoise(q.xy) + 0.3*vnoise(q.yz*1.7) + 0.2*vnoise(q.zx*3.1);
      float edge = 1.0 - abs(dot(N, V));
      return nn < 0.30 + edge*0.32;
    }`;
  const treeDepth = make(U, TREE_VS, /* glsl */ `
    ${HEAD}
    varying vec3 vP; varying vec3 vN; varying vec3 vO; varying float vPart; varying float vSeed;
    ${LEAF_CUT}
    void main(){
      vec3 V = normalize(uCamPos - vP);
      if (leafHole(normalize(vN), V)) discard;
      gl_FragColor = vec4(0.0);
    }`, { side: THREE.DoubleSide, colorWrite: false });
  const tree = make(U, TREE_VS, /* glsl */ `
    ${HEAD}
    varying vec3 vP; varying vec3 vN; varying vec3 vO; varying float vPart; varying float vSeed;
    ${LEAF_CUT}
    void main(){
      vec3 V = normalize(uCamPos - vP);
      vec3 N = normalize(vN);
      if (leafHole(N, V)) discard;
      vec3 col;
      if (vPart < 0.5) {
        float bark = vnoise(vec2(atan(vO.z, vO.x)*3.0, vO.y*1.5) + vSeed*10.0);
        vec3 alb = vec3(0.045, 0.040, 0.035)*(0.55 + 0.8*bark);
        N = normalize(N + (hash33(floor(vO*12.0))-0.5)*0.4);
        col = shade(vP, N, V, alb, 0.45, 0.6, 0.15, 0.0);
      } else {
        vec3 q = vO*2.6 + vSeed*31.0;
        float nn = 0.5*vnoise(q.xy) + 0.3*vnoise(q.yz*1.7) + 0.2*vnoise(q.zx*3.1);
        vec3 cell = floor(vO*11.0 + vSeed*7.0);
        vec3 rn = hash33(cell)*2.0 - 1.0;
        N = normalize(N + rn*0.55);
        float hv = vnoise(vO.xy*3.1 + vO.z*1.7 + vSeed*9.0);
        vec3 alb = mix(vec3(0.020, 0.032, 0.016), vec3(0.046, 0.052, 0.026), hv) * mix(0.75, 1.2, fract(vSeed*7.7));
        alb *= (0.55 + 0.45*smoothstep(0.30, 0.6, nn))*(0.8 + 0.4*hash12(cell.xy*0.37 + cell.z));
        col = shade(vP, N, V, alb, 0.42, 0.45, 0.55, 0.0);
      }
      gl_FragColor = vec4(col, length(uCamPos - vP));
    }`, { side: THREE.FrontSide });

  const prop = make(U, /* glsl */ `
    attribute vec3 aCol; attribute vec4 aMat; attribute float aKind; attribute vec2 aUv;
    varying vec3 vP; varying vec3 vN; varying vec3 vCol; varying vec4 vMat; varying float vKind; varying vec2 vUv;
    void main(){
      vec4 wp = modelMatrix*vec4(position,1.0);
      vP = wp.xyz; vN = normalize(mat3(modelMatrix)*normal);
      vCol = aCol; vMat = aMat; vKind = aKind; vUv = aUv;
      gl_Position = projectionMatrix*viewMatrix*wp;
    }`, /* glsl */ `
    ${HEAD}
    varying vec3 vP; varying vec3 vN; varying vec3 vCol; varying vec4 vMat; varying float vKind; varying vec2 vUv;
    void main(){
      vec3 V = normalize(uCamPos - vP);
      vec3 N = normalize(vN);
      if (!gl_FrontFacing) N = -N;
      int k = int(vKind + 0.5);
      vec3 alb = vCol; float retro = vMat.z;
      vec3 col = vec3(0.0);
      if (k == 1) {
        // diamond warning sign; uv is the position on the sign plane, diamond |x|+|y| = 0.5
        vec2 p = vUv - 0.5;
        float dir = vMat.w;
        float ax = p.x*dir;
        float shaft = step(abs(ax + 0.07), 0.04) * step(-0.25, p.y) * step(p.y, 0.09);
        float bend = step(abs(p.y - 0.05), 0.04) * step(-0.11, ax) * step(ax, 0.09);
        float head = step(abs(p.y - 0.05), (0.21 - ax)*0.95) * step(0.08, ax) * step(ax, 0.21);
        float black = max(max(shaft, bend), max(head, step(0.455, abs(p.x) + abs(p.y))));
        alb = mix(vec3(0.62, 0.45, 0.04), vec3(0.015), black);
        retro = mix(3.0, 0.0, black);
        col = shade(vP, N, V, alb, 0.35, 0.5, 0.0, retro);
      } else if (k == 2) {
        // window: lit (emissive) or dark glass
        vec2 p = vUv;
        float frame = step(0.47, abs(p.x-0.5)) + step(0.47, abs(p.y-0.5)) + step(abs(p.x-0.5), 0.025) + step(abs(p.y-0.55), 0.02);
        if (vMat.w > 0.0) {
          float curtain = 0.55 + 0.45*smoothstep(0.0, 0.4, abs(p.x-0.5));
          col = vCol*vMat.w*curtain*(1.0 - min(frame,1.0)*0.85);
        } else {
          col = shade(vP, N, V, vec3(0.01), 0.06, 1.0, 0.0, 0.0);
          col = mix(col, shade(vP, N, V, vec3(0.5), 0.5, 0.3, 0.0, 0.0), min(frame, 1.0));
        }
      } else if (k == 3) {
        float facing = pow(max(dot(N, V), 0.0), 3.0);
        col = vCol*vMat.w*(0.03 + facing);
      } else if (k == 4) {
        col = vCol*vMat.w;
      } else if (k == 5) {
        col = vCol*vMat.w*uFlicker;
      } else if (k == 6) {
        col = vCol*vMat.w*(0.03 + uBlink);
      } else {
        col = shade(vP, N, V, alb, vMat.x, vMat.y, 0.2, retro);
      }
      gl_FragColor = vec4(col, length(uCamPos - vP));
    }`, { side: THREE.DoubleSide });

  const wire = make(U, /* glsl */ `
    varying vec3 vP;
    void main(){ vec4 wp = modelMatrix*vec4(position,1.0); vP = wp.xyz; gl_Position = projectionMatrix*viewMatrix*wp; }`, /* glsl */ `
    ${HEAD}
    varying vec3 vP;
    void main(){ gl_FragColor = vec4(uFogAmb*0.25, length(uCamPos - vP)); }`);

  const sky = make(U, /* glsl */ `
    varying vec3 vD;
    void main(){ vD = position; vec4 wp = modelMatrix*vec4(position,1.0); gl_Position = projectionMatrix*viewMatrix*wp; }`, /* glsl */ `
    ${HEAD}
    varying vec3 vD;
    void main(){ gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0e4); }`, { side: THREE.BackSide, depthWrite: false });

  // distant tree line: ragged crown cut from noise, very dark foliage
  const treeline = make(U, /* glsl */ `
    attribute vec3 aLocal;
    varying vec3 vP; varying vec3 vO;
    void main(){ vec4 wp = modelMatrix*vec4(position,1.0); vP = wp.xyz; vO = aLocal; gl_Position = projectionMatrix*viewMatrix*wp; }`, /* glsl */ `
    ${HEAD}
    varying vec3 vP; varying vec3 vO;
    void main(){
      vec3 V = normalize(uCamPos - vP);
      vec3 N = normalize(vec3(hash12(floor(vO.xz*3.0))-0.5, 0.6, hash12(floor(vO.zx*3.0)+3.0)-0.5));
      vec3 alb = vec3(0.025, 0.035, 0.015)*(0.6 + 0.8*vnoise(vO.xz*2.0 + vO.y));
      vec3 col = shade(vP, N, V, alb, 0.5, 0.3, 0.6, 0.0);
      gl_FragColor = vec4(col, length(uCamPos - vP));
    }`, { side: THREE.DoubleSide });
  treeline.name = 'treeline';

  return { road, terrain, tree, treeDepth, prop, wire, sky, treeline };
}
