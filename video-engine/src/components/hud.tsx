import React, {useMemo} from 'react';
import {useCurrentFrame} from 'remotion';
import {markerPath, rectPts, seedOf} from '../lib/sketch';
import {C, FONT_LABEL, FONT_TITLE, FPS} from '../lib/theme';
import {popScale, prog} from '../lib/timing';
import {Check, Drawing, Stroke} from './primitives';

// Global mission tracker (top-right): "MISSION 3/7" + 7 boxes, ticks as missions complete.
export const MissionHud: React.FC<{missions: {start: number; done: number}[]; showFrom: number; hideAt: number}> = ({missions, showFrom, hideAt}) => {
  const f = useCurrentFrame();
  const o = prog(f, showFrom, 10) * (1 - prog(f, hideAt, 12));
  const box = useMemo(() => markerPath(rectPts(1560, 34, 320, 120), true, seedOf('hud'), 1.6), []);
  if (o <= 0) return null;
  let cur = 0;
  missions.forEach((m, i) => {
    if (f >= m.start) cur = i + 1;
  });
  return (
    <g opacity={o}>
      <path d={box} fill={C.white} opacity={0.85} />
      <Stroke d={box} at={showFrom} dur={12} w={4} />
      <text x={1720} y={86} fontFamily={FONT_TITLE} fontSize={40} textAnchor="middle" fill={C.ink}>
        {`MISSION ${Math.max(1, cur)}/7`}
      </text>
      {missions.map((m, i) => {
        const x = 1596 + i * 42;
        const done = f >= m.done;
        const active = i + 1 === cur && !done;
        return (
          <g key={i}>
            <rect x={x - 15} y={104} width={30} height={30} rx={4} fill={active ? C.yellow : C.white} stroke={C.ink} strokeWidth={3} />
            {done ? <Check x={x} y={120} at={m.done} s={0.62} /> : null}
          </g>
        );
      })}
    </g>
  );
};

// The "invisible team" board: up to 6 slots that fill in, one per mission.
export const TEAM = [
  {label: 'COOK / SUPPLY', icon: 'cook'},
  {label: 'DRIVER', icon: 'truck'},
  {label: 'MAIL', icon: 'mail'},
  {label: 'MEDIC', icon: 'medic'},
  {label: 'GRAVES / RECORDS', icon: 'folder'},
  {label: 'RETRAINED', icon: 'helmet'},
] as const;

const SlotIcon: React.FC<{icon: string}> = ({icon}) => {
  switch (icon) {
    case 'cook':
      return (
        <g>
          <circle cx={0} cy={6} r={16} fill={C.skinLight} stroke={C.ink} strokeWidth={3} />
          <path d="M-14,-6 L-22,-22 L-10,-34 L0,-28 L10,-36 L22,-22 L14,-6 Z" fill={C.white} stroke={C.ink} strokeWidth={3} />
        </g>
      );
    case 'truck':
      return (
        <g transform="scale(0.16) translate(0,110)">
          <path d="M-200,-40 L60,-40 L60,-170 L-200,-170 Z M60,-40 L60,-140 L140,-140 L170,-95 L200,-90 L200,-40 Z" fill={C.olive} stroke={C.ink} strokeWidth={18} strokeLinejoin="round" />
          <circle cx={-140} cy={-38} r={34} fill={C.ink} />
          <circle cx={140} cy={-38} r={34} fill={C.ink} />
        </g>
      );
    case 'mail':
      return (
        <g>
          <rect x={-24} y={-16} width={48} height={32} fill={C.white} stroke={C.ink} strokeWidth={3} />
          <path d="M-24,-16 L0,2 L24,-16" fill="none" stroke={C.ink} strokeWidth={3} />
        </g>
      );
    case 'medic':
      return (
        <g>
          <rect x={-22} y={-16} width={44} height={32} rx={5} fill={C.olive} stroke={C.ink} strokeWidth={3} />
          <rect x={-14} y={-8} width={28} height={14} fill={C.white} stroke={C.ink} strokeWidth={2} />
        </g>
      );
    case 'folder':
      return <path d="M-24,-18 L-8,-18 L-4,-12 L24,-12 L24,18 L-24,18 Z" fill={C.khaki} stroke={C.ink} strokeWidth={3} strokeLinejoin="round" />;
    default:
      return (
        <g>
          <path d="M-24,6 A24,22 0 0 1 24,6 L30,8 L-30,8 Z" fill={C.olive} stroke={C.ink} strokeWidth={3} />
          <path d="M0,-30 L0,-12 M-8,-22 L0,-30 L8,-22" stroke={C.green} strokeWidth={4} fill="none" strokeLinecap="round" />
        </g>
      );
  }
};

export const TeamBoard: React.FC<{filled: number; newAt: number; at: number; x?: number; y?: number; s?: number}> = ({filled, newAt, at, x = 1430, y = 190, s = 1}) => {
  const f = useCurrentFrame();
  const frame = useMemo(() => [{pts: rectPts(0, 0, 440, 720), closed: true, fill: C.white, solid: true}], []);
  if (f < at) return null;
  return (
    <g transform={`translate(${x},${y}) scale(${s})`}>
      <Drawing parts={frame} at={at} dur={12} seed={201} fillDur={6} />
      <text x={220} y={66} fontFamily={FONT_TITLE} fontSize={44} textAnchor="middle" fill={C.ink} opacity={prog(f, at + 6, 6)}>
        INVISIBLE TEAM
      </text>
      <line x1={40} y1={84} x2={400} y2={84} stroke={C.red} strokeWidth={6} strokeLinecap="round" opacity={prog(f, at + 10, 6)} />
      {TEAM.map((t, i) => {
        const yy = 140 + i * 100;
        const isNew = i === filled - 1;
        const show = i < filled - 1 ? prog(f, at + 8 + i * 2, 6) : isNew ? 1 : 0;
        const sc = isNew ? popScale(f, newAt, 10) : show;
        return (
          <g key={i}>
            <rect x={30} y={yy - 38} width={380} height={80} rx={10} fill="none" stroke={C.grey} strokeWidth={3} strokeDasharray="10 8" opacity={prog(f, at + 6, 6)} />
            {sc > 0 ? (
              <g transform={`translate(85,${yy}) scale(${sc})`}>
                <SlotIcon icon={t.icon} />
              </g>
            ) : null}
            {sc > 0 ? (
              <text x={140} y={yy + 14} fontFamily={FONT_LABEL} fontSize={40} fill={C.ink} opacity={Math.min(1, sc)}>
                {t.label}
              </text>
            ) : null}
          </g>
        );
      })}
    </g>
  );
};

export const secToFrame = (s: number) => Math.round(s * FPS);
