import React from 'react';
import {AbsoluteFill, Html5Audio, staticFile, useCurrentFrame} from 'remotion';
import {buildHand} from './hand';
import {HandSVG, TableSVG, makeProj, orbitCam, topCam, shadowPath, contactPath} from './draw';
import {T, FPS, poseAt, frontCamAt, front2CamAt, topCamAt, xrayAt} from './timeline';
import {Face, faceFrame, Caption, Chips, ChipState, TimerBar, YesNo, Anatomy, XrayState, Badge, knucklePos, EXPR0, Expr} from './overlays';
import {prog, popIn, ring, clamp, easeOut, lerp} from './math';

const F = 2400;

function exprAt(t: number): Expr {
  const e: Expr = {...EXPR0};
  const end = T.end;
  e.scale = popIn(t, T.ring - 0.02, 0.3) * (t > end - 0.42 ? Math.max(0, 1 - (t - (end - 0.42)) / 0.2) : 1);
  if (e.scale <= 0) return e;
  const blink = (tb: number) => (t > tb && t < tb + 0.16 ? Math.sin(((t - tb) / 0.16) * Math.PI) : 0);
  e.lookY = -0.4;
  e.lid = Math.max(blink(T.ring + 0.55), blink(T.share0 + 0.5), blink(T.could + 0.35));
  // try-it: straining
  const strain = (a: number, b: number) => t > a && t < b;
  if (strain(T.ringEnd - 0.3, T.pause1 - 0.02)) {
    e.squeeze = 1;
    e.browTilt = -18;
    e.effort = clamp((t - (T.ringEnd - 0.3)) / 0.3);
    e.sweat = (t - (T.pause0 + 0.15)) / 1.9;
  } else if (t >= T.pause1 && t < T.cutTop) {
    // stuck: deflated
    e.lid = Math.max(e.lid, 0.42 * prog(t, T.pause1, T.pause1 + 0.25));
    e.browTilt = 16;
    e.lookY = 0.2;
    e.sweat = -1;
    if (t > T.most) {
      e.lookY = -0.3;
      e.lookX = 0.1;
      e.browRaise = 0.3;
    }
  } else if (t >= T.cutTop && t < T.cutFront) {
    e.lookY = 0.5; // looks down at its tendons
    if (strain(T.holds - 0.1, T.leash - 0.02)) {
      e.squeeze = 1;
      e.browTilt = -18;
      e.effort = 1;
    } else if (t >= T.leash - 0.02 && t < T.backup0) {
      e.wide = 0.18 * Math.max(0, 1 - (t - T.leash) / 0.6);
      e.browRaise = 0.8;
      e.browTilt = 6;
      e.lookY = -0.2;
      e.lookX = 0.25 * Math.sin((t - T.leash) * 14) * Math.exp(-(t - T.leash) * 2.5);
    } else if (t >= T.backup0 && t < T.doesnt0) {
      e.lookX = t < T.pinky2 ? 0.8 : -0.8; // top view: index is on the left, pinky on the right... of the finger itself
      e.lookY = 0;
      e.browRaise = 0.4;
    } else if (t >= T.doesnt0) {
      e.lid = Math.max(e.lid, 0.5 * prog(t, T.doesnt0, T.doesnt0 + 0.3));
      e.browTilt = 18;
      e.lookY = 0.5;
    }
  } else if (t >= T.cutFront) {
    e.browRaise = 0.7;
    e.lookY = -0.45;
    if (t > T.comment) {
      e.lookX = t < T.no ? -0.7 : 0.7;
      e.lookY = 0.6;
      e.browRaise = 0.3;
    }
    if (t > end - 0.62) e.lid = Math.max(e.lid, prog(t, end - 0.62, end - 0.45));
  }
  return e;
}

function chipsAt(t: number): ChipState[] {
  const st = (since: number, kind: ChipState['kind']) => (t >= since ? kind : 'none');
  const ringKind: ChipState['kind'] = t >= T.stuck ? 'no' : t >= T.ring ? 'q' : 'none';
  return [
    {label: 'THUMB', kind: st(T.easy1, 'ok'), since: T.easy1},
    {label: 'INDEX', kind: st(T.easy2, 'ok'), since: T.easy2},
    {label: 'PINKY', kind: st(T.easy3, 'ok'), since: T.easy3},
    {label: 'RING', kind: ringKind, since: t >= T.stuck ? T.stuck : T.ring},
  ];
}

function xrayStateAt(t: number): XrayState {
  return {
    muscle: popIn(t, T.share0 + 0.75, 0.35),
    tendons: prog(t, T.share0 + 1.0, T.share + 0.35, easeOut),
    bands: popIn(t, T.tied - 0.05, 0.3),
    leash: prog(t, T.so + 0.6, T.holds, (u) => u) * (1 - prog(t, T.leashEnd + 0.15, T.backup0 + 0.1)),
    twang: ring(t, T.leash, 7, 5) * 0.55 + (t > T.holds - 0.1 && t < T.leash ? 0.12 * Math.sin(t * 60) : 0),
    backup: popIn(t, T.backup - 0.05, 0.35),
    ringNo: t > T.doesnt - 0.05 ? 0.6 + 0.4 * Math.sin((t - T.doesnt) * 12) : 0,
    time: t,
  };
}

export const RingFinger: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const shot = t < T.cutTop ? 'front' : t < T.cutFront ? 'top' : 'front2';
  const pose = poseAt(t);
  // small shrug on "most people are" and on the question
  pose.dy += 0.25 * ring(t, T.most, 2.2, 4) + 0.2 * ring(t, T.could, 2.2, 4);
  const rig = buildHand(pose);
  let cam;
  let shake = 0;
  if (shot === 'top') {
    const c = topCamAt(t);
    cam = topCam([c.tx, 0, c.tz], c.h, F);
  } else {
    const c = shot === 'front' ? frontCamAt(t) : front2CamAt(t);
    cam = orbitCam([c.tx, c.ty, c.tz], c.dist, c.pitch, c.yaw, F, 800);
  }
  shake = 6 * Math.max(0, 1 - (t - T.leash) / 0.4) * (t > T.leash ? 1 : 0) * Math.sin(t * 2 * Math.PI * 13.3) + 3 * ring(t, T.under + 0.05, 9, 14);
  const pr = makeProj(cam);
  const xr = shot === 'top' ? xrayAt(t) : 0;
  const scanY = -60 + 2040 * xr;
  const face = faceFrame(rig, pr, 'ring');
  const e = exprAt(t);

  const under = (
    <>
      <TableSVG pr={pr} />
      <path d={shadowPath(rig, pr)} fill="rgba(110,55,15,0.26)" filter="url(#soft)" />
      <path d={contactPath(rig, pr)} fill="rgba(80,35,5,0.35)" filter="url(#soft2)" />
    </>
  );
  const handNormal = (
    <>
      {under}
      <HandSVG rig={rig} pr={pr} ow={0.17} camPos={cam.pos} id="n" />
    </>
  );
  const xs = xrayStateAt(t);

  // captions
  const capY = 1480;
  const caps: {l: string[]; a: number; b: number; y?: number; c?: string}[] = [
    {l: ['PUT YOUR HAND', 'ON A TABLE'], a: -1, b: T.do - 0.08},
    {l: ['DO EXACTLY THIS'], a: T.do - 0.05, b: T.palm - 0.08},
    {l: ['PALM DOWN'], a: T.palm - 0.05, b: T.fold - 0.08},
    {l: ['FOLD YOUR MIDDLE', 'FINGER UNDER'], a: T.fold - 0.05, b: T.lift - 0.12},
    {l: ['LIFT YOUR THUMB'], a: T.lift - 0.08, b: T.index - 0.12},
    {l: ['NOW THE INDEX'], a: T.index - 0.08, b: T.pinky - 0.12},
    {l: ['NOW THE PINKY'], a: T.pinky - 0.08, b: T.now - 0.1},
    {l: ['NOW... YOUR', 'RING FINGER'], a: T.now - 0.05, b: T.pause0 - 0.05, c: '#FFD23F'},
    {l: ['TRY IT'], a: T.pause0, b: T.pause1 - 0.05},
    {l: ['STUCK?'], a: T.pause1 + 0.4, b: T.most - 0.08},
    {l: ['MOST PEOPLE ARE'], a: T.most - 0.05, b: T.cutTop - 0.02},
    // x-ray (top view): captions at the top of the frame
    {l: ['ONE SHARED', 'MUSCLE'], a: T.share0 + 0.75, b: T.tied0 - 0.05, y: 215},
    {l: ['TENDONS TIED', 'TOGETHER'], a: T.tied0 + 0.1, b: T.so - 0.08, y: 215},
    {l: ['IT HOLDS THE', 'RING FINGER'], a: T.so, b: T.like - 0.08, y: 215},
    {l: ['LIKE A LEASH'], a: T.like - 0.05, b: T.backup0 - 0.08, y: 215, c: '#FFB238'},
    {l: ['INDEX + PINKY:', 'BACKUP MUSCLES'], a: T.backup0, b: T.doesnt0 - 0.08, y: 215, c: '#7CF0A8'},
    {l: ['RING FINGER:', 'NO BACKUP'], a: T.doesnt0, b: T.cutFront - 0.02, y: 215, c: '#FF8A8E'},
    {l: ['COULD YOU', 'LIFT IT?'], a: T.cutFront + 0.05, b: T.end - 0.4, y: 1385},
    {l: ['PUT YOUR HAND', 'ON A TABLE'], a: T.end - 0.32, b: T.end + 1},
  ];

  // badges on the knuckles in the x-ray
  const kIdx = knucklePos(rig, pr, 'index'),
    kPin = knucklePos(rig, pr, 'pinky'),
    kRing = knucklePos(rig, pr, 'ring');
  const bR = 0.75 * pr([0, 4, 0]).k;

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
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation={10} />
          </filter>
          <clipPath id="below">
            <rect x={-100} y={scanY} width={1280} height={2200} />
          </clipPath>
          <clipPath id="above">
            <rect x={-100} y={-200} width={1280} height={Math.max(0, scanY + 200)} />
          </clipPath>
        </defs>
        <g transform={`translate(${shake * 0.6} ${shake})`}>
          {/* normal world (everything in front view; below the scan line in the top view) */}
          <g clipPath={xr > 0 ? 'url(#below)' : undefined}>
            {handNormal}
          </g>
          {/* x-ray world */}
          {xr > 0 && (
            <g clipPath="url(#above)">
              <rect x={-100} y={-100} width={1280} height={2120} fill="#0B1C30" />
              {Array.from({length: 13}).map((_, i) => (
                <line key={'gx' + i} x1={i * 90} x2={i * 90} y1={-100} y2={2020} stroke="#12304D" strokeWidth={3} />
              ))}
              {Array.from({length: 23}).map((_, i) => (
                <line key={'gy' + i} y1={i * 90} y2={i * 90} x1={-100} x2={1180} stroke="#12304D" strokeWidth={3} />
              ))}
              <HandSVG rig={rig} pr={pr} ow={0.17} camPos={cam.pos} xray={1} id="x" />
              <Anatomy rig={rig} pr={pr} s={xs} />
            </g>
          )}
          {xr > 0 && xr < 1 && (
            <g>
              <rect x={-100} y={scanY - 14} width={1280} height={28} fill="#7FE6FF" opacity={0.35} filter="url(#glow)" />
              <line x1={-100} x2={1180} y1={scanY} y2={scanY} stroke="#C8F6FF" strokeWidth={6} />
            </g>
          )}
          <Face f={face} e={e} t={t} />
          {/* x-ray knuckle badges */}
          {shot === 'top' && (
            <>
              <Badge x={kIdx.x} y={kIdx.y} r={bR} kind="plus" sc={popIn(t, T.backup + 0.05, 0.3) * (1 - prog(t, T.cutFront - 0.15, T.cutFront))} />
              <Badge x={kPin.x} y={kPin.y} r={bR} kind="plus" sc={popIn(t, T.backup + 0.2, 0.3) * (1 - prog(t, T.cutFront - 0.15, T.cutFront))} />
              <Badge x={kRing.x} y={kRing.y} r={bR} kind="no" sc={popIn(t, T.doesnt - 0.02, 0.3) * (1 - prog(t, T.cutFront - 0.15, T.cutFront))} />
            </>
          )}
        </g>
        {/* screen-space UI */}
        <Chips chips={chipsAt(t)} t={t} t0={T.lift - 0.1} t1={T.cutTop - 0.25} />
        {caps.map((c, i) => (
          <Caption key={i} lines={c.l} y={c.y ?? capY} t={t} t0={c.a} t1={c.b} color={c.c} />
        ))}
        <TimerBar t={t} t0={T.pause0} t1={T.pause1 - 0.05} y={1590} />
        <YesNo t={t} t0={T.yes - 0.12} tNo={T.no - 0.1} t1={T.end - 0.5} y={1575} />
      </svg>
      <Html5Audio src={staticFile('mix.wav')} />
    </AbsoluteFill>
  );
};

export {lerp};
