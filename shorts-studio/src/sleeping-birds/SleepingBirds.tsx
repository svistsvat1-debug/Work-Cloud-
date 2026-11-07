import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {bump, clamp, eo, kf, popScale, V2} from './anim';
import {BONK, DURATION, FPS, T, XR_IN, XR_OUT, SNIPS} from './timing';
import {PIVOT, R_ANCHOR, S_PIVOT, SP, camera, project, robinChain, robinW, scanY, starChain, starW, sway, swayW} from './world';
import {AttachedLeaves, BONK_HEAD, BonkStar, Branch, Caption, FarHills, FlyingLeaves, Layer, Moon, NearHills, RawImg, RawSvg, Sky, Stars, WindLines, Zzz} from './parts';
import {Lens, RobinHallux, RobinRig, SNIP_PTS, ScanLine, Scissors, StarTendons, TOE_BASE, XrayBg, ZipTie, bodyOffset} from './xray';
import {Soundtrack} from './sound';

const ZP = DURATION / 24; // Zzz period that loops cleanly

// starling balance wobble (deg) about its feet
const wobble = (t: number) =>
  kf(t, [
    [22.6, 0],
    [22.95, 6.5, eo],
    [23.25, -5.5],
    [23.52, 3.2],
    [23.8, -1.6],
    [24.06, 0.6],
    [24.32, 0],
  ]);

// motion arcs beside the starling while it balances (on the side it leans toward)
const BalanceArcs: React.FC<{t: number}> = ({t}) => {
  const w = wobble(t);
  if (t < 22.65 || t > 24.2 || Math.abs(w) < 0.6) return null;
  const side = w > 0 ? 1 : -1;
  const o = clamp(Math.abs(w) / 5);
  const c = starW(side > 0 ? [690, 560] : [110, 560]);
  const arcs = [0, 1].map((i) => {
    const r = 70 + i * 42;
    const a0 = -38;
    const a1 = 38;
    const p = (a: number): V2 => [c[0] + side * r * Math.cos((a * Math.PI) / 180) - side * 60, c[1] + r * Math.sin((a * Math.PI) / 180)];
    const [x0, y0] = p(a0);
    const [x1, y1] = p(a1);
    return `M${x0},${y0} A${r} ${r} 0 0 ${side > 0 ? 1 : 0} ${x1},${y1}`;
  });
  return (
    <svg width={1} height={1} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible', opacity: o}}>
      {arcs.map((d, i) => (
        <path key={`o${i}`} d={d} fill="none" stroke="#16141a" strokeWidth={17} strokeLinecap="round" />
      ))}
      {arcs.map((d, i) => (
        <path key={`i${i}`} d={d} fill="none" stroke="#ffffff" strokeWidth={8} strokeLinecap="round" />
      ))}
    </svg>
  );
};

export const SleepingBirds: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const cam = camera(t);
  const ys = scanY(t, XR_IN, XR_OUT);
  const sw = sway(t);
  const swayT = `translate(${PIVOT[0]}px, ${PIVOT[1]}px) rotate(${sw}deg) translate(${-PIVOT[0]}px, ${-PIVOT[1]}px)`;
  const hit = swayW(robinW(BONK_HEAD), BONK);
  const blurFar = clamp((cam.k - 1.06) * 14, 0, 2.6);
  const breath = 0.007 * Math.sin(2 * Math.PI * 0.45 * t);
  const robinBreath = ` translate(${R_ANCHOR[0]}px, ${R_ANCHOR[1]}px) scale(1, ${1 + breath}) translate(${-R_ANCHOR[0]}px, ${-R_ANCHOR[1]}px)`;
  const smug = 0.045 * bump(t, T.work, 0.5);
  const sb = 0.006 * Math.sin(2 * Math.PI * 0.4 * t + 1);
  const starBody = ` translate(${S_PIVOT[0]}px, ${S_PIVOT[1]}px) rotate(${wobble(t)}deg) scale(${1 - smug * 0.5}, ${1 + sb + smug}) translate(${-S_PIVOT[0]}px, ${-S_PIVOT[1]}px)`;
  const off = bodyOffset(t);
  const snipA = starW(SNIP_PTS[0]);
  const snipB = starW(SNIP_PTS[1]);
  const toeScreen = project(cam, robinW(TOE_BASE as V2));

  const normal = (
    <>
      <Sky />
      <Stars t={t} />
      <Layer cam={cam} z={6000} blur={blurFar}>
        <Moon t={t} />
      </Layer>
      <Layer cam={cam} z={4500} blur={blurFar}>
        <FarHills />
      </Layer>
      <Layer cam={cam} z={3000} blur={blurFar * 0.8}>
        <NearHills />
      </Layer>
      <Layer cam={cam} z={1000}>
        <div style={{position: 'absolute', left: 0, top: 0, transformOrigin: '0 0', transform: swayT}}>
          <Branch mode="normal" id="bn" />
          <AttachedLeaves t={t} />
          <RawImg src="robin.png" meta={SP.robin} chain={robinChain + robinBreath} />
          <RawImg src="starling_body.png" meta={SP.starling} chain={starChain + starBody} />
          <RawImg src="starling_base.png" meta={SP.starling} chain={starChain} />
          <Zzz t={t} origin={robinW([600, 290])} windows={[[-3, 3.75], [24.45, 40]]} period={ZP} seed={0} />
          <BalanceArcs t={t} />
          <Zzz t={t} origin={starW([300, 300])} windows={[[21.35, 24.5]]} period={ZP * 1.07} seed={1} size={46} />
        </div>
        <FlyingLeaves t={t} hit={hit} />
        <BonkStar t={t} t0={BONK} p={hit} />
        <WindLines t={t} />
      </Layer>
    </>
  );

  const xray = (
    <>
      <XrayBg />
      <Layer cam={cam} z={1000}>
        <div style={{position: 'absolute', left: 0, top: 0, transformOrigin: '0 0', transform: swayT}}>
          <RawImg src="robin_xray.png" meta={SP.robin} chain={`${robinChain} translate(${off[0]}px, ${off[1]}px)`} />
          <RawImg src="starling_xray.png" meta={SP.starling} chain={starChain} />
          <RawSvg chain={robinChain}>
            <RobinHallux t={t} />
          </RawSvg>
          <Branch mode="xray" id="bx" />
          <AttachedLeaves t={t} xray />
          <RawImg src="starling_xray_toes.png" meta={SP.starling} chain={starChain} />
          <RawSvg chain={robinChain}>
            <RobinRig t={t} />
          </RawSvg>
          <RawSvg chain={starChain}>
            <StarTendons t={t} />
          </RawSvg>
        </div>
      </Layer>
    </>
  );

  const hook = t < 3.95 ? popScale(t, -1, 3.72, 1, 0.22) : 0;
  const hookRot = 2.2 * Math.sin((t - T.fall) * 9) * (t > T.fall && t < T.fallEnd + 0.2 ? 1 : 0);
  const endCap = popScale(t, 24.85, 1e9, 1.1);

  return (
    <AbsoluteFill style={{backgroundColor: '#0a1736'}}>
      {ys < 1920 && <AbsoluteFill style={{clipPath: ys > 0 ? `inset(${ys.toFixed(2)}px 0px 0px 0px)` : undefined}}>{normal}</AbsoluteFill>}
      {ys > 0 && <AbsoluteFill style={{clipPath: ys < 1920 ? `inset(0px 0px ${(1920 - ys).toFixed(2)}px 0px)` : undefined}}>{xray}</AbsoluteFill>}
      <ScanLine y={ys} />
      <Lens t={t} target={toeScreen} />
      <ZipTie t={t} />
      <Layer cam={cam} z={1000}>
        <Scissors t={t} a={snipA} b={snipB} />
      </Layer>
      <Caption lines={["WHY DOESN'T", 'IT FALL?']} y={250} size={118} s={hook} rot={hookRot} />
      <Caption lines={['Which bird should', 'I X-ray next?']} y={262} size={92} s={endCap} />
      <Soundtrack />
    </AbsoluteFill>
  );
};
export const _s = SNIPS;
