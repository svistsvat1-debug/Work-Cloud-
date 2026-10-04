import React from 'react';
import {Easing, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {C, DISPLAY, UI} from '../../brand';
import {Stage} from '../../ui/Common';
import {CalendarIcon, Check, Globe, UserIcon} from '../../ui/Icons';
import {LightCard, Marker, Tag} from '../../ui/Light';

const sp = (frame: number, fps: number, stiffness = 170, damping = 16) =>
  spring({frame, fps, config: {damping, stiffness, mass: 0.7}});

const useSp = (at: number, stiffness = 170) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  return sp(f - at, fps, stiffness);
};

/* ---------- MYTH quote card, words appear as they are spoken ---------- */
export const MythQuote: React.FC<{words: {text: string; at: number}[]; markAt?: number; enter?: boolean}> = ({words, markAt = 1e9, enter = true}) => {
  const f = useCurrentFrame();
  const p = useSp(enter ? 0 : -99);
  const mark = interpolate(f, [markAt, markAt + 10], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});
  return (
    <Stage y={560}>
      <LightCard style={{width: 800, padding: '44px 48px 54px', transform: `translateY(${(1 - p) * 40}px)`, opacity: p}}>
        <Tag text="MYTH" tone="myth" />
        <div style={{fontFamily: DISPLAY, fontWeight: 900, fontSize: 150, lineHeight: 0.6, color: C.yellow, marginTop: 30}}>“</div>
        <div style={{fontFamily: DISPLAY, fontWeight: 900, fontSize: 70, lineHeight: 1.12, marginTop: -10}}>
          {words.map((w, i) => {
            const vis = f >= w.at;
            const content = w.text === 'Instagram.' ? <Marker p={mark}>{w.text}</Marker> : w.text;
            return (
              <span key={i} style={{opacity: vis ? 1 : 0.12, transition: 'none'}}>
                {content}
                {i < words.length - 1 ? ' ' : ''}
              </span>
            );
          })}
        </div>
      </LightCard>
    </Stage>
  );
};

/* ---------- FACT 1: you rent your audience ---------- */
export const RentedProfile: React.FC<{rentAt: number}> = ({rentAt}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const p = useSp(0);
  const tag = f >= rentAt ? sp(f - rentAt, fps, 260, 12) : 0;
  return (
    <Stage y={540}>
      <div style={{position: 'relative', transform: `translateY(${(1 - p) * 40}px)`, opacity: p}}>
        <LightCard style={{width: 800, padding: 40}}>
          <Tag text="FACT 1" />
          <div style={{display: 'flex', alignItems: 'center', gap: 26, marginTop: 30}}>
            <div style={{width: 140, height: 140, borderRadius: 999, background: 'linear-gradient(135deg,#FFE600,#FFB800)', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
              <UserIcon size={80} color="#111" stroke={2} />
            </div>
            <div>
              <div style={{fontSize: 44, fontWeight: 800}}>yourbusiness</div>
              <div style={{display: 'flex', gap: 28, marginTop: 10, fontSize: 28, color: '#666', fontWeight: 600}}>
                <span>posts</span>
                <span>followers</span>
                <span>following</span>
              </div>
            </div>
          </div>
          <div style={{display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginTop: 30}}>
            {Array.from({length: 6}).map((_, i) => (
              <div key={i} style={{aspectRatio: '1', borderRadius: 16, background: i % 2 ? '#EFEDE6' : '#E6E3DA'}} />
            ))}
          </div>
        </LightCard>
        {tag > 0 && (
          <div
            style={{
              position: 'absolute',
              right: -10,
              top: 120,
              padding: '18px 34px',
              background: '#111',
              color: C.yellow,
              borderRadius: 20,
              fontFamily: DISPLAY,
              fontWeight: 900,
              fontSize: 64,
              transform: `rotate(${8 - 4 * tag}deg) scale(${tag})`,
              boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
            }}
          >
            RENTED
          </div>
        )}
      </div>
    </Stage>
  );
};

/* ---------- FACT 2: the algorithm decides ---------- */
const DOTS = 30;
// which followers get shown the post (fixed pattern, illustrative only)
const SHOWN = new Set([2, 7, 11, 16, 23, 27]);
export const Algorithm: React.FC<{filterAt: number; eyesAt: number; enter?: boolean}> = ({filterAt, eyesAt, enter = true}) => {
  const f = useCurrentFrame();
  const p = useSp(enter ? 0 : -99);
  const filt = interpolate(f, [filterAt, filterAt + 14], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.cubic)});
  return (
    <Stage y={540}>
      <LightCard style={{width: 800, padding: 40, transform: `translateY(${(1 - p) * 40}px)`, opacity: p}}>
        <Tag text="FACT 2" />
        <div style={{display: 'flex', alignItems: 'center', gap: 18, marginTop: 28, padding: 20, borderRadius: 24, background: '#F5F4EF'}}>
          <div style={{width: 90, height: 90, borderRadius: 18, background: '#E6E3DA'}} />
          <div style={{fontSize: 34, fontWeight: 800}}>Your new post</div>
        </div>
        <div style={{position: 'relative', marginTop: 30}}>
          <div style={{display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 18}}>
            {Array.from({length: DOTS}).map((_, i) => {
              const shown = SHOWN.has(i);
              const dim = shown ? 0 : filt;
              return (
                <div
                  key={i}
                  style={{
                    height: 86,
                    borderRadius: 999,
                    background: shown && filt > 0.5 ? C.yellow : '#D9D6CC',
                    opacity: 1 - dim * 0.65,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transform: `scale(${shown ? 1 + 0.08 * filt : 1 - 0.15 * filt})`,
                  }}
                >
                  {shown && f >= eyesAt ? (
                    <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="2.2">
                      <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" />
                      <circle cx="12" cy="12" r="3" fill="#111" />
                    </svg>
                  ) : (
                    <UserIcon size={40} color={shown && filt > 0.5 ? '#111' : '#9C998F'} stroke={2.2} />
                  )}
                </div>
              );
            })}
          </div>
          {filt > 0 && filt < 1 && (
            <div style={{position: 'absolute', left: -20, right: -20, top: `${filt * 100}%`, height: 8, background: C.yellow, borderRadius: 8, boxShadow: '0 0 24px rgba(255,200,0,0.8)'}} />
          )}
        </div>
      </LightCard>
    </Stage>
  );
};

/* ---------- FACT 3: your website is yours ---------- */
export const OwnedSite: React.FC<{ownAt: number}> = ({ownAt}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const p = useSp(0);
  const tag = f >= ownAt ? sp(f - ownAt, fps, 260, 12) : 0;
  return (
    <Stage y={540}>
      <div style={{position: 'relative', transform: `translateY(${(1 - p) * 40}px)`, opacity: p}}>
        <LightCard style={{width: 800, padding: 0, overflow: 'hidden'}}>
          <div style={{display: 'flex', alignItems: 'center', gap: 12, padding: '20px 26px', background: '#EFEDE6'}}>
            {['#FF5F57', '#FEBC2E', '#28C840'].map((c) => (
              <div key={c} style={{width: 18, height: 18, borderRadius: 99, background: c}} />
            ))}
            <div style={{marginLeft: 14, flex: 1, background: '#fff', borderRadius: 99, padding: '8px 22px', fontSize: 28, color: '#555', fontWeight: 600}}>yourbusiness.com</div>
          </div>
          <div style={{padding: 40}}>
            <Tag text="FACT 3" />
            <div style={{fontFamily: DISPLAY, fontWeight: 900, fontSize: 64, lineHeight: 1.05, marginTop: 26}}>Roof repair in Springfield</div>
            <div style={{fontSize: 32, color: '#555', marginTop: 14, fontWeight: 500}}>Services · Prices · Reviews · FAQ</div>
            <div style={{display: 'inline-block', marginTop: 28, padding: '20px 36px', borderRadius: 18, background: '#111', color: C.yellow, fontSize: 34, fontWeight: 800}}>Book a visit →</div>
          </div>
        </LightCard>
        {tag > 0 && (
          <div
            style={{
              position: 'absolute',
              right: -10,
              top: 110,
              padding: '18px 34px',
              background: C.yellow,
              color: '#111',
              borderRadius: 20,
              fontFamily: DISPLAY,
              fontWeight: 900,
              fontSize: 64,
              transform: `rotate(${-8 + 4 * tag}deg) scale(${tag})`,
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
            }}
          >
            YOURS
          </div>
        )}
      </div>
    </Stage>
  );
};

/* ---------- 24/7 clock ---------- */
export const AroundTheClock: React.FC = () => {
  const f = useCurrentFrame();
  const p = useSp(0);
  const hour = (f * 9) % 360;
  const minute = (f * 108) % 360;
  return (
    <Stage y={560}>
      <div style={{display: 'flex', alignItems: 'center', gap: 50, transform: `scale(${0.9 + 0.1 * p})`, opacity: p}}>
        <LightCard style={{width: 420, height: 420, borderRadius: 999, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
          {Array.from({length: 12}).map((_, i) => (
            <div key={i} style={{position: 'absolute', width: 10, height: i % 3 ? 22 : 40, background: '#111', borderRadius: 6, transform: `rotate(${i * 30}deg) translateY(-170px)`}} />
          ))}
          <div style={{position: 'absolute', width: 16, height: 120, background: '#111', borderRadius: 8, transform: `rotate(${hour}deg) translateY(-50px)`}} />
          <div style={{position: 'absolute', width: 10, height: 160, background: C.yellow, borderRadius: 8, border: '2px solid #111', transform: `rotate(${minute}deg) translateY(-70px)`}} />
          <div style={{width: 30, height: 30, borderRadius: 99, background: '#111'}} />
        </LightCard>
        <div style={{fontFamily: DISPLAY, fontWeight: 900, fontSize: 150, color: '#111'}}>
          <Marker>24/7</Marker>
        </div>
      </div>
    </Stage>
  );
};

/* ---------- Night booking ---------- */
export const NightBooking: React.FC<{bookAt: number}> = ({bookAt}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const p = useSp(0);
  const n = f >= bookAt ? sp(f - bookAt, fps, 240, 14) : 0;
  return (
    <Stage y={560}>
      <div style={{width: 800, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 40, opacity: p}}>
        <svg width="220" height="220" viewBox="0 0 24 24">
          <path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z" fill="#111" />
          <circle cx="18" cy="5" r="1.1" fill={C.yellow} />
          <circle cx="21" cy="9" r="0.8" fill={C.yellow} />
        </svg>
        <LightCard style={{width: 760, padding: '28px 32px', display: 'flex', alignItems: 'center', gap: 24, transform: `translateY(${(1 - n) * -60}px) scale(${0.85 + 0.15 * n})`, opacity: n}}>
          <div style={{width: 96, height: 96, borderRadius: 26, background: C.yellow, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0}}>
            <CalendarIcon size={58} color="#111" stroke={2.2} />
          </div>
          <div>
            <div style={{fontSize: 40, fontWeight: 800}}>New booking ✓</div>
            <div style={{fontSize: 30, color: '#666', fontWeight: 600}}>2:14 AM · from your website</div>
          </div>
        </LightCard>
      </div>
    </Stage>
  );
};

/* ---------- Social → attention → Website → clients ---------- */
const Node: React.FC<{icon: React.ReactNode; label: string; on: number}> = ({icon, label, on}) => (
  <div
    style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 14,
      opacity: 0.35 + 0.65 * on,
      transform: `scale(${0.9 + 0.1 * on})`,
    }}
  >
    <div
      style={{
        width: 190,
        height: 190,
        borderRadius: 48,
        background: on > 0.5 ? C.yellow : '#fff',
        border: '2px solid #E6E3DA',
        boxShadow: '0 20px 50px rgba(30,25,10,0.12)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {icon}
    </div>
    <div style={{fontFamily: DISPLAY, fontWeight: 900, fontSize: 40, color: '#111'}}>{label}</div>
  </div>
);

export const Funnel: React.FC<{socialAt: number; attentionAt: number; siteAt: number; clientsAt: number}> = ({socialAt, attentionAt, siteAt, clientsAt}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const on = (at: number) => (f >= at ? sp(f - at, fps, 220) : 0);
  const arrow = (from: number, to: number) => interpolate(f, [from, to], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const eye = (
    <svg width="96" height="96" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="2">
      <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" />
      <circle cx="12" cy="12" r="3" fill="#111" />
    </svg>
  );
  const Arrow: React.FC<{p: number}> = ({p}) => (
    <div style={{width: 10, height: 70, position: 'relative'}}>
      <div style={{position: 'absolute', inset: 0, background: '#111', borderRadius: 6, transform: `scaleY(${p})`, transformOrigin: 'top'}} />
    </div>
  );
  return (
    <Stage y={590}>
      <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10}}>
        <div style={{display: 'flex', gap: 60, alignItems: 'flex-end'}}>
          <Node icon={<UserIcon size={100} color="#111" stroke={1.8} />} label="Social" on={on(socialAt)} />
          <Node icon={eye} label="Attention" on={on(attentionAt)} />
        </div>
        <Arrow p={arrow(attentionAt + 6, siteAt)} />
        <div style={{display: 'flex', gap: 60, alignItems: 'flex-start'}}>
          <Node icon={<Globe size={100} color="#111" stroke={1.8} />} label="Website" on={on(siteAt)} />
          <Node icon={<Check size={100} color="#111" stroke={2.6} />} label="Clients" on={on(clientsAt)} />
        </div>
      </div>
    </Stage>
  );
};

/* ---------- Follow pill under the presenter ---------- */
export const FollowPill: React.FC<{at: number}> = ({at}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const p = f >= at ? sp(f - at, fps, 220) : 0;
  const pulse = 1 + 0.04 * Math.sin(f / 4);
  return (
    <div style={{position: 'absolute', left: 0, right: 0, top: '86%', display: 'flex', justifyContent: 'center'}}>
      <div
        style={{
          padding: '22px 52px',
          borderRadius: 999,
          background: C.yellow,
          color: '#111',
          fontFamily: UI,
          fontWeight: 800,
          fontSize: 48,
          boxShadow: '0 20px 40px rgba(0,0,0,0.18)',
          transform: `scale(${p * pulse})`,
        }}
      >
        + Follow
      </div>
    </div>
  );
};
