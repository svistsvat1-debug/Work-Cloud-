// Falling rain as camera-relative streaks, lit by the scene lights, depth-tested against the scene manually.
import * as THREE from 'three';
import { NOISE, LIGHTS } from './glsl.js';
import { mulberry32 } from './util.js';

export function makeRain(U, count, seed) {
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute([-1, 0, 0, 1, 0, 0, 1, 1, 0, -1, 1, 0], 3));
  g.setIndex([0, 1, 2, 0, 2, 3]);
  const r = mulberry32(seed);
  const d = new Float32Array(count * 4);
  for (let i = 0; i < d.length; i++) d[i] = r();
  g.setAttribute('aDrop', new THREE.InstancedBufferAttribute(d, 4));
  g.instanceCount = count;
  const mat = new THREE.ShaderMaterial({
    uniforms: {
      ...U,
      uFwd: { value: new THREE.Vector3(0, 0, -1) }, uRight: { value: new THREE.Vector3(1, 0, 0) }, uUpV: { value: new THREE.Vector3(0, 1, 0) },
      uSpeed: { value: 20 }, uFall: { value: 8.5 }, uWind: { value: 1.2 }, uShutter: { value: 1 / 48 },
      uPix: { value: 0.001 }, tDepth: { value: null }, uRes: { value: new THREE.Vector2() }, uSigma: { value: 0.012 },
      uGain: { value: 0.1 },
    },
    vertexShader: /* glsl */ `
      ${NOISE}
      ${LIGHTS}
      uniform float uTime;
      attribute vec4 aDrop;
      uniform vec3 uFwd, uRight, uUpV; uniform float uSpeed, uFall, uWind, uShutter, uPix, uGain;
      varying vec3 vCol; varying float vX; varying float vY; varying float vDist;
      void main(){
        vec3 bmin = vec3(-11.0, -3.2, 3.0), bsz = vec3(22.0, 12.5, 45.0);
        vec3 lp = bmin + mod(aDrop.xyz*bsz + vec3(uWind, -uFall, -uSpeed)*uTime, bsz);
        vec3 wp = uCamPos + uRight*lp.x + uUpV*lp.y + uFwd*lp.z;
        vec3 vel = uRight*uWind - uUpV*uFall - uFwd*uSpeed;
        vec3 a = wp, b = wp + vel*uShutter*(0.7 + 0.6*aDrop.w);
        vec4 va = viewMatrix*vec4(a, 1.0), vb = viewMatrix*vec4(b, 1.0);
        vec3 vp = mix(va.xyz, vb.xyz, position.y);
        vec2 sa = va.xy/max(-va.z, 0.1), sb = vb.xy/max(-vb.z, 0.1);
        vec2 dir = sb - sa; float dl = length(dir);
        dir = dl > 1e-6 ? dir/dl : vec2(0.0, 1.0);
        vec2 perp = vec2(-dir.y, dir.x);
        float hw = max(0.9*uPix*(-vp.z), 0.0012);
        vp.xy += perp*hw*position.x;
        gl_Position = projectionMatrix*vec4(vp, 1.0);
        vec3 toEye = normalize(uCamPos - wp);
        vec3 E = vec3(0.0);
        for (int j=0;j<MAXL;j++){
          if (j >= uLCount) break;
          vec3 Lv = uLPos[j] - wp; float d2 = dot(Lv, Lv);
          vec3 Ld = Lv*inversesqrt(d2);
          float bb = beam(j, -Ld);
          if (bb <= 0.0) continue;
          E += uLCol[j]*bb/(d2 + 0.6)*(0.3 + 3.0*pow(max(dot(-Ld, toEye), 0.0), 6.0));
        }
        vCol = E*uGain*(0.5 + aDrop.w);
        vX = position.x; vY = position.y; vDist = length(wp - uCamPos);
      }`,
    fragmentShader: /* glsl */ `
      uniform sampler2D tDepth; uniform vec2 uRes; uniform float uSigma;
      varying vec3 vCol; varying float vX; varying float vY; varying float vDist;
      void main(){
        float sd = texture(tDepth, gl_FragCoord.xy/uRes).a;
        if (vDist > sd) discard;
        float a = (1.0 - vX*vX)*smoothstep(0.0, 0.2, vY)*smoothstep(1.0, 0.8, vY);
        gl_FragColor = vec4(vCol*a*exp(-uSigma*vDist), 0.0);
      }`,
    transparent: true,
    depthTest: false,
    depthWrite: false,
    blending: THREE.CustomBlending,
    blendEquation: THREE.AddEquation,
    blendSrc: THREE.OneFactor, blendDst: THREE.OneFactor,
    blendSrcAlpha: THREE.ZeroFactor, blendDstAlpha: THREE.OneFactor,
  });
  const mesh = new THREE.Mesh(g, mat);
  mesh.frustumCulled = false;
  return mesh;
}
