// Vertical cover (9:16) for the Short: the same hand, the ring finger straining, big text + arrow.
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {buildHand} from './hand';
import {HandSVG, TableSVG, makeProj, orbitCam, shadowPath, contactPath, capHull, pathOf, INK} from './draw';
import {Face, faceFrame, EXPR0, FONT} from './overlays';

const Text: React.FC<{x: number; y: number; size: number; fill: string; children: string; rot?: number}> = ({x, y, size, fill, children, rot = 0}) => (
  <text
    x={x}
    y={y}
    transform={`rotate(${rot} ${x} ${y})`}
    textAnchor="middle"
    dominantBaseline="central"
    fontFamily={FONT}
    fontWeight={700}
    fontSize={size}
    fill={fill}
    stroke={INK}
    strokeWidth={size * 0.22}
    strokeLinejoin="round"
    paintOrder="stroke"
    letterSpacing={2}
  >
    {children}
  </text>
);

export const Thumb: React.FC = () => {
  const rig = buildHand({tent: 1, fold: 1, lift: {thumb: 0, index: 0, ring: 3.5, pinky: 0}, dy: 0});
  const cam = orbitCam([-2.15, 1.7, 3.0], 25, 30, 4, 2400, 1180);
  const pr = makeProj(cam);
  const face = faceFrame(rig, pr, 'ring');
  // yellow halo round the ring finger
  const j = rig.joints.ring,
    r = rig.radii.ring;
  const halo = [0, 1, 2].map((i) => {
    const a = pr(j[i]),
      b = pr(j[i + 1]);
    return capHull(a, (r[i] + 0.42) * a.k, b, (r[i + 1] + 0.42) * b.k);
  });
  const haloInk = [0, 1, 2].map((i) => {
    const a = pr(j[i]),
      b = pr(j[i + 1]);
    return capHull(a, (r[i] + 0.58) * a.k, b, (r[i + 1] + 0.58) * b.k);
  });
  // arrow from the text to the finger
  const tip = {x: face.x + face.s * 0.55, y: face.y - face.s * 1.75};
  const start = {x: 880, y: 540};
  const ctrl = {x: 900, y: tip.y - 60};
  const tx = tip.x - ctrl.x,
    ty = tip.y - ctrl.y,
    tl = Math.hypot(tx, ty);
  const ux = tx / tl,
    uy = ty / tl;
  const head = (w: number, l: number) =>
    `${tip.x + ux * l * 0.35},${tip.y + uy * l * 0.35} ${tip.x - ux * l * 0.65 - uy * w},${tip.y - uy * l * 0.65 + ux * w} ${tip.x - ux * l * 0.65 + uy * w},${tip.y - uy * l * 0.65 - ux * w}`;
  const shaftEnd = {x: tip.x - ux * 60, y: tip.y - uy * 60};
  const arrowD = `M${start.x},${start.y} Q${ctrl.x},${ctrl.y} ${shaftEnd.x},${shaftEnd.y}`;
  return (
    <AbsoluteFill style={{background: '#000'}}>
      <svg width={1080} height={1920} viewBox="0 0 1080 1920">
        <defs>
          <filter id="soft" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation={7} />
          </filter>
          <filter id="soft2" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation={4} />
          </filter>
          <filter id="glow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation={18} />
          </filter>
          <radialGradient id="spot" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FFF4D6" stopOpacity={0.55} />
            <stop offset="100%" stopColor="#FFF4D6" stopOpacity={0} />
          </radialGradient>
          <radialGradient id="vig" cx="50%" cy="55%" r="75%">
            <stop offset="60%" stopColor="#3A1C05" stopOpacity={0} />
            <stop offset="100%" stopColor="#3A1C05" stopOpacity={0.45} />
          </radialGradient>
        </defs>
        <TableSVG pr={pr} />
        <ellipse cx={face.x} cy={face.y + 120} rx={520} ry={620} fill="url(#spot)" />
        <path d={shadowPath(rig, pr)} fill="rgba(110,55,15,0.26)" filter="url(#soft)" />
        <path d={contactPath(rig, pr)} fill="rgba(80,35,5,0.35)" filter="url(#soft2)" />
        <path d={pathOf(halo)} fill="#FFD23F" opacity={0.9} filter="url(#glow)" />
        <path d={pathOf(haloInk)} fill={INK} />
        <path d={pathOf(halo)} fill="#FFD23F" />
        <HandSVG rig={rig} pr={pr} ow={0.17} camPos={cam.pos} id="t" />
        <Face f={face} e={{...EXPR0, scale: 1.12, lookY: -0.55, lookX: 0.1, browTilt: 20, browRaise: 0.5, sweat: 0.3, wide: 0.08}} t={0} />
        <rect x={0} y={0} width={1080} height={1920} fill="url(#vig)" />
        {/* arrow */}
        <path d={arrowD} fill="none" stroke={INK} strokeWidth={50} strokeLinecap="round" />
        <polygon points={head(62, 120)} fill={INK} stroke={INK} strokeWidth={22} strokeLinejoin="round" />
        <path d={arrowD} fill="none" stroke="#FF4D4D" strokeWidth={30} strokeLinecap="round" />
        <polygon points={head(52, 104)} fill="#FF4D4D" />
        {/* text */}
        <Text x={540} y={235} size={190} fill="#FFFFFF" rot={-3}>
          TRY THIS
        </Text>
        <Text x={555} y={420} size={92} fill="#FFD23F" rot={-3}>
          MOST PEOPLE CAN'T
        </Text>
      </svg>
    </AbsoluteFill>
  );
};
