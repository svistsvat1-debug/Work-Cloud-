// Scene assembly and the per-frame entry point used by the headless renderer.
import * as THREE from 'three';
import { Road } from './road.js';
import { lightUniforms, makeMaterials } from './materials.js';
import { World, buildTruck } from './world.js';
import { Post } from './post.js';
import { makeRain } from './rain.js';
import { MAXL } from './glsl.js';
import { noise1, smoothstep, hash1, clamp } from './util.js';

const cfg = Object.assign({
  seed: 7, fps: 24, duration: 60, speed: 20, width: 1920, height: 1080,
  trucks: [], towns: [], fovV: 47, pitch: -0.03, renderScale: 1, exposure: 40, bloomThresh: 0.9, dashGain: 0.35, interior: 0.006, msaa: 4, volScale: 3,
  headlight: 520, truckLight: 420, fogSigma: 0.012, mist: 0.05, rainCount: 7000,
  wiperPeriod: 2.8, wiperStroke: 0.85,
}, window.CFG || {});

const W = cfg.width, H = cfg.height;
const renderer = new THREE.WebGLRenderer({ antialias: false, preserveDrawingBuffer: true, alpha: false, powerPreference: 'high-performance' });
renderer.setPixelRatio(1);
renderer.setSize(W, H, false);
renderer.autoClear = false;
renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
document.body.appendChild(renderer.domElement);

const U = lightUniforms();
const mats = makeMaterials(U);
const road = new Road(cfg);
const world = new World(road, mats, cfg);
if (cfg.debugNoTrees) mats.tree.visible = false;
const scene = new THREE.Scene();
scene.add(world.scene);
const sky = new THREE.Mesh(new THREE.SphereGeometry(850, 24, 12), mats.sky);
sky.frustumCulled = false;
scene.add(sky);

const trucks = cfg.trucks.map((tm, i) => {
  const t = buildTruck(mats, i + cfg.seed);
  scene.add(t.tractor, t.trailer);
  return { tm, ...t };
});

const camera = new THREE.PerspectiveCamera(cfg.fovV, W / H, 0.3, 1000);
const post = new Post(renderer, W, H, U, cfg);
post.vol.uniforms.uSigma.value = cfg.fogSigma;
post.vol.uniforms.uMist.value = cfg.mist;
post.win.uniforms.uWiper.value.x = cfg.wiperPeriod;
post.win.uniforms.uWiper.value.y = cfg.wiperStroke;
post.final.uniforms.uExposure.value = cfg.exposure;
post.thresh = cfg.bloomThresh / cfg.exposure;
if (cfg.debugClear) post.win.uniforms.uDebugClear.value = 1;

const rain = makeRain(U, cfg.rainCount, cfg.seed * 13 + 5);
rain.material.uniforms.tDepth.value = post.rtScene.texture;
rain.material.uniforms.uRes.value.set(post.W, post.H);
rain.material.uniforms.uSigma.value = cfg.fogSigma;
rain.material.uniforms.uSpeed.value = cfg.speed;
rain.material.uniforms.uPix.value = (2 * Math.tan((cfg.fovV * Math.PI) / 360)) / post.H;
const rainScene = new THREE.Scene();
rainScene.add(rain);


const V3 = (a) => new THREE.Vector3(a[0], a[1], a[2]);
const HALOGEN = [1.0, 0.84, 0.62];

function chordMatrix(s0, s1, u) {
  const p0 = V3(road.point(s0, u)), p1 = V3(road.point(s1, u));
  const z = p1.clone().sub(p0).normalize();
  const x = new THREE.Vector3(0, 1, 0).cross(z).normalize();
  const y = z.clone().cross(x).normalize();
  return new THREE.Matrix4().makeBasis(x, y, z).setPosition(p0);
}

function blinkValue(t) {
  const ph = (t % 1.1) / 1.1;
  return smoothstep(0.0, 0.06, ph) * (1 - smoothstep(0.45, 0.53, ph));
}
function flickerValue(t) {
  const bin = Math.floor(t * 12);
  const r = hash1(bin * 0.731 + 3.0);
  const burst = hash1(Math.floor(t * 0.6) * 1.37) > 0.55;
  return burst && r > 0.45 ? 0.12 + 0.3 * hash1(bin) : 0.9 + 0.1 * hash1(bin * 2.1);
}

function update(t) {
  U.uTime.value = t;
  const s = road.camS(t);
  world.update(s);

  // camera: driver's eye in a cab-over, right lane
  const eye = V3(road.point(s, 1.30, 2.75));
  eye.y += 0.004 * noise1(t * 9.1, 2) + 0.002 * noise1(t * 21.3, 4);
  const tan3 = V3(road.point(s + 6, 1.3)).sub(V3(road.point(s - 6, 1.3))).normalize();
  const look = V3(road.point(s + 24, 1.45, 2.75)).sub(eye).normalize();
  const dir = tan3.clone().lerp(look, 0.35).normalize();
  const right = dir.clone().cross(new THREE.Vector3(0, 1, 0)).normalize();
  const pitch = cfg.pitch + 0.0007 * noise1(t * 5.7, 6) + 0.0004 * noise1(t * 13.1, 7);
  const yaw = 0.0006 * noise1(t * 4.3, 8);
  dir.applyAxisAngle(right, pitch).applyAxisAngle(new THREE.Vector3(0, 1, 0), yaw);
  const k = road.sample(s).k;
  const roll = -k * cfg.speed * cfg.speed * 0.0035 + 0.0005 * noise1(t * 7.7, 9);
  const up = new THREE.Vector3(0, 1, 0).applyAxisAngle(dir, roll);
  camera.position.copy(eye);
  camera.up.copy(up);
  camera.lookAt(eye.clone().add(dir));
  camera.updateMatrixWorld();
  U.uCamPos.value.copy(eye);
  sky.position.copy(eye);

  // lights
  const lights = [];
  for (const du of [-0.95, 0.95]) {
    const p = road.point(s + 1.5, 1.85 + du, 1.1);
    lights.push({ pos: p, col: HALOGEN.map((c) => c * cfg.headlight), dir: tan3.toArray(), type: 1, cone: [-2, -1], force: true });
  }
  const splash = [-1, -1, -1, -1];
  const spray = [];
  for (const [i, tr] of trucks.entries()) {
    const sf = road.camS(tr.tm) + 22 * (tr.tm - t);
    const rel = sf - s;
    const active = rel > -45 && rel < 700;
    tr.tractor.visible = tr.trailer.visible = active;
    if (i < 4) splash[i] = tr.tm + 0.3;
    if (!active) continue;
    const m = chordMatrix(sf, sf + 6.9, -1.85);
    const mt = chordMatrix(sf + 7.1, sf + 21.7, -1.85);
    tr.tractor.matrix.copy(m); tr.tractor.matrixWorld.copy(m);
    tr.trailer.matrix.copy(mt); tr.trailer.matrixWorld.copy(mt);
    const fwd = new THREE.Vector3(0, 0, -1).transformDirection(m);
    for (const x of [-0.95, 0.95]) {
      const p = new THREE.Vector3(x, 1.12, 0.3).applyMatrix4(m);
      lights.push({ pos: p.toArray(), col: [1.0, 0.9, 0.74].map((c) => c * cfg.truckLight), dir: fwd.toArray(), type: 1, cone: [-2, -1] });
    }
    const mk = new THREE.Vector3(0, 3.7, 2.9).applyMatrix4(m);
    lights.push({ pos: mk.toArray(), col: [1.0, 0.55, 0.1].map((c) => c * 1.5), dir: [0, -1, 0], type: 0, cone: [-2, -1] });
    if (rel < 260) {
      const A = new THREE.Vector3(0, 1.3, 1.0).applyMatrix4(m);
      const B = new THREE.Vector3(0, 1.8, 18).applyMatrix4(mt);
      spray.push([A, B, 0.11]);
    }
  }
  const blink = blinkValue(t), flick = flickerValue(t);
  U.uBlink.value = blink;
  U.uFlicker.value = flick;
  for (const L of world.lights) {
    const d = eye.distanceTo(V3(L.pos));
    const fade = 1 - smoothstep(L.range * 0.75, L.range, d);
    if (fade <= 0) continue;
    const gain = fade * (L.anim === 'blink' ? blink : L.anim === 'flicker' ? flick : 1);
    lights.push({ pos: L.pos, col: L.col.map((c) => c * gain), dir: L.dir, type: L.type, cone: L.cone, vol: L.vol });
  }
  for (const L of lights) {
    const d2 = eye.distanceToSquared(V3(L.pos));
    L.imp = L.force ? 1e9 : (L.col[0] + L.col[1] + L.col[2]) / (d2 + 400);
  }
  lights.sort((a, b) => b.imp - a.imp);
  const used = lights.slice(0, MAXL);
  // volumetric pass uses the leading lights; keep non-volumetric ones at the end
  used.sort((a, b) => (a.vol === false) - (b.vol === false));
  U.uLCount.value = used.length;
  used.forEach((L, i) => {
    U.uLPos.value[i].set(...L.pos);
    U.uLCol.value[i].set(...L.col);
    U.uLDir.value[i].set(L.dir[0], L.dir[1], L.dir[2], L.type);
    U.uLCone.value[i].set(L.cone[0], L.cone[1]);
    U.uLRt.value[i].set(L.dir[0], L.dir[1], L.dir[2]).cross(new THREE.Vector3(0, 1, 0)).normalize();
  });
  post.vol.uniforms.uVolCount.value = Math.min(used.filter((L) => L.vol !== false).length, 10);

  // fog / spray
  post.vol.uniforms.uGroundY.value = road.sample(s).y;
  post.vol.uniforms.uMist.value = cfg.mist * (0.35 + 1.3 * (0.5 + 0.5 * noise1(t / 45, 21))) * (1 - 0.65 * road.townWeight(s));
  for (let i = 0; i < 2; i++) {
    const sp = spray[i];
    const A = post.vol.uniforms.uSprayA.value[i], B = post.vol.uniforms.uSprayB.value[i];
    if (sp) { A.set(sp[0].x, sp[0].y, sp[0].z, sp[2]); B.set(sp[1].x, sp[1].y, sp[1].z, 0); } else A.w = 0;
  }
  post.win.uniforms.uSplash.value.set(...splash);

  // rain frame
  const ru = rain.material.uniforms;
  ru.uFwd.value.copy(tan3);
  ru.uRight.value.copy(tan3.clone().cross(new THREE.Vector3(0, 1, 0)).normalize());

  post.final.uniforms.uFrame.value = Math.round(t * cfg.fps);
  post.final.uniforms.uWeave.value.set(0.35 * noise1(t * 3.1, 11), 0.35 * noise1(t * 2.7, 12));
}

function render() {
  renderer.setRenderTarget(post.rtScene);
  renderer.setClearColor(0x000000, 1);
  renderer.clear();
  renderer.render(scene, camera);
  post.vol.uniforms.uInvProj.value.copy(camera.projectionMatrixInverse);
  post.vol.uniforms.uCamWorld.value.copy(camera.matrixWorld);
  post.pass(post.vol, post.rtVol);
  post.pass(post.fog, post.rtFog);
  renderer.setRenderTarget(post.rtFog);
  renderer.render(rainScene, camera);
  post.pass(post.win, post.rtWin);
  post.bloom();
  post.pass(post.final, null);
}

const gl = renderer.getContext();
const buf = new Uint8Array(W * H * 4);
function toB64(u8) {
  return new Promise((res) => {
    const fr = new FileReader();
    fr.onload = () => res(fr.result.slice(fr.result.indexOf(',') + 1));
    fr.readAsDataURL(new Blob([u8]));
  });
}

window.renderFrame = async (frame, read = true) => {
  update(frame / cfg.fps);
  render();
  if (!read) return null;
  gl.readPixels(0, 0, W, H, gl.RGBA, gl.UNSIGNED_BYTE, buf);
  return toB64(buf);
};
window.renderPNG = (frame) => {
  update(frame / cfg.fps);
  render();
  return renderer.domElement.toDataURL('image/png');
};
window.profile = (frame) => {
  const T = {};
  const fin = () => { const rt = renderer.getRenderTarget(); renderer.setRenderTarget(null); gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(4)); renderer.setRenderTarget(rt); };
  let t0 = performance.now();
  const mark = (k) => { fin(); const t1 = performance.now(); T[k] = +(t1 - t0).toFixed(0); t0 = t1; };
  update(frame / cfg.fps); mark('update');
  renderer.setRenderTarget(post.rtScene); renderer.clear(); renderer.render(scene, camera); const sceneTris = renderer.info.render.triangles, sceneCalls = renderer.info.render.calls; mark('scene');
  post.vol.uniforms.uInvProj.value.copy(camera.projectionMatrixInverse);
  post.vol.uniforms.uCamWorld.value.copy(camera.matrixWorld);
  post.pass(post.vol, post.rtVol); mark('vol');
  post.pass(post.fog, post.rtFog); mark('fog');
  renderer.setRenderTarget(post.rtFog); renderer.render(rainScene, camera); mark('rain');
  post.pass(post.win, post.rtWin); mark('win');
  post.bloom(); mark('bloom');
  post.pass(post.final, null); mark('final');
  gl.readPixels(0, 0, W, H, gl.RGBA, gl.UNSIGNED_BYTE, buf); mark('read');
  let tris = 0; renderer.info.render && (tris = renderer.info.render.triangles);
  T.tris = sceneTris; T.calls = sceneCalls; T.lights = U.uLCount.value;
  let inst = 0; world.scene.traverse((o) => { if (o.userData.trees && o.parent.visible) inst += o.geometry.index.count / 3; }); T.inst = inst;
  return T;
};
window.overdraw = (frame) => {
  update(frame / cfg.fps);
  const od = new THREE.ShaderMaterial({ vertexShader: 'void main(){ gl_Position = projectionMatrix*viewMatrix*modelMatrix*vec4(position,1.0); }',
    fragmentShader: 'void main(){ gl_FragColor = vec4(0.02, 0.02, 0.02, 1.0); }', blending: THREE.AdditiveBlending, depthTest: false, depthWrite: false, side: THREE.DoubleSide });
  const saved = [];
  scene.traverse((o) => { if (o.isMesh || o.isLineSegments) { saved.push([o, o.material]); const m = od.clone(); m.side = o.material.side; o.material = m; } });
  renderer.setRenderTarget(null); renderer.setClearColor(0, 1); renderer.clear(); renderer.render(scene, camera);
  saved.forEach(([o, m]) => (o.material = m));
  return renderer.domElement.toDataURL('image/png');
};
window.probe = (frame, xs, ys) => {
  update(frame / cfg.fps); render();
  const h2f = (h) => { const s = (h & 0x8000) ? -1 : 1, e = (h >> 10) & 0x1f, m = h & 0x3ff; return e === 0 ? s * 6.103515625e-5 * (m / 1024) : e === 31 ? NaN : s * Math.pow(2, e - 15) * (1 + m / 1024); };
  const rd = (rt, x, y) => { const b = new Uint16Array(4); renderer.readRenderTargetPixels(rt, Math.floor(x * rt.width), Math.floor(y * rt.height), 1, 1, b); return Array.from(b).map(h2f); };
  return xs.map((x, i) => ({ x, y: ys[i], scene: rd(post.rtScene, x, ys[i]), vol: rd(post.rtVol, x, ys[i]), fog: rd(post.rtFog, x, ys[i]), win: rd(post.rtWin, x, ys[i]) }));
};
window.READY = true;
