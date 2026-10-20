import React from 'react';
import {AbsoluteFill, Easing, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {C, DISPLAY, UI} from '../../brand';
import {Stage} from '../../ui/Common';
import {Bolt, CalendarIcon, Globe, Kanban, Mail, Mic, UserIcon} from '../../ui/Icons';
import {FocusPill, LockClock, Notification, StatusBar, Wallpaper} from '../../ui/Phone';

export const TIME = '9:04';
export const DATE = 'Friday, October 9';

/** Absolute time (sec) of the current frame inside a shot that starts at `fromSec`. */
const useAbs = (fromFrame: number) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  return {f: f + fromFrame, t: (f + fromFrame) / fps, fps};
};

const sp = (frame: number, fps: number, stiffness = 220) =>
  spring({frame, fps, config: {damping: 14, stiffness, mass: 0.6}});

/* ---------- Lock screen hook ---------- */
export const LockHook: React.FC<{from: number; calendarAt: number; dismissAt: number; buzzAt: number}> = ({from, calendarAt, dismissAt, buzzAt}) => {
  const {f, fps} = useAbs(from);
  const inP = sp(f - calendarAt, fps, 260);
  const out = interpolate(f, [dismissAt, dismissAt + 8], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.in(Easing.cubic)});
  const glow = f >= buzzAt ? Math.min(1, (f - buzzAt) / 6) * (0.75 + 0.25 * Math.sin((f - buzzAt) / 3)) : 0;
  return (
    <AbsoluteFill>
      <Wallpaper />
      <StatusBar time={TIME} />
      <LockClock time={TIME} date={DATE} focus={<FocusPill icon={<Mic size={34} color={glow > 0.5 ? '#000' : C.yellow} stroke={2.6} />} label="Conference" glow={glow} />} />
      {f >= calendarAt && (
        <div
          style={{
            position: 'absolute',
            left: 130,
            width: 800,
            top: 640,
            opacity: inP * (1 - out),
            transform: `translateY(${(1 - inP) * -60 - out * 220}px) scale(${0.9 + 0.1 * inP})`,
          }}
        >
          <Notification icon={<CalendarIcon size={42} color={C.yellow} stroke={2.4} />} app="Calendar" time="9:00" title="Marketing Summit" body="All day · Focus is on" />
        </div>
      )}
    </AbsoluteFill>
  );
};

/* ---------- Notification stack ---------- */
export type Notif = {
  at: number; // arrival frame (absolute)
  icon: React.ReactNode;
  app: string;
  title: string;
  body: string;
  accent?: boolean;
  done?: boolean;
  /** optional later state change */
  change?: {at: number; title: string; body: string; accent?: boolean; done?: boolean};
};

const CARD_H = 172;

export const NotifStack: React.FC<{from: number; items: Notif[]; collapseAt?: number; summary?: string; pillGlowAt?: number}> = ({
  from,
  items,
  collapseAt,
  summary,
  pillGlowAt,
}) => {
  const {f, fps} = useAbs(from);
  const arrived = items.filter((n) => f >= n.at);
  const collapse = collapseAt !== undefined ? sp(f - collapseAt, fps, 160) : 0;
  const glow = pillGlowAt !== undefined && f >= pillGlowAt ? 0.8 + 0.2 * Math.sin((f - pillGlowAt) / 3) : 0;
  return (
    <AbsoluteFill>
      <Wallpaper dim={0.1} />
      <StatusBar time={TIME} />
      <LockClock time={TIME} date={DATE} focus={<FocusPill icon={<Mic size={34} color={glow > 0.5 ? '#000' : C.yellow} stroke={2.6} />} label="Conference" glow={glow} />} />
      <div style={{position: 'absolute', left: 130, width: 800, top: 600, height: 620}}>
        {arrived.map((n, idx) => {
          // slot grows smoothly as newer notifications arrive
          const slot = arrived.slice(idx + 1).reduce((s, m) => s + sp(f - m.at, fps), 0);
          const enter = sp(f - n.at, fps, 260);
          const extra = Math.max(0, slot - 2);
          let y = Math.min(slot, 2) * CARD_H + Math.min(extra, 2) * 26;
          let scale = (1 - 0.06 * Math.min(extra, 2)) * (0.9 + 0.1 * enter);
          let opacity = Math.max(0, 1 - 0.4 * Math.min(extra, 2.5)) * Math.min(1, enter * 1.4);
          // collapse everything into one stack
          if (collapse > 0) {
            const k = Math.min(slot, 3);
            y = y * (1 - collapse) + k * 22 * collapse;
            scale = scale * (1 - collapse) + (1 - 0.05 * k) * collapse;
            opacity = opacity * (1 - collapse) + (k < 3 ? 1 - 0.3 * k : 0) * collapse;
          }
          const ch = n.change && f >= n.change.at ? n.change : undefined;
          const flip = ch ? sp(f - (n.change as NonNullable<Notif['change']>).at, fps, 300) : 1;
          return (
            <div
              key={idx}
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                top: 0,
                zIndex: 100 + idx,
                opacity,
                transform: `translateY(${y + (1 - enter) * -70}px) scale(${scale * (ch ? 0.92 + 0.08 * flip : 1)})`,
                transformOrigin: 'top center',
              }}
            >
              <Notification
                icon={n.icon}
                app={n.app}
                title={ch ? ch.title : n.title}
                body={ch ? ch.body : n.body}
                accent={ch ? ch.accent : n.accent}
                done={ch ? ch.done : n.done}
              />
            </div>
          );
        })}
        {summary && collapse > 0.05 && (
          <div
            style={{
              position: 'absolute',
              top: 230,
              left: 0,
              right: 0,
              textAlign: 'center',
              fontFamily: UI,
              fontSize: 34,
              fontWeight: 700,
              color: C.yellow,
              opacity: collapse,
              transform: `translateY(${(1 - collapse) * 30}px)`,
            }}
          >
            {summary}
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};

/* ---------- CRM pipeline app ---------- */
const COLS = ['New', 'Booked', 'Following up'];
export const Pipeline: React.FC<{cards: {col: number; title: string; meta: string; at: number}[]}> = ({cards}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  return (
    <AbsoluteFill>
      <Wallpaper dim={0.78} />
      <StatusBar time={TIME} />
      <div style={{position: 'absolute', left: 130, width: 800, top: 230, fontFamily: UI}}>
        <div style={{display: 'flex', alignItems: 'center', gap: 18, color: C.white, fontSize: 56, fontWeight: 800}}>
          <div style={{width: 80, height: 80, borderRadius: 22, background: C.yellow, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
            <Kanban size={48} color="#000" stroke={2.4} />
          </div>
          Pipeline
        </div>
        <div style={{display: 'flex', gap: 16, marginTop: 44}}>
          {COLS.map((c, ci) => (
            <div key={c} style={{flex: 1, minHeight: 640, borderRadius: 28, background: 'rgba(255,255,255,0.05)', border: '2px solid rgba(255,255,255,0.08)', padding: 16}}>
              <div style={{color: 'rgba(255,255,255,0.6)', fontSize: 26, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 16}}>{c}</div>
              {cards
                .filter((k) => k.col === ci)
                .map((k) => {
                  const p = sp(f - k.at, fps, 240);
                  if (f < k.at) return null;
                  return (
                    <div
                      key={k.title}
                      style={{
                        background: '#1C1C1C',
                        borderRadius: 18,
                        borderLeft: `8px solid ${C.yellow}`,
                        padding: '18px 16px',
                        marginBottom: 14,
                        transform: `translateY(${(1 - p) * -120}px) scale(${0.7 + 0.3 * p})`,
                        opacity: Math.min(1, p * 1.5),
                        boxShadow: '0 14px 30px rgba(0,0,0,0.4)',
                      }}
                    >
                      <div style={{color: C.white, fontSize: 28, fontWeight: 700, lineHeight: 1.15}}>{k.title}</div>
                      <div style={{color: 'rgba(255,255,255,0.6)', fontSize: 23, marginTop: 6}}>{k.meta}</div>
                    </div>
                  );
                })}
            </div>
          ))}
        </div>
      </div>
    </AbsoluteFill>
  );
};

/* ---------- Not an employee ---------- */
export const NotEmployee: React.FC<{strikeAt: number}> = ({strikeAt}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const p = sp(f, fps);
  const strike = interpolate(f, [strikeAt, strikeAt + 6], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});
  return (
    <AbsoluteFill>
      <Wallpaper dim={0.55} />
      <Stage y={660}>
        <div style={{position: 'relative', width: 440, height: 440, transform: `scale(${0.6 + 0.4 * p})`}}>
          <div style={{width: 440, height: 440, borderRadius: 999, border: `10px solid ${C.white}`, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
            <UserIcon size={300} color={C.white} stroke={1.6} />
          </div>
          <div
            style={{
              position: 'absolute',
              left: -30,
              top: '50%',
              height: 36,
              width: `${strike * 520}px`,
              background: C.yellow,
              borderRadius: 99,
              transform: 'rotate(-35deg)',
              transformOrigin: 'left center',
              boxShadow: '0 0 40px rgba(255,230,0,0.6)',
              marginTop: 140,
            }}
          />
        </div>
      </Stage>
    </AbsoluteFill>
  );
};

/* ---------- A system ---------- */
const NODES = [
  {label: 'Website', icon: Globe},
  {label: 'Lead', icon: Mail},
  {label: 'CRM', icon: Kanban},
  {label: 'Follow-up', icon: Bolt},
];
export const SystemFlow: React.FC<{litEvery?: number}> = ({litEvery = 4}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  return (
    <AbsoluteFill>
      <Wallpaper dim={0.5} />
      <Stage y={690}>
        <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
          {NODES.map((n, i) => {
            const at = i * litEvery;
            const p = sp(f - at, fps, 260);
            const lit = f >= at;
            const Icon = n.icon;
            return (
              <React.Fragment key={n.label}>
                {i > 0 && (
                  <div style={{width: 8, height: 60, background: lit ? C.yellow : '#333', boxShadow: lit ? '0 0 24px rgba(255,230,0,0.7)' : undefined, transform: `scaleY(${lit ? p : 1})`, transformOrigin: 'top'}} />
                )}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 20,
                    padding: '22px 44px',
                    minWidth: 420,
                    justifyContent: 'center',
                    borderRadius: 999,
                    background: lit ? C.yellow : '#1A1A1A',
                    color: lit ? '#000' : C.gray,
                    fontFamily: DISPLAY,
                    fontWeight: 900,
                    fontSize: 54,
                    boxShadow: lit ? '0 0 60px rgba(255,230,0,0.45)' : undefined,
                    transform: `scale(${lit ? 0.85 + 0.15 * p : 0.9})`,
                  }}
                >
                  <Icon size={56} color={lit ? '#000' : C.gray} stroke={2.6} />
                  {n.label.toUpperCase()}
                </div>
              </React.Fragment>
            );
          })}
        </div>
      </Stage>
    </AbsoluteFill>
  );
};
