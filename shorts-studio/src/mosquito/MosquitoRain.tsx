import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {At, Cam, Layer, camAt, shakeAt} from './camera';
import {BusSprite, DropExpr, DropSprite, GuyPose, GuySprite, MosqPose, MosqSprite, ScaleBack, ScaleFront, scaleGeom} from './art/Sprites';
import {Clouds, GroundBand, Hills, Puddle, RAIN_LAYERS, RainField, Sky, Buildings, Road} from './art/Scenery';
import {Badge, ForceArrow, ImpactSpray, ImpactStar, SpeedLines, Splash} from './art/Effects';
import {RIDE, SPLASH_T, T, rideDropY, simTime, timeScale} from './timing';
import {Sound} from './Sound';
import {
  FPS,
  clamp,
  easeInCubic,
  easeInOutCubic,
  easeOutCubic,
  lerp,
  popIn,
  popOut,
  prog,
  rand,
  springTo,
  sway,
  wobble,
} from './util';

const smooth = (t: number, a: number, b: number) => easeInOutCubic(prog(t, a, b));

/** Pose / expression schedules: [start time, value]. Swaps get a small damped pop (never a cross-fade). */
type Sched<V> = [number, V][];
const pick = <V,>(s: Sched<V>, t: number) => {
  let i = 0;
  for (let j = 0; j < s.length; j++) if (t >= s[j][0]) i = j;
  return {v: s[i][1], pop: 1 + 0.06 * wobble(t - s[i][0], 4.5, 9)};
};

/* ======================================================================= shared rainy world */
const FAR_CAM: Cam = {x: 540, y: 860, z: 120};

const RainWorldBack: React.FC<{cam: Cam}> = ({cam}) => (
  <>
    <Sky />
    <Layer cam={cam} z={2600}>
      <Clouds x={540} y={-1224 + 140} w={5200} seed={4} />
    </Layer>
    <Layer cam={cam} z={3000}>
      <Hills y={2864} color="#7AA68E" seed={5} />
    </Layer>
    <Layer cam={cam} z={1700}>
      <GroundBand y={2220} color="#86BF73" dark="#76AE64" tufts={false} />
    </Layer>
    <Layer cam={cam} z={1000}>
      <GroundBand y={RIDE.groundY} />
      <Puddle x={RIDE.dropX} y={RIDE.puddleY} rx={240} ry={44} />
    </Layer>
  </>
);
void FAR_CAM;

const RainBack: React.FC<{cam: Cam; sim: number; speed: number}> = ({cam, sim, speed}) => (
  <>
    <RainField cam={cam} simT={sim} speed={speed} spec={RAIN_LAYERS[0]} />
    <RainField cam={cam} simT={sim} speed={speed} spec={RAIN_LAYERS[1]} />
  </>
);
const RainFront: React.FC<{cam: Cam; sim: number; speed: number}> = ({cam, sim, speed}) => (
  <RainField cam={cam} simT={sim} speed={speed} spec={RAIN_LAYERS[2]} />
);

/* ======================================================================= Scene A: premise (frame 0) */
const FRAME0_DROP: DropExpr = 'D1';
const FRAME0_MOSQ: MosqPose = 'M1';
const DROP_A_Y = (t: number) => 520 + 32 * t;

const SceneA: React.FC<{t: number}> = ({t}) => {
  const cam = camAt(
    [
      {t: 0, x: 540, y: 810, z: 250},
      {t: T.cutScale, x: 540, y: 830, z: 320, ease: (u) => u},
    ],
    t,
  );
  const sim = simTime(t);
  const bob = sway(t, 10, 1.1);
  const killed = t >= T.kill;
  const mosq = pick<MosqPose>([[-10, FRAME0_MOSQ], [T.kill, 'M2']], t);
  const sweat = popIn(t, T.kill + 0.05, 0.3);
  const face = pick<DropExpr>([[-10, FRAME0_DROP], [T.kill, 'D2']], t);
  const inhale = killed ? 0.05 * wobble(t - T.kill, 2.5, 4) : 0;
  const jig = 0.015 * Math.sin(t * 9);
  return (
    <>
      <RainWorldBack cam={cam} />
      <RainBack cam={cam} sim={sim} speed={1} />
      <Layer cam={cam} z={1000}>
        <At x={RIDE.dropX} y={DROP_A_Y(t)} sx={(1 + jig - inhale * 0.6) * face.pop} sy={(1 - jig + inhale) * face.pop}>
          <DropSprite expr={face.v} R={RIDE.R} />
        </At>
        <At x={RIDE.M0.x} y={RIDE.M0.y + bob} sx={mosq.pop} sy={mosq.pop}>
          <MosqSprite pose={mosq.v} t={sim} sweat={sweat} sweatSlide={clamp((t - T.kill) / 1.4)} />
        </At>
      </Layer>
      <RainFront cam={cam} sim={sim} speed={1} />
    </>
  );
};

/* ======================================================================= Scene B: the scale (50x) */
const SB = {
  base: {x: 540, y: RIDE.groundY},
  dropR: 92,
  mScale: 0.3,
};
const ROWS = [7, 7, 6, 6, 5, 5, 4, 4, 3, 2]; // = 49 mosquitoes + the hero = 50
type Slot = {x: number; y: number; rot: number; flip: number; land: number; sx: number; sy: number};
const SLOTS: Slot[] = (() => {
  const out: Slot[] = [];
  let i = 0;
  const first = T.fifty + 0.04;
  const span = T.one - 0.45 - first; // last one lands on "one"
  ROWS.forEach((n, r) => {
    for (let c = 0; c < n; c++) {
      const start = first + (i / 48) * span;
      out.push({
        x: (c - (n - 1) / 2) * 44 + (r % 2) * 9 + (rand(i, 1) - 0.5) * 10,
        y: 6 - r * 33 + (rand(i, 2) - 0.5) * 8,
        rot: (rand(i, 3) - 0.5) * 44,
        flip: rand(i, 4) > 0.5 ? -1 : 1,
        land: start + 0.42,
        sx: 640 + rand(i, 5) * 420,
        sy: -1100 - rand(i, 6) * 600,
      });
      i++;
    }
  });
  return out;
})();

const SceneB: React.FC<{t: number}> = ({t}) => {
  const cam0 = camAt(
    [
      {t: T.cutScale, x: 545, y: 1500, z: -30},
      {t: T.cutBus, x: 545, y: 1490, z: 10, ease: (u) => u},
    ],
    t,
  );
  const sh = shakeAt(t, 12 * Math.exp(-7 * Math.max(0, t - T.dropLand)) * (t >= T.dropLand ? 1 : 0));
  const cam = cam0;
  const sim = simTime(t);
  const land = T.dropLand;
  const balance = easeInOutCubic(prog(t, T.fifty + 0.3, T.one + 0.05));
  const angle = (t >= land ? -24 * springTo(t - land, 1.6, 4.2) : 0) + 24 * balance + 2.2 * wobble(t - T.one - 0.05, 2.4, 4);
  const geo = scaleGeom(angle);
  const L = {x: SB.base.x + geo.rimL.x, y: SB.base.y + geo.rimL.y};
  const Rp = {x: SB.base.x + geo.rimR.x, y: SB.base.y + geo.rimR.y};

  // the drop falling into the left pan
  const g = 6400;
  const dropRestY = L.y + 26 - SB.dropR;
  const dt = land - t;
  const dropY = t < land ? dropRestY - 0.5 * g * dt * dt : dropRestY;
  const dsq = t >= land ? 0.28 * wobble(t - land, 3, 6) : 0;
  const dropFace = pick<DropExpr>([[-10, 'D2'], [land, 'D1'], [T.one, 'D4']], t);

  // the hero mosquito standing on the right pan, flicked up when the beam slams
  const hopU = prog(t, land, land + 0.62);
  const hop = t >= land && hopU < 1 ? 4 * hopU * (1 - hopU) * 230 : 0;
  const flip = t >= land ? 360 * easeInOutCubic(hopU) : 0;
  const heroY = Rp.y + 12 - 228 * SB.mScale - hop;
  const heroX = Rp.x - 56;
  const inAir = t >= land && hopU < 1;
  const afterHop = t >= land + 0.62;
  const hero = pick<MosqPose>([[-10, 'M1'], [land, 'M3'], [land + 0.62, 'M2'], [T.one, 'M4']], t);
  void inAir;

  const badgeS = popIn(t, T.fifty, 0.3);
  return (
    <>
      <RainWorldBack cam={cam} />
      <RainBack cam={cam} sim={sim} speed={1} />
      <Layer cam={cam} z={1000} shake={sh}>
        {/* stand, beam, strings and rims; then the pan contents; then the bowls' front halves */}
        <At x={SB.base.x} y={SB.base.y}>
          <ScaleBack angle={angle} />
        </At>
        <At x={L.x} y={dropY} sx={(1 + dsq) * dropFace.pop} sy={(1 - dsq) * dropFace.pop}>
          <DropSprite expr={dropFace.v} R={SB.dropR} />
        </At>
        {SLOTS.map((s, i) => {
          if (t < s.land - 0.42) return null;
          const u = prog(t, s.land - 0.42, s.land);
          const tx = Rp.x + s.x;
          const ty = Rp.y + s.y - 40;
          const e = easeOutCubic(u);
          const cx = (Rp.x + s.sx + tx) / 2;
          const cy = Math.min(Rp.y + s.sy, ty) - 260;
          const x = (1 - e) * (1 - e) * (Rp.x + s.sx) + 2 * (1 - e) * e * cx + e * e * tx;
          const y = (1 - e) * (1 - e) * (Rp.y + s.sy) + 2 * (1 - e) * e * cy + e * e * ty;
          const sq = t >= s.land ? 0.22 * wobble(t - s.land, 4, 9) : 0;
          return (
            <At key={i} x={x} y={y} rot={u < 1 ? -20 : s.rot} sx={SB.mScale * s.flip * (1 + sq)} sy={SB.mScale * (1 - sq)}>
              <MosqSprite t={sim + i * 0.013} pose={rand(i, 9) > 0.7 ? 'M4' : 'M1'} full={u >= 1} flapAmp={14} />
            </At>
          );
        })}
        <At x={heroX} y={heroY} rot={flip} sx={SB.mScale * hero.pop} sy={SB.mScale * hero.pop}>
          <MosqSprite t={sim} pose={hero.v} flapAmp={inAir ? 16 : 4} sweat={afterHop && t < T.one ? 1 : 0} sweatSlide={clamp((t - land - 0.62) / 1.2)} />
        </At>
        <At x={SB.base.x} y={SB.base.y}>
          <ScaleFront angle={angle} />
        </At>
        <At x={Rp.x - 70} y={Rp.y - 540 + 10 * Math.sin(t * 5)}>
          <Badge text="×50" s={badgeS} />
        </At>
      </Layer>
      <RainFront cam={cam} sim={sim} speed={1} />
    </>
  );
};

/* ======================================================================= Scene C: "for you, that's like a bus" */
const SC = {groundY: 1700, guyX: 700};
const SceneC: React.FC<{t: number}> = ({t}) => {
  const base = camAt(
    [
      {t: T.cutBus, x: 560, y: 1400, z: 250},
      {t: T.cutRide, x: 580, y: 1385, z: 330, ease: (u) => u},
    ],
    t,
  );
  const sh = shakeAt(t, t >= T.bus ? 10 + 6 * prog(t, T.bus, T.cutRide) : t >= T.hit ? 3 : 0);
  const cam = base;
  const sim = simTime(t);

  // bus approaches from the far end of the road, accelerating
  const u = prog(t, T.thats - 0.25, T.cutRide);
  const zFar = 26000;
  const zNear = 1070;
  const busZ = Math.exp(lerp(Math.log(zFar), Math.log(zNear), easeInCubic(u)));
  const busX = lerp(330, 560, easeInCubic(u));
  const busBounce = 6 * Math.abs(Math.sin(t * 14));

  // guy
  const jumpU = prog(t, T.bus, T.bus + 0.45);
  const jump = t >= T.bus && jumpU < 1 ? 4 * jumpU * (1 - jumpU) * 70 : 0;
  const antic = t >= T.bus - 0.08 && t < T.bus ? 1 : 0;
  const breathe = 1 + 0.009 * Math.sin(2 * Math.PI * 0.6 * t);
  const tremble = t >= T.bus ? 2 * Math.sin(t * 47) : 0;
  const guy = pick<GuyPose>([[-10, 'G1'], [T.you - 0.05, 'G2'], [T.thats, 'G1'], [T.bus, 'G3']], t);
  const guySweat = t >= T.hit && t < T.bus ? popIn(t, T.hit + 0.1) : 0;

  const sy = antic ? 0.93 : 1 + (jumpU < 1 && t >= T.bus ? 0.05 * Math.sin(jumpU * Math.PI) : 0);
  return (
    <>
      <Sky top="#7A90A8" bottom="#C1CEDA" />
      <Layer cam={cam} z={6000}>
        <Buildings y={SC.groundY + 300} />
      </Layer>
      <Road cam={cam} groundY={SC.groundY} />
      <RainField cam={cam} simT={sim} speed={1} spec={RAIN_LAYERS[0]} />
      <Layer cam={cam} z={busZ} minDepth={120} shake={sh}>
        <At x={busX} y={SC.groundY - busBounce}>
          <BusSprite />
        </At>
      </Layer>
      <RainField cam={cam} simT={sim} speed={1} spec={RAIN_LAYERS[1]} />
      <Layer cam={cam} z={1000} shake={sh}>
        <At x={SC.guyX + tremble} y={SC.groundY - jump} sx={(antic ? 1.05 : 1) * guy.pop} sy={sy * breathe * guy.pop}>
          <GuySprite pose={guy.v} sweat={guySweat} sweatSlide={clamp((t - T.hit) / 0.6)} />
        </At>
      </Layer>
      <RainFront cam={cam} sim={sim} speed={1} />
    </>
  );
};

/* ======================================================================= Scene D: the ride */
const ATTACH = {x: -60, y: RIDE.R + 80};
const P = RIDE;
const mosqRideY = (t: number) => rideDropY(t) + ATTACH.y;
const SLIDE_END = T.slides + 0.75;

const mosquitoPosD = (t: number) => {
  const bobAmp = 10 * (1 - prog(t, T.hits - 0.1, T.hits)) ;
  if (t < T.hits) {
    const lift = t >= T.light ? -46 * Math.sin(Math.PI * prog(t, T.light, T.light + 0.9)) : 0;
    return {x: P.M0.x, y: P.M0.y + sway(t, bobAmp, 1.1) + lift, rot: t >= T.light ? 8 * Math.sin(Math.PI * 2 * prog(t, T.light, T.light + 0.9)) : 0};
  }
  if (t < T.slides) {
    const surf = t >= T.rides ? 6 * Math.sin(2 * Math.PI * 0.9 * (t - T.rides)) * smooth(t, T.rides, T.rides + 0.3) : 0;
    return {x: P.dropX + ATTACH.x, y: mosqRideY(t), rot: 6 + surf};
  }
  const s0 = {x: P.dropX + ATTACH.x, y: mosqRideY(T.slides)};
  const u = prog(t, T.slides, SLIDE_END);
  const p1 = {x: s0.x + 320, y: s0.y - 90};
  if (t < T.keeps) {
    const e = easeOutCubic(u);
    return {
      x: lerp(s0.x, p1.x, e),
      y: lerp(s0.y, p1.y, e) + 40 * Math.sin(Math.PI * u) + (u >= 1 ? sway(t, 8, 1.2) : 0),
      rot: 6 - 360 * easeInOutCubic(prog(t, T.slides, T.slides + 0.6)),
    };
  }
  // fly home with a loop-de-loop
  const v = easeInOutCubic(prog(t, T.keeps, 22.15));
  const c1 = {x: p1.x + 220, y: p1.y - 520};
  const c2 = {x: P.M0.x - 380, y: P.M0.y + 160};
  const b = (a: number, b1: number, c: number, d: number) =>
    (1 - v) ** 3 * a + 3 * (1 - v) ** 2 * v * b1 + 3 * (1 - v) * v * v * c + v ** 3 * d;
  const settle = 1 - prog(t, T.END - 0.35, T.END);
  return {
    x: b(p1.x, c1.x, c2.x, P.M0.x),
    y: b(p1.y + sway(T.keeps, 8, 1.2), c1.y, c2.y, P.M0.y) + (v >= 1 ? sway(t, 9, 1.1) * settle : 0),
    rot: -360 * easeInOutCubic(prog(t, T.keeps + 0.3, T.keeps + 0.95)),
  };
};

const SceneD: React.FC<{t: number}> = ({t}) => {
  const sim = simTime(t);
  const speed = timeScale(t);
  const m = mosquitoPosD(t);
  const base = camAt(
    [
      {t: T.cutRide, x: 540, y: 810, z: 250},
      {t: T.drop - 0.15, x: 540, y: 830, z: 300, ease: (u) => u},
      {t: T.slows, x: 540, y: 740, z: -60},
      {t: T.hits + 1.0, x: 540, y: 1000, z: -20},
      {t: T.doesnt + 0.2, x: 520, y: 1100, z: 130},
      {t: T.moment, x: 530, y: 1500, z: 110},
      {t: T.slides + 0.6, x: 640, y: 1370, z: -150},
      {t: T.keeps, x: 640, y: 1370, z: -150},
      {t: 22.3, x: 540, y: 810, z: 250},
    ],
    t,
  );
  const fw = smooth(t, T.hits + 0.1, T.hits + 0.9) * (1 - smooth(t, T.moment + 0.1, T.slides + 0.6));
  const cam: Cam = {x: lerp(base.x, m.x - 20, fw * 0.6), y: lerp(base.y, m.y - 150, fw), z: base.z};
  const hitAge = t - T.hits;
  const sh = shakeAt(t, (hitAge >= 0 ? 22 * Math.exp(-6 * hitAge) : 0) + (t >= SPLASH_T ? 12 * Math.exp(-7 * (t - SPLASH_T)) : 0));

  // hero drop
  const showRideDrop = t >= T.drop && t < SPLASH_T + 0.1;
  const dropY = rideDropY(t);
  const imp = hitAge >= 0 ? 0.14 * wobble(hitAge, 2.2, 3.5) : 0;
  const sinkU = prog(t, SPLASH_T - 0.02, SPLASH_T + 0.1);
  const dropSY = (1 - imp) * (1 - 0.7 * sinkU);
  const dropSX = (1 + imp) * (1 + 0.35 * sinkU);
  const dface = pick<DropExpr>([[-10, 'D2'], [T.hits, 'D3'], [T.slides + 0.1, 'D4']], t);

  // the next drop arriving for the loop
  const nextU = prog(t, 21.55, T.END);
  const nextY = lerp(-560, DROP_A_Y(0), easeOutCubic(nextU)) - 32 * (1 - nextU) * 0;

  // mosquito face
  const mf = pick<MosqPose>(
    [
      [-10, 'M4'],
      [T.drop + 0.15, 'M1'],
      [T.barely, 'M2'],
      [T.when, 'M3'],
      [T.hits + 0.55, 'M1'],
      [T.doesnt + 0.05, 'M2'],
      [T.almost + 0.2, 'M1'],
      [T.bug, 'M4'],
      [T.rides, 'M5'],
      [T.moment, 'M2'],
      [T.slides, 'M3'],
      [T.slides + 0.62, 'M1'],
      [T.keeps, 'M4'],
      [22.05, FRAME0_MOSQ],
    ],
    t,
  );
  const sweat = t >= T.slows && t < T.hits ? popIn(t, T.slows, 0.25) : t >= T.moment && t < T.slides + 0.6 ? popIn(t, T.moment, 0.25) : 0;
  const sweatSlide = t < T.hits ? prog(t, T.slows, T.hits) : prog(t, T.moment, T.slides + 0.6);
  const msq = hitAge >= 0 && hitAge < 1.2 ? 0.2 * wobble(hitAge, 2.4, 4) : 0;
  const riding = t >= T.hits - 0.02 && t < T.slides + 0.25; // wings tucked behind the drop while stuck to it

  // force arrow
  const arrowIn = popIn(t, T.doesnt, 0.3);
  const deflate = easeInOutCubic(prog(t, T.almost, T.force + 0.15));
  const arrowGone = t >= T.bug ? popOut(t, T.bug, 0.25) : 1;
  const arrowS = arrowIn * lerp(1, 0.2, deflate) * arrowGone * (1 + 0.05 * wobble(t - T.force, 5, 5));
  const arrowTip = {x: m.x - 70, y: m.y - 70};

  return (
    <>
      <RainWorldBack cam={cam} />
      <RainBack cam={cam} sim={sim} speed={speed} />
      <Layer cam={cam} z={1000} shake={sh}>
        {t >= 21.55 && (
          <At x={P.dropX} y={nextY}>
            <DropSprite expr={FRAME0_DROP} R={P.R} />
          </At>
        )}
        {t >= T.drop && t < T.hits + 0.05 && (
          <At x={P.dropX} y={dropY - P.R * 1.9}>
            <SpeedLines t={t} w={340} h={520} alpha={1 - prog(t, T.hits - 0.1, T.hits + 0.05)} seed={3} />
          </At>
        )}
        {riding && (
          <At x={m.x} y={m.y} rot={m.rot} sx={(1 + msq * 0.5) * mf.pop} sy={(1 - msq) * mf.pop}>
            <MosqSprite t={sim} pose={mf.v} part="wings" flapAmp={5} />
          </At>
        )}
        {showRideDrop && (
          <At x={P.dropX} y={dropY + P.R * (1 - dropSY)} sx={dropSX * dface.pop} sy={dropSY * dface.pop}>
            <DropSprite expr={dface.v} R={P.R} />
          </At>
        )}
        <At x={P.dropX} y={P.puddleY - 6}>
          <Splash age={t - SPLASH_T} scale={1.7} />
        </At>
        <At x={m.x} y={m.y} rot={m.rot} sx={(1 + msq * 0.5) * mf.pop} sy={(1 - msq) * mf.pop}>
          <MosqSprite t={sim} pose={mf.v} sweat={sweat} sweatSlide={sweatSlide} part={riding ? 'body' : 'all'} flapAmp={11} />
        </At>
        <At x={m.x - 30} y={m.y - 90}>
          <ImpactStar s={hitAge >= 0 && hitAge < 0.3 ? popIn(t, T.hits, 0.08) * (1 - prog(t, T.hits + 0.12, T.hits + 0.3)) : 0} rot={hitAge * 40} />
        </At>
        <At x={m.x - 10} y={m.y - 80}>
          <ImpactSpray age={hitAge / Math.max(0.2, speed)} />
        </At>
        <At x={arrowTip.x} y={arrowTip.y} rot={-38 + 10 * deflate}>
          <ForceArrow s={arrowS} crumple={deflate} />
        </At>
      </Layer>
      <RainFront cam={cam} sim={sim} speed={speed} />
    </>
  );
};

/* ======================================================================= root */
export const MosquitoRain: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  let scene: React.ReactNode;
  if (t < T.cutScale) scene = <SceneA t={t} />;
  else if (t < T.cutBus) scene = <SceneB t={t} />;
  else if (t < T.cutRide) scene = <SceneC t={t} />;
  else scene = <SceneD t={t} />;
  return (
    <AbsoluteFill style={{backgroundColor: '#9DB3C7', overflow: 'hidden'}}>
      {scene}
      <Sound />
    </AbsoluteFill>
  );
};
