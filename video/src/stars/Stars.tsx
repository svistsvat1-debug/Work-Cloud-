import React, {useEffect, useState} from 'react';
import {AbsoluteFill, Audio, Sequence, continueRender, delayRender, staticFile, useCurrentFrame} from 'remotion';
import data from './sprites.json';
import {
	Box, Cam, FONT, FPS, IMG, Layer, OText, Pic, Svg, SweatDrop, clamp, easeIn, easeInOut, easeOut, lerp, pop, ramp, rnd, seg,
	shake, sparklePath, springStep, starPath, wob,
} from './lib';
import {CUES} from './cues';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const M: any = data;

/** voice placed at V; every beat = word time from the forced alignment + V */
export const V = 0.1;
export const STARS_FRAMES = Math.round(30.5 * FPS);
const T = {
	jump: 0.4, land: 0.8, fight: 1.05,
	cut2: 2.62, half: 4.08, liter: 4.49, drops: 5.29, legs: 6.45, pressure: 6.78, dips: 7.22, less: 8.0, head: 9.09,
	cut3: 9.8, glitch: 11.33, dazed: 11.62,
	cut4: 12.5, sparks: 12.58, tunnel: 13.7,
	cut5: 15.1, toPilot: 16.45, grey: 17.98,
	cut6: 18.85, sensors: 19.33, catch: 20.63, drop: 21.0,
	cut7: 21.7, vessels: 22.76,
	cut8: 23.85, vision: 24.13, back: 24.7,
	cut9: 25.3, you: 26.47, happens: 27.15, faint: 28.36, tell: 29.15, doctor: 29.43,
};

// ---------------------------------------------------------------------------------------------- global tunnel / grey
const tunnelR = (t: number): number | null => {
	if (t < T.tunnel || (t >= T.cut6 && t < T.cut8) || t >= T.cut9) return null;
	if (t < T.cut5) return lerp(1500, 470, ramp(t, T.tunnel, 14.7));
	if (t < T.toPilot) return lerp(470, 560, ramp(t, T.cut5, 15.7));
	if (t < T.cut6) return lerp(520, 330, ramp(t, 17.55, 18.45));
	return lerp(330, 1700, ramp(t, T.vision, 24.9, easeOut));
};
const Tunnel: React.FC<{t: number}> = ({t}) => {
	const r0 = tunnelR(t);
	if (r0 === null || r0 > 1650) return null;
	const r = r0 * (1 + 0.025 * Math.sin(t * 2 * Math.PI * 1.1));
	return (
		<AbsoluteFill
			style={{background: `radial-gradient(ellipse ${r}px ${r * 1.3}px at 50% 46%, rgba(86,88,96,0) 0%, rgba(86,88,96,0) 52%, rgba(86,88,96,0.97) 100%)`}}
		/>
	);
};

// ---------------------------------------------------------------------------------------------- S1 living room
const S1: React.FC<{t: number}> = ({t}) => {
	const room = M['10_room'], sofa = M['09_sofa'], sit = M['02_sit'], dz = M['03_dizzy'];
	const u = ramp(t, 0.85, 2.15);
	const cam: Cam = {x: lerp(540, 525, u), y: lerp(960, 1085, u), z: lerp(0, 420, u)};
	const sRoom = 3300 / room.w;
	const sSofa = 1.222;
	const sofaTL = {x: 540 - 703.5 * sSofa, y: 2120 - 714 * sSofa};
	const DY = 70;
	const sitTL = {x: sofaTL.x + 329 * sSofa, y: sofaTL.y + (24 - 398 + DY) * sSofa};
	const sD = (sit.head[2] * sSofa) / dz.head[2];
	const startHead = {x: sitTL.x + sit.head[0] * sSofa, y: sitTL.y + sit.head[1] * sSofa};
	const fx = (dz.feet[0] - dz.head[0]) * sD, fy = (dz.feet[1] - dz.head[1]) * sD;
	const startFeet = {x: startHead.x + fx, y: startHead.y + fy};
	const endFeet = {x: 600, y: 1905};
	const blur = 2.6 * ramp(t, 0.9, 1.6);
	const jumping = t >= T.jump;
	const uj = seg(t, T.jump, T.land);
	const feet = jumping
		? {x: lerp(startFeet.x, endFeet.x, easeInOut(uj)), y: lerp(startFeet.y, endFeet.y, uj) - 430 * 4 * uj * (1 - uj)}
		: startFeet;
	const zj = lerp(1990, 1350, easeOut(uj));
	// pose
	const breath = 1 + 0.009 * Math.sin(t * 2 * Math.PI * 0.6);
	const antic = ramp(t, 0.22, T.jump, easeOut);
	const land = t >= T.land ? Math.exp(-7 * (t - T.land)) * Math.cos(2 * Math.PI * 3 * (t - T.land)) : 0;
	const syJ = t < T.land ? 1 + 0.1 * (1 - uj) * (uj < 0.6 ? 1 : 0) : 1 - 0.13 * land;
	const sxJ = t < T.land ? 1 - 0.05 * (1 - uj) : 1 + 0.09 * land;
	const sway = t >= T.land ? 4.5 * Math.sin(2 * Math.PI * 0.85 * (t - T.land)) * ramp(t, T.land, 1.25) : 0;
	const rotJ = t < T.land ? -9 * Math.sin(Math.PI * uj) : sway + wob(t, T.land, 3, 3, 5);
	// stars orbit (sprite px of the dizzy pose)
	const hx = dz.head[0], hy = dz.head[1], hr = dz.head[2];
	const stars = [0, 1, 2, 3, 4].map((i) => {
		const a = t * 2 * Math.PI * 0.75 + (i * 2 * Math.PI) / 5;
		const sc = pop(t, T.land + 0.05 + i * 0.06);
		return {x: hx + Math.cos(a) * hr * 1.2, y: hy - hr * 1.32 + Math.sin(a) * hr * 0.24, front: Math.sin(a) > 0, sc, rot: t * 160 + i * 40};
	});
	const starEl = (front: boolean) =>
		stars.filter((s) => s.front === front).map((s, i) => (
			<g key={i} transform={`translate(${s.x},${s.y}) rotate(${s.rot}) scale(${s.sc})`}>
				<path d={starPath(78, 0.45)} fill="#FFD54A" stroke="#111" strokeWidth={13} strokeLinejoin="round" />
			</g>
		));
	const shadowSc = jumping ? clamp(1 - 4 * uj * (1 - uj) * 0.8, 0.2, 1) : 1;
	const vig = ramp(t, T.land, 1.25) * (0.55 + 0.25 * Math.sin(t * 2 * Math.PI * 1.2));
	return (
		<AbsoluteFill style={{background: '#FDE3CB'}}>
			<Layer cam={cam} z={3000} blur={blur * 1.2}>
				<Box w={room.w} h={room.h} s={sRoom} x={540} y={960} px={room.w / 2} py={room.h / 2}>
					<Pic src="10_room.jpg" w={room.w} h={room.h} />
				</Box>
			</Layer>
			<Layer cam={cam} z={2000} blur={blur}>
				<Box w={sofa.w} h={sofa.h} s={sSofa} x={sofaTL.x} y={sofaTL.y}>
					<Pic src="09_sofa.png" w={sofa.w} h={sofa.h} />
				</Box>
				{!jumping && (
					<Box w={sit.w} h={sit.h} s={sSofa} x={sitTL.x + (sit.w / 2) * sSofa} y={sitTL.y + sit.bottom * sSofa} px={sit.w / 2} py={sit.bottom}
						sy={breath * (1 - 0.06 * antic)} sx={1 + 0.035 * antic} rot={4 * antic}>
						<Pic src="02_sit.png" w={sit.w} h={sit.h} />
					</Box>
				)}
			</Layer>
			{jumping && (
				<Layer cam={cam} z={zj} minDepth={100}>
					<div style={{position: 'absolute', left: feet.x - 300 * shadowSc, top: endFeet.y - 30 * shadowSc, width: 600 * shadowSc, height: 70 * shadowSc,
						borderRadius: '50%', background: 'rgba(72,54,42,0.26)', filter: 'blur(4px)', display: t < 0.6 ? 'none' : 'block'}} />
					<Box w={dz.w} h={dz.h} s={sD} x={feet.x} y={feet.y} px={dz.feet[0]} py={dz.feet[1]} rot={rotJ} sx={sxJ} sy={syJ * breath}>
						<Svg w={dz.w} h={dz.h}>{starEl(false)}</Svg>
						<Pic src="03_dizzy.png" w={dz.w} h={dz.h} />
						<Svg w={dz.w} h={dz.h}>{starEl(true)}</Svg>
					</Box>
				</Layer>
			)}
			<AbsoluteFill style={{background: `radial-gradient(ellipse 72% 62% at 50% 52%, rgba(95,97,106,0) 60%, rgba(95,97,106,${0.9 * vig}) 100%)`}} />
		</AbsoluteFill>
	);
};

// ---------------------------------------------------------------------------------------------- x-ray scene (S2 + S6)
const XR = M['04_xray'];
const sX = 0.62;
const xrTL = {x: 540 - (XR.w * sX) / 2, y: 230};
const HEART = {x: XR.heart[0] + XR.heart[2] / 2, y: XR.heart[1] + XR.heart[3] / 2};

const Monitor: React.FC<{children?: React.ReactNode}> = ({children}) => (
	<AbsoluteFill style={{background: '#CFE6F7'}}>
		<svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
			<defs>
				<pattern id="grid" width={72} height={72} patternUnits="userSpaceOnUse">
					<path d="M72 0 L0 0 0 72" fill="none" stroke="#B2D2EA" strokeWidth={3} />
				</pattern>
			</defs>
			<rect width={1080} height={1920} fill="url(#grid)" />
		</svg>
		{children}
	</AbsoluteFill>
);
const Brackets: React.FC = () => (
	<svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
		{[[50, 50, 1, 1], [1030, 50, -1, 1], [50, 1870, 1, -1], [1030, 1870, -1, -1]].map(([x, y, a, b], i) => (
			<path key={i} d={`M${x},${y + b * 110} L${x},${y} L${x + a * 110},${y}`} fill="none" stroke="#1B2B3C" strokeWidth={14} strokeLinecap="round" strokeLinejoin="round" />
		))}
		<circle cx={1000} cy={95} r={14} fill="#E53935" stroke="#111" strokeWidth={5} />
	</svg>
);

const XrayFigure: React.FC<{t: number; drain: number; legFill: number; brainPale: number; reveal: number; overlay?: React.ReactNode}> = ({t, drain, legFill, brainPale, reveal, overlay}) => {
	const p = lerp(-10, 52, drain);
	const mask = `linear-gradient(to bottom, rgba(0,0,0,0) ${p}%, #000 ${p + 7}%)`;
	const base = IMG('04_xray_base.png');
	// blood drops falling to the legs while draining
	const drops = Array.from({length: 9}).map((_, i) => {
		const t0 = T.drops + 0.02 + i * 0.12, u = seg(t, t0, t0 + 0.6);
		if (u <= 0 || u >= 1) return null;
		const x1 = i % 2 ? 805 : 600, y1 = 1650 + rnd(i) * 550;
		const x = lerp(HEART.x, x1, easeInOut(u)), y = lerp(HEART.y + 60, y1, u * u);
		const sc = u > 0.85 ? (1 - u) / 0.15 : Math.min(1, u * 6);
		return <SweatDropRed key={i} x={x} y={y} r={30} sc={sc} />;
	});
	return (
		<Box w={XR.w} h={XR.h} s={sX} x={xrTL.x} y={xrTL.y} style={{clipPath: `inset(0 0 ${(1 - reveal) * 100}% 0)`}}>
			<Pic src="04_xray_base.png" w={XR.w} h={XR.h} />
			<Pic src="04_xray_vessels.png" w={XR.w} h={XR.h} style={{WebkitMaskImage: mask, maskImage: mask, WebkitMaskSize: '100% 100%'}} />
			{legFill > 0 && (
				<div style={{position: 'absolute', left: 0, top: 0, width: XR.w, height: XR.h, WebkitMaskImage: `url(${base})`, WebkitMaskSize: '100% 100%', maskImage: `url(${base})`,
					clipPath: 'polygon(380px 0, 1030px 0, 1030px 1605px, 1230px 1605px, 1230px 2475px, 170px 2475px, 170px 1605px, 380px 1605px)'}}>
					<div style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: `${legFill * 46}%`, background: 'rgba(222,38,52,0.42)'}} />
					<div style={{position: 'absolute', left: 0, right: 0, bottom: `${legFill * 46}%`, height: 10, background: 'rgba(255,120,120,0.9)'}} />
				</div>
			)}
			{brainPale > 0 && <Pic src="04_xray_brainpale.png" w={XR.w} h={XR.h} style={{opacity: brainPale}} />}
			<Svg w={XR.w} h={XR.h}>
				{drops}
				{overlay}
			</Svg>
		</Box>
	);
};
const SweatDropRed: React.FC<{x: number; y: number; r: number; sc: number}> = ({x, y, r, sc}) => (
	<g transform={`translate(${x},${y}) rotate(180) scale(${sc})`}>
		<path d={`M0,${-2.2 * r} C${0.5 * r},${-1.2 * r} ${r},${-0.5 * r} ${r},0 A${r},${r} 0 1 1 ${-r},0 C${-r},${-0.5 * r} ${-0.5 * r},${-1.2 * r} 0,${-2.2 * r}Z`}
			fill="#E8323F" stroke="#111" strokeWidth={r * 0.22} strokeLinejoin="round" />
	</g>
);

const S2: React.FC<{t: number}> = ({t}) => {
	const jug = M['12_jug'], g = M['13_gauge'];
	const reveal = ramp(t, T.cut2, T.cut2 + 0.45, (u) => u);
	const drain = ramp(t, T.drops, T.legs);
	const legFill = ramp(t, T.drops + 0.1, T.legs);
	const brainPale = ramp(t, 8.35, 9.0);
	// zoom to the head on "less blood reaches your head"
	const zu = ramp(t, T.less, 8.85);
	const Z = lerp(1, 2.15, zu) * (1 + 0.015 * seg(t, T.cut2, T.less));
	const focus = {x: xrTL.x + 703 * sX, y: xrTL.y + 300 * sX};
	const target = {x: 540, y: lerp(focus.y, 700, zu)};
	const tx = target.x - Z * focus.x, ty = target.y - Z * focus.y;
	// jug
	const jp = pop(t, T.half, 6.62);
	const lv = ramp(t, T.drops, T.legs, (u) => u);
	const L = lerp(jug.liquid[1], jug.liquid[3], lv);
	const jugRot = wob(t, T.half, 6, 3, 4) - 14 * ramp(t, T.drops, 5.6) + 14 * ramp(t, 6.2, 6.5);
	// gauge
	const gp = pop(t, T.pressure, 7.95);
	const [cx, cy, a, b] = g.dial;
	const th = t < T.dips ? 22 + 4 * Math.sin(t * 2 * Math.PI * 1.3) : 22 - 145 * springStep(t, T.dips, 2.0, 4.2);
	const tr = (th * Math.PI) / 180;
	const tip = {x: cx + a * 0.6 * Math.sin(tr), y: cy - b * 0.6 * Math.cos(tr)};
	const tail = {x: cx - a * 0.12 * Math.sin(tr), y: cy + b * 0.12 * Math.cos(tr)};
	const squeezed = t >= T.dips && t < T.dips + 0.38;
	const worried = t >= T.dips + 0.38;
	const look = {x: Math.sin(tr) * 16, y: -Math.cos(tr) * 16};
	const eye = (ex: number, side: number) =>
		squeezed ? (
			<path d={`M${ex - side * 40},${cy + 250} L${ex + side * 30},${cy + 290} L${ex - side * 40},${cy + 330}`} fill="none" stroke="#111" strokeWidth={16} strokeLinecap="round" strokeLinejoin="round" />
		) : (
			<g>
				<ellipse cx={ex} cy={cy + 290} rx={50} ry={74} fill="#fff" stroke="#111" strokeWidth={12} />
				<circle cx={ex + look.x * (worried ? 0.4 : 1)} cy={cy + 290 + (worried ? 22 : look.y)} r={25} fill="#111" />
				{worried && <path d={`M${ex - 50},${cy + 196 + side * 18} Q${ex},${cy + 180} ${ex + 50},${cy + 196 - side * 18}`} fill="none" stroke="#111" strokeWidth={16} strokeLinecap="round" />}
			</g>
		);
	const gaugeShake = t >= T.dips && t < T.dips + 0.5 ? shake(t, 4 * (1 - seg(t, T.dips, T.dips + 0.5))) : [0, 0];
	return (
		<Monitor>
			<div style={{position: 'absolute', left: 0, top: 0, transformOrigin: '0 0', transform: `translate(${tx}px,${ty}px) scale(${Z})`, width: 1080, height: 1920}}>
				<XrayFigure t={t} drain={drain} legFill={legFill} brainPale={brainPale} reveal={reveal}
					overlay={<SweatDrop x={980} y={lerp(170, 250, ramp(t, 8.95, 9.6))} r={34} sc={pop(t, 8.9)} rot={-10} />} />
				{/* scan line */}
				{reveal < 1 && (
					<div style={{position: 'absolute', left: -40, width: 1160, top: xrTL.y + XR.h * sX * reveal - 7, height: 14, background: '#43E3FF', boxShadow: '0 0 0 4px #1B2B3C'}} />
				)}
				{jp > 0.01 && (
					<Box w={jug.w} h={jug.h} s={0.19} x={190} y={440} px={jug.w / 2} py={jug.h / 2} sx={jp} sy={jp} rot={jugRot}>
						<Pic src="12_jug_empty.png" w={jug.w} h={jug.h} />
						<Pic src="12_jug.png" w={jug.w} h={jug.h} style={{clipPath: `inset(${L}px 0 0 0)`}} />
					</Box>
				)}
				{jp > 0.01 && (
					<svg width={1080} height={1920} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
						<g transform={`translate(190,630) scale(${pop(t, T.liter, 6.62)})`}>
							<OText x={0} y={0} size={78}>0.5 L</OText>
						</g>
					</svg>
				)}
				{gp > 0.01 && (
					<Box w={g.w} h={g.h} s={0.222} x={868 + gaugeShake[0]} y={500 + gaugeShake[1]} px={g.w / 2} py={g.h / 2} sx={gp} sy={gp}>
						<Pic src="13_gauge.png" w={g.w} h={g.h} />
						<Svg w={g.w} h={g.h}>
							{eye(cx - 120, 1)}
							{eye(cx + 120, -1)}
							<line x1={tail.x} y1={tail.y} x2={tip.x} y2={tip.y} stroke="#111" strokeWidth={40} strokeLinecap="round" />
							<line x1={tail.x} y1={tail.y} x2={tip.x} y2={tip.y} stroke="#D32F2F" strokeWidth={20} strokeLinecap="round" />
							<ellipse cx={cx} cy={cy} rx={44} ry={56} fill="#333" stroke="#111" strokeWidth={10} />
							<SweatDrop x={cx + 330} y={lerp(cy - 420, cy - 300, ramp(t, 7.6, 8.4))} r={46} sc={pop(t, 7.55)} rot={8} />
						</Svg>
					</Box>
				)}
			</div>
			<Brackets />
		</Monitor>
	);
};

const S6: React.FC<{t: number}> = ({t}) => {
	const [nl, ny, nr] = XR.neck;
	const Z = lerp(2.55, 2.8, ramp(t, T.cut6, T.cut7, (u) => u));
	const focus = {x: xrTL.x + ((nl + nr) / 2) * sX, y: xrTL.y + (ny + 70) * sX};
	const tx = 540 - Z * focus.x, ty = 1000 - Z * focus.y;
	const drain = 1 - ramp(t, T.drop, 21.68);
	const sensors = [
		{x: nl + 38, y: ny + 75, t0: T.sensors + 0.08},
		{x: nr - 38, y: ny + 75, t0: T.sensors + 0.28},
	];
	const alarm = t >= T.catch;
	const blink = alarm ? (Math.floor((t - T.catch) * 8) % 2 === 0 ? '#FF3B3B' : '#FFE0E0') : Math.floor(t * 2.5) % 2 ? '#FFD54A' : '#FFF3B5';
	const overlay = (
		<g>
			{sensors.map((s, i) => {
				const sc = pop(t, s.t0);
				if (sc < 0.01) return null;
				const rings = alarm ? [0, 0.33].map((o, k) => {
					const u = ((t - T.catch + o) % 0.66) / 0.66;
					return <circle key={k} cx={s.x} cy={s.y} r={22 + 60 * u} fill="none" stroke="#E53935" strokeWidth={9 * (1 - u)} />;
				}) : null;
				return (
					<g key={i}>
						{rings}
						<g transform={`translate(${s.x},${s.y}) scale(${sc})`}>
							<line x1={0} y1={-20} x2={i ? 16 : -16} y2={-50} stroke="#111" strokeWidth={6} strokeLinecap="round" />
							<circle cx={i ? 16 : -16} cy={-52} r={9} fill={blink} stroke="#111" strokeWidth={5} />
							<circle cx={0} cy={0} r={24} fill="#FFD54A" stroke="#111" strokeWidth={7} />
							<circle cx={0} cy={0} r={9} fill="#111" />
						</g>
					</g>
				);
			})}
			<g transform={`translate(${nr + 120},${ny + 10}) scale(${pop(t, T.catch + 0.02)}) rotate(${wob(t, T.catch, 10, 4, 4)})`}>
				<OText x={0} y={0} size={120} fill="#FF3B3B">!</OText>
			</g>
		</g>
	);
	return (
		<Monitor>
			<div style={{position: 'absolute', left: 0, top: 0, transformOrigin: '0 0', transform: `translate(${tx}px,${ty}px) scale(${Z})`, width: 1080, height: 1920}}>
				<XrayFigure t={t} drain={drain} legFill={0} brainPale={1 - ramp(t, 21.1, 21.68)} reveal={1} overlay={overlay} />
			</div>
			<Brackets />
		</Monitor>
	);
};

// ---------------------------------------------------------------------------------------------- S3 hungry eyeball
const EYE = M['14_eye'];
const sE = 0.6;
const S3: React.FC<{t: number}> = ({t}) => {
	const [bx, by, br] = EYE.ball;
	const [ix, iy, ir] = EYE.iris;
	const dazed = t >= T.dazed;
	const arrivals = [10.37, 10.67, 10.97, 11.27];
	let gulp = 0;
	for (const ta of arrivals) if (t >= ta) gulp += 0.1 * Math.exp(-8 * (t - ta)) * Math.sin(2 * Math.PI * 3.5 * (t - ta));
	const bob = dazed ? 0 : 10 * Math.sin(t * 2 * Math.PI * 1.8);
	const rot = dazed ? 7 * Math.sin(2 * Math.PI * 0.7 * (t - T.dazed)) * ramp(t, T.dazed, T.dazed + 0.3) : 2 * Math.sin(t * 2 * Math.PI * 0.9);
	const pos = {x: 540, y: 930 + bob};
	const sy = 1 - gulp + wob(t, T.dazed, 0.06, 3, 5), sx = 1 + gulp * 0.7;
	const irisScreen = {x: pos.x + (ix - bx) * sE, y: pos.y + (iy - by) * sE};
	const lid = dazed ? clamp(springStep(t, T.dazed, 2.2, 6), 0, 1.2) : 0;
	const browBounce = dazed ? 0 : -14 * Math.abs(Math.sin(t * 2 * Math.PI * 1.6));
	const spiral = (() => {
		let d = '';
		for (let i = 0; i <= 120; i++) {
			const a = (i / 120) * Math.PI * 2 * 3.3, r = (i / 120) * ir * 0.92;
			d += `${i ? 'L' : 'M'}${(ix + r * Math.cos(a)).toFixed(1)},${(iy + r * Math.sin(a)).toFixed(1)}`;
		}
		return d;
	})();
	const eyeBox = (
		<Box w={EYE.w} h={EYE.h} s={sE} x={pos.x} y={pos.y} px={bx} py={by} rot={rot} sx={sx} sy={sy}>
			<Pic src="14_eye_body.png" w={EYE.w} h={EYE.h} />
			{dazed && (
				<Svg w={EYE.w} h={EYE.h}>
					<defs>
						<clipPath id="ball"><circle cx={bx} cy={by} r={br - 6} /></clipPath>
					</defs>
					<circle cx={ix} cy={iy} r={ir} fill="#8A5634" stroke="#111" strokeWidth={10} />
					<g transform={`rotate(${(t - T.dazed) * 420},${ix},${iy})`}>
						<path d={spiral} fill="none" stroke="#111" strokeWidth={20} strokeLinecap="round" />
					</g>
					<g clipPath="url(#ball)">
						<path d={`M${bx - br - 20},${by - br - 20} L${bx + br + 20},${by - br - 20} L${bx + br + 20},${by - br + lid * br * 0.5 + 40} Q${bx},${by - br + lid * br * 0.5 - 50} ${bx - br - 20},${by - br + lid * br * 0.5 + 40}Z`}
							fill="#D7D9EA" stroke="#111" strokeWidth={18} />
					</g>
				</Svg>
			)}
			{EYE.brows.map((b: {x: number; y: number; w: number; h: number}, i: number) => (
				<Pic key={i} src={`14_eye_brow${i}.png`} w={b.w} h={b.h} x={b.x} y={b.y + browBounce + (dazed ? 40 * lid : 0)}
					style={{transformOrigin: '50% 50%', transform: `rotate(${dazed ? (i ? 16 : -16) * lid : 0}deg)`}} />
			))}
		</Box>
	);
	// glitch: horizontal strips shifted on alternate frames
	const f = Math.round(t * FPS);
	const glitching = t >= T.glitch && t < T.glitch + 0.42 && f % 4 < 3;
	const strips = 6;
	const bubbles = [9.92, 10.22, 10.52, 10.82].map((t0, i) => {
		const u = seg(t, t0, t0 + 0.45);
		if (t < t0 || u >= 1) return null;
		const st = [{x: -90, y: 330}, {x: 1170, y: 260}, {x: -80, y: 1420}, {x: 1160, y: 1380}][i];
		const e = easeIn(u);
		const x = lerp(st.x, irisScreen.x, e) + Math.sin(u * Math.PI) * (i % 2 ? -60 : 60);
		const y = lerp(st.y, irisScreen.y, e);
		const sc = (u > 0.88 ? (1 - u) / 0.12 : 1) * Math.min(1, u * 8);
		return (
			<g key={i} transform={`translate(${x},${y}) scale(${sc})`}>
				<circle r={58} fill="#A8DCFF" stroke="#111" strokeWidth={8} />
				<ellipse cx={-22} cy={-24} rx={12} ry={8} fill="#fff" />
				<text x={-6} y={6} fontFamily={FONT} fontWeight={900} fontSize={50} textAnchor="middle" dominantBaseline="middle" fill="#111">O</text>
				<text x={22} y={22} fontFamily={FONT} fontWeight={900} fontSize={30} textAnchor="middle" dominantBaseline="middle" fill="#111">2</text>
			</g>
		);
	});
	const sparks = t > 12.05 ? [0, 1, 2, 3, 4].map((i) => {
		const t0 = 12.05 + i * 0.08, u = seg(t, t0, t0 + 0.5);
		if (u <= 0 || u >= 1) return null;
		const x = 160 + rnd(i + 3) * 760, y = 380 + rnd(i + 9) * 1100;
		return <path key={i} transform={`translate(${x},${y}) rotate(${u * 90}) scale(${Math.sin(Math.PI * u)})`} d={sparklePath(60)} fill="#FFFBE0" stroke="#111" strokeWidth={6} />;
	}) : null;
	return (
		<AbsoluteFill style={{background: '#FFD8CC'}}>
			<svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
				<circle cx={540} cy={930} r={600} fill="#FFE5DD" />
			</svg>
			{glitching
				? Array.from({length: strips}).map((_, k) => {
					const off = (rnd(f * 7 + k) - 0.5) * 90;
					return (
						<AbsoluteFill key={k} style={{clipPath: `inset(${(k * 100) / strips}% 0 ${100 - ((k + 1) * 100) / strips}% 0)`, transform: `translateX(${off}px)`}}>
							{eyeBox}
						</AbsoluteFill>
					);
				})
				: eyeBox}
			{glitching && (
				<svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
					<rect x={0} y={300 + rnd(f) * 1200} width={1080} height={26} fill="#43E3FF" opacity={0.85} />
					<rect x={0} y={300 + rnd(f + 1) * 1200} width={1080} height={16} fill="#FF4FD8" opacity={0.85} />
				</svg>
			)}
			<svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
				{bubbles}
				{sparks}
			</svg>
		</AbsoluteFill>
	);
};

// ---------------------------------------------------------------------------------------------- POV (S4 + S8)
const POV_SPARKS = Array.from({length: 18}).map((_, i) => ({
	t0: i < 12 ? T.sparks - 0.03 + i * 0.065 + rnd(i) * 0.05 : 13.4 + (i - 12) * 0.22,
	x: 110 + rnd(i * 3 + 1) * 860, y: 260 + rnd(i * 5 + 2) * 1400, r: 45 + rnd(i * 7) * 55,
}));
const Pov: React.FC<{t: number; grey: number; sway: number; sparkGate?: (t0: number) => boolean}> = ({t, grey, sway, sparkGate}) => {
	const pov = M['11_pov'];
	const s = 1080 / pov.w;
	const rot = sway * 1.4 * Math.sin(t * 2 * Math.PI * 0.45);
	const sc = 1.07 + sway * 0.02 * Math.sin(t * 2 * Math.PI * 0.3);
	const dx = sway * 14 * Math.sin(t * 2 * Math.PI * 0.37), dy = sway * 10 * Math.sin(t * 2 * Math.PI * 0.53 + 1);
	return (
		<AbsoluteFill style={{background: '#9aa'}}>
			<AbsoluteFill style={{transform: `translate(${dx}px,${dy}px) rotate(${rot}deg) scale(${sc})`, filter: grey > 0.01 ? `grayscale(${grey}) blur(${grey * 1.6}px)` : undefined}}>
				<Box w={pov.w} h={pov.h} s={s} x={540} y={960} px={pov.w / 2} py={pov.h / 2}>
					<Pic src="11_pov.jpg" w={pov.w} h={pov.h} />
				</Box>
			</AbsoluteFill>
			<svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
				{POV_SPARKS.map((p, i) => {
					if (sparkGate && !sparkGate(p.t0)) return null;
					const u = seg(t, p.t0, p.t0 + 0.42);
					if (u <= 0 || u >= 1) return null;
					return <path key={i} transform={`translate(${p.x},${p.y}) rotate(${u * 120}) scale(${Math.pow(Math.sin(Math.PI * u), 0.6)})`} d={sparklePath(p.r)} fill="#FFFBE0" stroke="#111" strokeWidth={6} />;
				})}
			</svg>
		</AbsoluteFill>
	);
};
const S4: React.FC<{t: number}> = ({t}) => <Pov t={t} grey={0.9 * ramp(t, T.tunnel, 14.6)} sway={1} />;
const S8: React.FC<{t: number}> = ({t}) => {
	// sparks that are still twinkling fade out by shrinking; new ones stop
	const glints = [0, 1, 2].map((i) => {
		const t0 = T.back - 0.05 + i * 0.09, u = seg(t, t0, t0 + 0.5);
		if (u <= 0 || u >= 1) return null;
		const x = [300, 760, 540][i], y = [700, 820, 1180][i];
		return <path key={i} transform={`translate(${x},${y}) rotate(${u * 90}) scale(${Math.sin(Math.PI * u)})`} d={sparklePath(70)} fill="#fff" stroke="#111" strokeWidth={6} />;
	});
	return (
		<AbsoluteFill>
			<Pov t={t} grey={0.9 * (1 - ramp(t, T.vision, 24.8))} sway={1 - ramp(t, T.vision, 24.9)} sparkGate={() => false} />
			<svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>{glints}</svg>
		</AbsoluteFill>
	);
};

// ---------------------------------------------------------------------------------------------- S5 jet + pilot
const JET = M['08_jet'];
const sJ = 0.56;
const JPIV = {x: 687, y: 579};
const phi = (tau: number) => lerp(8, 58, ramp(tau, T.cut5, T.toPilot));
const jetPos = (tau: number) => {
	let x = 0, y = 0;
	const dt = 1 / 120;
	for (let s = T.cut5; s < tau; s += dt) {
		const a = (phi(s) * Math.PI) / 180;
		x += 1350 * Math.cos(a) * dt;
		y -= 1350 * Math.sin(a) * dt;
	}
	return {x, y};
};
const jetRot = (tau: number) => 19.8 - phi(tau);
const camOff = (t: number) => {
	const u = ramp(t, T.cut5, 15.8, easeOut);
	return {x: lerp(560, 0, u), y: lerp(-430, 0, u)};
};
const rotPt = (p: {x: number; y: number}, deg: number) => {
	const a = (deg * Math.PI) / 180;
	return {x: p.x * Math.cos(a) - p.y * Math.sin(a), y: p.x * Math.sin(a) + p.y * Math.cos(a)};
};
const CLOUDS = Array.from({length: 9}).map((_, i) => ({
	tau: T.cut5 + i * 0.17, side: i % 2 ? 1 : -1, d: 380 + rnd(i) * 420, size: 120 + rnd(i + 11) * 120, par: i % 3 === 0 ? 0.55 : 1,
}));
const Cloud: React.FC<{x: number; y: number; size: number}> = ({x, y, size}) => {
	const c = [[-1, 0.1, 0.55], [-0.45, -0.25, 0.7], [0.2, -0.35, 0.8], [0.85, 0, 0.6], [0.1, 0.2, 0.6]];
	return (
		<g transform={`translate(${x},${y})`}>
			{c.map(([cx, cy, r], i) => <circle key={`o${i}`} cx={cx * size} cy={cy * size} r={r * size + 8} fill="#111" />)}
			{c.map(([cx, cy, r], i) => <circle key={`f${i}`} cx={cx * size} cy={cy * size} r={r * size} fill="#fff" />)}
		</g>
	);
};
const S5Jet: React.FC<{t: number}> = ({t}) => {
	const J = jetPos(t);
	const off = camOff(t);
	const C = {x: J.x + off.x, y: J.y + off.y};
	const toS = (p: {x: number; y: number}) => ({x: p.x - C.x + 540, y: p.y - C.y + 960});
	const rot = jetRot(t);
	const jetS = toS(J);
	// contrails from both wingtips
	const tips = [{x: 698, y: 43}, {x: 368, y: 1103}];
	const trails = tips.map((tp, k) => {
		const pts: string[] = [];
		for (let i = 0; i <= 30; i++) {
			const tau = t - i * 0.03;
			if (tau < T.cut5) break;
			const r = rotPt({x: (tp.x - JPIV.x) * sJ, y: (tp.y - JPIV.y) * sJ}, jetRot(tau));
			const jp = jetPos(tau);
			const sp = toS({x: jp.x + r.x, y: jp.y + r.y});
			pts.push(`${sp.x.toFixed(1)},${sp.y.toFixed(1)}`);
		}
		return pts.length > 1 ? (
			<g key={k}>
				<polyline points={pts.join(' ')} fill="none" stroke="#111" strokeWidth={30} strokeLinecap="round" strokeLinejoin="round" />
				<polyline points={pts.join(' ')} fill="none" stroke="#fff" strokeWidth={18} strokeLinecap="round" strokeLinejoin="round" />
			</g>
		) : null;
	});
	// push into the cockpit
	const zu = ramp(t, 16.12, T.toPilot, easeIn);
	const canopy = rotPt({x: (828 - JPIV.x) * sJ, y: (313 - JPIV.y) * sJ}, rot);
	const cs = {x: jetS.x + canopy.x, y: jetS.y + canopy.y};
	const Z = lerp(1, 4.2, zu);
	const tgt = {x: lerp(cs.x, 540, zu), y: lerp(cs.y, 820, zu)};
	return (
		<AbsoluteFill style={{background: 'linear-gradient(#6FC0F2, #CDEEFF)'}}>
			<div style={{position: 'absolute', inset: 0, transformOrigin: '0 0', transform: `translate(${tgt.x - Z * cs.x}px,${tgt.y - Z * cs.y}px) scale(${Z})`}}>
				<svg width={1080} height={1920} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
					{CLOUDS.filter((c) => c.par < 1).map((c, i) => {
						const jp = jetPos(c.tau), a = ((phi(c.tau) + 90) * Math.PI) / 180;
						const w = {x: jp.x + Math.cos(a) * c.d * c.side * 1.6, y: jp.y - Math.sin(a) * c.d * c.side * 1.6};
						return <Cloud key={i} x={(w.x - C.x) * c.par + 540} y={(w.y - C.y) * c.par + 960} size={c.size * 0.7} />;
					})}
					{trails}
				</svg>
				<Box w={JET.w} h={JET.h} s={sJ} x={jetS.x} y={jetS.y} px={JPIV.x} py={JPIV.y} rot={rot}>
					<Pic src="08_jet.png" w={JET.w} h={JET.h} />
				</Box>
				<svg width={1080} height={1920} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
					{CLOUDS.filter((c) => c.par === 1).map((c, i) => {
						const jp = jetPos(c.tau), a = ((phi(c.tau) + 90) * Math.PI) / 180;
						const w = {x: jp.x + Math.cos(a) * c.d * c.side + 500, y: jp.y - Math.sin(a) * c.d * c.side - 300};
						const sp = toS(w);
						return <Cloud key={i} x={sp.x} y={sp.y} size={c.size} />;
					})}
				</svg>
			</div>
		</AbsoluteFill>
	);
};

const PIL = M['07_pilot'];
const S5Pilot: React.FC<{t: number}> = ({t}) => {
	const sP = 0.62;
	const [hx, hy] = PIL.head;
	const g = ramp(t, T.toPilot, 16.75) * (1 - 0.3 * ramp(t, 18.5, 18.85));
	const [shx, shy] = shake(t, 3.2 * g);
	const squash = 1 - 0.045 * g * (0.8 + 0.2 * Math.sin(t * 2 * Math.PI * 2.2));
	const land = wob(t, T.toPilot, 0.05, 3, 6);
	const panelTop = 820 + (1985 - hy) * sP;
	const streaks = Array.from({length: 12}).map((_, i) => {
		const sp = 2600 + rnd(i) * 1400, ph = rnd(i + 20);
		const u = ((t - T.toPilot) * sp / 2600 + ph) % 1;
		const x0 = -300 + rnd(i + 40) * 1700, y0 = -200 + rnd(i + 60) * 2100;
		const x = x0 - u * 1600 + 800, y = y0 + u * 900 - 450;
		return <line key={i} x1={x} y1={y} x2={x + 260} y2={y - 146} stroke="#fff" strokeWidth={10} strokeLinecap="round" opacity={0.9} />;
	});
	const gp = pop(t, T.grey);
	return (
		<AbsoluteFill style={{background: 'linear-gradient(#5DB4EE, #BEE7FF)'}}>
			<AbsoluteFill style={{transform: 'rotate(-10deg) scale(1.3)'}}>
				<svg width={1080} height={1920} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
					{[0, 1, 2].map((i) => {
						const u = ((t - T.toPilot) * 0.9 + i / 3) % 1;
						return <Cloud key={i} x={1500 - u * 2400} y={300 + i * 620 + u * 500} size={150 + i * 40} />;
					})}
					{streaks}
				</svg>
			</AbsoluteFill>
			<div style={{position: 'absolute', inset: 0, transform: `translate(${shx}px,${shy}px)`}}>
				<Box w={PIL.w} h={PIL.h} s={sP} x={540} y={820} px={hx} py={hy} sy={squash - land} sx={1 + (1 - squash) * 0.5 + land * 0.6}>
					<Pic src="07_pilot.png" w={PIL.w} h={PIL.h} />
					<Svg w={PIL.w} h={PIL.h}>
						<SweatDrop x={hx + 560} y={lerp(hy - 120, hy + 120, ramp(t, 17.15, 17.9))} r={44} sc={pop(t, 17.1, 18.6)} rot={-8} />
						<SweatDrop x={hx - 590} y={lerp(hy - 40, hy + 140, ramp(t, 17.45, 18.2))} r={36} sc={pop(t, 17.4, 18.7)} rot={8} />
					</Svg>
				</Box>
			</div>
			{/* cockpit: canopy frame + instrument panel */}
			<svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
				<path d="M-20,250 Q540,40 1100,250 L1100,150 Q540,-60 -20,150Z" fill="#46525E" stroke="#111" strokeWidth={10} />
				<path d={`M-20,${panelTop + 40} Q540,${panelTop - 40} 1100,${panelTop + 40} L1100,1940 L-20,1940Z`} fill="#3E4A57" stroke="#111" strokeWidth={10} />
				{[260, 540, 820].map((x, i) => (
					<g key={i}>
						<circle cx={x} cy={panelTop + 170} r={78} fill="#F3EBD3" stroke="#111" strokeWidth={9} />
						<line x1={x} y1={panelTop + 170} x2={x + 55 * Math.cos(t * (2 + i) + i)} y2={panelTop + 170 + 55 * Math.sin(t * (2 + i) + i)} stroke="#D32F2F" strokeWidth={10} strokeLinecap="round" />
					</g>
				))}
			</svg>
			<svg width={1080} height={1920} style={{position: 'absolute', inset: 0, zIndex: 5}}>
				<g transform={`translate(540,330) rotate(${-4 + wob(t, T.grey, 6, 3, 5)}) scale(${gp})`}>
					<OText x={0} y={0} size={128}>GREY-OUT</OText>
				</g>
			</svg>
		</AbsoluteFill>
	);
};

// ---------------------------------------------------------------------------------------------- S7 heart + vessel
const HRT = M['16_heart'];
const BEATS = [21.78, 22.16, 22.48, 22.76, 23.0, 23.22, 23.43, 23.63, 23.83];
const cellsX = (t: number) => {
	let x = 0;
	for (let s = T.cut7; s < t; s += 1 / 120) x += (280 + 520 * ramp(s, T.vessels, 23.2)) / 120;
	return x;
};
const S7: React.FC<{t: number}> = ({t}) => {
	const [bx, by, br] = HRT.body;
	let beat = 0;
	let lastBeat = -1;
	for (const b of BEATS) {
		if (t >= b) lastBeat = b;
		beat += 0.09 * Math.exp(-Math.pow((t - b - 0.04) / 0.045, 2)) + 0.05 * Math.exp(-Math.pow((t - b - 0.17) / 0.045, 2));
	}
	const sH = 0.5;
	const marks = lastBeat > 0 && t - lastBeat < 0.14 ? 1 - (t - lastBeat) / 0.14 : 0;
	const sq = ramp(t, T.vessels, 23.05, easeOut) * (1 - 0.15 * ramp(t, 23.5, 23.85));
	const outer = lerp(84, 52, sq), inner = lerp(60, 34, sq);
	const vy = 1480;
	const edge = (sgn: number, h: number) => {
		let d = '';
		for (let x = -80; x <= 1160; x += 40) {
			const w = h + Math.sin(x * 0.012 + t * 9) * 4 * sq;
			d += `${x === -80 ? 'M' : 'L'}${x},${vy + sgn * w}`;
		}
		return d;
	};
	const tube = (h: number) => `${edge(-1, h)} ${edge(1, h).replace('M', 'L').split('L').filter(Boolean).reverse().map((p) => 'L' + p).join(' ')}Z`;
	const cx0 = cellsX(t);
	const cells = Array.from({length: 9}).map((_, i) => {
		const x = ((i * 150 + cx0) % 1350) - 100;
		const ys = 1 - 0.35 * sq;
		return (
			<g key={i} transform={`translate(${x},${vy + Math.sin(i * 2.1) * 8 * (1 - sq)}) scale(${1 + 0.12 * sq},${ys})`}>
				<ellipse rx={30} ry={27} fill="#F04A4A" stroke="#111" strokeWidth={6} />
				<ellipse rx={13} ry={10} fill="#C62B37" />
			</g>
		);
	});
	return (
		<AbsoluteFill style={{background: '#FFE1DC'}}>
			<svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
				<circle cx={540} cy={760} r={520} fill="#FFEDEA" />
			</svg>
			<Box w={HRT.w} h={HRT.h} s={sH} x={540} y={760} px={bx} py={by} sx={1 + beat} sy={1 + beat} rot={3 * Math.sin(t * 2 * Math.PI * 1.4)}>
				<Pic src="16_heart.png" w={HRT.w} h={HRT.h} />
				<Svg w={HRT.w} h={HRT.h}>
					{[-1, 1].map((sd) => (
						<g key={sd}>
							<ellipse cx={bx + sd * 0.3 * br} cy={by - 0.1 * br} rx={0.15 * br} ry={0.2 * br} fill="#fff" stroke="#111" strokeWidth={14} />
							<circle cx={bx + sd * 0.3 * br - sd * 8} cy={by - 0.06 * br} r={0.075 * br} fill="#111" />
							<path d={`M${bx + sd * 0.14 * br},${by - 0.3 * br} L${bx + sd * 0.46 * br},${by - 0.4 * br}`} stroke="#111" strokeWidth={30} strokeLinecap="round" />
						</g>
					))}
					<path d={`M${bx - 0.2 * br},${by + 0.18 * br} Q${bx},${by + 0.42 * br} ${bx + 0.2 * br},${by + 0.18 * br}Z`} fill="#6E0F1C" stroke="#111" strokeWidth={14} strokeLinejoin="round" />
					<path d={`M${bx - 0.17 * br},${by + 0.2 * br} L${bx + 0.17 * br},${by + 0.2 * br} L${bx + 0.13 * br},${by + 0.26 * br} L${bx - 0.13 * br},${by + 0.26 * br}Z`} fill="#fff" />
				</Svg>
			</Box>
			<svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
				{marks > 0 && [-1, 1].map((sd) => [-1, 0, 1].map((k) => {
					const a = (sd * (35 + k * 22) * Math.PI) / 180;
					const r0 = 400 + 40 * (1 - marks), r1 = r0 + 70;
					return <line key={`${sd}${k}`} x1={540 + Math.sin(a) * r0} y1={760 - Math.cos(a) * r0 * 0.9} x2={540 + Math.sin(a) * r1} y2={760 - Math.cos(a) * r1 * 0.9} stroke="#111" strokeWidth={14 * marks} strokeLinecap="round" />;
				}))}
				<path d={tube(outer)} fill="#E86A6A" stroke="#111" strokeWidth={10} strokeLinejoin="round" />
				<path d={tube(inner)} fill="#A91E2D" />
				{cells}
				<path d={edge(-1, outer - 12)} fill="none" stroke="#F7A0A0" strokeWidth={8} strokeLinecap="round" />
			</svg>
		</AbsoluteFill>
	);
};

// ---------------------------------------------------------------------------------------------- S9 question + doctor
const PT = M['05_point'];
const S9: React.FC<{t: number}> = ({t}) => {
	const room = M['10_room'];
	const sP = 0.56;
	const breath = 1 + 0.008 * Math.sin(t * 2 * Math.PI * 0.6);
	const bounce = wob(t, T.you, 0.035, 3, 5) + wob(t, T.cut9, 0.05, 3, 6);
	const nod = wob(t, T.doctor, 4, 2.2, 3) + wob(t, T.faint, 3, 3, 4);
	const b1 = pop(t, 25.42, T.happens - 0.05);
	const b2 = pop(t, T.happens + 0.05);
	const tx = pop(t, T.tell);
	const bubble = (sc: number, content: React.ReactNode) =>
		sc < 0.01 ? null : (
			<g transform={`translate(540,330) scale(${sc})`}>
				<path d="M-120,120 L-190,240 L-30,130Z" fill="#fff" stroke="#111" strokeWidth={12} strokeLinejoin="round" />
				<rect x={-400} y={-170} width={800} height={320} rx={150} fill="#fff" stroke="#111" strokeWidth={12} />
				<path d="M-120,128 L-30,128" stroke="#fff" strokeWidth={14} />
				{content}
			</g>
		);
	return (
		<AbsoluteFill>
			<AbsoluteFill style={{filter: 'blur(7px)', transform: 'scale(1.25)'}}>
				<Box w={room.w} h={room.h} s={1080 / room.w} x={540} y={960} px={room.w / 2} py={room.h / 2}>
					<Pic src="10_room.jpg" w={room.w} h={room.h} />
				</Box>
			</AbsoluteFill>
			<Box w={PT.w} h={PT.h} s={sP} x={540} y={1935} px={PT.head[0]} py={PT.h} sy={breath - bounce} sx={1 + bounce * 0.6} rot={nod}>
				<Pic src="05_point.png" w={PT.w} h={PT.h} />
			</Box>
			<svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
				{bubble(b1, (
					<g>
						<OText x={0} y={-5} size={200} fill="#111" stroke="#fff" sw={1}>?</OText>
						<path transform={`translate(-210,-30) rotate(${t * 90})`} d={sparklePath(55)} fill="#FFD54A" stroke="#111" strokeWidth={7} />
						<path transform={`translate(215,40) rotate(${-t * 90})`} d={sparklePath(42)} fill="#FFD54A" stroke="#111" strokeWidth={7} />
					</g>
				))}
				{bubble(b2, (
					<g>
						<g transform={`translate(-250,-5) scale(${0.85 + 0.15 * b2})`}>
							<circle r={95} fill="#E53935" stroke="#111" strokeWidth={10} />
							<path d="M-24,-62 H24 V-24 H62 V24 H24 V62 H-24 V24 H-62 V-24 H-24Z" fill="#fff" stroke="#111" strokeWidth={6} strokeLinejoin="round" />
						</g>
						<g transform={`translate(95,-5) scale(${tx})`}>
							<OText x={0} y={-48} size={86} fill="#111" stroke="#fff" sw={1}>TELL A</OText>
							<OText x={0} y={52} size={86} fill="#111" stroke="#fff" sw={1}>DOCTOR</OText>
						</g>
					</g>
				))}
			</svg>
		</AbsoluteFill>
	);
};

// ---------------------------------------------------------------------------------------------- main
const useFont = () => {
	const [h] = useState(() => delayRender('font'));
	useEffect(() => {
		const f = new FontFace('InterBlack', `url(${staticFile('fonts/InterDisplay-Black.otf')})`, {weight: '900'});
		f.load().then(() => {
			document.fonts.add(f);
			continueRender(h);
		}).catch(() => continueRender(h));
	}, [h]);
};

export const Stars: React.FC = () => {
	useFont();
	const frame = useCurrentFrame();
	const t = frame / FPS;
	let scene: React.ReactNode;
	if (t < T.cut2) scene = <S1 t={t} />;
	else if (t < T.cut3) scene = <S2 t={t} />;
	else if (t < T.cut4) scene = <S3 t={t} />;
	else if (t < T.cut5) scene = <S4 t={t} />;
	else if (t < T.toPilot) scene = <S5Jet t={t} />;
	else if (t < T.cut6) scene = <S5Pilot t={t} />;
	else if (t < T.cut7) scene = <S6 t={t} />;
	else if (t < T.cut8) scene = <S7 t={t} />;
	else if (t < T.cut9) scene = <S8 t={t} />;
	else scene = <S9 t={t} />;
	return (
		<AbsoluteFill style={{background: '#000'}}>
			{scene}
			<Tunnel t={t} />
			<Sequence from={Math.round(V * FPS)} layout="none">
				<Audio src={staticFile('why-you-see-stars/vo/take1.mp3')} volume={1} />
			</Sequence>
			{CUES.map((c, i) => (
				<Sequence key={i} from={Math.round(c.at * FPS)} layout="none">
					<Audio src={staticFile(`why-you-see-stars/sfx/${c.f}.wav`)} volume={10 ** (c.db / 20)} />
				</Sequence>
			))}
		</AbsoluteFill>
	);
};
