import React from 'react';
import {AbsoluteFill, Easing, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {C, DISPLAY, UI} from '../../brand';
import {Browser, Line} from '../../ui/Browser';
import {AssistantText, BizCard, ChatFrame, ChatInput, TypingDots, UserBubble} from '../../ui/Chat';
import {Check, Cross, Dice, Globe, ImageIcon, Pin, Plus, Search, Sparkle, UserIcon, Wrench} from '../../ui/Icons';

/** Stage: visual area above the captions, centred in the TikTok-safe column. */
export const Stage: React.FC<{children: React.ReactNode; y?: number}> = ({children, y = 680}) => (
  <AbsoluteFill>
    <div
      style={{
        position: 'absolute',
        left: 130,
        width: 800,
        top: y,
        transform: 'translateY(-50%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      {children}
    </div>
  </AbsoluteFill>
);

/** Spring pop-in helper: returns 0..1 starting at local frame `at`. */
const usePop = (at: number, stiff = 220) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  return spring({frame: f - at, fps, config: {damping: 13, stiffness: stiff, mass: 0.6}});
};

const typed = (text: string, f: number, start: number, cps: number) =>
  text.slice(0, Math.max(0, Math.min(text.length, Math.floor(((f - start) / 30) * cps))));

export const ROOFERS = [
  {name: 'Summit Roofing Co.', meta: 'Roofing · 2.1 mi'},
  {name: 'Ridgeline Roofers', meta: 'Roofing · 3.4 mi'},
  {name: 'Northside Roof Pros', meta: 'Roofing · 4.0 mi'},
];

/* ---------- 1. Hook: typing the question ---------- */
export const HookTyping: React.FC<{sendAt: number}> = ({sendAt}) => {
  const f = useCurrentFrame();
  const q = 'Who should I hire?';
  const text = typed(q, f, 0, 26);
  const sent = f >= sendAt;
  const bubble = usePop(sendAt, 260);
  return (
    <Stage>
      <ChatFrame>
        {sent ? (
          <>
            <UserBubble text={q} style={{transform: `translateY(${(1 - bubble) * 60}px) scale(${0.7 + 0.3 * bubble})`}} />
            <TypingDots frame={f} />
          </>
        ) : (
          <div style={{height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16}}>
            <Sparkle size={44} color={C.yellow} />
            <div style={{fontSize: 40, color: C.gray, fontWeight: 600}}>How can I help?</div>
          </div>
        )}
        <ChatInput text={sent ? '' : text} caret={!sent && f % 16 < 10} pressed={f >= sendAt - 2 && f < sendAt + 2} />
      </ChatFrame>
    </Stage>
  );
};

/* ---------- 2. "Are you there?" ghost slot ---------- */
export const GhostSlot: React.FC = () => {
  const f = useCurrentFrame();
  const p = usePop(0);
  const blink = 0.75 + 0.25 * Math.abs(Math.sin(f / 4));
  return (
    <Stage>
      <div style={{width: 800, display: 'flex', flexDirection: 'column', gap: 22, transform: `scale(${0.85 + 0.15 * p})`}}>
        {ROOFERS.slice(0, 2).map((r, i) => (
          <BizCard key={i} rank={i + 1} name={r.name} meta={r.meta} style={{opacity: 0.35, filter: 'blur(2px)'}} />
        ))}
        <BizCard
          rank="?"
          name="Your business?"
          meta="searching…"
          ghost
          accent
          style={{opacity: blink, transform: 'scale(1.06)', boxShadow: '0 0 60px rgba(255,230,0,0.3)'}}
        />
      </div>
    </Stage>
  );
};

/* ---------- 3. People search like this now ---------- */
const QUERIES = ['best dentist near me', 'who fixes iPhones fast?', 'top wedding photographer', 'plumber open now near me'];
export const QueryCloud: React.FC<{pops: number[]}> = ({pops}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  return (
    <Stage y={690}>
      <div style={{width: 800, display: 'flex', flexDirection: 'column', gap: 30}}>
        {QUERIES.map((q, i) => {
          const p = spring({frame: f - pops[i], fps, config: {damping: 12, stiffness: 240, mass: 0.6}});
          const left = i % 2 === 0;
          return (
            <div
              key={q}
              style={{
                alignSelf: left ? 'flex-start' : 'flex-end',
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                padding: '24px 32px',
                borderRadius: 999,
                background: i === QUERIES.length - 1 ? C.yellow : '#1C1C1C',
                border: `2px solid ${i === QUERIES.length - 1 ? C.yellow : C.line}`,
                color: i === QUERIES.length - 1 ? '#000' : C.white,
                fontFamily: UI,
                fontSize: 40,
                fontWeight: 700,
                opacity: f >= pops[i] ? 1 : 0,
                transform: `translateY(${(1 - p) * 50 - f * 0.6 * (i % 2 ? 1 : 0.6)}px) scale(${0.6 + 0.4 * p})`,
                boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
              }}
            >
              <Sparkle size={34} color={i === QUERIES.length - 1 ? '#000' : C.yellow} />
              {q}
            </div>
          );
        })}
      </div>
    </Stage>
  );
};

/* ---------- 4. Typing "best roofer near me" ---------- */
export const TypeQuery: React.FC<{wordStarts: number[]; sendAt: number}> = ({wordStarts, sendAt}) => {
  const f = useCurrentFrame();
  const words = ['best', 'roofer', 'near', 'me'];
  // reveal word by word in sync with the voice, letters typed quickly within each word
  let text = '';
  words.forEach((w, i) => {
    if (f >= wordStarts[i]) text += (i ? ' ' : '') + w.slice(0, Math.min(w.length, Math.floor((f - wordStarts[i]) * 1.6) + 1));
  });
  return (
    <Stage>
      <ChatFrame>
        <div style={{height: 110, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16}}>
          <Search size={44} color={C.gray} />
          <div style={{fontSize: 38, color: C.gray, fontWeight: 600}}>Searching the web…</div>
        </div>
        <ChatInput text={text} caret={f < sendAt} pressed={f >= sendAt && f < sendAt + 4} />
      </ChatFrame>
    </Stage>
  );
};

/* ---------- 5. AI gives three names ---------- */
export const ThreeNames: React.FC<{cardsAt: number[]}> = ({cardsAt}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  return (
    <Stage y={700}>
      <ChatFrame>
        <UserBubble text="best roofer near me" />
        <AssistantText text="Here are top picks near you:" />
        {ROOFERS.map((r, i) => {
          const p = spring({frame: f - cardsAt[i], fps, config: {damping: 13, stiffness: 240, mass: 0.6}});
          return (
            <BizCard
              key={r.name}
              rank={i + 1}
              name={r.name}
              meta={r.meta}
              style={{opacity: f >= cardsAt[i] ? 1 : 0, transform: `translateX(${(1 - p) * 140}px) scale(${0.85 + 0.15 * p})`}}
            />
          );
        })}
      </ChatFrame>
    </Stage>
  );
};

/* ---------- 6. Not yours ---------- */
export const NotYours: React.FC<{strikeAt: number}> = ({strikeAt}) => {
  const f = useCurrentFrame();
  const struck = f >= strikeAt;
  const s = usePop(strikeAt, 300);
  return (
    <Stage y={680}>
      <div style={{width: 800, display: 'flex', flexDirection: 'column', gap: 22}}>
        {ROOFERS.map((r, i) => (
          <BizCard key={r.name} rank={i + 1} name={r.name} meta={r.meta} style={{opacity: 0.4}} />
        ))}
        <div style={{position: 'relative'}}>
          <BizCard
            rank="?"
            name="Your business"
            meta={struck ? 'not recommended' : 'checking…'}
            ghost
            style={{
              opacity: struck ? 0.8 : 1,
              filter: struck ? 'grayscale(1)' : undefined,
              transform: `scale(${1.06 - 0.06 * s}) rotate(${struck ? -1.5 * s : 0}deg)`,
            }}
          />
          {struck && (
            <div
              style={{
                position: 'absolute',
                right: 26,
                top: '50%',
                width: 96,
                height: 96,
                borderRadius: 99,
                background: C.white,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transform: `translateY(-50%) scale(${s})`,
              }}
            >
              <Cross size={60} color="#000" stroke={3.4} />
            </div>
          )}
        </div>
      </div>
    </Stage>
  );
};

/* ---------- 7. Why? ---------- */
export const BigQuestion: React.FC = () => {
  const f = useCurrentFrame();
  const p = usePop(0, 260);
  return (
    <Stage y={660}>
      <div
        style={{
          fontFamily: DISPLAY,
          fontWeight: 900,
          fontSize: 560,
          lineHeight: 1,
          color: C.yellow,
          textShadow: '0 0 120px rgba(255,230,0,0.45)',
          transform: `scale(${0.5 + 0.5 * p}) rotate(${-8 + Math.sin(f / 5) * 3}deg)`,
        }}
      >
        ?
      </div>
    </Stage>
  );
};

/* ---------- 8. AI doesn't guess ---------- */
export const NoGuessing: React.FC<{strikeAt: number}> = ({strikeAt}) => {
  const f = useCurrentFrame();
  const p = usePop(0);
  const strike = interpolate(f, [strikeAt, strikeAt + 6], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});
  return (
    <Stage y={680}>
      <div style={{position: 'relative', width: 420, height: 420, transform: `scale(${0.6 + 0.4 * p}) rotate(${(1 - p) * -30 + Math.sin(f / 6) * 4}deg)`}}>
        <Dice size={420} color={C.white} stroke={1.6} />
        <div
          style={{
            position: 'absolute',
            left: -40,
            top: '50%',
            height: 34,
            width: `${strike * 500}px`,
            background: C.yellow,
            borderRadius: 99,
            transform: 'rotate(-35deg)',
            transformOrigin: 'left center',
            boxShadow: '0 0 40px rgba(255,230,0,0.6)',
            marginTop: 120,
          }}
        />
      </div>
    </Stage>
  );
};

/* ---------- 9. It reads the web ---------- */
const MiniPage: React.FC<{seed: number; lit: number}> = ({seed, lit}) => (
  <div style={{width: 240, height: 300, borderRadius: 18, background: '#1A1A1A', border: `2px solid ${C.line}`, padding: 18, display: 'flex', flexDirection: 'column', gap: 12}}>
    <div style={{height: 70, borderRadius: 10, background: '#262626'}} />
    {[0.9, 0.7, 0.8, 0.5, 0.75].map((w, i) => (
      <div
        key={i}
        style={{
          height: 14,
          width: `${w * 100 - ((seed * 7 + i * 13) % 20)}%`,
          borderRadius: 99,
          background: lit > 0 && i < lit ? C.yellow : '#333',
          opacity: lit > 0 && i < lit ? 0.9 : 1,
        }}
      />
    ))}
  </div>
);

export const ReadsTheWeb: React.FC = () => {
  const f = useCurrentFrame();
  const scanY = ((f * 26) % 1300) - 150;
  return (
    <AbsoluteFill>
      <div style={{position: 'absolute', left: 130, width: 800, top: 170, height: 960, overflow: 'hidden'}}>
        <div style={{display: 'flex', gap: 40, justifyContent: 'center'}}>
          {[0, 1, 2].map((col) => (
            <div key={col} style={{display: 'flex', flexDirection: 'column', gap: 40, transform: `translateY(${-f * (2 + col) - col * 120}px)`}}>
              {Array.from({length: 6}).map((_, i) => {
                const top = i * 340 - f * (2 + col) - col * 120;
                const lit = scanY > top ? Math.min(5, Math.floor((scanY - top) / 50)) : 0;
                return <MiniPage key={i} seed={col * 6 + i} lit={lit} />;
              })}
            </div>
          ))}
        </div>
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: scanY,
            height: 6,
            background: C.yellow,
            boxShadow: '0 0 40px 10px rgba(255,230,0,0.5)',
          }}
        />
      </div>
      <Stage y={680}>
        <div style={{width: 150, height: 150, borderRadius: 40, background: C.yellow, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 80px rgba(255,230,0,0.5)'}}>
          <Globe size={96} color="#000" stroke={2} />
        </div>
      </Stage>
    </AbsoluteFill>
  );
};

/* ---------- 10. The vague site ---------- */
const MissingTag: React.FC<{icon: React.ReactNode; label: string; at: number; f: number}> = ({icon, label, at, f}) => {
  const {fps} = useVideoConfig();
  const p = spring({frame: f - at, fps, config: {damping: 10, stiffness: 300, mass: 0.5}});
  const on = f >= at;
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '14px 22px',
        borderRadius: 999,
        border: `3px dashed ${on ? '#111' : '#C9C9C6'}`,
        background: on ? C.yellow : 'transparent',
        color: '#111',
        fontSize: 30,
        fontWeight: 800,
        transform: `scale(${on ? 0.7 + 0.3 * p : 1})`,
        opacity: on ? 1 : 0.5,
      }}
    >
      {icon}
      {on ? label : '???'}
    </div>
  );
};

export const VagueSite: React.FC<{scanUntil?: number; marks?: number[]; focus?: 'all' | 'hero'}> = ({scanUntil = 0, marks = [], focus = 'all'}) => {
  const f = useCurrentFrame();
  const scan = f < scanUntil ? interpolate(f, [0, scanUntil], [0, 100]) : -1;
  const zoom = focus === 'hero' ? 1.18 : 1;
  return (
    <Stage y={690}>
      <div style={{transform: `scale(${zoom})`, transformOrigin: '50% 35%'}}>
        <Browser url="yoursite.com">
          <div style={{position: 'relative', padding: '30px 44px 44px', display: 'flex', flexDirection: 'column', gap: 26}}>
            <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
              <div style={{width: 120, height: 44, borderRadius: 8, background: '#D2D2CF', color: '#8E8E8B', fontSize: 22, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                LOGO
              </div>
              <div style={{display: 'flex', gap: 22}}>
                <Line w={80} />
                <Line w={80} />
                <Line w={80} />
              </div>
            </div>
            <div style={{height: 160, borderRadius: 20, background: '#E2E2DF', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
              <ImageIcon size={90} color="#B5B5B2" stroke={1.6} />
            </div>
            <div style={{position: 'relative'}}>
              <div style={{fontSize: 56, fontWeight: 800, color: '#222', lineHeight: 1.1}}>Welcome to our website!</div>
              <div style={{fontSize: 32, color: '#777', marginTop: 14, fontWeight: 500}}>Quality solutions for all your needs.</div>
              {marks[0] !== undefined && f >= marks[0] && (
                <div
                  style={{
                    position: 'absolute',
                    right: -14,
                    top: -96,
                    width: 86,
                    height: 86,
                    borderRadius: 99,
                    background: C.yellow,
                    color: '#000',
                    fontFamily: DISPLAY,
                    fontWeight: 900,
                    fontSize: 60,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.35)',
                  }}
                >
                  ?
                </div>
              )}
            </div>
            <div style={{display: 'flex', gap: 16, flexWrap: 'wrap'}}>
              <MissingTag icon={<Search size={30} color="#111" stroke={3} />} label="What you do?" at={marks[1] ?? 1e9} f={f} />
              <MissingTag icon={<Pin size={30} color="#111" stroke={3} />} label="Where?" at={marks[2] ?? 1e9} f={f} />
              <MissingTag icon={<UserIcon size={30} color="#111" stroke={3} />} label="Who for?" at={marks[3] ?? 1e9} f={f} />
            </div>
            <div style={{alignSelf: 'flex-start', padding: '18px 34px', borderRadius: 12, border: '2px solid #BBB', color: '#777', fontSize: 30, fontWeight: 600}}>
              Learn more
            </div>
            {scan >= 0 && (
              <div
                style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  top: `${scan}%`,
                  height: 6,
                  background: C.yellow,
                  boxShadow: '0 0 40px 12px rgba(255,230,0,0.55)',
                }}
              />
            )}
          </div>
        </Browser>
      </div>
    </Stage>
  );
};

/* ---------- 11. AI can't recommend you ---------- */
export const CantRecommend: React.FC = () => {
  const p = usePop(0);
  return (
    <Stage y={690}>
      <ChatFrame>
        <UserBubble text="best roofer near me" />
        <AssistantText
          text="I couldn't find enough clear info about this business to recommend it."
          style={{transform: `scale(${0.8 + 0.2 * p})`, transformOrigin: 'left top', border: `3px solid ${C.white}`}}
        />
      </ChatFrame>
    </Stage>
  );
};

/* ---------- 12. Fix it ---------- */
export const FixIt: React.FC = () => {
  const f = useCurrentFrame();
  const p = usePop(0, 200);
  return (
    <Stage y={680}>
      <div
        style={{
          width: 440,
          height: 440,
          borderRadius: 120,
          background: C.yellow,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 0 160px rgba(255,230,0,0.5)',
          transform: `scale(${0.4 + 0.6 * p}) rotate(${(1 - p) * 180 + Math.sin(f / 4) * 3}deg)`,
        }}
      >
        <Wrench size={260} color="#000" stroke={1.8} />
      </div>
    </Stage>
  );
};

/* ---------- 13. The fixed site ---------- */
const CheckDot: React.FC<{at: number; f: number}> = ({at, f}) => {
  const {fps} = useVideoConfig();
  const p = spring({frame: f - at, fps, config: {damping: 9, stiffness: 320, mass: 0.5}});
  if (f < at) return null;
  return (
    <div
      style={{
        width: 70,
        height: 70,
        flexShrink: 0,
        borderRadius: 99,
        background: '#111',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transform: `scale(${p})`,
        boxShadow: '0 0 0 6px rgba(255,230,0,0.9)',
      }}
    >
      <Check size={44} color={C.yellow} stroke={3.6} />
    </div>
  );
};

const FAQ = ['How much does a roof repair cost?', 'Do you offer free inspections?', 'How fast can you come out?'];

export const FixedSite: React.FC<{
  focus: 'services' | 'city' | 'faq' | 'faqOpen';
  checks: {services?: number; city?: number; faq?: number};
  faqAt?: number[];
  rewriteAt?: number;
}> = ({focus, checks, faqAt = [], rewriteAt}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  // camera "inside the browser": zoom/scroll the page, the window itself stays put
  const focusMap = {services: {s: 1.08, scroll: 0}, city: {s: 1.1, scroll: 110}, faq: {s: 1.0, scroll: 290}, faqOpen: {s: 1.08, scroll: 380}};
  const fo = focusMap[focus];
  const headline = rewriteAt !== undefined && f < rewriteAt ? 'Welcome to our website!' : 'Roof Repair & Replacement';
  return (
    <Stage y={690}>
      <div>
        <Browser url="yoursite.com" viewportHeight={860}>
          <div
            style={{
              padding: '30px 44px 40px',
              display: 'flex',
              flexDirection: 'column',
              gap: 26,
              transform: `translateY(${-fo.scroll}px) scale(${fo.s})`,
              transformOrigin: 'top center',
            }}
          >
            <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
              <div style={{display: 'flex', alignItems: 'center', gap: 12, fontSize: 30, fontWeight: 800, color: '#111'}}>
                <div style={{width: 44, height: 44, borderRadius: 12, background: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                  <div style={{width: 18, height: 18, background: C.yellow, transform: 'rotate(45deg)'}} />
                </div>
                Your Roofing Co.
              </div>
              <div style={{padding: '12px 22px', borderRadius: 999, background: '#111', color: C.yellow, fontSize: 24, fontWeight: 800}}>Call now</div>
            </div>
            <div style={{display: 'flex', alignItems: 'center', gap: 20}}>
              <div style={{fontSize: 60, fontWeight: 800, color: '#111', lineHeight: 1.05, flex: 1}}>{headline}</div>
              {checks.services !== undefined && <CheckDot at={checks.services} f={f} />}
            </div>
            <div style={{display: 'flex', alignItems: 'center', gap: 20}}>
              <div style={{display: 'flex', alignItems: 'center', gap: 12, fontSize: 34, fontWeight: 700, color: '#333', flex: 1}}>
                <Pin size={40} color="#111" stroke={2.6} />
                Serving Springfield &amp; nearby
              </div>
              {checks.city !== undefined && <CheckDot at={checks.city} f={f} />}
            </div>
            <div style={{alignSelf: 'flex-start', padding: '22px 40px', borderRadius: 16, background: '#111', color: C.yellow, fontSize: 32, fontWeight: 800}}>
              Book an inspection →
            </div>
            <div style={{marginTop: 6, display: 'flex', alignItems: 'center', gap: 20}}>
              <div style={{fontSize: 34, fontWeight: 800, color: '#111', flex: 1}}>FAQ</div>
              {checks.faq !== undefined && <CheckDot at={checks.faq} f={f} />}
            </div>
            {FAQ.map((q, i) => {
              const at = faqAt[i] ?? -1000;
              const p = spring({frame: f - at, fps, config: {damping: 13, stiffness: 240, mass: 0.6}});
              const open = i === 0 && faqAt.length > 3 && f >= faqAt[3];
              return (
                <div
                  key={q}
                  style={{
                    background: '#FFFFFF',
                    borderRadius: 18,
                    padding: '22px 26px',
                    border: open ? '3px solid #111' : '2px solid #E1E1DE',
                    opacity: f >= at ? 1 : 0,
                    transform: `translateY(${(1 - p) * 40}px)`,
                  }}
                >
                  <div style={{display: 'flex', justifyContent: 'space-between', fontSize: 30, fontWeight: 700, color: '#222'}}>
                    {q}
                    <span style={{color: '#111'}}>{open ? '−' : '+'}</span>
                  </div>
                  {open && (
                    <div style={{display: 'flex', flexDirection: 'column', gap: 10, marginTop: 16}}>
                      <Line w="92%" h={16} />
                      <Line w="70%" h={16} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Browser>
      </div>
    </Stage>
  );
};

/* ---------- 14. Payoff: you're on the list ---------- */
export const PickYou: React.FC<{revealAt: number}> = ({revealAt}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const p = spring({frame: f - revealAt, fps, config: {damping: 11, stiffness: 220, mass: 0.7}});
  const on = f >= revealAt;
  return (
    <Stage y={700}>
      <ChatFrame glow={on}>
        <UserBubble text="best roofer near me" />
        <div style={{display: 'flex', flexDirection: 'column', gap: 20}}>
          {on && (
            <BizCard
              rank={1}
              name="Your Roofing Co."
              meta="Roof repair · Springfield"
              you
              style={{transform: `translateY(${(1 - p) * -80}px) scale(${0.7 + 0.32 * p})`, opacity: p}}
            />
          )}
          {ROOFERS.slice(0, on ? 2 : 3).map((r, i) => (
            <BizCard key={r.name} rank={i + (on ? 2 : 1)} name={r.name} meta={r.meta} style={{opacity: on ? 0.45 : 1}} />
          ))}
        </div>
      </ChatFrame>
    </Stage>
  );
};

/* ---------- 15. End card ---------- */
export const FollowCard: React.FC<{pulses: number[]}> = ({pulses}) => {
  const f = useCurrentFrame();
  const p = usePop(0, 200);
  return (
    <Stage y={660}>
      <div style={{position: 'relative', width: 420, height: 420, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
        {pulses.map((at, i) => {
          const d = f - at;
          if (d < 0 || d > 24) return null;
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                width: 300,
                height: 300,
                borderRadius: 999,
                border: `8px solid ${C.yellow}`,
                transform: `scale(${1 + d / 14})`,
                opacity: 1 - d / 24,
              }}
            />
          );
        })}
        <div
          style={{
            width: 300,
            height: 300,
            borderRadius: 999,
            background: C.yellow,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 140px rgba(255,230,0,0.5)',
            transform: `scale(${p})`,
          }}
        >
          <Plus size={190} color="#000" stroke={3.2} />
        </div>
      </div>
    </Stage>
  );
};
