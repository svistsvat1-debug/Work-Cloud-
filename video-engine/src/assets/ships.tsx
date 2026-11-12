// Side-view ship silhouettes, flat 2-3 tone with rim light. Drawn bow-right in a 1000-unit box,
// waterline at y=0. Recognizable by shape, simplified. Japanese/US/other navies by outline only (no ensigns).
import React from 'react';
import {useShot, wave} from '../engine/core';

export type ShipKind =
  | 'destroyer'
  | 'carrierKatsuragi'
  | 'carrierHosho'
  | 'nagato'
  | 'missouri'
  | 'minesweeper'
  | 'tug'
  | 'transport'
  | 'landingCraft'
  | 'cargo';

type Parts = {hull: string; deck?: string; upper: string[]; guns?: string[]; masts?: string[]; light?: string[]; windows?: [number, number][]};

const P: Record<ShipKind, Parts> = {
  destroyer: {
    hull: 'M14 0 L0 -46 L610 -50 L630 -60 L1000 -74 L958 0 Z',
    upper: [
      'M640 -60 L642 -118 L700 -122 L712 -150 L748 -150 L762 -120 L772 -64 Z', // bridge
      'M520 -52 L527 -140 L566 -140 L572 -52 Z', // fwd funnel
      'M420 -50 L428 -128 L462 -128 L468 -50 Z', // aft funnel
      'M250 -48 L255 -76 L380 -76 L384 -48 Z', // aft deckhouse / torpedo
    ],
    guns: ['M840 -70 L846 -96 L900 -96 L908 -70 Z', 'M150 -47 L156 -74 L210 -74 L216 -47 Z', 'M215 -55 L221 -84 L262 -84 L266 -55 Z'],
    masts: ['M726 -150 L728 -250 L732 -250 L734 -150 Z', 'M330 -76 L331 -170 L335 -170 L336 -76 Z'],
    light: ['M0 -46 L610 -50 L630 -60 L1000 -74'],
  },
  carrierKatsuragi: {
    hull: 'M26 0 L0 -64 L1000 -74 L955 0 Z',
    deck: 'M-30 -84 L1030 -94 L1030 -106 L-30 -96 Z',
    upper: [
      'M640 -104 L646 -160 L706 -164 L712 -104 Z', // small island
      'M560 -74 L570 -100 L600 -100 L600 -74 Z',
      'M120 -66 L130 -86 L900 -92 L900 -72 Z', // hangar sides
    ],
    masts: ['M674 -164 L676 -230 L680 -230 L682 -164 Z'],
    light: ['M-30 -96 L1030 -106'],
    windows: [[200, -78], [260, -78], [320, -79], [380, -79], [440, -80], [500, -80], [740, -82], [800, -83]],
  },
  carrierHosho: {
    hull: 'M30 0 L0 -56 L1000 -64 L950 0 Z',
    deck: 'M-10 -72 L990 -80 L990 -90 L-10 -84 Z',
    upper: ['M150 -60 L160 -74 L860 -78 L860 -64 Z'],
    masts: ['M700 -90 L702 -150 L706 -150 L708 -90 Z'],
    light: ['M-10 -84 L990 -90'],
    windows: [[220, -68], [300, -68], [380, -69], [460, -69], [540, -70], [620, -71]],
  },
  nagato: {
    hull: 'M20 0 L0 -54 L1000 -66 L952 0 Z',
    upper: [
      'M380 -56 L384 -96 L640 -100 L646 -60 Z', // citadel
      // pagoda mast: stacked platforms narrowing
      'M560 -100 L556 -150 L612 -152 L610 -100 Z',
      'M552 -150 L548 -175 L620 -177 L616 -151 Z',
      'M560 -176 L562 -215 L604 -216 L606 -177 Z',
      'M548 -215 L550 -232 L618 -233 L616 -216 Z',
      'M564 -232 L568 -270 L600 -271 L602 -233 Z',
      'M556 -270 L560 -284 L610 -285 L606 -271 Z',
      'M572 -284 L576 -312 L594 -312 L598 -285 Z',
      // funnel (trunked, raked)
      'M470 -98 L480 -190 L530 -194 L528 -100 Z',
      'M474 -190 L470 -200 L536 -204 L532 -194 Z',
    ],
    guns: [
      'M770 -64 L778 -96 L860 -98 L866 -64 Z', // A turret
      'M686 -100 L692 -130 L760 -132 L766 -102 Z', // B turret (superfiring)
      'M290 -96 L296 -126 L364 -128 L368 -98 Z', // X
      'M200 -56 L208 -88 L290 -90 L294 -58 Z', // Y
    ],
    masts: ['M240 -90 L244 -210 L250 -210 L254 -90 Z', 'M586 -312 L588 -360 L590 -360 L592 -312 Z'],
    light: ['M0 -54 L1000 -66'],
  },
  missouri: {
    hull: 'M14 0 L0 -50 L1000 -68 L960 0 Z',
    upper: [
      'M420 -56 L424 -96 L700 -104 L704 -62 Z',
      'M590 -104 L594 -170 L650 -172 L654 -104 Z', // tower
      'M600 -170 L604 -210 L640 -211 L644 -171 Z',
      'M500 -96 L506 -160 L548 -160 L552 -98 Z', // funnel 1
      'M440 -96 L446 -150 L484 -150 L488 -96 Z', // funnel 2
    ],
    guns: ['M800 -64 L806 -94 L880 -96 L886 -66 Z', 'M720 -100 L726 -128 L790 -130 L796 -104 Z', 'M240 -54 L246 -84 L320 -86 L326 -56 Z'],
    masts: ['M620 -211 L622 -290 L626 -290 L628 -211 Z'],
    light: ['M0 -50 L1000 -68'],
  },
  minesweeper: {
    hull: 'M24 0 L0 -60 L1000 -78 L945 0 Z',
    upper: [
      'M560 -72 L566 -150 L700 -152 L708 -74 Z', // wheelhouse
      'M580 -150 L584 -172 L690 -172 L694 -150 Z',
      'M440 -68 L448 -128 L486 -128 L492 -68 Z', // funnel
      'M80 -62 L84 -150 L92 -150 L96 -62 Z', // stern A-frame leg
      'M160 -64 L150 -150 L158 -150 L170 -64 Z',
    ],
    masts: ['M640 -172 L642 -300 L646 -300 L648 -172 Z', 'M84 -150 L158 -150 L158 -144 L84 -144 Z'],
    light: ['M0 -60 L1000 -78'],
    windows: [[600, -126], [632, -126], [664, -126]],
  },
  tug: {
    hull: 'M40 0 L0 -70 L1000 -110 L900 0 Z',
    upper: ['M360 -80 L370 -210 L640 -214 L650 -90 Z', 'M470 -214 L478 -310 L540 -310 L546 -214 Z'],
    masts: ['M600 -214 L602 -360 L608 -360 L610 -214 Z'],
    light: ['M0 -70 L1000 -110'],
    windows: [[420, -170], [480, -170], [560, -172]],
  },
  transport: {
    hull: 'M20 0 L0 -80 L1000 -96 L950 0 Z',
    upper: ['M360 -86 L364 -150 L700 -156 L704 -90 Z', 'M440 -150 L446 -200 L640 -204 L644 -152 Z', 'M500 -204 L508 -270 L560 -270 L566 -204 Z'],
    masts: ['M200 -84 L202 -230 L206 -230 L208 -84 Z', 'M820 -92 L822 -240 L826 -240 L828 -92 Z'],
    light: ['M0 -80 L1000 -96'],
    windows: [[400, -120], [440, -120], [480, -121], [520, -122], [560, -122], [600, -123], [640, -124], [480, -176], [540, -178], [600, -180]],
  },
  cargo: {
    hull: 'M20 0 L0 -70 L1000 -84 L950 0 Z',
    upper: ['M560 -78 L564 -160 L680 -164 L684 -82 Z', 'M600 -164 L606 -220 L650 -220 L656 -164 Z'],
    masts: ['M260 -72 L262 -220 L266 -220 L268 -72 Z', 'M840 -82 L842 -220 L846 -220 L848 -82 Z'],
    light: ['M0 -70 L1000 -84'],
  },
  landingCraft: {
    hull: 'M0 0 L0 -90 L760 -90 L1000 -60 L1000 0 Z',
    upper: ['M40 -90 L40 -150 L160 -150 L170 -90 Z'],
    light: ['M0 -90 L760 -90 L1000 -60'],
  },
};

const GUN_BARRELS: Partial<Record<ShipKind, [number, number, number, number][]>> = {
  // x, y, length, thickness (barrels point to bow unless negative length)
  destroyer: [[900, -86, 70, 6], [212, -64, -60, 6], [262, -72, -50, 5]],
  nagato: [[860, -84, 110, 8], [860, -76, 110, 8], [760, -118, 100, 8], [760, -110, 100, 8], [292, -116, -100, 8], [292, -108, -100, 8], [204, -76, -110, 8], [204, -68, -110, 8]],
  missouri: [[880, -82, 120, 7], [880, -76, 120, 7], [790, -118, 110, 7], [790, -112, 110, 7], [242, -72, -120, 7], [242, -66, -120, 7]],
};

export const Ship: React.FC<{
  kind: ShipKind;
  x: number;
  y: number;
  len: number;
  color?: string; // main silhouette
  shade?: string; // hull lower tone
  rim?: string; // rim light color (edge facing light)
  flip?: boolean; // bow left
  roll?: number; // degrees of gentle roll
  speed?: number; // px/s horizontal travel
  windowsLit?: string; // warm lamp color, if lit
  guns?: boolean; // false = guns removed (ferry)
  wake?: string;
  listDeg?: number; // static list (sinking ship)
  sinkY?: number;
  opacity?: number;
}> = ({kind, x, y, len, color = '#1b1d26', shade, rim, flip = false, roll = 0.6, speed = 0, windowsLit, guns = true, wake, listDeg = 0, sinkY = 0, opacity = 1}) => {
  const {t} = useShot();
  const s = len / 1000;
  const p = P[kind];
  const r = roll * wave(t, 5.5) + listDeg;
  const bob = 2 * wave(t, 4.2, 0.3);
  const xx = x + (flip ? -1 : 1) * speed * t;
  const barrels = guns ? GUN_BARRELS[kind] ?? [] : [];
  return (
    <g transform={`translate(${xx} ${y + bob + sinkY}) scale(${flip ? -s : s} ${s}) rotate(${r} 500 -40)`} opacity={opacity}>
      {wake && (
        <g fill={wake} opacity={0.5}>
          <path d={`M-40 2 Q-300 10 -700 6 L-700 14 Q-300 22 0 10 Z`} opacity={speed ? 0.8 : 0.3} />
          <path d="M920 0 Q980 6 1040 2 L1040 8 Q980 12 920 6Z" />
        </g>
      )}
      {/* soft reflection in the water */}
      <path d={p.hull} fill={color} opacity={0.28} transform="scale(1 -0.6)" />
      <path d={p.hull} fill={color} />
      {p.deck && <path d={p.deck} fill={color} />}
      {p.upper.map((d, i) => (
        <path key={i} d={d} fill={color} />
      ))}
      {guns && p.guns?.map((d, i) => <path key={`g${i}`} d={d} fill={color} />)}
      {barrels.map(([bx, by, bl, bt], i) => (
        <rect key={`b${i}`} x={bl > 0 ? bx : bx + bl} y={by} width={Math.abs(bl)} height={bt} fill={color} />
      ))}
      {p.masts?.map((d, i) => (
        <path key={`m${i}`} d={d} fill={color} />
      ))}
      {rim && p.light?.map((d, i) => <path key={`l${i}`} d={d} fill="none" stroke={rim} strokeWidth={4 / s > 10 ? 10 : 4 / s} strokeOpacity={0.55} />)}
      {windowsLit &&
        p.windows?.map(([wx, wy], i) => <rect key={`w${i}`} x={wx} y={wy} width={14} height={9} fill={windowsLit} opacity={0.85 * (0.85 + 0.15 * wave(t, 3 + (i % 3), i * 0.2))} />)}
    </g>
  );
};

/** horned contact sea mine, moored by a chain; `float` = surface bobbing */
export const Mine: React.FC<{x: number; y: number; r?: number; color?: string; rim?: string; chain?: number; float?: boolean; seed?: number}> = ({
  x,
  y,
  r = 60,
  color = '#1c2224',
  rim = '#8fb3b5',
  chain = 0,
  float = false,
  seed = 0,
}) => {
  const {t} = useShot();
  const dy = float ? 6 * wave(t, 3.1, seed * 0.17) : 4 * wave(t, 6, seed * 0.13);
  const rot = (float ? 4 : 2) * wave(t, 4.4, seed * 0.29);
  const horns = [-70, -35, 0, 35, 70, 110, -110];
  return (
    <g transform={`translate(${x} ${y + dy}) rotate(${rot})`}>
      {chain > 0 && (
        <g stroke={color} strokeWidth={r * 0.06} fill="none" opacity={0.9}>
          {Array.from({length: Math.ceil(chain / (r * 0.25))}).map((_, i) => (
            <ellipse key={i} cx={0} cy={r + i * r * 0.25} rx={r * 0.06} ry={r * 0.12} transform={i % 2 ? `rotate(90 0 ${r + i * r * 0.25})` : undefined} />
          ))}
        </g>
      )}
      {horns.map((a, i) => (
        <g key={i} transform={`rotate(${a})`}>
          <rect x={-r * 0.07} y={-r * 1.28} width={r * 0.14} height={r * 0.36} rx={r * 0.04} fill={color} />
          <circle cx={0} cy={-r * 1.28} r={r * 0.09} fill={color} />
        </g>
      ))}
      <circle cx={0} cy={0} r={r} fill={color} />
      <path d={`M${-r * 0.8} ${-r * 0.55} A${r} ${r} 0 0 1 ${r * 0.55} ${-r * 0.82}`} fill="none" stroke={rim} strokeWidth={r * 0.07} strokeOpacity={0.5} strokeLinecap="round" />
      <rect x={-r} y={-r * 0.06} width={r * 2} height={r * 0.12} fill="#000" opacity={0.25} />
    </g>
  );
};
