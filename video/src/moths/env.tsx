import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Cam, INK, Layer, Obj, Pic, clamp, lerp, rnd, seg, spring, E} from './lib';

// world constants shared by every shot (2.5D: far band Z 2600, mid band Z 1800, near band / actors Z 1000)
export const GROUND = {near: 1560, mid: 1644, far: 1740};
export const LAMP_S = 0.348; // lamp sprite px -> world

// ---------------- sky + stars (screen space / very far) ----------------
export const Sky: React.FC<{glow?: number}> = ({glow = 0}) => (
  <AbsoluteFill>
    <AbsoluteFill style={{background: 'linear-gradient(180deg, #060C22 0%, #0C1A3E 45%, #1B3363 78%, #26457A 100%)'}} />
    {glow > 0.001 && (
      <AbsoluteFill style={{opacity: glow, background: 'radial-gradient(120% 70% at 50% 0%, rgba(120,160,235,0.55) 0%, rgba(80,120,200,0.25) 45%, rgba(0,0,0,0) 75%)'}} />
    )}
  </AbsoluteFill>
);

export const Stars: React.FC<{cam: Cam; t: number}> = ({cam, t}) => (
  <Layer cam={cam} z={8000}>
    {Array.from({length: 70}, (_, i) => {
      const x = -3400 + rnd(i) * 9400, y = -8600 + rnd(i + 100) * 11000;
      const r = 8 * (1.6 + rnd(i + 200) * 2.4); // world radius at Z 8000 (k = 0.125) -> 1.6..4 px on screen
      const tw = 0.5 + 0.5 * Math.sin(2 * Math.PI * (Math.round(2 + rnd(i + 300) * 4) / 29.8) * t + i);
      return <div key={i} style={{position: 'absolute', left: x - r, top: y - r, width: 2 * r, height: 2 * r,
        borderRadius: '50%', background: '#FFF6D8', opacity: tw}} />;
    })}
  </Layer>
);

// ---------------- ground bands, trees, grass ----------------
const Band: React.FC<{top: number; color: string; line?: number}> = ({top, color, line = 0}) => (
  <div style={{position: 'absolute', left: -9000, top, width: 22000, height: 12000, background: color, borderTop: line ? `${line}px solid ${INK}` : undefined}} />
);

export const FarGround: React.FC<{cam: Cam; blur?: number}> = ({cam, blur = 0}) => (
  <>
    <Layer cam={cam} z={2600} blur={blur}>
      {[-1700, 520, 2740, -3920].map((x, i) => (
        <Obj key={i} x={x} y={GROUND.far + 40} s={1.02} w={2214} h={837} ax={1107} ay={797} sx={i % 2 ? -1 : 1}>
          <Pic src="trees_strip.png" w={2214} h={837} />
        </Obj>
      ))}
      <Band top={GROUND.far} color="#15302A" line={12} />
    </Layer>
    <Layer cam={cam} z={1800} blur={blur * 0.6}>
      <Band top={GROUND.mid} color="#1A3A2D" />
      {[[-620, 0.55, 1], [260, 0.45, 3], [1500, 0.5, 4], [2300, 0.42, 0]].map(([x, s, g], i) => (
        <GrassTuft key={i} x={x} y={GROUND.mid + 14} s={s} g={g} />
      ))}
    </Layer>
  </>
);

const GRASS = [[286, 276, 263], [360, 344, 330], [248, 442, 429], [452, 374, 361], [220, 208, 195]];
export const GrassTuft: React.FC<{x: number; y: number; s: number; g: number; flip?: boolean}> = ({x, y, s, g, flip}) => {
  const [w, h, b] = GRASS[g];
  return (
    <Obj x={x} y={y} s={s} w={w} h={h} ax={w / 2} ay={b} sx={flip ? -1 : 1}>
      <Pic src={`grass_${g}.png`} w={w} h={h} />
    </Obj>
  );
};

export const NearBand: React.FC = () => <Band top={GROUND.near} color="#1E4430" />;

export const NearGrass: React.FC<{xs?: number[]}> = ({xs = [-760, -330, 120, 980, 1430, 1900]}) => (
  <>
    {xs.map((x, i) => <GrassTuft key={i} x={x} y={GROUND.near + 22 + (i % 3) * 30} s={0.62 + 0.12 * (i % 2)} g={i % 5} flip={i % 2 === 1} />)}
  </>
);

// ---------------- lamp light ----------------
export const LampGlow: React.FC<{x: number; y: number; a: number}> = ({x, y, a}) =>
  a <= 0.001 ? null : (
    <>
      <div style={{position: 'absolute', left: x - 1500, top: y - 1500, width: 3000, height: 3000, borderRadius: '50%', opacity: a,
        background: 'radial-gradient(circle, rgba(255,214,120,0.17) 0%, rgba(255,190,90,0.07) 32%, rgba(255,190,90,0) 62%)'}} />
      <div style={{position: 'absolute', left: x - 520, top: y - 520, width: 1040, height: 1040, borderRadius: '50%', opacity: a,
        background: 'radial-gradient(circle, rgba(255,236,170,0.45) 0%, rgba(255,214,120,0.17) 40%, rgba(255,214,120,0) 70%)'}} />
    </>
  );
export const LightPool: React.FC<{x: number; a: number}> = ({x, a}) =>
  a <= 0.001 ? null : (
    <div style={{position: 'absolute', left: x - 560, top: GROUND.near - 30, width: 1120, height: 260, borderRadius: '50%', opacity: a,
      background: 'radial-gradient(closest-side, rgba(255,220,130,0.35), rgba(255,220,130,0.12) 60%, rgba(255,220,130,0))'}} />
  );
export const ContactShadow: React.FC<{x: number; y: number; w: number}> = ({x, y, w}) => (
  <div style={{position: 'absolute', left: x - w / 2, top: y - w * 0.09, width: w, height: w * 0.18, borderRadius: '50%',
    background: 'rgba(5,10,8,0.45)', filter: 'blur(3px)'}} />
);

// ---------------- effects ----------------
/** dust / smoke puff: clusters of circles with ONE merged outline (ink circles first, then fills); grows, drifts, shrinks */
export const Puff: React.FC<{x: number; y: number; t: number; t0: number; size: number; color?: string; seed?: number}> = ({x, y, t, t0, size, color = '#D8D0BF', seed = 1}) => {
  const u = t - t0;
  if (u < 0 || u > 0.7) return null;
  const circles = Array.from({length: 9}, (_, i) => {
    const side = i % 2 ? 1 : -1;
    const dx = side * (0.25 + rnd(seed + i) * 0.9) * size * (0.4 + u * 1.3);
    const dy = -(rnd(seed + i + 20) * 0.35 + 0.05) * size * (0.3 + u);
    const grow = seg(u, 0, 0.14, E.out), shrink = 1 - seg(u, 0.25, 0.7, E.in);
    const r = size * (0.11 + rnd(seed + i + 40) * 0.08) * grow * shrink;
    return {cx: x + dx, cy: y + dy, r};
  });
  return (
    <svg style={{position: 'absolute', left: 0, top: 0, width: 1, height: 1, overflow: 'visible'}}>
      {circles.map((c, i) => <circle key={`k${i}`} cx={c.cx} cy={c.cy} r={c.r > 1 ? c.r + 7 : 0} fill={INK} />)}
      {circles.map((c, i) => <circle key={`f${i}`} cx={c.cx} cy={c.cy} r={Math.max(0, c.r)} fill={color} />)}
    </svg>
  );
};

/** three yellow stars circling over a dazed head */
export const DizzyStars: React.FC<{x: number; y: number; t: number; t0: number; t1: number; rx: number}> = ({x, y, t, t0, t1, rx}) => {
  if (t < t0 || t > t1) return null;
  const a = Math.min(seg(t, t0, t0 + 0.15, E.out), 1 - seg(t, t1 - 0.15, t1, E.in));
  return (
    <svg style={{position: 'absolute', left: 0, top: 0, width: 1, height: 1, overflow: 'visible'}}>
      {[0, 1, 2].map((i) => {
        const ph = 2 * Math.PI * 1.1 * (t - t0) + (i * 2 * Math.PI) / 3;
        const sx = x + Math.cos(ph) * rx, sy = y + Math.sin(ph) * rx * 0.3;
        const r = 26 * a * (0.8 + 0.25 * Math.sin(ph));
        const pts = Array.from({length: 10}, (_, k) => {
          const ang = -Math.PI / 2 + (k * Math.PI) / 5, rr = k % 2 ? r * 0.45 : r;
          return `${sx + Math.cos(ang) * rr},${sy + Math.sin(ang) * rr}`;
        }).join(' ');
        return <polygon key={i} points={pts} fill="#FFE066" stroke={INK} strokeWidth={6} strokeLinejoin="round" />;
      })}
    </svg>
  );
};

// ---------------- screen-space overlays ----------------
export const Caption: React.FC<{text: string; t: number; t0: number; t1: number; y: number; size?: number; instant?: boolean}> = ({text, t, t0, t1, y, size = 92, instant}) => {
  if (t < t0 || t > t1) return null;
  const inS = instant ? 1 : spring(t, t0, 2.6, 9);
  const out = 1 - seg(t, t1 - 0.12, t1, E.in);
  const s = inS * out;
  return (
    <div style={{position: 'absolute', left: 60, right: 60, top: y, transform: `translateY(-50%) scale(${s})`, textAlign: 'center',
      fontFamily: '"Inter Display", "Inter", sans-serif', fontWeight: 900, fontSize: size, lineHeight: 1.02, color: '#FFFFFF',
      letterSpacing: 1, textTransform: 'uppercase', WebkitTextStroke: `${size * 0.17}px ${INK}`, paintOrder: 'stroke fill',
      textShadow: `0 ${size * 0.08}px 0 rgba(0,0,0,0.45)`}}>
      {text}
    </div>
  );
};

export const Tag: React.FC<{text: string; t: number; t0: number; t1: number; x: number; y: number; rot: number; bg: string; fg: string; size?: number}> = (p) => {
  if (p.t < p.t0 || p.t > p.t1) return null;
  const s = spring(p.t, p.t0, 2.8, 9) * (1 - seg(p.t, p.t1 - 0.1, p.t1, E.in));
  const size = p.size ?? 54;
  return (
    <div style={{position: 'absolute', left: p.x, top: p.y, transform: `translate(-50%, -50%) rotate(${p.rot}deg) scale(${s})`,
      background: p.bg, color: p.fg, border: `8px solid ${INK}`, borderRadius: 22, padding: '10px 28px 12px',
      fontFamily: '"Inter Display", "Inter", sans-serif', fontWeight: 900, fontSize: size, letterSpacing: 2, whiteSpace: 'nowrap',
      boxShadow: '0 8px 0 rgba(0,0,0,0.4)'}}>
      {p.text}
    </div>
  );
};

/** big red cross that slams down */
export const RedX: React.FC<{x: number; y: number; size: number; t: number; t0: number}> = ({x, y, size, t, t0}) => {
  if (t < t0) return null;
  const u = clamp((t - t0) / 0.13);
  const s = lerp(2.3, 1, E.out(u)) * (1 + 0.06 * Math.sin(Math.min(t - t0, 0.6) * 30) * Math.exp(-(t - t0) * 8));
  const h = size / 2;
  const d = `M ${-h} ${-h} L ${h} ${h} M ${h} ${-h} L ${-h} ${h}`;
  return (
    <svg style={{position: 'absolute', left: x, top: y, width: 1, height: 1, overflow: 'visible', opacity: Math.min(1, u * 3)}}>
      <g transform={`rotate(-6) scale(${s})`}>
        <path d={d} stroke={INK} strokeWidth={size * 0.2 + 22} strokeLinecap="round" />
        <path d={d} stroke="#E8322A" strokeWidth={size * 0.2} strokeLinecap="round" />
        <path d={`M ${-h * 0.82} ${-h * 0.9} L ${-h * 0.4} ${-h * 0.48}`} stroke="#FF8A7E" strokeWidth={size * 0.045} strokeLinecap="round" />
      </g>
    </svg>
  );
};

/** dashed line in screen space */
export const Dashed: React.FC<{pts: {x: number; y: number}[]; t: number; color?: string; width?: number; a?: number}> = ({pts, t, color = '#FFFFFF', width = 9, a = 0.85}) =>
  pts.length < 2 ? null : (
    <svg style={{position: 'absolute', left: 0, top: 0, width: 1080, height: 1920, overflow: 'visible', opacity: a}}>
      <polyline points={pts.map((p) => `${p.x},${p.y}`).join(' ')} fill="none" stroke={INK} strokeWidth={width + 7} strokeDasharray="26 22"
        strokeDashoffset={-t * 90} strokeLinecap="round" strokeLinejoin="round" />
      <polyline points={pts.map((p) => `${p.x},${p.y}`).join(' ')} fill="none" stroke={color} strokeWidth={width} strokeDasharray="26 22"
        strokeDashoffset={-t * 90} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );

/** thick white arrow with outline from (x, y) pointing at angle (deg, 0 = up), length L; label next to it */
export const Arrow: React.FC<{x: number; y: number; ang: number; L: number; s: number; label?: string; labelSide?: 1 | -1}> = ({x, y, ang, L, s, label, labelSide = 1}) => {
  if (s <= 0.001) return null;
  const sh = `M -16 0 L -16 ${-L + 70} L -46 ${-L + 70} L 0 ${-L} L 46 ${-L + 70} L 16 ${-L + 70} L 16 0 Z`;
  return (
    <svg style={{position: 'absolute', left: x, top: y, width: 1, height: 1, overflow: 'visible'}}>
      <g transform={`rotate(${ang}) scale(${s})`}>
        <path d={sh} fill="#FFFFFF" stroke={INK} strokeWidth={10} strokeLinejoin="round" />
        {label && (
          <g transform={`translate(${labelSide * 92} ${-L * 0.62}) rotate(${-ang})`}>
            <text textAnchor="middle" dominantBaseline="middle" fontFamily='"Inter Display", "Inter", sans-serif' fontWeight={900} fontSize={64}
              fill="#FFFFFF" stroke={INK} strokeWidth={12} paintOrder="stroke" style={{letterSpacing: 2}}>{label}</text>
          </g>
        )}
      </g>
    </svg>
  );
};

/** camera viewfinder frame (corners, REC, SLOW-MO) */
export const Viewfinder: React.FC<{t: number; t0: number}> = ({t, t0}) => {
  if (t < t0) return null;
  const s = lerp(1.12, 1, seg(t, t0, t0 + 0.16, E.out));
  const rec = Math.floor((t - t0) * 2.4) % 2 === 0;
  const corner = (x: number, y: number, sx: number, sy: number) => `M ${x} ${y + sy * 130} L ${x} ${y} L ${x + sx * 130} ${y}`;
  const m = 70, top = 230, bot = 1690;
  return (
    <AbsoluteFill style={{transform: `scale(${s})`}}>
      <svg width={1080} height={1920} style={{position: 'absolute'}}>
        {[[m, top, 1, 1], [1080 - m, top, -1, 1], [m, bot, 1, -1], [1080 - m, bot, -1, -1]].map(([x, y, sx, sy], i) => (
          <g key={i}>
            <path d={corner(x, y, sx, sy)} fill="none" stroke={INK} strokeWidth={20} strokeLinecap="round" strokeLinejoin="round" />
            <path d={corner(x, y, sx, sy)} fill="none" stroke="#FFFFFF" strokeWidth={10} strokeLinecap="round" strokeLinejoin="round" />
          </g>
        ))}
        <circle cx={m + 46} cy={top + 76} r={20} fill={rec ? '#FF3B30' : 'rgba(255,59,48,0.25)'} stroke={INK} strokeWidth={5} />
        <text x={m + 82} y={top + 92} fontFamily='"Inter Display", "Inter", sans-serif' fontWeight={900} fontSize={48} fill="#FFFFFF" stroke={INK} strokeWidth={9} paintOrder="stroke">REC</text>
        <text x={1080 - m - 30} y={top + 92} textAnchor="end" fontFamily='"Inter Display", "Inter", sans-serif' fontWeight={900} fontSize={48} fill="#FFFFFF" stroke={INK} strokeWidth={9} paintOrder="stroke">SLOW-MO</text>
        <path d="M 520 960 L 560 960 M 540 940 L 540 980" stroke="rgba(255,255,255,0.7)" strokeWidth={5} />
      </svg>
    </AbsoluteFill>
  );
};
