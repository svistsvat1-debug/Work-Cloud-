import React, {useEffect, useState} from 'react';
import {AbsoluteFill, Audio, Img, continueRender, delayRender, staticFile, useCurrentFrame} from 'remotion';
import {
  CHAMBER, EYE_HEAD, EYE_SPRITE, FPS, HEAD, HERO, HOLE, LH, NOSTRIL_HEAD, PIVOT, REVEAL_BEHIND, REVEAL_TOP, ROD,
  TRUNK, TUNNEL_PATH, V, XRAY, at, headW, poly, sAtY, tangent,
} from './geo';
import {Cam, IMPACTS, K, camAt, clamp, ei, eio, eo, inv, keys, lerp, pop, popIn, popOut, rnd, springK, toScreen} from './anim';

const A = (f: string) => staticFile(`woodpecker-tongue/${f}`);
const FONT = 'Luckiest, sans-serif';
const BONE = '#EAF5FF';
const BONE_EDGE = '#7FB4E6';
const PINK = '#FF86AE';

// ---------------------------------------------------------------- timeline values
const S_TOUCH = sAtY(703, ROD); // tongue tip touches the grub's tail
const D_HOOK = S_TOUCH - ROD;
const D_NEAR = D_HOOK - 14;

/** how far the whole rod (hyoid + tongue) has slid forward along the track */
const slideAt = (t: number) =>
  keys(t, [
    [12.9, 0], [13.3, 6], [13.83, 6], [14.2, 10], [14.3, 10], [14.9, 4], [15.22, 120, eo], [16.46, 150],
    [17.6, D_NEAR], [21.75, D_NEAR], [21.97, D_HOOK, ei], [22.38, D_HOOK], [23.0, 0, (u) => (u < 0.35 ? 0.4 * ei(u / 0.35) : 0.4 + 0.6 * eo((u - 0.35) / 0.65))],
  ]);

/** fraction of the hyoid drawn (from the tongue base backwards), synced to the words */
const revealAt = (t: number) =>
  keys(t, [[3.93, 0], [5.1, 0.12], [5.4, 0.12], [6.75, REVEAL_BEHIND], [6.9, REVEAL_BEHIND], [8.0, REVEAL_TOP], [9.85, REVEAL_TOP], [10.55, 1]]);

/** X-ray window (world rect) during the hook, then it grows to fill the screen */
const windowAt = (t: number) => {
  const slide = clamp((t - 0.92) / 0.4);
  const cx = t < 2.8 ? lerp(1450, 738, eob2(slide)) : lerp(738, 745, eio(inv(2.8, 3.45, t)));
  const g = eio(inv(2.8, 3.45, t));
  return {cx, cy: lerp(580, 560, g), w: lerp(470, 1700, g), h: lerp(470, 2600, g)};
};
const eob2 = (u: number) => (u <= 0 ? 0 : u >= 1 ? 1 : 1 + 2.2 * Math.pow(u - 1, 3) + 1.2 * Math.pow(u - 1, 2));

// ---------------------------------------------------------------- bird pose (normal mode)
const P = 0.14;
const drum = (tau: number) => {
  const u = ((((tau - 0.12) / P) % 1) + 1) % 1; // 0 = impact
  return {th: u < 0.55 ? lerp(-3, 2.2, eo(u / 0.55)) : lerp(2.2, -3, ei((u - 0.55) / 0.45)), squeeze: u > 0.84 || u < 0.2};
};
type Face = 'normal' | 'squeeze' | 'surprised' | 'happy' | 'curious';
const birdAt = (t: number): {th: number; face: Face; breathe: number} => {
  const breathe = t > 23.3 ? 0.008 * Math.sin(2 * Math.PI * 0.6 * (t - 23.3)) : 0;
  if (t < 0.82) {
    const d = drum(t);
    return {th: d.th, face: d.squeeze ? 'squeeze' : 'normal', breathe: 0};
  }
  if (t < 1.0) return {th: lerp(-3, 0, eo(inv(0.82, 1.0, t))), face: t < 0.86 ? 'squeeze' : t < 0.97 ? 'normal' : 'surprised', breathe: 0};
  if (t < 23.3) return {th: 0, face: 'surprised', breathe: 0};
  if (t < 23.97) return {th: 1.0 * Math.sin(2 * Math.PI * 3.5 * (t - 23.4)) * (t > 23.4 && t < 23.95 ? 1 : 0), face: 'happy', breathe};
  if (t < 25.75) return {th: 2 * eo(inv(23.97, 24.25, t)) + 0.6 * springK(t, 23.97, 3, 4), face: 'curious', breathe};
  if (t < 26.4) {
    const th = keys(t, [[25.75, 2], [25.92, 3, eo], [26.02, -3.2, ei], [26.09, -3.2], [26.4, 0, eo]]);
    return {th, face: t > 25.98 && t < 26.12 ? 'squeeze' : t >= 26.12 ? 'happy' : 'curious', breathe};
  }
  if (t < 27.25) return {th: 0, face: t < 26.95 ? 'happy' : 'normal', breathe};
  const d = drum(t - DUR_S);
  const w = inv(27.25, 27.33, t);
  return {th: lerp(0, d.th, w), face: d.squeeze && w > 0.5 ? 'squeeze' : 'normal', breathe: 0};
};
const DUR_S = 1660 / FPS;

// ---------------------------------------------------------------- layers
const Layer: React.FC<{cam: Cam; z: number; blur?: number; children: React.ReactNode}> = ({cam, z, blur = 0, children}) => {
  const d = z - cam.z;
  if (d < 80) return null;
  const k = 1000 / d;
  return (
    <AbsoluteFill style={{filter: blur ? `blur(${blur}px)` : undefined}}>
      <div
        style={{
          position: 'absolute', left: 0, top: 0, transformOrigin: '0 0',
          transform: `translate(${540 + cam.sx}px, ${960 + cam.sy}px) scale(${k}) translate(${-cam.x}px, ${-cam.y}px)`,
        }}
      >
        {children}
      </div>
    </AbsoluteFill>
  );
};
const abs = (x: number, y: number, w: number, h: number, extra: React.CSSProperties = {}): React.CSSProperties => ({
  position: 'absolute', left: x, top: y, width: w, height: h, ...extra,
});
const WorldSvg: React.FC<{children: React.ReactNode}> = ({children}) => (
  <svg style={abs(0, 0, 1400, 1800, {overflow: 'visible'})} viewBox="0 0 1400 1800">
    {children}
  </svg>
);

// ---------------------------------------------------------------- background (normal)
const Forest: React.FC = () => {
  const crowns1 = Array.from({length: 14}, (_, i) => [-1300 + i * 270 + rnd(i) * 90, 1330 + rnd(i + 40) * 120, 170 + rnd(i + 80) * 90]);
  const crowns2 = Array.from({length: 11}, (_, i) => [-1200 + i * 340 + rnd(i + 7) * 120, 1640 + rnd(i + 50) * 110, 210 + rnd(i + 90) * 80]);
  return (
    <svg style={abs(-2000, -2500, 6000, 7000, {overflow: 'visible'})} viewBox="-2000 -2500 6000 7000">
      {[[-500, -700, 1], [900, -420, 0.8], [1900, -820, 1.1]].map(([x, y, s], i) => (
        <g key={i} transform={`translate(${x} ${y}) scale(${s})`} fill="#FFFFFF" stroke="#C4E2F4" strokeWidth={8}>
          <circle cx={-110} cy={30} r={90} /><circle cx={0} cy={-20} r={130} /><circle cx={130} cy={30} r={95} />
          <rect x={-200} y={30} width={420} height={90} rx={45} stroke="none" />
        </g>
      ))}
      {crowns1.map(([x, y, r], i) => (
        <g key={i}>
          <rect x={x - 22} y={y} width={44} height={1100} fill="#C9B193" stroke="#A9906F" strokeWidth={6} />
          <circle cx={x} cy={y} r={r} fill="#B4DAA2" stroke="#8DBB7C" strokeWidth={7} />
        </g>
      ))}
      {crowns2.map(([x, y, r], i) => (
        <g key={i}>
          <rect x={x - 30} y={y} width={60} height={900} fill="#BCA27F" stroke="#987E5C" strokeWidth={7} />
          <circle cx={x} cy={y} r={r} fill="#9CCC8B" stroke="#76A866" strokeWidth={8} />
          <circle cx={x - r * 0.6} cy={y + r * 0.35} r={r * 0.62} fill="#9CCC8B" stroke="#76A866" strokeWidth={8} />
        </g>
      ))}
      <rect x={-2000} y={2330} width={6000} height={3000} fill="#BFE29B" stroke="#94C474" strokeWidth={10} />
    </svg>
  );
};
const Leaves: React.FC = () => (
  <svg style={abs(0, 1300, 520, 520, {overflow: 'visible'})} viewBox="0 1300 520 520">
    <path d="M 60 1760 C 150 1660, 240 1560, 360 1470" stroke="#111" strokeWidth={18} fill="none" strokeLinecap="round" />
    <path d="M 60 1760 C 150 1660, 240 1560, 360 1470" stroke="#7A5234" strokeWidth={10} fill="none" strokeLinecap="round" />
    {[[120, 1690, -40], [180, 1610, 20], [240, 1560, -70], [300, 1500, 10], [360, 1470, -30], [200, 1680, 70], [280, 1580, 60]].map(([x, y, r], i) => (
      <g key={i} transform={`translate(${x} ${y}) rotate(${r})`}>
        <path d="M 0 0 C 30 -40, 90 -40, 120 0 C 90 40, 30 40, 0 0 Z" fill={i % 2 ? '#5DBB63' : '#4AA352'} stroke="#111" strokeWidth={6} />
        <path d="M 8 0 L 108 0" stroke="#2F7A3A" strokeWidth={4} />
      </g>
    ))}
  </svg>
);

// trunk = three stacked copies (middle normal, outer ones flipped) so it never ends on screen
const Trunk: React.FC<{src: string}> = ({src}) => {
  const w = TRUNK.w * TRUNK.s, h = TRUNK.h * TRUNK.s;
  return (
    <>
      <Img src={src} style={abs(TRUNK.x, TRUNK.y - h + 1, w, h, {transform: 'scaleY(-1)'})} />
      <Img src={src} style={abs(TRUNK.x, TRUNK.y, w, h)} />
      <Img src={src} style={abs(TRUNK.x, TRUNK.y + h - 1, w, h, {transform: 'scaleY(-1)'})} />
    </>
  );
};

// ---------------------------------------------------------------- hero bird + face overlays (sprite px)
const FaceOverlay: React.FC<{face: Face; t: number}> = ({face, t}) => {
  const [ex, ey] = EYE_SPRITE;
  if (face === 'normal') return null;
  const patch = <ellipse cx={ex} cy={ey + 4} rx={86} ry={78} fill="#F0EFEA" />;
  if (face === 'squeeze')
    return (
      <g>{patch}<path d={`M ${ex + 34} ${ey - 46} L ${ex - 34} ${ey + 2} L ${ex + 34} ${ey + 50}`} stroke="#111" strokeWidth={22} fill="none" strokeLinecap="round" strokeLinejoin="round" /></g>
    );
  if (face === 'happy')
    return (
      <g>
        {patch}
        <path d={`M ${ex - 62} ${ey + 22} Q ${ex} ${ey - 64} ${ex + 62} ${ey + 22}`} stroke="#111" strokeWidth={20} fill="none" strokeLinecap="round" />
        <ellipse cx={ex + 50} cy={ey + 118} rx={58} ry={30} fill="#FF9DB0" opacity={0.8} />
      </g>
    );
  const sur = face === 'surprised';
  const s = sur ? popIn(t, 0.97, 0.25, 2.5) : 1;
  const crest = sur ? popIn(t, 1.0, 0.3, 2.8) : 0;
  const blink = face === 'curious' && t > 25.0 && t < 25.14 ? 0.12 : 1;
  return (
    <g>
      {patch}
      <g transform={`translate(${ex} ${ey}) scale(${0.55 + 0.45 * s}, ${(0.55 + 0.45 * s) * blink})`}>
        <circle r={sur ? 90 : 80} fill="#FFF" stroke="#111" strokeWidth={14} />
        <circle cx={sur ? -6 : -10} cy={sur ? 0 : 6} r={sur ? 24 : 32} fill="#111" />
        <circle cx={sur ? 2 : -2} cy={sur ? -8 : -4} r={9} fill="#FFF" />
      </g>
      {face === 'curious' && <path d={`M ${ex - 80} ${ey - 128} Q ${ex} ${ey - 178} ${ex + 84} ${ey - 120}`} stroke="#111" strokeWidth={18} fill="none" strokeLinecap="round" />}
      {crest > 0 &&
        [[-28, 950, 80], [0, 1025, 62], [26, 1100, 72]].map(([r, x, y], i) => (
          <g key={i} transform={`translate(${x} ${y}) rotate(${r}) scale(${crest})`}>
            <path d="M 0 0 C -34 -60, -26 -130, 0 -175 C 26 -130, 34 -60, 0 0 Z" fill="#222" stroke="#111" strokeWidth={10} />
          </g>
        ))}
    </g>
  );
};
const Bird: React.FC<{t: number}> = ({t}) => {
  const b = birdAt(t);
  const w = HERO.w * HERO.s, h = HERO.h * HERO.s;
  return (
    <div style={{position: 'absolute', left: 0, top: 0, transformOrigin: `${PIVOT[0]}px ${PIVOT[1]}px`, transform: `rotate(${b.th}deg) scale(${1 - b.breathe * 0.4}, ${1 + b.breathe})`}}>
      <Img src={A('bird.png')} style={abs(HERO.x, HERO.y, w, h)} />
      <svg style={abs(HERO.x, HERO.y, w, h, {overflow: 'visible'})} viewBox={`0 0 ${HERO.w} ${HERO.h}`}>
        <FaceOverlay face={b.face} t={t} />
      </svg>
    </div>
  );
};

// wood chips from every impact (incl. two "virtual" ones before frame 0 = the last two of the loop)
const Chips: React.FC<{t: number}> = ({t}) => {
  const imps = [-0.16, -0.02, ...IMPACTS];
  const out: React.ReactNode[] = [];
  imps.forEach((ti, i) => {
    for (let j = 0; j < 2; j++) {
      const id = i * 2 + j, tau = t - ti;
      if (tau < 0 || tau > 1.1) continue;
      const vx = 70 + rnd(id) * 150, vy = -120 - rnd(id + 9) * 170, g = 1500;
      const x = HOLE[0] + 6 + vx * tau, y = HOLE[1] + vy * tau + 0.5 * g * tau * tau;
      const w = 13 + rnd(id + 3) * 8, rot = (rnd(id + 5) - 0.5) * 900 * tau;
      out.push(<Img key={id} src={A(`chip${id % 6}.png`)} style={{position: 'absolute', left: x - w / 2, top: y - w / 2, width: w, transform: `rotate(${rot}deg)`}} />);
    }
  });
  return <>{out}</>;
};

// ---------------------------------------------------------------- X-ray: bones (head px / hero px)
const SKULL =
  'M 840 560 C 870 470, 950 390, 1050 340 C 1150 285, 1280 255, 1400 255 C 1560 255, 1700 310, 1790 410 C 1870 500, 1890 640, 1860 760 C 1830 860, 1730 930, 1580 950 C 1420 970, 1250 950, 1130 900 C 1060 870, 1010 830, 960 790 C 900 740, 860 660, 840 560 Z';
const UPPER_BEAK = 'M 870 520 C 700 545, 400 588, 82 621 L 66 628 C 300 652, 600 682, 880 706 Z';
const LOWER_BEAK = 'M 78 640 C 300 668, 620 702, 900 728 C 980 738, 1040 792, 1072 850 C 1082 882, 1050 902, 1020 882 C 900 822, 650 792, 420 748 C 280 718, 150 676, 78 640 Z';
const VERT: V[] = [[1480, 1010], [1500, 1150], [1515, 1290], [1525, 1430], [1530, 1570], [1530, 1710], [1525, 1850], [1515, 1990], [1505, 2130]];

const HeadBones: React.FC = () => (
  <svg style={abs(HEAD.x, HEAD.y, HEAD.w * HEAD.s, HEAD.h * HEAD.s, {overflow: 'visible'})} viewBox={`0 0 ${HEAD.w} ${HEAD.h}`}>
    {VERT.map(([x, y], i) => (
      <rect key={i} x={x - 95} y={y - 55} width={190} height={112} rx={42} fill={BONE} stroke={BONE_EDGE} strokeWidth={14} />
    ))}
    <path d={LOWER_BEAK} fill={BONE} stroke={BONE_EDGE} strokeWidth={13} />
    <path d={UPPER_BEAK} fill={BONE} stroke={BONE_EDGE} strokeWidth={13} />
    <path d={SKULL} fill={BONE} stroke={BONE_EDGE} strokeWidth={14} />
    <path d="M 1000 380 C 1150 330, 1350 320, 1500 360" stroke="#CFE5F8" strokeWidth={10} fill="none" strokeLinecap="round" />
    <circle cx={EYE_HEAD[0]} cy={EYE_HEAD[1]} r={175} fill="#13264A" stroke={BONE_EDGE} strokeWidth={12} />
    <circle cx={1040} cy={862} r={30} fill={BONE} stroke={BONE_EDGE} strokeWidth={10} />
    <ellipse cx={NOSTRIL_HEAD[0]} cy={NOSTRIL_HEAD[1]} rx={30} ry={18} fill="#0C1A33" stroke={BONE_EDGE} strokeWidth={8} />
  </svg>
);
const BodyBones: React.FC = () => {
  const bone = (d: string, w: number, key: string | number) => (
    <g key={key}>
      <path d={d} stroke={BONE_EDGE} strokeWidth={w + 16} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d={d} stroke={BONE} strokeWidth={w} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </g>
  );
  const spine: V[] = [[1070, 1300], [1090, 1440], [1110, 1580], [1125, 1720], [1130, 1860], [1125, 2000], [1110, 2140], [1085, 2280], [1050, 2420]];
  const tail: V[] = [[1010, 2700], [995, 2840], [985, 2980], [978, 3120]];
  return (
    <svg style={abs(HERO.x, HERO.y, HERO.w * HERO.s, HERO.h * HERO.s, {overflow: 'visible'})} viewBox={`0 0 ${HERO.w} ${HERO.h}`}>
      {[1480, 1600, 1720, 1840, 1960].map((y, i) => bone(`M 1105 ${y} Q 760 ${y + 40}, 520 ${y + 130}`, 24, `r${i}`))}
      {bone('M 560 1330 C 440 1600, 430 1850, 600 2150', 44, 'keel')}
      {bone('M 1120 1180 L 900 1560', 46, 'hum')}
      {bone('M 900 1560 L 1240 2150', 34, 'rad')}
      {bone('M 930 1600 L 1270 2120', 26, 'uln')}
      {bone('M 1250 2150 L 1330 2560', 30, 'hand')}
      {bone('M 1250 2150 L 1240 2480', 18, 'fing')}
      {bone('M 940 2300 L 560 2060', 44, 'fem')}
      {bone('M 560 2060 L 260 1860', 36, 'tib')}
      {bone('M 260 1860 L 140 1650', 20, 'toe1')}
      {bone('M 260 1860 L 120 2040', 20, 'toe2')}
      <path d="M 900 2240 C 1000 2180, 1160 2220, 1170 2360 C 1170 2480, 1040 2560, 960 2500 C 900 2440, 880 2320, 900 2240 Z" fill={BONE} stroke={BONE_EDGE} strokeWidth={14} />
      {[...spine, ...tail].map(([x, y], i) => (
        <rect key={i} x={x - (i < spine.length ? 70 : 45)} y={y - 42} width={i < spine.length ? 140 : 90} height={84} rx={32} fill={BONE} stroke={BONE_EDGE} strokeWidth={13} />
      ))}
    </svg>
  );
};

// X-ray eye in the socket (head px): pupil follows a world target
const XEye: React.FC<{t: number; look: V | null; scale: number; pupil: number; closed: boolean}> = ({t, look, scale, pupil, closed}) => {
  const [ex, ey] = EYE_HEAD;
  let px = 0, py = 0;
  if (look) {
    const e = headW(EYE_HEAD);
    const dx = look[0] - e[0], dy = look[1] - e[1], l = Math.hypot(dx, dy) || 1;
    const m = Math.min(1, l / 30) * 62;
    px = (dx / l) * m;
    py = (dy / l) * m;
  }
  const blink = [4.4, 8.6, 13.3, 18.05].some((b) => t > b && t < b + 0.13) ? 0.1 : 1;
  return (
    <svg style={abs(HEAD.x, HEAD.y, HEAD.w * HEAD.s, HEAD.h * HEAD.s, {overflow: 'visible'})} viewBox={`0 0 ${HEAD.w} ${HEAD.h}`}>
      {closed ? (
        <path d={`M ${ex - 90} ${ey + 20} Q ${ex} ${ey - 80} ${ex + 90} ${ey + 20}`} stroke="#FFF" strokeWidth={26} fill="none" strokeLinecap="round" />
      ) : (
        <g transform={`translate(${ex} ${ey}) scale(${scale}, ${scale * blink})`}>
          <circle r={125} fill="#FFF" stroke="#0A0F1C" strokeWidth={16} />
          <circle cx={px} cy={py} r={46 * pupil} fill="#0A0F1C" />
          <circle cx={px + 14} cy={py - 16} r={15} fill="#FFF" />
        </g>
      )}
    </svg>
  );
};

// ---------------------------------------------------------------- grub (sprite px faces)
type GrubKind = 'calm' | 'alert' | 'curled' | 'hooked';
const GRUB = {
  calm: {src: 'grub.png', w: 1764, h: 918, s: 0.051, eyes: [[175, 450], [290, 435]] as V[], r: 50},
  curled: {src: 'grub_curled.png', w: 1728, h: 1833, s: 0.032, eyes: [[1335, 390], [1455, 365]] as V[], r: 60},
  hooked: {src: 'grub_stretched.png', w: 2172, h: 534, s: 0.042, eyes: [[105, 165], [195, 150]] as V[], r: 44},
};
const Grub: React.FC<{kind: GrubKind; c: V; rot: number; sx: number; sy: number; t: number}> = ({kind, c, rot, sx, sy, t}) => {
  const g = kind === 'alert' ? GRUB.calm : GRUB[kind];
  const w = g.w * g.s, h = g.h * g.s;
  const wide = kind === 'alert' ? popIn(t, 17.2, 0.25, 3) : 1;
  return (
    <div style={{position: 'absolute', left: c[0] - w / 2, top: c[1] - h / 2, width: w, height: h, transform: `rotate(${rot}deg) scale(${sx}, ${sy})`}}>
      <Img src={A(g.src)} style={abs(0, 0, w, h)} />
      <svg style={abs(0, 0, w, h, {overflow: 'visible'})} viewBox={`0 0 ${g.w} ${g.h}`}>
        {g.eyes.map(([x, y], i) =>
          kind === 'hooked' ? (
            <path key={i} d={i === 0 ? `M ${x - 30} ${y - 34} L ${x + 22} ${y} L ${x - 30} ${y + 34}` : `M ${x + 30} ${y - 34} L ${x - 22} ${y} L ${x + 30} ${y + 34}`} stroke="#111" strokeWidth={16} fill="none" strokeLinecap="round" strokeLinejoin="round" />
          ) : (
            <g key={i} transform={`translate(${x} ${y}) scale(${kind === 'alert' ? 0.8 + 0.35 * wide : 1})`}>
              <circle r={g.r} fill="#FFF" stroke="#111" strokeWidth={12} />
              {kind === 'calm' ? (
                <>
                  <circle cx={-14} cy={8} r={g.r * 0.46} fill="#111" />
                  <path d={`M ${-g.r} ${-4} Q 0 ${-g.r * 0.9} ${g.r} ${-4}`} fill="#F4E4C4" stroke="#111" strokeWidth={10} />
                </>
              ) : (
                <circle cx={kind === 'alert' ? 20 : 4} cy={kind === 'alert' ? 0 : -16} r={g.r * 0.3} fill="#111" />
              )}
            </g>
          ),
        )}
      </svg>
    </div>
  );
};

// ---------------------------------------------------------------- the tongue + hyoid rod (world)
const Rod: React.FC<{t: number; d: number; reveal: number}> = ({t, d, reveal}) => {
  const els: React.ReactNode[] = [];
  const h0 = d + (1 - reveal) * LH, h1 = d + LH, tip = d + ROD;
  // muscles (fixed on the track, the bones slide through them)
  const mus = pop(t, 12.49, 16.4, 0.25);
  if (mus > 0.01) {
    const pulse = 1 + 0.4 * [12.55, 13.0, 13.86, 14.92].reduce((a, p) => a + Math.max(0, springK(t, p, 4, 7)), 0);
    const m0 = LH - 120, m1 = LH - 18;
    els.push(
      <g key="mus" opacity={0.9}>
        <polyline points={poly(m0, m1)} stroke="#9E2338" strokeWidth={15 * mus * pulse} fill="none" strokeLinecap="round" opacity={0.75} />
        <polyline points={poly(m0, m1)} stroke="#FF6178" strokeWidth={12 * mus * pulse} fill="none" strokeLinecap="round" opacity={0.8} />
        <polyline points={poly(m0, m1, 2.5)} stroke="#FFC4CE" strokeWidth={1.1} strokeDasharray="2 3" fill="none" />
        <polyline points={poly(m0, m1, -2.5)} stroke="#FFC4CE" strokeWidth={1.1} strokeDasharray="2 3" fill="none" />
      </g>,
    );
  }
  // ghost path + comet (hook)
  if (t > 1.9 && t < 10.6) {
    const c = eio(inv(1.9, 2.55, t));
    const g0 = LH * (1 - c);
    els.push(<polyline key="ghost" points={poly(g0, LH)} stroke="#9FD8FF" strokeWidth={2} strokeDasharray="5 4" fill="none" opacity={0.75} />);
    if (t < 2.65) {
      const p = at(g0);
      els.push(
        <g key="comet">
          <circle cx={p[0]} cy={p[1]} r={9} fill="#9FD8FF" opacity={0.35} />
          <circle cx={p[0]} cy={p[1]} r={3.4} fill="#FFFFFF" />
        </g>,
      );
    }
  }
  // the pair of hyoid horns
  if (h1 - h0 > 0.2) {
    els.push(<polyline key="hglow" points={poly(h0, h1)} stroke="#8FD3FF" strokeWidth={17} fill="none" strokeLinecap="round" opacity={0.3} />);
    for (const o of [-2.9, 2.9]) els.push(<polyline key={`ho${o}`} points={poly(h0, h1, o)} stroke="#0A0F1C" strokeWidth={6.2} fill="none" strokeLinecap="round" strokeLinejoin="round" />);
    for (const o of [-2.9, 2.9]) els.push(<polyline key={`hf${o}`} points={poly(h0, h1, o)} stroke={BONE} strokeWidth={4.0} fill="none" strokeLinecap="round" strokeLinejoin="round" />);
    if (reveal < 0.999 && t > 3.9 && t < 10.7) {
      const p = at(h0);
      els.push(<circle key="spark" cx={p[0]} cy={p[1]} r={4.5 + 1.5 * Math.sin(t * 40)} fill="#FFFFFF" opacity={0.9} />);
    }
  }
  // tongue (pink) + hard tip
  const t0 = d + LH - 2;
  els.push(<polyline key="to" points={poly(t0, tip)} stroke="#0A0F1C" strokeWidth={11.4} fill="none" strokeLinecap="round" strokeLinejoin="round" />);
  els.push(<polyline key="tf" points={poly(t0, tip)} stroke={PINK} strokeWidth={9} fill="none" strokeLinecap="round" strokeLinejoin="round" />);
  els.push(<polyline key="th" points={poly(t0 + 6, tip - 4, -2.4)} stroke="#FFC6D8" strokeWidth={1.8} fill="none" strokeLinecap="round" />);
  const pt = at(tip), tg = tangent(tip), nx = -tg[1], ny = tg[0];
  els.push(
    <path key="cap" d={`M ${pt[0] + nx * 4.3} ${pt[1] + ny * 4.3} L ${pt[0] + tg[0] * 8} ${pt[1] + tg[1] * 8} L ${pt[0] - nx * 4.3} ${pt[1] - ny * 4.3} Z`} fill="#F3DDB5" stroke="#0A0F1C" strokeWidth={1.2} strokeLinejoin="round" />,
  );
  // backward barbs
  [0, 1, 2, 3, 4, 5].forEach((i) => {
    const sc = popIn(t, 18.92 + i * 0.12, 0.22, 3);
    if (sc <= 0.01) return;
    const s = tip - 2.5 - Math.floor(i / 2) * 4.2, side = i % 2 ? 1 : -1;
    const p = at(s), g = tangent(s), n: V = [-g[1] * side, g[0] * side];
    const b0: V = [p[0] + n[0] * 4.2 + g[0] * 1.6, p[1] + n[1] * 4.2 + g[1] * 1.6];
    const b1: V = [p[0] + n[0] * 4.2 - g[0] * 1.6, p[1] + n[1] * 4.2 - g[1] * 1.6];
    const ap: V = [p[0] + n[0] * (4.2 + 4.2 * sc) - g[0] * 4.6 * sc, p[1] + n[1] * (4.2 + 4.2 * sc) - g[1] * 4.6 * sc];
    els.push(<path key={`b${i}`} d={`M ${b0[0]} ${b0[1]} L ${ap[0]} ${ap[1]} L ${b1[0]} ${b1[1]} Z`} fill="#F6E7C8" stroke="#0A0F1C" strokeWidth={0.9} strokeLinejoin="round" />);
  });
  // sticky saliva + one drip
  [[2, -3.5, 2.6], [6, 4, 3.2], [10, -4.6, 2.4], [13.5, 3.6, 2.9], [16.5, -3, 2.2]].forEach(([ds, o, r], i) => {
    const sc = popIn(t, 20.0 + i * 0.08, 0.25, 2.5);
    if (sc <= 0.01) return;
    const s = tip - ds, p = at(s), g = tangent(s);
    const c: V = [p[0] - g[1] * o, p[1] + g[0] * o];
    els.push(
      <g key={`s${i}`}>
        <circle cx={c[0]} cy={c[1]} r={r * sc} fill="#EAF6FF" opacity={0.92} stroke="#9CCBEB" strokeWidth={0.8} />
        <circle cx={c[0] - r * 0.35 * sc} cy={c[1] - r * 0.35 * sc} r={r * 0.3 * sc} fill="#FFFFFF" />
      </g>,
    );
  });
  if (t > 20.4 && t < 20.82) {
    const grow = clamp((t - 20.4) / 0.15), fall = Math.max(0, t - 20.55);
    const y = pt[1] + 7 + 0.5 * 1400 * fall * fall, len = 3 + 6 * grow;
    els.push(<path key="drip" d={`M ${pt[0]} ${y - len} C ${pt[0] + 2.8} ${y - len * 0.3}, ${pt[0] + 3} ${y + 2.6}, ${pt[0]} ${y + 2.8} C ${pt[0] - 3} ${y + 2.6}, ${pt[0] - 2.8} ${y - len * 0.3}, ${pt[0]} ${y - len} Z`} fill="#EAF6FF" stroke="#9CCBEB" strokeWidth={0.8} />);
  }
  return <WorldSvg>{els}</WorldSvg>;
};

// ---------------------------------------------------------------- screen-space UI
const Caption: React.FC<{lines: [string, number, string?][][]; y: number; t: number; out: number; size?: number}> = ({lines, y, t, out, size = 96}) => {
  const o = popOut(t, out, 0.16);
  if (o <= 0) return null;
  return (
    <div style={{position: 'absolute', left: 0, top: y, width: 1080, textAlign: 'center', fontFamily: FONT, fontSize: size, lineHeight: 1.08, transform: `scale(${o})`, transformOrigin: `540px ${size}px`}}>
      {lines.map((ws, li) => (
        <div key={li}>
          {ws.map(([w, t0, col], wi) => {
            const s = popIn(t, t0, 0.24, 2.6);
            return (
              <span key={wi} style={{display: 'inline-block', margin: '0 12px', transform: `scale(${s})`, position: 'relative'}}>
                <span style={{position: 'absolute', left: 0, top: 0, WebkitTextStroke: `${size * 0.2}px #111`, color: '#111'}}>{w}</span>
                <span style={{position: 'relative', color: col ?? '#FFFFFF', textShadow: '0 8px 0 rgba(0,0,0,0.25)'}}>{w}</span>
              </span>
            );
          })}
        </div>
      ))}
    </div>
  );
};
const Label: React.FC<{text: string; at: [number, number]; anchor: [number, number]; s: number; color?: string}> = ({text, at: p, anchor, s, color = '#FFE14D'}) => {
  if (s <= 0.01) return null;
  return (
    <>
      <svg style={abs(0, 0, 1080, 1920, {overflow: 'visible'})}>
        <line x1={p[0]} y1={p[1]} x2={lerp(p[0], anchor[0], Math.min(1, s))} y2={lerp(p[1], anchor[1], Math.min(1, s))} stroke="#111" strokeWidth={7} strokeLinecap="round" />
        <line x1={p[0]} y1={p[1]} x2={lerp(p[0], anchor[0], Math.min(1, s))} y2={lerp(p[1], anchor[1], Math.min(1, s))} stroke="#FFF" strokeWidth={3} strokeLinecap="round" />
        <circle cx={anchor[0]} cy={anchor[1]} r={9 * s} fill="#FFF" stroke="#111" strokeWidth={4} />
      </svg>
      <div style={{position: 'absolute', left: p[0], top: p[1], transform: `translate(-50%, -50%) scale(${s})`, background: color, border: '6px solid #111', borderRadius: 26, padding: '8px 22px 2px', fontFamily: FONT, fontSize: 52, color: '#111', whiteSpace: 'nowrap', boxShadow: '0 8px 0 rgba(0,0,0,0.3)'}}>
        {text}
      </div>
    </>
  );
};
const Card: React.FC<{x: number; y: number; s: number; rot: number; src?: string}> = ({x, y, s, rot, src}) => {
  if (s <= 0.01) return null;
  return (
    <div style={{position: 'absolute', left: x - 120, top: y - 120, width: 240, height: 240, transform: `rotate(${rot}deg) scale(${s})`, background: src ? '#FFFFFF' : '#14284B', border: '7px solid #111', borderRadius: 34, boxShadow: '0 10px 0 rgba(0,0,0,0.28)', overflow: 'visible'}}>
      {src ? (
        <Img src={A(src)} style={{position: 'absolute', left: 18, top: 14, width: 190, height: 198, objectFit: 'contain'}} />
      ) : (
        <div style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FONT, fontSize: 170, color: '#9FD8FF', paddingTop: 30}}>?</div>
      )}
      <div style={{position: 'absolute', right: -22, top: -22, width: 70, height: 70, borderRadius: 35, background: '#FFE14D', border: '6px solid #111', fontFamily: FONT, fontSize: 52, display: 'flex', alignItems: 'center', justifyContent: 'center', paddingTop: 8}}>?</div>
    </div>
  );
};
const Bubble: React.FC<{p: [number, number]; s: number}> = ({p, s}) =>
  s <= 0.01 ? null : (
    <div style={{position: 'absolute', left: p[0] - 75, top: p[1] - 75, width: 150, height: 150, borderRadius: 75, background: '#FFF', border: '7px solid #111', transform: `scale(${s})`, fontFamily: FONT, fontSize: 110, display: 'flex', alignItems: 'center', justifyContent: 'center', paddingTop: 18, boxShadow: '0 8px 0 rgba(0,0,0,0.3)'}}>?</div>
  );
const Sweat: React.FC<{c: V; s: number; size: number}> = ({c, s, size}) =>
  s <= 0.01 ? null : (
    <svg style={abs(c[0] - size, c[1] - size * 1.6, size * 2, size * 2.6, {overflow: 'visible'})} viewBox="-10 -16 20 26">
      <g transform={`scale(${s})`}>
        <path d="M 0 -14 C 4 -7, 8 -2, 8 3 C 8 8, 4 10, 0 10 C -4 10, -8 8, -8 3 C -8 -2, -4 -7, 0 -14 Z" fill="#8ED8FF" stroke="#111" strokeWidth={1.6} />
        <ellipse cx={-3} cy={3} rx={1.6} ry={2.6} fill="#FFF" />
      </g>
    </svg>
  );

// subscribe button (world, stuck on the trunk where the beak hits)
const Subscribe: React.FC<{t: number}> = ({t}) => {
  const s = pop(t, 25.62, 27.0, 0.3);
  if (s <= 0.01) return null;
  const pressed = t >= 26.04;
  const squash = pressed ? 1 - 0.12 * Math.max(0, springK(t, 26.04, 5, 7)) - (t < 26.1 ? 0.1 : 0) : 1;
  const bell = pressed ? 22 * springK(t, 26.32, 5, 4) : 0;
  return (
    <div style={{position: 'absolute', left: 330 - 205, top: 505 - 64, width: 410, height: 128, transform: `scale(${s * (2 - squash)}, ${s * squash})`, background: pressed ? '#8E8E8E' : '#FF2B2B', border: '6px solid #111', borderRadius: 22, boxShadow: '0 7px 0 rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, fontFamily: FONT, color: '#FFF', fontSize: pressed ? 52 : 64, paddingTop: 8}}>
      {pressed && (
        <svg width={56} height={62} viewBox="-12 -14 24 28" style={{transform: `rotate(${bell}deg)`, marginTop: -6}}>
          <path d="M -9 6 C -9 -2, -7 -9, 0 -9 C 7 -9, 9 -2, 9 6 L 11 9 L -11 9 Z" fill="#FFE14D" stroke="#111" strokeWidth={2.4} strokeLinejoin="round" />
          <circle cx={0} cy={11.5} r={2.6} fill="#FFE14D" stroke="#111" strokeWidth={2} />
        </svg>
      )}
      {pressed ? 'SUBSCRIBED' : 'SUBSCRIBE'}
    </div>
  );
};

// X-ray scanner panel frame (world)
const Scanner: React.FC<{t: number; win: {cx: number; cy: number; w: number; h: number}}> = ({t, win}) => {
  const f = 26, x0 = win.cx - win.w / 2, y0 = win.cy - win.h / 2;
  const blink = Math.floor(t * 4) % 2 === 0;
  return (
    <WorldSvg>
      <defs>
        <clipPath id="stripe"><rect x={x0 - f} y={y0 - f} width={win.w + 2 * f} height={f} rx={6} /></clipPath>
      </defs>
      <rect x={x0 - f - 26} y={win.cy - 52} width={34} height={104} rx={14} fill="#B9C1CD" stroke="#111" strokeWidth={4} />
      <rect x={x0 + win.w + f - 8} y={win.cy - 52} width={34} height={104} rx={14} fill="#B9C1CD" stroke="#111" strokeWidth={4} />
      <path fillRule="evenodd" fill="#D9DEE6" stroke="#111" strokeWidth={4}
        d={`M ${x0 - f + 30} ${y0 - f} H ${x0 + win.w + f - 30} Q ${x0 + win.w + f} ${y0 - f} ${x0 + win.w + f} ${y0 - f + 30} V ${y0 + win.h + f - 30} Q ${x0 + win.w + f} ${y0 + win.h + f} ${x0 + win.w + f - 30} ${y0 + win.h + f} H ${x0 - f + 30} Q ${x0 - f} ${y0 + win.h + f} ${x0 - f} ${y0 + win.h + f - 30} V ${y0 - f + 30} Q ${x0 - f} ${y0 - f} ${x0 - f + 30} ${y0 - f} Z
           M ${x0 + 14} ${y0} H ${x0 + win.w - 14} Q ${x0 + win.w} ${y0} ${x0 + win.w} ${y0 + 14} V ${y0 + win.h - 14} Q ${x0 + win.w} ${y0 + win.h} ${x0 + win.w - 14} ${y0 + win.h} H ${x0 + 14} Q ${x0} ${y0 + win.h} ${x0} ${y0 + win.h - 14} V ${y0 + 14} Q ${x0} ${y0} ${x0 + 14} ${y0} Z`} />
      <g clipPath="url(#stripe)">
        {Array.from({length: 40}, (_, i) => (
          <path key={i} d={`M ${x0 - f + i * 26} ${y0 - f + 26} l 13 0 l 18 -26 l -13 0 Z`} fill={i % 2 ? '#111' : '#FFD400'} />
        ))}
      </g>
      <rect x={x0 - 2} y={y0 - 2} width={win.w + 4} height={win.h + 4} rx={15} fill="none" stroke="#7D8796" strokeWidth={5} />
      <circle cx={win.cx + 40} cy={y0 + win.h + f / 2} r={7} fill={blink ? '#FF3B3B' : '#8E1C1C'} stroke="#111" strokeWidth={2.5} />
      <circle cx={win.cx - 40} cy={y0 + win.h + f / 2} r={7.5} fill="#EEF1F5" stroke="#111" strokeWidth={2.5} />
      <text x={x0 + 10} y={y0 + win.h + f - 7} fontFamily={FONT} fontSize={18} fill="#111">X-RAY</text>
    </WorldSvg>
  );
};

// ---------------------------------------------------------------- composition
export const Woodpecker: React.FC = () => {
  const [handle] = useState(() => delayRender('font'));
  useEffect(() => {
    const ff = new FontFace('Luckiest', `url(${staticFile('fonts/luckiest-guy.woff2')}) format('woff2')`);
    ff.load().then((f) => { (document.fonts as unknown as {add: (x: FontFace) => void}).add(f); continueRender(handle); }).catch(() => continueRender(handle));
  }, [handle]);

  const frame = useCurrentFrame();
  const t = frame / FPS;
  const cam = camAt(t);
  const d = slideAt(t);
  const reveal = revealAt(t);
  const tip = d + ROD;

  // X-ray clip (screen rect)
  const win = windowAt(t);
  let clip: string | null = null;
  let wipeY = -1;
  if (t >= 0.92 && t < 3.45) {
    const [x0, y0] = toScreen(cam, [win.cx - win.w / 2, win.cy - win.h / 2]);
    const [x1, y1] = toScreen(cam, [win.cx + win.w / 2, win.cy + win.h / 2]);
    clip = `inset(${y0}px ${1080 - x1}px ${1920 - y1}px ${x0}px round ${14 * cam.k}px)`;
  } else if (t >= 3.45 && t < 23.3) clip = 'none';
  else if (t >= 23.3 && t < 23.65) {
    wipeY = 1920 * eio(inv(23.3, 23.65, t));
    clip = `inset(${wipeY}px 0px 0px 0px)`;
  }
  const normalVisible = !(t >= 3.45 && t < 23.3);

  // eye target / state (X-ray eye)
  const lookAt = (tt: number): V | null => {
    const dd = slideAt(tt), rr = revealAt(tt);
    if (tt > 1.9 && tt < 2.55) return at(LH * (1 - eio(inv(1.9, 2.55, tt))));
    if (tt > 3.93 && tt < 10.62) return at(dd + (1 - rr) * LH);
    if (tt > 12.5 && tt < 14.9) return at(LH - 60);
    if (tt > 14.9 && tt < 23.1) return at(dd + ROD);
    return null;
  };
  const smooth = (): V | null => {
    let sx = 0, sy = 0, n = 0;
    const e = headW(EYE_HEAD);
    for (let i = 0; i < 8; i++) {
      const p = lookAt(t - i * 0.02) ?? e;
      sx += p[0]; sy += p[1]; n++;
    }
    return [sx / n, sy / n];
  };
  const eyeScale = 1 + 0.22 * Math.max(0, springK(t, 1.32, 3, 5)) + (t > 10.6 && t < 11.6 ? 0.22 * popIn(t, 10.6, 0.25, 3) * popOut(t, 11.4, 0.2) : 0);
  const pupil = (t > 1.3 && t < 1.9) || (t > 10.6 && t < 11.5) ? 0.68 : 1;

  // grub state
  let grub: React.ReactNode = null;
  if (t < 23.14) {
    const munch = t < 17.2 ? 1 + 0.035 * Math.sin(2 * Math.PI * 3 * t) : 1;
    if (t < 17.64) {
      grub = <Grub kind={t < 17.2 ? 'calm' : 'alert'} c={[CHAMBER[0], CHAMBER[1] + 4]} rot={-90} sx={munch} sy={1 / munch} t={t} />;
    } else if (t < 21.97) {
      const sq = 1 + 0.18 * springK(t, 17.64, 4, 5) + (t > 20.76 ? 0.12 * springK(t, 20.76, 5, 6) : 0);
      grub = <Grub kind="curled" c={[CHAMBER[0] + 1, CHAMBER[1] + 6]} rot={0} sx={sq} sy={2 - sq} t={t} />;
    } else {
      const sg = t < 23.0 ? tip + 47 : lerp(ROD + 47, ROD - 45, eio(inv(23.0, 23.14, t)));
      const c = at(sg), g = tangent(sg);
      const rot = (Math.atan2(g[1], g[0]) * 180) / Math.PI - 180;
      const st = 1 + 0.15 * springK(t, 21.97, 5, 5);
      grub = <Grub kind="hooked" c={c} rot={rot} sx={st} sy={2 - st} t={t} />;
    }
  }

  // labels (screen)
  const bonesAnchor = toScreen(cam, at(LH * 0.93));
  const musAnchor = toScreen(cam, at(LH - 70));
  const tipP = at(tip - 7);
  const tipS = toScreen(cam, tipP);
  const headTop = toScreen(cam, headW([1500, 60]));

  return (
    <AbsoluteFill style={{background: '#9ED8FF'}}>
      <Audio src={A('audio/mix.wav')} />
      {normalVisible && (
        <>
          <AbsoluteFill style={{background: 'linear-gradient(#8FD0FF 0%, #CDEBFF 55%, #E6F6FF 100%)'}} />
          <Layer cam={cam} z={3000} blur={3}><Forest /></Layer>
          <Layer cam={cam} z={1000}>
            <Trunk src={A('trunk.png')} />
            <svg style={abs(0, 0, 1200, 1200, {overflow: 'visible'})} viewBox="0 0 1200 1200">
              <ellipse cx={HOLE[0] - 1} cy={HOLE[1]} rx={8.5} ry={6.5} fill="#3A2216" stroke="#111" strokeWidth={1.6} />
            </svg>
            <Subscribe t={t} />
            <Bird t={t} />
            <Chips t={t} />
          </Layer>
          <Layer cam={cam} z={700} blur={3}><Leaves /></Layer>
        </>
      )}

      {clip !== null && (
        <AbsoluteFill style={{clipPath: clip === 'none' ? undefined : clip}}>
          <AbsoluteFill style={{background: 'radial-gradient(circle at 50% 45%, #10264A 0%, #081530 70%, #050D20 100%)'}} />
          <Layer cam={cam} z={1000}>
            <svg style={abs(-2000, -2000, 5000, 5000)} viewBox="-2000 -2000 5000 5000">
              <defs>
                <pattern id="grid" width={40} height={40} patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#3E79C4" strokeWidth={0.8} opacity={0.35} />
                </pattern>
              </defs>
              <rect x={-2000} y={-2000} width={5000} height={5000} fill="url(#grid)" />
            </svg>
            <Trunk src={A('xray_trunk.png')} />
            <WorldSvg>
              <path d={TUNNEL_PATH} stroke="#6FB6FF" strokeWidth={27} fill="none" strokeLinecap="round" strokeLinejoin="round" />
              <ellipse cx={CHAMBER[0]} cy={CHAMBER[1] + 4} rx={33} ry={64} fill="#6FB6FF" />
              <path d={TUNNEL_PATH} stroke="#0A1631" strokeWidth={22} fill="none" strokeLinecap="round" strokeLinejoin="round" />
              <ellipse cx={CHAMBER[0]} cy={CHAMBER[1] + 4} rx={30.5} ry={61.5} fill="#0A1631" />
              {Array.from({length: 26}, (_, i) => (
                <circle key={i} cx={CHAMBER[0] + (rnd(i) - 0.5) * 40} cy={CHAMBER[1] + 40 + rnd(i + 30) * 22} r={1.2 + rnd(i + 60) * 1.4} fill="#C9A97A" opacity={0.85} />
              ))}
            </WorldSvg>
            {grub}
            <Img src={A('xray_body.png')} style={abs(XRAY.x, XRAY.y, XRAY.w, XRAY.h)} />
            <BodyBones />
            <HeadBones />
            <Rod t={t} d={d} reveal={reveal} />
            <XEye t={t} look={smooth()} scale={eyeScale} pupil={pupil} closed={t > 23.06 && t < 23.4} />
            <WorldSvg>
              {t > 10.55 && t < 11.0 && (() => {
                const n = headW(NOSTRIL_HEAD), u = inv(10.55, 11.0, t);
                return <circle cx={n[0]} cy={n[1]} r={4 + 22 * eo(u)} fill="none" stroke="#FFE14D" strokeWidth={3 * (1 - u)} />;
              })()}
              {t > 23.06 && t < 23.6 && (() => {
                const u = inv(23.06, 23.6, t);
                const p = headW([lerp(1000, 1180, u), lerp(880, 2000, eio(u))]);
                const r = 13 * (1 - u * 0.6);
                return <ellipse cx={p[0]} cy={p[1]} rx={r} ry={r * 0.8} fill="#F4E4C4" stroke="#C9A97A" strokeWidth={1.5} opacity={0.9} />;
              })()}
            </WorldSvg>
            <Sweat c={headW([1880, lerp(240, 360, inv(10.75, 11.45, t))])} s={pop(t, 10.75, 11.45, 0.2)} size={9} />
            <Sweat c={[512, lerp(712, 726, inv(17.3, 17.9, t))]} s={pop(t, 17.3, 17.9, 0.2)} size={6} />
          </Layer>
          <AbsoluteFill style={{background: 'repeating-linear-gradient(0deg, rgba(160,210,255,0.035) 0px, rgba(160,210,255,0.035) 2px, transparent 2px, transparent 6px)'}} />
          <AbsoluteFill style={{boxShadow: 'inset 0 0 220px rgba(0,8,25,0.75)'}} />
        </AbsoluteFill>
      )}
      {wipeY >= 0 && <div style={{position: 'absolute', left: 0, top: wipeY - 5, width: 1080, height: 10, background: '#BFF0FF', boxShadow: '0 0 30px 12px rgba(120,220,255,0.8)'}} />}

      {t >= 0.9 && t < 3.45 && (
        <Layer cam={cam} z={1000}><Scanner t={t} win={win} /></Layer>
      )}

      {/* screen-space UI */}
      <Caption t={t} y={92} out={2.78} size={74} lines={[[['THIS', 0.1], ["WOODPECKER'S", 0.41]], [['TONGUE', 1.05], ["DOESN'T", 1.49], ['END', 1.82]], [['IN', 2.03], ['ITS', 2.12], ['MOUTH', 2.3, '#FFE14D']]]} />
      <Label text="HYOID BONES" at={[300, 1420]} anchor={bonesAnchor} s={pop(t, 4.66, 11.25, 0.3)} />
      <Bubble p={[headTop[0] - 10, headTop[1] - 110]} s={pop(t, 11.66, 12.4, 0.28)} />
      <Label text="MUSCLES" at={[300, 1500]} anchor={musAnchor} s={pop(t, 12.49, 14.85, 0.3)} color="#FF9DB0" />
      <Label text="BARBS" at={[250, tipS[1] - 330]} anchor={toScreen(cam, at(tip - 6))} s={pop(t, 19.35, 21.7, 0.3)} />
      <Label text="STICKY SPIT" at={[780, tipS[1] + 300]} anchor={toScreen(cam, [tipP[0] + 4, tipP[1] + 4])} s={pop(t, 20.4, 21.7, 0.3)} color="#BFE8FF" />
      <Caption t={t} y={130} out={26.95} size={92} lines={[[['WHICH', 23.97], ['BIRD', 24.36], ['SHOULD', 24.6]], [['I', 24.73], ['X-RAY', 24.83, '#9FD8FF'], ['NEXT?', 25.17]]]} />
      <Card x={250} y={560} s={pop(t, 23.97, 26.95)} rot={-5} src="owl.png" />
      <Card x={540} y={590} s={pop(t, 24.36, 27.0)} rot={3} src="penguin.png" />
      <Card x={830} y={560} s={pop(t, 24.83, 27.05)} rot={6} />
    </AbsoluteFill>
  );
};
