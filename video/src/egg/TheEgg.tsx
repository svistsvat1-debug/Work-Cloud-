import React from 'react';
import {AbsoluteFill, Audio, Img, Sequence, continueRender, delayRender, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {
  Cam, CamKey, Layer, Sprite, Svg, WorldImg, camAt, clamp, easeInCubic, easeInOutCubic, easeOutBack, easeOutCubic, kAt, lerp, linear,
  poseAt, prog, rnd, toScreen, wobble,
} from './lib';
import {
  CloudBank, Crack, Drop, Droplets, Galaxy, Glow, Poof, Rays, RingPlanet, Shards, Sparkles, Stars, Steam, Sun, SvgSprite,
  VoidSky, crackPoints, eggPath,
} from './fx';
import {SPR} from './sprites';
import {ROWS} from './crowd';

// Fredoka Bold (OFL) served from public/: the render browser cannot reach Google Fonts here
const fontFamily = 'FredokaLocal';
const W = (typeof window !== 'undefined' ? window : {}) as {__fredoka?: boolean};
if (typeof document !== 'undefined' && !W.__fredoka) {
  W.__fredoka = true;
  const handle = delayRender('Loading Fredoka');
  const face = new FontFace(fontFamily, `url(${staticFile('the-egg/fonts/fredoka-700-latin.woff2')}) format('woff2')`, {weight: '700'});
  face.load().then((f) => { (document.fonts as unknown as {add: (x: FontFace) => void}).add(f); continueRender(handle); })
    .catch((e) => { console.error(e); continueRender(handle); });
}
const INK = '#141414';

// ---------- timing (composition seconds; the voice starts at 0.1 s) ----------
export const VO_AT = 0.1;
export const T = {
  died: 0.54, hi: 2.485, god: 3.2, heaven: 3.875, hell: 4.42, nope: 5.045, back: 5.47, backW: 5.78,
  over: 6.455, hundred: 6.7, lived: 9.14, every: 9.96, you: 11.7, killer: 12.43, killerW: 12.74,
  victim: 13.635, victimW: 14.16, why: 15.06, because: 15.705, born: 16.43, when: 17.33, everyone: 17.78,
  hatch: 18.775, hatchW: 18.9, burst: 19.36, asgod: 19.7, godW: 20.0, everything: 20.725, isjust: 22.67,
  egg: 23.93, sub: 24.575, subEnd: 25.635,
};
export const EGG_DURATION_S = 26.3;

// ---------- world constants ----------
const HERO_R = 150;                  // hero head radius in world units (depth 1000)
const HX = 540, HY = 700;            // hero head position in the void
const GOD_S = 1170 / SPR.god.head[2];
const GOD_Z = 2400, GOD_X = 540, GOD_Y = -1040;
const heroS = (pose: string) => HERO_R / SPR[pose].head[2];
const bob = (t: number, a = 10, f = 0.4) => a * Math.sin(2 * Math.PI * f * t);

// A hero pose at world (x, y) = head centre; pivot for squash/flip is (head x, feet y).
const Hero: React.FC<{t: number; x: number; y: number; pose: string; flip?: boolean; sx?: number; sy?: number; scale?: number; rot?: number}> = (
  {t, x, y, pose, flip = false, sx = 1, sy = 1, scale = 1, rot = 0}) => {
  const info = SPR[pose];
  const s = heroS(pose) * scale;
  const breathe = 1 + 0.009 * Math.sin(2 * Math.PI * 0.6 * t);
  return <Sprite name={pose} x={x} y={y} s={s} px={info.head[0]} py={info.box[3]} sx={sx} sy={sy * breathe} flip={flip} rot={rot} />;
};

// ---------- SHOT A + D: the void with God ----------
const GodFigure: React.FC<{t: number; dz?: number; rot?: number; dy?: number}> = ({t, rot = 0, dy = 0}) => {
  const y = GOD_Y + dy + bob(t, 14, 0.22);
  const neckY = SPR.god.head[1] + SPR.god.head[2] * 1.15;
  return <Sprite name="god" x={GOD_X} y={y} s={GOD_S} px={SPR.god.head[0]} py={neckY} rot={rot} filter={GOD_TINT} />;
};

const GOD_TINT = 'sepia(0.42) saturate(1.7) hue-rotate(-6deg) brightness(1.02)';
const VoidWorld: React.FC<{t: number; cam: Cam; godRot: number; godDz: number; godDy: number; raysOn: number; children?: React.ReactNode;
  front?: React.ReactNode; dof?: number}> = ({t, cam, godRot, godDz, godDy, raysOn, children, front, dof = 0}) => (
  <>
    <VoidSky />
    <Sparkles t={t} drift={[-cam.x * 0.05, -cam.y * 0.08]} opacity={0.9} />
    <Layer cam={cam} z={GOD_Z + 60 + godDz} blur={dof}>
      <Rays x={GOD_X} y={GOD_Y + godDy} r={2900} t={t} n={16} opacity={0.75 * raysOn} />
    </Layer>
    <Layer cam={cam} z={GOD_Z + godDz} blur={dof}>
      <GodFigure t={t} rot={godRot} dy={godDy} />
    </Layer>
    <Layer cam={cam} z={2250} blur={dof * 0.8}>
      <CloudBank x0={-4200} x1={5300} y={2350} r={430} t={t} line={10} />
    </Layer>
    {children}
    {front}
  </>
);

const shotA = (t: number) => {
  const keys: CamKey[] = [
    {t: 0, x: 540, y: 845, z: 300},
    {t: 2.4, x: 540, y: 835, z: 330, ease: linear},
    {t: 3.55, x: 540, y: 330, z: -950},
    {t: 3.75, x: 540, y: 345, z: -920, ease: linear},
    {t: 4.3, x: 540, y: 560, z: -480},
    {t: 5.35, x: 540, y: 580, z: -440, ease: linear},
    {t: 5.98, x: 540, y: 1350, z: -500},
    {t: 6.455, x: 540, y: 1950, z: 1260, ease: easeInCubic},
  ];
  return camAt(t, keys, 1400);
};

const ShotA: React.FC<{t: number}> = ({t}) => {
  const cam = shotA(t);
  const swaps = [
    {t: 0, pose: 'hero_float'},
    {t: T.hi, pose: 'hero_startled', kind: 'pop' as const},
    {t: 3.8, pose: 'hero_side', kind: 'turn' as const},
    {t: 4.36, pose: 'hero_side', kind: 'turn' as const, flip: true},
    {t: T.back, pose: 'hero_nervous', kind: 'action' as const},
  ];
  const p = poseAt(t, swaps);
  const hop = t > T.hi && t < T.hi + 0.6 ? -110 * Math.sin(Math.PI * prog(t, T.hi, T.hi + 0.6)) : 0;
  const hy = HY + bob(t) + hop;
  // God: friendly nod on "Hi", head shake on "Nope"
  const godRot = 3.5 * wobble(t, T.hi + 0.05, 1.6, 2.2) + 6.5 * wobble(t, T.nope, 3.1, 3.2);
  const raysOn = clamp((t - 2.75) / 0.6);
  // God rises from behind the clouds on "Hi"
  const godRise = lerp(4840, 0, easeOutBack(prog(t, 2.36, 3.3), 1.2));
  // mug: drawn in the hand until "Hi", then flies up and away spinning
  const m = SPR.hero_float.mug!;
  const hs = heroS('hero_float');
  const mug0x = HX + (m[0] - SPR.hero_float.head[0]) * hs, mug0y = HY + bob(T.hi) + (m[1] - SPR.hero_float.head[1]) * hs;
  const mugS = (m[2] * hs) / SPR.mug.body![2];
  const md = t - T.hi;
  const mugX = mug0x + 420 * md, mugY = mug0y - 3400 * md + 0.5 * 1500 * md * md;
  // icons
  const iconS = 0.56;
  const heavenScale = easeOutBack(prog(t, T.heaven - 0.05, T.heaven + 0.25)) * (1 - easeInCubic(prog(t, T.nope + 0.04, T.nope + 0.16)));
  const hellScale = easeOutBack(prog(t, T.hell - 0.05, T.hell + 0.25)) * (1 - easeInCubic(prog(t, T.nope + 0.16, T.nope + 0.28)));
  // earth rises on "going back"
  const earthY = lerp(2950, 1950, easeOutCubic(prog(t, T.back - 0.05, 6.0)));
  const earthS = 900 / SPR.earth.w;
  return (
    <VoidWorld t={t} cam={cam} godRot={godRot} godDz={0} godDy={godRise} raysOn={raysOn} dof={2.6 * clamp((t - 3.55) / 0.5)}>
      <Layer cam={cam} z={1400} minDepth={60}>
        {t > T.back - 0.1 ? <Sprite name="earth" x={540} y={earthY} s={earthS} rot={t * 6} /> : null}
      </Layer>
      <Layer cam={cam} z={1000}>
        {heavenScale > 0.01 ? <Sprite name="heaven" x={HX - 360} y={HY - 60 + bob(t + 1, 8, 0.7)} s={iconS * heavenScale} /> : null}
        {hellScale > 0.01 ? <Sprite name="hell" x={HX + 360} y={HY - 60 + bob(t + 2, 8, 0.8)} s={iconS * hellScale}
          sx={1 + 0.04 * Math.sin(t * 19)} sy={1 + 0.05 * Math.sin(t * 23 + 1)} /> : null}
        <Poof x={HX - 360} y={HY - 60} t={t} t0={T.nope + 0.1} r={95} seed={2} />
        <Poof x={HX + 360} y={HY - 60} t={t} t0={T.nope + 0.22} r={95} seed={5} />
        <Hero t={t} x={HX} y={hy} pose={p.pose} flip={p.flip} sx={p.sx} sy={p.sy} />
        {t < T.hi ? <Steam x={mug0x - 4} y={mug0y - 50} t={t} scale={1.1} /> : null}
        {t >= T.hi && md < 1.4 ? <Sprite name="mug" x={mugX} y={mugY} s={mugS} ax={SPR.mug.body![0]} ay={SPR.mug.body![1]} rot={md * 540} /> : null}
        <Droplets x={mug0x} y={mug0y - 40} t={t} t0={T.hi + 0.02} n={10} scale={1} />
        <Drop x={HX + 128} y={HY - 70} t={t} t0={5.62} t1={6.4} size={34} slide={60} />
      </Layer>
    </VoidWorld>
  );
};

// ---------- SHOT B: the crowd ----------
const shotB = (t: number) => camAt(t, [
  {t: 6.455, x: 540, y: 1250, z: 420, sy: 0},
  {t: 6.85, x: 540, y: 1240, z: 380, sy: 0, ease: linear},
  {t: 9.35, x: 540, y: -1500, z: -2000, sy: -330},
  {t: 9.96, x: 540, y: -1440, z: -1950, sy: -330, ease: linear},
  {t: 11.45, x: 640, y: 650, z: -150, sy: -250},
  {t: 12.43, x: 650, y: 640, z: -90, sy: -250, ease: linear},
]);

const formatCount = (v: number) => Math.floor(v).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');

const ShotB: React.FC<{t: number}> = ({t}) => {
  const cam = shotB(t);
  const horizon = 960 + (cam.sy ?? 0);
  // far copies of the back rows (tiled) so the crowd runs to the horizon
  // far tiers: re-use the back strips deeper and deeper (continuous depth), tiled sideways to cover the view
  const tiers: [number, number[], number][] = [[7600, [-1, 0, 1], 1], [11740, [-2, -1, 0, 1, 2], 2], [15650, [-2, -1, 0, 1, 2], 2], [19560, [-3, -2, -1, 0, 1, 2, 3], 2]];
  const far = tiers.flatMap(([dz, offs, step]) => ROWS.slice(14).filter((_, j) => j % step === 0)
    .flatMap((r) => offs.map((o) => ({...r, z: r.z + dz, x: r.x + o * r.w, key: `${r.row}-${dz}-${o}`}))));
  const rows = [...far.map((r) => ({...r, far: true})), ...ROWS.map((r, i) => ({...r, key: r.row, far: false, i}))]
    .sort((a, b) => b.z - a.z);
  const heroX = 863 + 1300 * (1 - easeOutCubic(prog(t, T.every, 10.9)));
  const p = poseAt(t, [{t: 0, pose: 'hero_side'}, {t: T.you, pose: 'hero_shocked', kind: 'pop'}]);
  const count = t < T.hundred ? 0 : Math.pow(10, 11 * easeOutCubic(prog(t, T.hundred, T.lived)));
  const counterIn = easeOutBack(prog(t, 6.55, 6.85));
  return (
    <>
      <AbsoluteFill style={{background: `linear-gradient(180deg, #74C3FF 0%, #A9DCFF ${horizon * 0.6 / 19.2}%, #E6F6FF ${horizon / 19.2}%, #E6F6FF 100%)`}} />
      {/* ground */}
      <div style={{position: 'absolute', left: 0, top: 0, transform: `translateY(${horizon}px)`, width: 1080, height: 1920 + 400,
        background: 'linear-gradient(180deg, #CFE9B2 0%, #B9E09A 30%, #A6D684 100%)', borderTop: `4px solid ${INK}`}} />
      {/* distant heads: a band of tiny heads just under the horizon, where the real rows get too small */}
      <svg style={{position: 'absolute', left: 0, top: 0, transform: `translateY(${horizon + 2}px)`}} width={1080} height={280}>
        <defs>
          <pattern id="heads" width={8} height={7} patternUnits="userSpaceOnUse">
            <circle cx={4} cy={3.5} r={2.7} fill="#FFFFFF" stroke="#3A3D44" strokeWidth={0.9} />
          </pattern>
          <pattern id="hats" width={19} height={13} patternUnits="userSpaceOnUse">
            <rect x={2} y={1} width={4} height={2.4} fill="#4A3B2E" />
            <rect x={11} y={7.5} width={4} height={2.4} fill="#E2B93B" />
          </pattern>
        </defs>
        <rect x={0} y={0} width={1080} height={280} fill="#C9CEC0" />
        <rect x={0} y={0} width={1080} height={280} fill="url(#heads)" />
        <rect x={0} y={0} width={1080} height={280} fill="url(#hats)" />
      </svg>
      {rows.map((r) => {
        const i = (r as {i?: number}).i ?? 40;
        const tH = T.you + 0.02 + 0.022 * i;
        const hop = r.far ? 0 : -30 * Math.sin(Math.PI * prog(t, tH + 0.03, tH + 0.33));
        const hd = easeOutBack(prog(t, tH, tH + 0.26));
        const ho = clamp((t - tH) / 0.05);
        return (
          <Layer key={r.key} cam={cam} z={r.z} minDepth={120}>
            <WorldImg src={r.row} x={r.x} y={r.y + hop} w={r.w} h={r.h} pw={r.pw} ph={r.ph} />
            {!r.far && ho > 0 ? <WorldImg src={r.halo} x={r.x} y={r.y + hop - 70 * (1 - hd)} w={r.w} h={r.h} pw={r.pw} ph={r.ph} opacity={ho} /> : null}
          </Layer>
        );
      })}
      <Layer cam={cam} z={820}>
        {t > T.every - 0.05 ? <Hero t={t} x={heroX} y={504 + bob(t, 12)} pose={p.pose} sx={p.sx} sy={p.sy} /> : null}
        <Drop x={heroX - 165} y={330} t={t} t0={T.you + 0.12} t1={T.you + 0.75} size={38} slide={70} />
      </Layer>
      {/* counter */}
      {t > 6.55 ? (
        <div style={{position: 'absolute', left: 0, width: 1080, top: 250, textAlign: 'center', fontFamily, fontWeight: 700,
          fontSize: 108, color: '#FFFFFF', WebkitTextStroke: `16px ${INK}`, paintOrder: 'stroke fill', letterSpacing: 1,
          transform: `scale(${counterIn * (1 + 0.06 * Math.max(0, 1 - Math.abs(t - T.lived - 0.05) / 0.12))})`,
          opacity: 1 - clamp((t - 9.75) / 0.12)}}>
          {t >= T.lived ? '100,000,000,000+' : formatCount(Math.max(1, count))}
        </div>
      ) : null}
    </>
  );
};

// ---------- SHOT C: killer & victim ----------
const ShotC: React.FC<{t: number}> = ({t}) => {
  const cam = camAt(t, [{t: 12.43, x: 540, y: 900, z: -100}, {t: 15.06, x: 540, y: 880, z: 70}]);
  const vs = 0.56;
  const popV = easeOutBack(prog(t, 12.47, 12.8));
  const popW = easeOutBack(prog(t, 13.68, 14.0));
  const lightV = clamp((t - 12.45) / 0.15), lightW = clamp((t - 13.66) / 0.15);
  const tremble = t > 14.05 ? 3 * Math.sin(2 * Math.PI * 13.3 * t) + 2 * Math.sin(2 * Math.PI * 7.1 * t + 1) : 0;
  const [vx, vy] = toScreen(cam, 300, 1430, 1000);
  const [wx, wy] = toScreen(cam, 790, 1430, 1000);
  const vic = SPR.victim;
  const vil = SPR.villain;
  return (
    <>
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 40%, #2C2450 0%, #1B1631 70%, #120F22 100%)'}} />
      <svg width={1080} height={1920} style={{position: 'absolute'}}>
        <defs>
          <linearGradient id="spot" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#FFF6D6" stopOpacity={0.05} />
            <stop offset="1" stopColor="#FFF6D6" stopOpacity={0.32} />
          </linearGradient>
        </defs>
        <polygon points={`${vx - 40},-20 ${vx + 40},-20 ${vx + 230},${vy + 10} ${vx - 230},${vy + 10}`} fill="url(#spot)" opacity={lightV} />
        <ellipse cx={vx} cy={vy + 6} rx={230} ry={46} fill="#FFF3C9" opacity={0.28 * lightV} />
        <polygon points={`${wx - 40},-20 ${wx + 40},-20 ${wx + 230},${wy + 10} ${wx - 230},${wy + 10}`} fill="url(#spot)" opacity={lightW} />
        <ellipse cx={wx} cy={wy + 6} rx={230} ry={46} fill="#FFF3C9" opacity={0.28 * lightW} />
      </svg>
      <Layer cam={cam} z={1000}>
        {popV > 0.01 ? <Sprite name="villain" x={300} y={1430} s={vs * popV} ax={(vil.box[0] + vil.box[2]) / 2} ay={vil.box[3]}
          rot={2.5 * wobble(t, T.killerW, 2.2, 3)} sy={1 + 0.012 * Math.sin(2 * Math.PI * 0.7 * t)} /> : null}
        {popW > 0.01 ? <Sprite name="victim" x={790 + tremble} y={1430} s={vs * popW} ax={(vic.box[0] + vic.box[2]) / 2} ay={vic.box[3]} /> : null}
        <Drop x={790 - 52 + tremble} y={1430 - (vic.box[3] - vic.head[1]) * vs + 10} t={t} t0={14.2} t1={15.1} size={22} fall />
        <Drop x={790 + 22 + tremble} y={1430 - (vic.box[3] - vic.head[1]) * vs + 10} t={t} t0={14.42} t1={15.1} size={20} fall />
        <Drop x={300 + 95} y={1430 - (vil.box[3] - vil.head[1]) * vs - 95} t={t} t0={14.45} t1={15.1} size={30} slide={45} />
      </Layer>
    </>
  );
};

// ---------- SHOT D: back in the void ----------
const shotD = (t: number) => camAt(t, [
  {t: 15.06, x: 540, y: 600, z: -450},
  {t: 16.9, x: 540, y: 620, z: -330},
  {t: 18.6, x: 540, y: 640, z: -300},
  {t: 19.36, x: 540, y: 656, z: -268, ease: linear},
  {t: 20.35, x: 540, y: 300, z: -1250, ease: easeOutCubic},
  {t: 20.725, x: 540, y: 290, z: -1300, ease: linear},
]);

const FLY = ['crowd_caveman', 'crowd_pharaoh', 'crowd_roman', 'crowd_knight', 'crowd_viking', 'crowd_pirate', 'crowd_tophat', 'crowd_cowboy', 'crowd_chef', 'crowd_builder'];

const ShotD: React.FC<{t: number}> = ({t}) => {
  const cam = shotD(t);
  const swaps = [
    {t: 0, pose: 'hero_shrug'},
    {t: T.born - 0.02, pose: 'hero_pacifier', kind: 'pop' as const},
    {t: T.when, pose: 'hero_god', kind: 'action' as const},
    {t: 18.72, pose: 'hero_curled', kind: 'action' as const},
    {t: T.burst, pose: 'hero_god', kind: 'pop' as const},
  ];
  const p = poseAt(t, swaps);
  const lean = easeInOutCubic(prog(t, T.because, 16.5));
  const godDz = -280 * lean, godDy = 260 * lean, godRot = -4 * lean + 2.5 * wobble(t, 20.0, 1.8, 2.5);
  const grow = t < T.burst ? 1 : 1 + 2.0 * easeOutBack(prog(t, T.burst, 20.15), 1.3);
  const hy = HY + bob(t) - (grow - 1) * 60;
  const glow = clamp((t - T.when) / 1.2) * (t < T.burst ? 1 : 1 - clamp((t - T.burst) / 0.5));
  const eggS = easeOutBack(prog(t, 18.74, 18.98)) * (t < T.burst ? 1 : 0);
  const eggWob = wobble(t, T.hatchW, 6, 5) * 4 + wobble(t, 19.08, 6, 5) * 4;
  const raysOn = clamp((t - T.burst) / 0.35);
  const cx = HX, cy = HY + 120;
  const c1 = crackPoints(cx - 190, cy - 160, 420, 0.35, 3);
  const c2 = crackPoints(cx + 210, cy + 40, 300, 2.6, 8, 5);
  return (
    <VoidWorld t={t} cam={cam} godRot={godRot} godDz={godDz} godDy={godDy} raysOn={1} dof={2.6 * (1 - clamp((t - 19.9) / 0.4))}>
      <Layer cam={cam} z={1010}>
        <Glow id="absorb" x={cx} y={cy - 40} r={520 * glow + 1} opacity={glow} />
        <Rays x={HX} y={hy} r={2600} t={t} n={18} opacity={0.85 * raysOn} color="#FFE28A" spin={-8} />
      </Layer>
      <Layer cam={cam} z={1000}>
        <Hero t={t} x={HX} y={hy} pose={p.pose} sx={p.sx} sy={p.sy} scale={grow} />
        {/* lives flying in */}
        {t > T.when - 0.05 && t < 18.75 ? FLY.concat(FLY).concat(FLY.slice(0, 4)).map((name, i) => {
          const t0 = T.when + 0.03 * i, t1 = 17.75 + 0.035 * i;
          if (t < t0 || t > t1) return null;
          const u = easeInCubic(prog(t, t0, t1));
          const a0 = (i / 24) * Math.PI * 2 + rnd(i, 3), a = a0 + 1.6 * u;
          const R = 1500 * (1 - u) + 10;
          return <Sprite key={i} name={name} x={cx + Math.cos(a) * R} y={cy - 40 + Math.sin(a) * R * 0.85} s={0.33 * (1 - 0.85 * u)} rot={u * 200 * (i % 2 ? 1 : -1)} />;
        }) : null}
        {eggS > 0.01 ? (
          <Svg>
            <g transform={`translate(${cx} ${cy}) rotate(${eggWob}) scale(${eggS}) translate(${-cx} ${-cy})`}>
              <path d={eggPath(cx, cy, 300, 400)} fill="#FFF4DE" fillOpacity={0.6} stroke={INK} strokeWidth={9} />
              <path d={eggPath(cx + 25, cy + 35, 240, 330)} fill="#FFE7B8" fillOpacity={0.18} />
            </g>
          </Svg>
        ) : null}
        {eggS > 0.5 ? <Crack pts={c1} u={prog(t, T.hatchW - 0.02, T.hatchW + 0.12)} width={8} glow={clamp((t - 19.0) / 0.3)} /> : null}
        {eggS > 0.5 ? <Crack pts={c2} u={prog(t, 19.08, 19.18)} width={7} glow={clamp((t - 19.1) / 0.25)} /> : null}
        <Shards x={cx} y={cy} t={t} t0={T.burst} size={330} n={18} />
        <Drop x={HX + 125} y={HY - 80} t={t} t0={16.55} t1={17.25} size={30} slide={40} />
      </Layer>
      {/* burst flash ring */}
      {t > T.burst && t < T.burst + 0.35 ? (
        <AbsoluteFill style={{background: '#FFFFFF', opacity: 0.85 * (1 - prog(t, T.burst, T.burst + 0.35))}} />
      ) : null}
    </VoidWorld>
  );
};

// ---------- SHOT E: the universe is an egg ----------
const EGG = {x: 540, y: 900, a: 1750, b: 2300, z: 3000};
const shotE = (t: number) => camAt(t, [
  {t: 20.725, x: -20, y: 1560, z: 2150},
  {t: 22.4, x: 70, y: 1460, z: 2040, ease: linear},
  {t: 23.95, x: 540, y: 860, z: -1200},
  {t: 24.6, x: 540, y: 865, z: -1150, ease: linear},
  {t: 26.3, x: 540, y: -500, z: 650, ease: easeInCubic},
], EGG.z);

const ShotE: React.FC<{t: number}> = ({t}) => {
  const cam = shotE(t);
  const pulse = (t0: number) => (t > t0 ? Math.exp(-7 * (t - t0)) * Math.sin(Math.PI * clamp((t - t0) / 0.18)) : 0);
  const beat = 1 + 0.03 * pulse(T.egg) + 0.022 * pulse(T.egg + 0.28);
  const wob = 2.6 * Math.sin(2 * Math.PI * 2.0 * (t - 24.6)) * clamp((t - 24.6) / 0.2) * clamp((25.9 - t) / 0.4);
  const {x, y, a, b} = EGG;
  const topY = y - b;
  const crack1 = crackPoints(x - 30, topY + 30, 1150, 1.25, 21, 7);
  const crack2 = crackPoints(crack1[3][0], crack1[3][1], 600, 2.2, 33, 4);
  const crU = prog(t, 24.85, 25.3), cr2U = prog(t, 25.25, 25.55);
  const crGlow = clamp((t - 25.05) / 0.4);
  const eggD = eggPath(x, y, a, b);
  // flash from the crack
  const [fx, fy] = toScreen(cam, crack1[2][0], crack1[2][1], EGG.z);
  const flashR = 2600 * easeInCubic(prog(t, 25.72, 26.18));
  const whiteOut = clamp((t - 26.08) / 0.12);
  const heroS2 = 360 / SPR.hero_curled.h;
  const earthS = 800 / SPR.earth.w;
  return (
    <>
      <VoidSky />
      <Sparkles t={t} drift={[-cam.x * 0.03, -cam.y * 0.03]} opacity={clamp((t - 22.8) / 0.6)} seed={4} />
      <Layer cam={cam} z={3300}>
        <Sprite name="god" x={540} y={-2330 + 12 * Math.sin(t)} s={GOD_S} filter={GOD_TINT} />
      </Layer>
      <Layer cam={cam} z={3100}>
        <Sprite name="god_hands" x={540} y={3330} s={2.13} ax={1008} ay={1250} filter={GOD_TINT} />
      </Layer>
      <Layer cam={cam} z={EGG.z} minDepth={150}>
        <Svg>
          <defs>
            <clipPath id="eggClip"><path d={eggD} /></clipPath>
            <radialGradient id="space" cx={x} cy={y} r={b * 1.1} gradientUnits="userSpaceOnUse">
              <stop offset="0" stopColor="#3A3480" />
              <stop offset="0.6" stopColor="#221E57" />
              <stop offset="1" stopColor="#141236" />
            </radialGradient>
            <radialGradient id="yolk" cx={x} cy={y} r={700} gradientUnits="userSpaceOnUse">
              <stop offset="0" stopColor="#FFF4C4" stopOpacity={0.95} />
              <stop offset="0.4" stopColor="#FFE08A" stopOpacity={0.45} />
              <stop offset="1" stopColor="#FFE08A" stopOpacity={0} />
            </radialGradient>
          </defs>
          <g transform={`rotate(${wob} ${x} ${y + b}) translate(${x} ${y}) scale(${beat}) translate(${-x} ${-y})`}>
            <g clipPath="url(#eggClip)">
              <rect x={x - a * 1.3} y={y - b * 1.1} width={a * 2.6} height={b * 2.2} fill="url(#space)" />
            </g>
          </g>
        </Svg>
        <div style={{position: 'absolute', left: 0, top: 0, width: 1, height: 1, overflow: 'visible',
          transformOrigin: `${x}px ${y + b}px`, transform: `rotate(${wob}deg)`}}>
          <div style={{position: 'absolute', left: 0, top: 0, width: 1, height: 1, overflow: 'visible', transformOrigin: `${x}px ${y}px`,
            transform: `scale(${beat})`, clipPath: `path('${eggD}')`}}>
            <Stars x0={x - a * 1.2} y0={y - b * 1.05} w={a * 2.4} h={b * 2.1} t={t} n={420} size={9} />
            <Galaxy x={1500} y={300} r={430} t={t} />
            <Galaxy x={-350} y={1900} r={380} t={t} color="#BFE3FF" seed={7} tilt={0.45} />
            <Galaxy x={1350} y={2500} r={260} t={t} color="#FFD3F0" seed={9} tilt={0.6} />
            <Sun x={1250} y={-380} r={300} t={t} line={14} />
            <RingPlanet x={-260} y={-250} r={190} line={12} />
            <Glow id="yolkglow" x={x} y={y} r={720} color="#FFF0B0" opacity={0.95} />
            <Sprite name="earth" x={-80} y={1700} s={earthS} rot={t * 5} />
            <Sprite name="hero_curled" x={x} y={y} s={heroS2} rot={8 * Math.sin(t * 0.8)} />
          </div>
          <Svg>
            <g transform={`translate(${x} ${y}) scale(${beat}) translate(${-x} ${-y})`}>
              <path d={eggD} fill="none" stroke={INK} strokeWidth={118} />
              <path d={eggD} fill="none" stroke="#FFF1D6" strokeWidth={86} />
            </g>
          </Svg>
          <Crack pts={crack1} u={crU} width={34} glow={crGlow} />
          <Crack pts={crack2} u={cr2U} width={28} glow={crGlow} />
        </div>
      </Layer>
      {flashR > 1 ? (
        <svg width={1080} height={1920} style={{position: 'absolute'}}>
          <circle cx={fx} cy={fy} r={flashR} fill="#FFFFFF" />
        </svg>
      ) : null}
      {whiteOut > 0 ? <AbsoluteFill style={{background: '#FFFFFF', opacity: whiteOut}} /> : null}
    </>
  );
};

// ---------- sound ----------
type Cue = {f: string; at: number; db: number; dur?: number; fadeIn?: number; fadeOut?: number};
const CUES: Cue[] = [
  {f: 'pad', at: 0, db: -24, fadeIn: 0.4},
  {f: 'whoosh', at: 2.3, db: -22},
  {f: 'splash', at: 2.49, db: -19},
  {f: 'choir', at: 3.08, db: -20},
  {f: 'pop', at: 3.86, db: -17},
  {f: 'pop', at: 4.4, db: -17},
  {f: 'poof', at: 5.12, db: -19},
  {f: 'poof', at: 5.24, db: -21},
  {f: 'whoosh', at: 6.02, db: -21},
  {f: 'gulp', at: 6.12, db: -15},
  {f: 'crowd', at: 6.46, db: -26, fadeIn: 0.25},
  {f: 'crowd', at: 9.75, db: -28, dur: 2.68, fadeOut: 0.2},
  {f: 'ticks', at: 6.72, db: -27},
  {f: 'ticks', at: 7.62, db: -28},
  {f: 'ticks', at: 8.42, db: -29},
  {f: 'ding', at: 9.14, db: -18},
  {f: 'ding', at: 11.72, db: -18},
  {f: 'shimmer', at: 11.7, db: -25},
  {f: 'lowhit', at: 12.45, db: -13},
  {f: 'pop', at: 13.7, db: -18},
  {f: 'squeak', at: 16.42, db: -15},
  {f: 'shimmer', at: 17.3, db: -20},
  {f: 'crack', at: T.hatchW, db: -15},
  {f: 'crack', at: 19.08, db: -18},
  {f: 'burst', at: T.burst, db: -12},
  {f: 'choir', at: 19.97, db: -18},
  {f: 'shimmer', at: 22.4, db: -21},
  {f: 'heartbeat', at: T.egg, db: -11},
  {f: 'crack', at: 24.85, db: -16},
  {f: 'crack', at: 25.25, db: -19},
  {f: 'whoosh', at: 25.65, db: -19},
];

const SoundTrack: React.FC = () => {
  const {fps} = useVideoConfig();
  return (
    <>
      <Sequence from={Math.round(VO_AT * fps)} layout="none">
        <Audio src={staticFile('the-egg/vo/vo_final.wav')} volume={0.8} />
      </Sequence>
      {CUES.map((c, i) => (
        <Sequence key={i} from={Math.round(c.at * fps)} durationInFrames={c.dur ? Math.round(c.dur * fps) : undefined} layout="none">
          <Audio src={staticFile(`the-egg/sfx/${c.f}.wav`)} volume={(f) => {
            const s = f / fps;
            let g = Math.pow(10, c.db / 20);
            if (c.fadeIn) g *= clamp(s / c.fadeIn);
            if (c.fadeOut && c.dur) g *= clamp((c.dur - s) / c.fadeOut);
            return g;
          }} />
        </Sequence>
      ))}
    </>
  );
};

// ---------- composition ----------
export const TheEgg: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  let shot: React.ReactNode;
  if (t < T.over) shot = <ShotA t={t} />;
  else if (t < T.killer) shot = <ShotB t={t} />;
  else if (t < T.why) shot = <ShotC t={t} />;
  else if (t < T.everything) shot = <ShotD t={t} />;
  else shot = <ShotE t={t} />;
  return (
    <AbsoluteFill style={{backgroundColor: '#FFF3E2', overflow: 'hidden'}}>
      {shot}
      <SoundTrack />
    </AbsoluteFill>
  );
};

export {kAt, easeInOutCubic};
