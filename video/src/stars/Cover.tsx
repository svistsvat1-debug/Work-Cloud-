import React, {useEffect, useState} from 'react';
import {AbsoluteFill, continueRender, delayRender, staticFile} from 'remotion';
import data from './sprites.json';
import {Box, FONT, Pic, Svg, sparklePath, starPath} from './lib';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const M: any = data;

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

/** big outlined title line, squeezed to an exact width so it never touches the frame edge */
const Title: React.FC<{y: number; size: number; width: number; fill: string; children: string}> = ({y, size, width, fill, children}) => (
	<g>
		<text x={540} y={y + 14} textAnchor="middle" dominantBaseline="middle" fontFamily={FONT} fontWeight={900} fontSize={size}
			textLength={width} lengthAdjust="spacingAndGlyphs" fill="rgba(0,0,0,0.35)" stroke="rgba(0,0,0,0.35)" strokeWidth={size * 0.3} strokeLinejoin="round">
			{children}
		</text>
		<text x={540} y={y} textAnchor="middle" dominantBaseline="middle" fontFamily={FONT} fontWeight={900} fontSize={size}
			textLength={width} lengthAdjust="spacingAndGlyphs" fill={fill} stroke="#111" strokeWidth={size * 0.2} strokeLinejoin="round" paintOrder="stroke">
			{children}
		</text>
	</g>
);

export const Cover: React.FC = () => {
	useFont();
	const room = M['10_room'], dz = M['03_dizzy'];
	const [hx, hy, hr] = dz.head;
	const s = 0.69;
	// stars orbiting above the head (sprite px of the dizzy pose)
	const stars = [-1.2, -0.6, 0, 0.6, 1.2].map((k, i) => ({
		x: hx + k * hr, y: hy - hr * 1.3 - (1 - (k / 1.2) ** 2) * hr * 0.28, front: true, r: [84, 96, 104, 96, 84][i], rot: [-18, 10, 0, -10, 18][i],
	}));
	const starEls = (front: boolean) =>
		stars.filter((p) => p.front === front).map((p, i) => (
			<g key={i} transform={`translate(${p.x},${p.y}) rotate(${p.rot})`}>
				<path d={starPath(p.r, 0.45)} fill="#FFD54A" stroke="#111" strokeWidth={14} strokeLinejoin="round" />
			</g>
		));
	const sparkles = [
		{x: 120, y: 760, r: 46}, {x: 965, y: 820, r: 58}, {x: 90, y: 1300, r: 38}, {x: 1000, y: 1380, r: 44}, {x: 930, y: 660, r: 30},
	];
	return (
		<AbsoluteFill style={{background: '#FDE3CB'}}>
			{/* the room, out of focus */}
			<AbsoluteFill style={{filter: 'blur(9px)', transform: 'scale(1.18)'}}>
				<Box w={room.w} h={room.h} s={1080 / room.w} x={540} y={960} px={room.w / 2} py={room.h / 2}>
					<Pic src="10_room.jpg" w={room.w} h={room.h} />
				</Box>
			</AbsoluteFill>
			{/* the grey tunnel closing in from the edges */}
			<AbsoluteFill style={{background: 'radial-gradient(ellipse 62% 52% at 50% 58%, rgba(86,88,96,0) 55%, rgba(86,88,96,0.92) 100%)'}} />
			{/* the dizzy guy */}
			<Box w={dz.w} h={dz.h} s={s} x={500} y={1185} px={hx} py={hy} rot={-4}>
				<Svg w={dz.w} h={dz.h}>{starEls(false)}</Svg>
				<Pic src="03_dizzy.png" w={dz.w} h={dz.h} />
				<Svg w={dz.w} h={dz.h}>{starEls(true)}</Svg>
			</Box>
			<svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
				{sparkles.map((p, i) => (
					<path key={i} transform={`translate(${p.x},${p.y}) rotate(${i * 17})`} d={sparklePath(p.r)} fill="#FFFBE0" stroke="#111" strokeWidth={6} />
				))}
				<g transform="rotate(-3 540 380)">
					<Title y={300} size={190} width={880} fill="#FFFFFF">STOOD UP</Title>
					<Title y={500} size={190} width={940} fill="#FFD54A">TOO FAST?</Title>
				</g>
			</svg>
		</AbsoluteFill>
	);
};
