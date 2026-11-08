import React from 'react';
import {Img, staticFile} from 'remotion';

export const FPS = 60;
export const W = 1080;
export const H = 1920;
export const IMG = (n: string) => staticFile(`why-you-see-stars/img/${n}`);
export const FONT = 'InterBlack, "Inter Display", sans-serif';

export const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a: number, b: number, u: number) => a + (b - a) * u;
export const seg = (t: number, t0: number, t1: number) => clamp((t - t0) / (t1 - t0));
export const easeInOut = (u: number) => (u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2);
export const easeOut = (u: number) => 1 - Math.pow(1 - u, 3);
export const easeIn = (u: number) => u * u * u;
/** eased 0..1 between t0 and t1 */
export const ramp = (t: number, t0: number, t1: number, e: (u: number) => number = easeInOut) => e(seg(t, t0, t1));
/** damped spring step: 0 before t0, settles at 1 with overshoot */
export const springStep = (t: number, t0: number, freq = 3, damp = 6) =>
	t < t0 ? 0 : 1 - Math.exp(-damp * (t - t0)) * Math.cos(2 * Math.PI * freq * (t - t0));
/** decaying wobble around 0 */
export const wob = (t: number, t0: number, amp: number, freq = 5, damp = 5) =>
	t < t0 ? 0 : amp * Math.exp(-damp * (t - t0)) * Math.sin(2 * Math.PI * freq * (t - t0));
/** pop in (0 -> overshoot -> 1) and optionally pop out (1 -> 0 with anticipation) */
export const pop = (t: number, tin: number, tout = 1e9) => {
	const i = clamp(springStep(t, tin, 2.6, 7.5), 0, 2);
	if (t < tout) return i;
	const u = seg(t, tout, tout + 0.22);
	return i * (u < 0.35 ? 1 + 0.12 * Math.sin((u / 0.35) * Math.PI) : 1 - easeIn((u - 0.35) / 0.65));
};
/** screen shake = sums of sines (never random jumps) */
export const shake = (t: number, amp: number): [number, number] => [
	amp * (Math.sin(t * 2 * Math.PI * 13.3) + 0.6 * Math.sin(t * 2 * Math.PI * 7.1 + 1.3)),
	amp * (Math.sin(t * 2 * Math.PI * 11.7 + 0.7) + 0.6 * Math.sin(t * 2 * Math.PI * 5.3 + 2.1)),
];
/** deterministic pseudo random 0..1 */
export const rnd = (i: number) => {
	const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
	return x - Math.floor(x);
};

/**
 * A box in sprite pixels. The pivot (px,py) in sprite px lands on (x,y) in the parent's units; s = parent units per sprite px.
 * Children are laid out in sprite px (images use left/top/width/height in sprite px).
 */
export const Box: React.FC<{
	w: number; h: number; s: number; x: number; y: number; px?: number; py?: number;
	rot?: number; sx?: number; sy?: number; style?: React.CSSProperties; children?: React.ReactNode;
}> = ({w, h, s, x, y, px = 0, py = 0, rot = 0, sx = 1, sy = 1, style, children}) => (
	<div
		style={{
			position: 'absolute', left: x - px * s, top: y - py * s, width: w * s, height: h * s,
			transformOrigin: `${px * s}px ${py * s}px`, transform: `rotate(${rot}deg) scale(${sx},${sy})`, ...style,
		}}
	>
		<div style={{position: 'absolute', left: 0, top: 0, width: w, height: h, transformOrigin: '0 0', transform: `scale(${s})`}}>
			{children}
		</div>
	</div>
);

export const Pic: React.FC<{src: string; w: number; h: number; x?: number; y?: number; style?: React.CSSProperties}> = ({src, w, h, x = 0, y = 0, style}) => (
	<Img src={IMG(src)} style={{position: 'absolute', left: x, top: y, width: w, height: h, display: 'block', ...style}} />
);

export const Svg: React.FC<{w: number; h: number; children?: React.ReactNode; style?: React.CSSProperties}> = ({w, h, children, style}) => (
	<svg viewBox={`0 0 ${w} ${h}`} width={w} height={h} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible', ...style}}>
		{children}
	</svg>
);

/** 2.5D multiplane layer: world point P shows at 540 + k (P - cam), k = 1000 / (z - cam.z) */
export type Cam = {x: number; y: number; z: number};
export const Layer: React.FC<{cam: Cam; z: number; blur?: number; minDepth?: number; children?: React.ReactNode}> = ({cam, z, blur = 0, minDepth = 250, children}) => {
	const d = z - cam.z;
	if (d < minDepth) return null;
	const k = 1000 / d;
	return (
		<div style={{position: 'absolute', inset: 0, filter: blur > 0.05 ? `blur(${blur}px)` : undefined}}>
			<div style={{position: 'absolute', left: 0, top: 0, transformOrigin: '0 0', transform: `translate(540px, 960px) scale(${k}) translate(${-cam.x}px, ${-cam.y}px)`}}>
				{children}
			</div>
		</div>
	);
};

/** n-point star path centred at 0,0 */
export const starPath = (r: number, inner: number, n = 5, rot = -90) => {
	let d = '';
	for (let i = 0; i < n * 2; i++) {
		const rr = i % 2 === 0 ? r : r * inner;
		const a = ((rot + (i * 180) / n) * Math.PI) / 180;
		d += `${i === 0 ? 'M' : 'L'}${(rr * Math.cos(a)).toFixed(2)},${(rr * Math.sin(a)).toFixed(2)}`;
	}
	return d + 'Z';
};
/** 4-point sparkle with concave sides */
export const sparklePath = (r: number) => {
	const q = r * 0.18;
	return `M0,${-r} Q${q},${-q} ${r},0 Q${q},${q} 0,${r} Q${-q},${q} ${-r},0 Q${-q},${-q} 0,${-r}Z`;
};

/** outlined cartoon text (SVG so the stroke sits under the fill) */
export const OText: React.FC<{x: number; y: number; size: number; fill?: string; stroke?: string; sw?: number; children: React.ReactNode; anchor?: 'middle' | 'start' | 'end'}> = ({
	x, y, size, fill = '#fff', stroke = '#111', sw, children, anchor = 'middle',
}) => (
	<text x={x} y={y} fontFamily={FONT} fontWeight={900} fontSize={size} textAnchor={anchor} dominantBaseline="middle" fill={fill} stroke={stroke}
		strokeWidth={sw ?? size * 0.14} strokeLinejoin="round" paintOrder="stroke" letterSpacing={size * 0.01}>
		{children}
	</text>
);

/** sweat drop: light-blue teardrop with outline + glint, pointing up */
export const SweatDrop: React.FC<{x: number; y: number; r: number; rot?: number; sc?: number}> = ({x, y, r, rot = 0, sc = 1}) =>
	sc <= 0.01 ? null : (
		<g transform={`translate(${x},${y}) rotate(${rot}) scale(${sc})`}>
			<path d={`M0,${-2.2 * r} C${0.5 * r},${-1.2 * r} ${r},${-0.5 * r} ${r},0 A${r},${r} 0 1 1 ${-r},0 C${-r},${-0.5 * r} ${-0.5 * r},${-1.2 * r} 0,${-2.2 * r}Z`}
				fill="#8FD3FF" stroke="#111" strokeWidth={r * 0.22} strokeLinejoin="round" />
			<ellipse cx={-0.35 * r} cy={-0.1 * r} rx={0.18 * r} ry={0.32 * r} fill="#fff" />
		</g>
	);
