import React from 'react';
import {Easing, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {C, DISPLAY, UI} from '../../brand';
import {BlackButton, BrutalCard, Field, Stamp, StepBadge} from '../../ui/Brutal';
import {Stage} from '../../ui/Common';
import {Bolt, CalendarIcon, Check, Globe, Kanban, Mail} from '../../ui/Icons';

const sp = (frame: number, fps: number, stiffness = 220, damping = 14) =>
  spring({frame, fps, config: {damping, stiffness, mass: 0.6}});

const usePop = (at: number, stiffness = 220) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  return sp(f - at, fps, stiffness);
};

const MESSAGE = 'Need a quote for a roof repair this week.';

/* ---------- 1. Contact form (+ flatline on "die") ---------- */
export const ContactForm: React.FC<{dieAt?: number; typed?: {name: number; msg: number}; sendAt?: number}> = ({dieAt, typed, sendAt}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const dead = dieAt !== undefined && f >= dieAt;
  const deadP = dieAt !== undefined ? sp(f - dieAt, fps, 160) : 0;
  const nameTxt = typed ? 'Jordan'.slice(0, Math.max(0, Math.floor((f - typed.name) * 0.9))) : '';
  const msgTxt = typed ? MESSAGE.slice(0, Math.max(0, Math.floor((f - typed.msg) * 3))) : '';
  const sent = sendAt !== undefined && f >= sendAt;
  const sentP = sendAt !== undefined ? sp(f - sendAt, fps, 260) : 0;
  // ECG: a heartbeat that goes flat on "die"
  const w = 760;
  const pts: string[] = [];
  for (let x = 0; x <= w; x += 8) {
    const phase = (x + f * 14) % 190;
    let y = 0;
    if (!dead || x > w * Math.min(1, deadP * 1.2)) {
      if (phase > 60 && phase < 70) y = -14;
      else if (phase >= 70 && phase < 80) y = 60;
      else if (phase >= 80 && phase < 90) y = -90;
      else if (phase >= 90 && phase < 100) y = 30;
    }
    pts.push(`${x},${y}`);
  }
  return (
    <Stage y={700}>
      <div style={{position: 'relative', transform: `rotate(${deadP * -3}deg)`}}>
        <BrutalCard style={{width: 800, padding: '34px 40px', filter: dead ? `grayscale(${deadP})` : undefined}}>
          <div style={{fontFamily: DISPLAY, fontWeight: 900, fontSize: 52, marginBottom: 24}}>Get a free quote</div>
          <Field label="Name" value={nameTxt} />
          <Field label="Email" value={typed && f > typed.name + 10 ? 'jordan@email.com'.slice(0, Math.floor((f - typed.name - 10) * 2)) : ''} />
          <Field label="Message" value={msgTxt} tall caret={!!typed && !sent && f % 16 < 9} />
          <BlackButton label={sent ? 'Sent ✓' : 'Send →'} pressed={sendAt !== undefined && f >= sendAt - 2 && f < sendAt + 3} />
        </BrutalCard>
        {dieAt !== undefined && (
          <svg width={w} height="200" viewBox={`0 -100 ${w} 200`} style={{position: 'absolute', left: 20, top: 330, overflow: 'visible'}}>
            <polyline points={pts.join(' ')} fill="none" stroke={dead ? '#E0261B' : '#0B0B0B'} strokeWidth="10" strokeLinejoin="round" strokeLinecap="round" />
          </svg>
        )}
        {sent && (
          <div
            style={{
              position: 'absolute',
              right: -10,
              top: -40,
              padding: '14px 26px',
              background: '#0B0B0B',
              color: C.yellow,
              borderRadius: 999,
              fontFamily: UI,
              fontWeight: 800,
              fontSize: 34,
              transform: `scale(${sentP})`,
            }}
          >
            Request sent ✓
          </div>
        )}
      </div>
    </Stage>
  );
};

/* ---------- 2. Inbox, buried under newsletters ---------- */
const NEWS = [
  ['Weekly Digest', '10 tips to grow your audience'],
  ['SALE ends tonight', 'Up to 50% off everything'],
  ['Webinar tomorrow', 'Save your seat now'],
  ['Your receipt', 'Thanks for your order'],
  ['Product update', 'See what’s new this month'],
  ['Last chance!', 'Your cart is waiting'],
];

const Row: React.FC<{from: string; subject: string; bold?: boolean; dim?: boolean; icon?: React.ReactNode}> = ({from, subject, bold, dim, icon}) => (
  <div style={{display: 'flex', alignItems: 'center', gap: 18, padding: '18px 8px', borderBottom: '3px solid #0B0B0B', opacity: dim ? 0.45 : 1}}>
    <div style={{width: 18, height: 18, borderRadius: 99, background: bold ? '#2563EB' : 'transparent', flexShrink: 0}} />
    {icon}
    <div style={{flex: 1, minWidth: 0}}>
      <div style={{fontSize: 32, fontWeight: bold ? 900 : 700}}>{from}</div>
      <div style={{fontSize: 27, color: '#444', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>{subject}</div>
    </div>
  </div>
);

export const Inbox: React.FC<{leadAt: number; pileAt: number[]}> = ({leadAt, pileAt}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const arrived = pileAt.filter((a) => f >= a).length;
  const leadIn = sp(f - leadAt, fps, 260);
  return (
    <Stage y={690}>
      <BrutalCard style={{width: 800, padding: '26px 30px', height: 860, overflow: 'hidden'}}>
        <div style={{display: 'flex', alignItems: 'center', gap: 14, fontFamily: DISPLAY, fontWeight: 900, fontSize: 48, marginBottom: 10}}>
          <Mail size={52} color="#0B0B0B" stroke={2.6} /> Inbox
          <span style={{marginLeft: 'auto', fontFamily: UI, fontSize: 28, background: '#0B0B0B', color: C.yellow, borderRadius: 999, padding: '6px 18px'}}>
            {arrived + (f >= leadAt ? 1 : 0)} new
          </span>
        </div>
        <div style={{position: 'relative'}}>
          {pileAt.map((a, i) => {
            if (f < a) return null;
            const p = sp(f - a, fps, 300);
            return (
              <div key={i} style={{transform: `translateY(${(1 - p) * -60}px)`, opacity: p}}>
                <Row from={NEWS[i % NEWS.length][0]} subject={NEWS[i % NEWS.length][1]} />
              </div>
            );
          }).reverse()}
          {f >= leadAt && (
            <div style={{transform: `scale(${0.9 + 0.1 * leadIn})`, opacity: leadIn, background: arrived ? 'transparent' : C.yellow, borderRadius: 12}}>
              <Row from="Website form" subject={`Quote request: “${MESSAGE}”`} bold dim={arrived >= 4} />
            </div>
          )}
        </div>
      </BrutalCard>
    </Stage>
  );
};

/* ---------- 3. Nobody sees it ---------- */
export const Unseen: React.FC = () => {
  const f = useCurrentFrame();
  const p = usePop(0);
  const slash = interpolate(f, [6, 14], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});
  return (
    <Stage y={680}>
      <div style={{position: 'relative', width: 520, height: 520, transform: `scale(${0.6 + 0.4 * p})`}}>
        <BrutalCard style={{width: 520, height: 520, borderRadius: 999, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
          <svg width="330" height="330" viewBox="0 0 24 24" fill="none" stroke="#0B0B0B" strokeWidth="1.8" strokeLinecap="round">
            <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" />
            <circle cx="12" cy="12" r="3" fill="#0B0B0B" />
          </svg>
        </BrutalCard>
        <div
          style={{
            position: 'absolute',
            left: 40,
            top: 250,
            width: `${slash * 470}px`,
            height: 34,
            background: '#E0261B',
            borderRadius: 99,
            transform: 'rotate(-40deg)',
            transformOrigin: 'left center',
            marginTop: 120,
          }}
        />
      </div>
    </Stage>
  );
};

/* ---------- 4. No reply ---------- */
export const NoReply: React.FC<{stampAt: number}> = ({stampAt}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const sP = f >= stampAt ? sp(f - stampAt, fps, 380, 16) : 0;
  return (
    <Stage y={690}>
      <div style={{position: 'relative', width: 800}}>
        <BrutalCard style={{width: 800, padding: 32}}>
          <div style={{fontFamily: DISPLAY, fontWeight: 900, fontSize: 40, marginBottom: 22}}>Jordan</div>
          <div style={{background: '#EDEDE8', border: '4px solid #0B0B0B', borderRadius: '28px 28px 28px 8px', padding: '22px 26px', fontSize: 34, fontWeight: 600, width: 560}}>
            Hi! Did you get my request? Need it this week.
          </div>
          <div style={{fontSize: 26, color: '#555', marginTop: 12, fontWeight: 700}}>Sent · 2 days ago</div>
          <div style={{height: 150, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', fontSize: 30, color: '#999', fontWeight: 700}}>no response</div>
        </BrutalCard>
        {sP > 0 && <Stamp text="NO REPLY" p={sP} style={{left: 190, top: 150}} />}
      </div>
    </Stage>
  );
};

/* ---------- 5. They book someone else ---------- */
export const BookedElsewhere: React.FC<{cardAt: number; markAt: number}> = ({cardAt, markAt}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const p = sp(f - cardAt, fps, 240);
  const mark = interpolate(f, [markAt, markAt + 8], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <Stage y={690}>
      <BrutalCard style={{width: 800, padding: 40, transform: `translateY(${(1 - p) * 140}px) rotate(${(1 - p) * 6}deg)`, opacity: f >= cardAt ? 1 : 0}}>
        <div style={{display: 'flex', alignItems: 'center', gap: 18}}>
          <div style={{width: 92, height: 92, borderRadius: 26, background: '#0B0B0B', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
            <CalendarIcon size={56} color={C.yellow} stroke={2.4} />
          </div>
          <div>
            <div style={{fontFamily: DISPLAY, fontWeight: 900, fontSize: 50}}>Booked ✓</div>
            <div style={{fontSize: 30, fontWeight: 600, color: '#444'}}>Tue · 10:00 AM</div>
          </div>
        </div>
        <div style={{marginTop: 30, fontSize: 30, fontWeight: 700, color: '#555'}}>with</div>
        <div style={{position: 'relative', display: 'inline-block', marginTop: 6}}>
          <div
            style={{
              position: 'absolute',
              left: -10,
              right: -10,
              top: '15%',
              bottom: '5%',
              background: '#FF6A3D',
              transform: `scaleX(${mark})`,
              transformOrigin: 'left',
              borderRadius: 8,
              opacity: 0.9,
            }}
          />
          <div style={{position: 'relative', fontFamily: DISPLAY, fontWeight: 900, fontSize: 62}}>Other Roofing Co.</div>
        </div>
      </BrutalCard>
    </Stage>
  );
};

/* ---------- 6. Fix it in 3 steps ---------- */
export const ThreeSteps: React.FC = () => {
  const p = usePop(0, 200);
  return (
    <Stage y={680}>
      <BrutalCard dark style={{width: 640, height: 640, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', transform: `scale(${0.5 + 0.5 * p}) rotate(${(1 - p) * -10}deg)`}}>
        <div style={{fontFamily: DISPLAY, fontWeight: 900, fontSize: 380, lineHeight: 0.9, color: C.yellow}}>3</div>
        <div style={{fontFamily: DISPLAY, fontWeight: 900, fontSize: 72, color: C.yellow, letterSpacing: '0.08em'}}>STEPS</div>
      </BrutalCard>
    </Stage>
  );
};

/* ---------- 7. Step cards ---------- */
const StepFrame: React.FC<{n: number; title: string; children: React.ReactNode}> = ({n, title, children}) => {
  const p = usePop(0, 260);
  return (
    <Stage y={690}>
      <div style={{width: 800, transform: `translateX(${(1 - p) * 120}px)`, opacity: p}}>
        <div style={{display: 'flex', alignItems: 'center', gap: 24, marginBottom: 30}}>
          <StepBadge n={n} />
          <div style={{fontFamily: DISPLAY, fontWeight: 900, fontSize: 58, color: '#0B0B0B', lineHeight: 1.05}}>{title}</div>
        </div>
        {children}
      </div>
    </Stage>
  );
};

export const StepAlert: React.FC<{alertAt: number}> = ({alertAt}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const p = sp(f - alertAt, fps, 280);
  const shake = f >= alertAt && f < alertAt + 10 ? Math.sin((f - alertAt) * 2.4) * 8 * (1 - (f - alertAt) / 10) : 0;
  return (
    <StepFrame n={1} title="Instant alert">
      <div style={{display: 'flex', justifyContent: 'center'}}>
        <div style={{width: 470, height: 560, borderRadius: 64, background: '#0B0B0B', padding: 18, transform: `rotate(${shake * 0.4}deg) translateX(${shake}px)`, boxShadow: '16px 16px 0 rgba(0,0,0,0.25)'}}>
          <div style={{width: '100%', height: '100%', borderRadius: 48, background: 'linear-gradient(180deg,#1b1b1b,#0b0b0b)', padding: 22, position: 'relative', overflow: 'hidden'}}>
            <div style={{color: '#fff', fontFamily: UI, fontWeight: 700, fontSize: 92, textAlign: 'center', marginTop: 30}}>9:04</div>
            {f >= alertAt && (
              <div
                style={{
                  marginTop: 40,
                  background: '#2A2A2A',
                  borderRadius: 26,
                  padding: '18px 20px',
                  display: 'flex',
                  gap: 14,
                  alignItems: 'center',
                  transform: `translateY(${(1 - p) * -60}px) scale(${0.85 + 0.15 * p})`,
                  opacity: p,
                  fontFamily: UI,
                }}
              >
                <div style={{width: 58, height: 58, borderRadius: 16, background: C.yellow, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                  <Globe size={36} color="#000" stroke={2.4} />
                </div>
                <div>
                  <div style={{color: '#fff', fontSize: 28, fontWeight: 800}}>New lead · now</div>
                  <div style={{color: '#bbb', fontSize: 23}}>Quote request: roof repair</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </StepFrame>
  );
};

export const StepReply: React.FC<{sentAt: number}> = ({sentAt}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const p = sp(f - sentAt, fps, 260);
  return (
    <StepFrame n={2} title="Auto-reply">
      <BrutalCard style={{padding: 32}}>
        <div style={{display: 'flex', alignItems: 'center', gap: 14, fontSize: 30, fontWeight: 800}}>
          <Bolt size={40} color="#0B0B0B" stroke={2.4} /> Re: Quote request
        </div>
        <div style={{fontSize: 34, fontWeight: 600, marginTop: 18, lineHeight: 1.3}}>
          Thanks, Jordan! We got your request. Pick a time that works for you →
        </div>
        {f >= sentAt && (
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 10,
              marginTop: 22,
              padding: '10px 20px',
              borderRadius: 999,
              background: '#0B0B0B',
              color: C.yellow,
              fontSize: 28,
              fontWeight: 800,
              transform: `scale(${p})`,
            }}
          >
            <Check size={30} color={C.yellow} stroke={3.4} /> Sent automatically
          </div>
        )}
      </BrutalCard>
    </StepFrame>
  );
};

const COLS = ['New', 'Contacted', 'Booked'];
export const StepCrm: React.FC<{cards: {col: number; title: string; at: number}[]}> = ({cards}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  return (
    <StepFrame n={3} title="Every lead in a CRM">
      <div style={{display: 'flex', gap: 14}}>
        {COLS.map((c, ci) => (
          <BrutalCard key={c} shadow={10} style={{flex: 1, minHeight: 420, padding: 14, borderRadius: 22}}>
            <div style={{fontSize: 24, fontWeight: 900, textTransform: 'uppercase', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8}}>
              {ci === 0 ? <Kanban size={26} color="#0B0B0B" stroke={2.6} /> : null}
              {c}
            </div>
            {cards
              .filter((k) => k.col === ci && f >= k.at)
              .map((k) => {
                const p = sp(f - k.at, fps, 260);
                return (
                  <div
                    key={k.title}
                    style={{
                      background: C.yellow,
                      border: '4px solid #0B0B0B',
                      borderRadius: 14,
                      padding: '12px 10px',
                      marginBottom: 10,
                      fontSize: 24,
                      fontWeight: 800,
                      transform: `translateY(${(1 - p) * -100}px) rotate(${(1 - p) * 8}deg)`,
                    }}
                  >
                    {k.title}
                  </div>
                );
              })}
          </BrutalCard>
        ))}
      </div>
    </StepFrame>
  );
};

/* ---------- 8. Nothing gets lost: chain ---------- */
const CHAIN = [
  {label: 'Form', icon: Globe},
  {label: 'Alert', icon: Bolt},
  {label: 'Reply', icon: Mail},
  {label: 'CRM', icon: Kanban},
];
export const Chain: React.FC<{every?: number}> = ({every = 5}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  return (
    <Stage y={690}>
      <div style={{display: 'flex', flexDirection: 'column', gap: 0, alignItems: 'center'}}>
        {CHAIN.map((c, i) => {
          const at = i * every;
          const p = sp(f - at, fps, 280);
          const on = f >= at;
          const Icon = c.icon;
          return (
            <React.Fragment key={c.label}>
              {i > 0 && <div style={{width: 10, height: 44, background: '#0B0B0B', transform: `scaleY(${on ? p : 0.2})`, transformOrigin: 'top'}} />}
              <BrutalCard
                dark={on}
                shadow={10}
                style={{width: 520, padding: '18px 26px', display: 'flex', alignItems: 'center', gap: 20, borderRadius: 999, transform: `scale(${on ? 0.9 + 0.1 * p : 0.9})`}}
              >
                <Icon size={52} color={on ? C.yellow : '#0B0B0B'} stroke={2.6} />
                <div style={{flex: 1, fontFamily: DISPLAY, fontWeight: 900, fontSize: 52}}>{c.label.toUpperCase()}</div>
                {on ? <Check size={52} color={C.yellow} stroke={3.4} /> : null}
              </BrutalCard>
            </React.Fragment>
          );
        })}
      </div>
    </Stage>
  );
};

/* ---------- 9. We build this ---------- */
export const WeBuild: React.FC = () => {
  const p = usePop(0, 220);
  return (
    <Stage y={680}>
      <BrutalCard dark style={{width: 720, padding: '56px 40px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 26, transform: `scale(${0.6 + 0.4 * p})`}}>
        <div style={{width: 140, height: 140, borderRadius: 36, background: C.yellow, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
          <div style={{width: 58, height: 58, background: '#0B0B0B', transform: 'rotate(45deg)'}} />
        </div>
        {['Websites', 'Lead systems', 'AI automation'].map((t, i) => (
          <div key={t} style={{fontFamily: DISPLAY, fontWeight: 900, fontSize: 56, color: i === 1 ? '#fff' : C.yellow}}>
            {t}
          </div>
        ))}
      </BrutalCard>
    </Stage>
  );
};

/* ---------- 10. Link in bio ---------- */
export const LinkInBio: React.FC<{tapAt: number}> = ({tapAt}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const p = sp(f, fps, 220);
  const pulse = 1 + 0.04 * Math.sin(f / 4);
  const tap = f >= tapAt && f < tapAt + 8;
  const arrow = Math.sin(f / 5) * 14;
  return (
    <Stage y={700}>
      <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 60, transform: `scale(${0.6 + 0.4 * p})`}}>
        <div style={{fontSize: 200, lineHeight: 1, transform: `translate(${arrow}px, ${-arrow}px)`, fontFamily: DISPLAY, fontWeight: 900, color: '#0B0B0B'}}>↗</div>
        <BlackButton label="LINK IN BIO" pressed={tap} style={{fontSize: 76, padding: '36px 64px', borderRadius: 28, transform: `scale(${pulse}) translate(${tap ? 6 : 0}px, ${tap ? 6 : 0}px)`}} />
      </div>
    </Stage>
  );
};
