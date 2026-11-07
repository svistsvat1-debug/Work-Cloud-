// X-ray view: the robin's leg rig (bones, tendon, toes), labels, wake-up, the ridge "lens", the starling's tendons + snip.
import React from 'react';
import {AbsoluteFill, Img} from 'remotion';
import {add, bump, clamp, ei, eio, eo, kf, lerp, lin, mix, mul, nrm, polar, popScale, prog, pts, rad, sm, smoothPath, spring, sub, V2} from './anim';
import {CLICKS, LENS, SNIPS, T} from './timing';
import {SP, TH} from './world';
import {f, FONT, INK} from './parts';

const CY = '#bdeeff';
const CY2 = '#7fd0ff';
const BONE = '#eef9ff';
const TEN = '#ff8a3d';

// ------------------------------------------------------------------ robin leg rig (robin raw units)
const LEG = {F: [357.5, 906.5] as V2, l3: 85.6, l2: 118.2, l1: 93.0, crouch: [-127.4, -32.2, -126.3], stand: [-102, -70, -108.6]};
const FAR_OFF: V2 = [161, -18];
export type Pose = {F: V2; A: V2; K: V2; H: V2};
export function legPose(c: number, F: V2): Pose {
  const a = LEG.stand.map((s, i) => lerp(s, LEG.crouch[i], c));
  const A = add(F, polar(LEG.l3, a[0]));
  const K = add(A, polar(LEG.l2, a[1]));
  const H = add(K, polar(LEG.l1, a[2]));
  return {F, A, K, H};
}
const H_CROUCH = legPose(1, LEG.F).H;
export const robinC = (t: number) =>
  kf(t, [
    [0, 1],
    [4.4, 1],
    [5.2, 0.35, eio],
    [T.crouching, 0.35],
    [T.shut + 0.06, 1, eio],
    [17.33, 1],
    [17.98, 0, eo],
    [40, 0],
  ]);
const curlOf = (c: number) => sm(clamp((c - 0.1) / 0.85));
export const bodyOffset = (t: number): V2 => sub(legPose(robinC(t), LEG.F).H, H_CROUCH);
export const TOE_BASE: V2 = add(LEG.F, [0, 9]);

function toeChain(base: V2, curl: number, sc: number, back: boolean): V2[] {
  const L = [44, 36, 22].map((x) => x * sc * (back ? 0.78 : 1));
  const inc = [60, 75, 65];
  const sg = back ? -1 : 1;
  let a = back ? 180 + TH : TH;
  let p = base;
  const out: V2[] = [base];
  for (let i = 0; i < 3; i++) {
    a += sg * (inc[i] * curl + 4);
    p = add(p, polar(L[i], a));
    out.push(p);
  }
  return out;
}
function plantar(ch: V2[], back: boolean, off = 4.5): V2[] {
  const dirs = [0, 1, 2].map((i) => nrm(sub(ch[i + 1], ch[i])));
  const pn = dirs.map((d) => (back ? ([d[1], -d[0]] as V2) : ([-d[1], d[0]] as V2)));
  return [
    add(ch[0], mul(pn[0], off)),
    add(ch[1], mul(nrm(add(pn[0], pn[1])), off)),
    add(ch[2], mul(nrm(add(pn[1], pn[2])), off)),
    sub(add(ch[3], mul(pn[2], off * 0.7)), mul(dirs[2], 4)),
  ];
}
const poly = (p: V2[]) => pts(p);

type LegGeo = {pose: Pose; toes: V2[][]; hallux: V2[]; tendon: V2[]; branches: V2[][]; heel: V2; muscle: {c: V2; ang: number; rx: number}};
function legGeo(t: number, far: boolean): LegGeo {
  const c = robinC(t);
  const curl = curlOf(c);
  const F = far ? add(LEG.F, FAR_OFF) : LEG.F;
  const pose = legPose(c, F);
  const {A, K} = pose;
  const base = add(F, [0, 9]);
  const dirB: V2 = [Math.cos(rad(TH)), Math.sin(rad(TH))];
  const toes = [-16, 0, 16].map((d, i) => toeChain(add(base, mul(dirB, d)), curl, [0.93, 1, 0.96][i], false));
  const hallux = toeChain(add(base, mul(dirB, -4)), curl, 1, true);
  const d2 = nrm(sub(K, A));
  const post2: V2 = [d2[1], -d2[0]];
  const d3 = nrm(sub(A, F));
  const post3: V2 = [d3[1], -d3[0]];
  const heelDir = nrm(mul(add(nrm(sub(K, A)), nrm(sub(F, A))), -1));
  const heel = add(A, mul(heelDir, 12));
  const M0 = add(mix(K, A, 0.15), mul(post2, 9));
  const M1 = add(mix(K, A, 0.64), mul(post2, 11));
  const T1 = add(mix(A, F, 0.3), mul(post3, 7));
  const T2 = add(mix(A, F, 0.86), mul(post3, 5));
  const tendon = [M0, M1, heel, T1, T2, ...plantar(toes[1], false)];
  const branches = [[T2, ...plantar(toes[0], false)], [T2, ...plantar(toes[2], false)], [T2, ...plantar(hallux, true)]];
  return {
    pose,
    toes,
    hallux,
    tendon,
    branches,
    heel,
    muscle: {c: add(mix(K, A, 0.4), mul(post2, 9)), ang: (Math.atan2(d2[1], d2[0]) * 180) / Math.PI, rx: 0.33 * LEG.l2},
  };
}

const Flesh: React.FC<{p: V2[]; w: number}> = ({p, w}) => (
  <>
    <polyline points={poly(p)} fill="none" stroke={CY} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" strokeOpacity={0.75} />
    <polyline points={poly(p)} fill="none" stroke="#173c66" strokeWidth={w - 6} strokeLinecap="round" strokeLinejoin="round" />
  </>
);
const Bones: React.FC<{p: V2[]; w: number; joints?: boolean}> = ({p, w, joints = true}) => (
  <>
    <polyline points={poly(p)} fill="none" stroke={CY2} strokeOpacity={0.22} strokeWidth={w + 9} strokeLinecap="round" strokeLinejoin="round" />
    <polyline points={poly(p)} fill="none" stroke={BONE} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" />
    {joints && p.slice(1, -1).map((q, i) => <circle key={i} cx={q[0]} cy={q[1]} r={w * 0.95} fill={BONE} />)}
  </>
);

const tendonReveal = (t: number) =>
  t < T.tendons ? 0 : kf(t, [[T.tendons, 0], [T.joint, 0.45, lin], [T.toes, 0.72, lin], [T.toesEnd - 0.05, 1, eo]]);

const TendonPath: React.FC<{d: string; reveal: number; tight: number; dim?: number}> = ({d, reveal, tight, dim = 1}) => {
  if (reveal <= 0.001) return null;
  const core = tight > 0.5 ? '#ffc070' : TEN;
  const dash = reveal >= 0.999 ? undefined : `${reveal.toFixed(4)} 2`;
  return (
    <g opacity={dim}>
      <path d={d} pathLength={1} fill="none" stroke={TEN} strokeOpacity={0.22 + 0.25 * tight} strokeWidth={13} strokeLinecap="round" strokeDasharray={dash} />
      <path d={d} pathLength={1} fill="none" stroke={core} strokeWidth={4.6 + 1.2 * tight} strokeLinecap="round" strokeDasharray={dash} />
    </g>
  );
};

// hallux toes: drawn behind the x-ray branch
export const RobinHallux: React.FC<{t: number}> = ({t}) => {
  const near = legGeo(t, false);
  const far = legGeo(t, true);
  return (
    <>
      <g opacity={0.45}>
        <Flesh p={far.hallux} w={14} />
        <Bones p={far.hallux} w={3.4} />
      </g>
      <Flesh p={near.hallux} w={15} />
      <Bones p={near.hallux} w={3.8} />
    </>
  );
};

const Pill: React.FC<{c: V2; text: string; fill: string; s: number; sx?: number; target?: V2; size?: number}> = ({c, text, fill, s, sx = 1, target, size = 30}) => {
  if (s <= 0.01) return null;
  const w = text.length * size * 0.62 + size * 1.1;
  const h = size * 1.55;
  return (
    <g>
      {target && (
        <>
          <line x1={c[0]} y1={c[1]} x2={lerp(c[0], target[0], s)} y2={lerp(c[1], target[1], s)} stroke={INK} strokeWidth={6} strokeLinecap="round" />
          <line x1={c[0]} y1={c[1]} x2={lerp(c[0], target[0], s)} y2={lerp(c[1], target[1], s)} stroke="#ffffff" strokeWidth={2.2} strokeLinecap="round" />
          <circle cx={target[0]} cy={target[1]} r={6 * s} fill="#ffffff" stroke={INK} strokeWidth={3} />
        </>
      )}
      <g transform={`translate(${c[0]} ${c[1]}) scale(${s * sx} ${s})`}>
        <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={h / 2} fill={fill} stroke={INK} strokeWidth={5} />
        <text x={0} y={size * 0.36} textAnchor="middle" fontFamily={FONT} fontWeight={700} fontSize={size} fill={INK}>
          {text}
        </text>
      </g>
    </g>
  );
};

const Ring: React.FC<{c: V2; t: number; t0: number; color?: string; r0?: number}> = ({c, t, t0, color = '#ffe066', r0 = 12}) => {
  const out: React.ReactNode[] = [];
  for (let k = 0; k < 2; k++) {
    const u = prog(t, t0 + k * 0.22, t0 + k * 0.22 + 0.6);
    if (u <= 0 || u >= 1) continue;
    out.push(<circle key={k} cx={c[0]} cy={c[1]} r={r0 + 30 * eo(u)} fill="none" stroke={color} strokeWidth={5 * (1 - u) + 1} opacity={1 - u} />);
  }
  return <>{out}</>;
};

// legs, front toes, tendons, labels, eye (in front of the branch)
export const RobinRig: React.FC<{t: number}> = ({t}) => {
  const near = legGeo(t, false);
  const far = legGeo(t, true);
  const c = robinC(t);
  const off = bodyOffset(t);
  const rev = tendonReveal(t);
  const tight = clamp((c - 0.35) / 0.65);
  const brRev = prog(rev, 0.72, 1);
  const pullOn = t > T.crouching - 0.05 && t < T.shut + 0.35 ? Math.sin(Math.PI * prog(t, T.crouching - 0.05, T.shut + 0.35)) : 0;
  const musS = popScale(t, T.tendons - 0.08, 1e9, 1.2);
  const P = near.pose;
  const legParts = (g: LegGeo, dim: number, main: boolean) => (
    <g opacity={dim}>
      <Flesh p={[g.pose.A, g.pose.F]} w={18} />
      {g.toes.slice().reverse().map((ch, i) => (
        <Flesh key={i} p={ch} w={15} />
      ))}
      <Bones p={[g.pose.H, g.pose.K, g.pose.A, g.pose.F]} w={6} />
      <circle cx={g.pose.H[0]} cy={g.pose.H[1]} r={11} fill="none" stroke={BONE} strokeWidth={4} />
      {g.toes.map((ch, i) => (
        <Bones key={i} p={ch} w={3.6} />
      ))}
      {main && musS > 0 && (
        <ellipse
          cx={g.muscle.c[0]}
          cy={g.muscle.c[1]}
          rx={g.muscle.rx * musS}
          ry={14 * musS}
          transform={`rotate(${g.muscle.ang} ${g.muscle.c[0]} ${g.muscle.c[1]})`}
          fill="rgba(255,138,61,0.30)"
          stroke="#ffa060"
          strokeWidth={3}
        />
      )}
      <TendonPath d={smoothPath(g.tendon)} reveal={rev} tight={tight} dim={main ? 1 : 0.7} />
      {g.branches.map((b, i) => (
        <TendonPath key={i} d={smoothPath(b)} reveal={brRev} tight={tight} dim={main ? 0.85 : 0.6} />
      ))}
    </g>
  );
  // pull indicator: light dashes running up the tendon toward the muscle while it crouches
  const pull = pullOn > 0.01 && (
    <path
      d={smoothPath(near.tendon)}
      pathLength={1}
      fill="none"
      stroke="#fff1c9"
      strokeWidth={3.4}
      strokeLinecap="round"
      strokeDasharray="0.03 0.06"
      strokeDashoffset={((t - T.crouching) * 0.45).toFixed(4)}
      opacity={pullOn}
    />
  );
  // click sparks at the toes when they shut
  const sparkS = popScale(t, T.shut + 0.06, T.shut + 0.3, 2, 0.15);
  const tip = near.toes[1][2];
  const sparks =
    sparkS > 0 &&
    [-40, 10, 60].map((a, i) => {
      const u = polar(1, a - 20);
      const p0 = add(tip, mul(u, 30));
      const p1 = add(tip, mul(u, 30 + 22 * sparkS));
      return <line key={i} x1={p0[0]} y1={p0[1]} x2={p1[0]} y2={p1[1]} stroke="#ffe9a8" strokeWidth={5} strokeLinecap="round" />;
    });
  // labels
  const lab1 = popScale(t, T.backward, 13.12, 1.3);
  const flipU = prog(t, T.actually + 0.12, T.ankle);
  const flipSx = Math.abs(Math.cos(Math.PI * flipU));
  const isAnkle = flipU >= 0.5;
  const lab2 = popScale(t, T.ankleEnd - 0.24, 13.12, 1.3);
  // wake up
  const eyeS = popScale(t, 16.97, 1e9, 1.4);
  const bangS = popScale(t, 16.97, 18.45, 1.5);
  const eyeC = add([478, 418], off);
  return (
    <>
      {legParts(far, 0.5, false)}
      {legParts(near, 1, true)}
      {pull}
      <Ring c={near.heel} t={t} t0={T.joint} />
      {sparks}
      <Ring c={P.A} t={t} t0={T.backward} color="#ffffff" r0={14} />
      <Pill c={add(P.A, [-128, 44])} text={isAnkle ? 'ANKLE' : 'KNEE?'} fill={isAnkle ? '#ffd54a' : '#ffffff'} s={lab1} sx={flipSx} target={near.heel} />
      <Ring c={P.K} t={t} t0={T.ankleEnd - 0.26} color="#8ff0c8" r0={14} />
      <Pill c={add(P.K, [70, -95])} text="REAL KNEE" fill="#8ff0c8" s={lab2} target={P.K} size={28} />
      {eyeS > 0 && (
        <g>
          <ellipse cx={eyeC[0]} cy={eyeC[1] + 2} rx={50} ry={30} fill="#1b3e66" filter="url(#xrsoft)" />
          <g transform={`translate(${eyeC[0]} ${eyeC[1]}) scale(${eyeS})`}>
            <circle r={21} fill="#21507f" stroke={CY} strokeWidth={5.5} />
            <circle cx={5} cy={-1} r={10} fill="#effbff" />
          </g>
        </g>
      )}
      {bangS > 0 && (
        <text
          x={0}
          y={0}
          transform={`translate(${618 + off[0]} ${300 + off[1]}) rotate(12) scale(${bangS})`}
          textAnchor="middle"
          fontFamily={FONT}
          fontWeight={700}
          fontSize={96}
          fill="#e9fbff"
          stroke="#2a6aa8"
          strokeWidth={8}
          paintOrder="stroke"
        >
          !
        </text>
      )}
      <defs>
        <filter id="xrsoft" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation={4} />
        </filter>
      </defs>
    </>
  );
};

// ------------------------------------------------------------------ starling tendons (starling raw units) + snip
const ST_R: V2[] = [[548, 760], [532, 815], [524, 846], [510, 872], [496, 892], [499, 914], [515, 927]];
const ST_L: V2[] = [[345, 792], [331, 838], [318, 862], [306, 879], [292, 897], [297, 918], [312, 929]];
export const SNIP_PTS: V2[] = [[524, 846], [318, 862]];
export const StarTendons: React.FC<{t: number}> = ({t}) => {
  const glow = 1 + 0.6 * bump(t, T.tendons3, 0.5);
  const one = (p: V2[], ts: number, key: string) => {
    if (t < ts) return <TendonPath key={key} d={smoothPath(p)} reveal={1} tight={0.4 * glow} />;
    const r = eo(prog(t, ts, ts + 0.28));
    const up = p.slice(0, 3).map((q, i) => add(q, [0, -16 * r * (i / 2)]));
    const lo = p.slice(2).map((q, i) => add(q, [3 * r * Math.sin(i * 2), 7 * r]));
    const wave = (q: V2[], amp: number) => q.map((v, i) => add(v, [amp * r * Math.sin(i * 2.4 + 1), 0]));
    return (
      <g key={key}>
        {[wave(up, 4), wave(lo, 5)].map((q, i) => (
          <path key={i} d={smoothPath(q)} fill="none" stroke="#9db7cc" strokeWidth={4.4} strokeDasharray="9 7" strokeLinecap="round" opacity={0.9} />
        ))}
        <circle cx={p[2][0]} cy={p[2][1]} r={16 * popScale(t, ts, ts + 0.15, 2, 0.15)} fill="none" stroke="#ffffff" strokeWidth={4} />
      </g>
    );
  };
  return (
    <>
      {one(ST_R, SNIPS[0] + 0.04, 'r')}
      {one(ST_L, SNIPS[1] + 0.04, 'l')}
    </>
  );
};

// ------------------------------------------------------------------ x-ray background
export const XrayBg: React.FC = () => (
  <AbsoluteFill style={{background: 'radial-gradient(circle at 50% 42%, #15385f 0%, #0c2546 55%, #06172f 100%)'}}>
    <svg width={1080} height={1920}>
      {Array.from({length: 10}, (_, i) => (
        <line key={`v${i}`} x1={i * 120 + 0} y1={0} x2={i * 120} y2={1920} stroke="#7fc6ff" strokeOpacity={0.05} strokeWidth={2} />
      ))}
      {Array.from({length: 17}, (_, i) => (
        <line key={`h${i}`} x1={0} y1={i * 120} x2={1080} y2={i * 120} stroke="#7fc6ff" strokeOpacity={0.05} strokeWidth={2} />
      ))}
    </svg>
  </AbsoluteFill>
);

export const ScanLine: React.FC<{y: number}> = ({y}) => {
  if (y <= 0 || y >= 1920) return null;
  const o = clamp(Math.min(y, 1920 - y) / 160);
  return (
    <AbsoluteFill style={{opacity: o}}>
      <div style={{position: 'absolute', left: 0, top: y - 60, width: 1080, height: 120, background: 'linear-gradient(180deg, rgba(120,220,255,0) 0%, rgba(120,220,255,0.35) 50%, rgba(120,220,255,0) 100%)'}} />
      <div style={{position: 'absolute', left: 0, top: y - 4, width: 1080, height: 8, background: '#eafcff', boxShadow: '0 0 18px 6px rgba(140,225,255,0.85)'}} />
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ the lens: tendon ridges lock like a zip tie
export const LENS_C: V2 = [560, 440];
export const LENS_R = 245;
const PITCH = 64;
const Y_UP = -30;
const Y_EN = 16;
function lensState(t: number) {
  let xo = 5 * PITCH + 90 * (1 - eio(prog(t, 13.6, 14.7)));
  let yb = kf(t, [[0, Y_UP], [14.62, Y_UP], [15.0, Y_EN, eio]]);
  for (const c of CLICKS) {
    const u = prog(t, c - 0.12, c);
    xo -= PITCH * eio(u);
    if (u > 0 && u < 1) yb -= 40 * Math.sin(Math.PI * u);
  }
  const un = eio(prog(t, 17.55, 17.95));
  yb = lerp(yb, Y_UP, un);
  xo += 130 * eo(prog(t, 17.9, 18.4));
  return {xo, yb};
}
export const Lens: React.FC<{t: number; target: V2}> = ({t, target}) => {
  const s = popScale(t, LENS[0], LENS[1], 1.25, 0.22);
  if (s <= 0.001) return null;
  const R = LENS_R;
  const [cx, cy] = LENS_C;
  const {xo, yb} = lensState(t);
  const ridgeGlow = bump(t, T.ridges, 0.6);
  const ridges: string[] = [];
  for (let n = -5; n <= 5; n++) {
    const x = n * PITCH;
    ridges.push(`M${x - 23},56 Q${x - 12},18 ${x},14 Q${x + 12},18 ${x + 23},56 Z`);
  }
  const bumps: string[] = [];
  for (let m = -6; m <= 6; m++) {
    const x = m * PITCH + PITCH / 2 + (xo % PITCH);
    bumps.push(`M${x - 22},${yb} Q${x - 11},${yb + 32} ${x},${yb + 36} Q${x + 11},${yb + 32} ${x + 22},${yb} Z`);
  }
  const flash = CLICKS.reduce((a, c) => a + bump(t, c, 0.18), 0);
  // callout to the toes
  const d = sub(target, LENS_C);
  const dist = Math.hypot(d[0], d[1]);
  const phi = Math.atan2(d[1], d[0]);
  const al = Math.acos(clamp(R / dist, -1, 1));
  const tp = [phi + al, phi - al].map((a) => add(LENS_C, [R * s * Math.cos(a), R * s * Math.sin(a)]));
  const co = clamp((s - 0.5) / 0.5);
  return (
    <AbsoluteFill>
      <svg width={1080} height={1920}>
        <defs>
          <clipPath id="lensclip">
            <circle cx={0} cy={0} r={R} />
          </clipPath>
        </defs>
        {co > 0 &&
          tp.map((p, i) => (
            <g key={i} opacity={co}>
              <line x1={p[0]} y1={p[1]} x2={target[0]} y2={target[1]} stroke={INK} strokeWidth={9} strokeLinecap="round" />
              <line x1={p[0]} y1={p[1]} x2={target[0]} y2={target[1]} stroke="#e9fbff" strokeWidth={4} strokeLinecap="round" />
            </g>
          ))}
        {co > 0 && <circle cx={target[0]} cy={target[1]} r={34 * co} fill="none" stroke="#e9fbff" strokeWidth={5} />}
        <g transform={`translate(${cx} ${cy}) scale(${s})`}>
          <g clipPath="url(#lensclip)">
            <rect x={-R} y={-R} width={2 * R} height={2 * R} fill="#0d2a4d" />
            {Array.from({length: 9}, (_, i) => (
              <line key={i} x1={-R} x2={R} y1={-R + i * 60} y2={-R + i * 60} stroke="#7fc6ff" strokeOpacity={0.06} strokeWidth={2} />
            ))}
            {/* sheath */}
            <rect x={-R} y={56} width={2 * R} height={R} fill="rgba(140,205,245,0.22)" />
            <path d={ridges.join(' ')} fill="rgba(170,225,255,0.55)" stroke="#d9f6ff" strokeWidth={3} />
            <line x1={-R} x2={R} y1={56} y2={56} stroke="#d9f6ff" strokeWidth={3.5} />
            {ridgeGlow > 0.01 && <path d={ridges.join(' ')} fill="none" stroke="#fff3b0" strokeWidth={6} opacity={ridgeGlow} />}
            {/* tendon */}
            <rect x={-R} y={yb - 200} width={2 * R} height={200} fill={TEN} />
            {[0, 1, 2, 3, 4].map((i) => (
              <line
                key={i}
                x1={-R}
                x2={R}
                y1={yb - 30 - i * 34}
                y2={yb - 30 - i * 34}
                stroke="#ffc49a"
                strokeWidth={4}
                strokeDasharray="46 30"
                strokeDashoffset={-xo + i * 17}
                opacity={0.7}
              />
            ))}
            <path d={bumps.join(' ')} fill={TEN} stroke="#ffd2ad" strokeWidth={3} />
            <line x1={-R} x2={R} y1={yb} y2={yb} stroke={TEN} strokeWidth={4} />
            <text x={0} y={yb - 92} textAnchor="middle" fontFamily={FONT} fontWeight={700} fontSize={36} fill="#ffffff" stroke="#9a3a0c" strokeWidth={6} paintOrder="stroke">
              TENDON
            </text>
            <text x={0} y={170} textAnchor="middle" fontFamily={FONT} fontWeight={700} fontSize={34} fill="#d9f6ff">
              SHEATH
            </text>
            {flash > 0.02 && <rect x={-R} y={12} width={2 * R} height={46} fill="#ffffff" opacity={0.35 * clamp(flash)} />}
          </g>
          <circle r={R} fill="none" stroke={INK} strokeWidth={26} />
          <circle r={R} fill="none" stroke="#f4fbff" strokeWidth={14} />
          <path d={`M${-R * 0.55},${-R * 0.7} A${R * 0.9} ${R * 0.9} 0 0 1 ${R * 0.05},${-R * 0.88}`} fill="none" stroke="#ffffff" strokeWidth={10} strokeLinecap="round" opacity={0.6} />
        </g>
      </svg>
    </AbsoluteFill>
  );
};

// zip tie prop next to the lens (screen space)
export const ZipTie: React.FC<{t: number}> = ({t}) => {
  const s = popScale(t, T.zip - 0.02, 18.28, 1.4, 0.2);
  if (s <= 0) return null;
  const m = SP.zip_tie;
  const H = 300;
  const sc = (H / m.h) * s;
  const wig = CLICKS.slice(3).reduce((a, c) => a + 7 * bump(t, c, 0.25), 0);
  return (
    <AbsoluteFill>
      <Img
        src={f('zip_tie.png')}
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: m.w,
          height: m.h,
          transformOrigin: '0 0',
          transform: `translate(205px, 760px) rotate(${-12 + wig}deg) scale(${sc}) translate(${-m.w / 2}px, ${-m.h / 2}px)`,
        }}
      />
    </AbsoluteFill>
  );
};

// scissors (world space): flipped so the blades point left at the leg; squash = snip
export const SCI_CUT: V2 = [1030, 522];
export function scissorsState(t: number, a: V2, b: V2) {
  const s0 = add(a, [430, -280]);
  const sEnd = add(b, [620, -420]);
  let p: V2;
  if (t < 20.12 || t > 21.1) return null;
  if (t < 20.42) p = mix(s0, a, eo(prog(t, 20.12, 20.42)));
  else if (t < 20.58) p = a;
  else if (t < 20.68) p = mix(a, b, eio(prog(t, 20.58, 20.68)));
  else if (t < 20.82) p = b;
  else p = mix(b, sEnd, ei(prog(t, 20.82, 21.08)));
  let sq = 1;
  for (const sn of SNIPS) {
    const u = prog(t, sn - 0.03, sn + 0.11);
    if (u > 0 && u < 1) sq = Math.min(sq, 1 - 0.58 * Math.sin(Math.PI * u));
  }
  const ent = spring(t, 20.12, 2.5, 0.5);
  return {p, sq, rot: -10 + 8 * (1 - ent)};
}
export const Scissors: React.FC<{t: number; a: V2; b: V2}> = ({t, a, b}) => {
  const st = scissorsState(t, a, b);
  if (!st) return null;
  const m = SP.scissors;
  const sc = 230 / m.w;
  return (
    <Img
      src={f('scissors.png')}
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        width: m.w,
        height: m.h,
        transformOrigin: '0 0',
        transform: `translate(${st.p[0]}px, ${st.p[1]}px) rotate(${st.rot}deg) scale(${-sc}, ${sc * st.sq}) translate(${-SCI_CUT[0]}px, ${-SCI_CUT[1]}px)`,
      }}
    />
  );
};
export const _u = [ei, mix];
