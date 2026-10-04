import React from 'react';
import {interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {C, DISPLAY, UI} from '../../brand';
import {Stage} from '../../ui/Common';
import {Pin, Star} from '../../ui/Icons';

const sp = (frame: number, fps: number, stiffness = 170, damping = 16) =>
  spring({frame, fps, config: {damping, stiffness, mass: 0.7}});

/** Progress 0..1 of a section's redesign that starts at local frame `at`. */
const useQ = (at: number) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  return at < -50 ? 1 : at > 5000 ? 0 : sp(f - at, fps);
};

const RETRO_BG = 'repeating-linear-gradient(45deg, #C7D3E6 0 14px, #D5DEEC 14px 28px)';
const TIMES = '"Times New Roman", Times, serif';

/** Cross-fade between the old and the new version of one page section. */
const Swap: React.FC<{q: number; old: React.ReactNode; neu: React.ReactNode; height: number}> = ({q, old, neu, height}) => (
  <div style={{position: 'relative', height}}>
    <div style={{position: 'absolute', inset: 0, opacity: 1 - q, transform: `scale(${1 - 0.04 * q})`}}>{old}</div>
    <div style={{position: 'absolute', inset: 0, opacity: q, transform: `translateY(${(1 - q) * 18}px)`}}>{neu}</div>
  </div>
);

const Bevel: React.FC<{children: React.ReactNode}> = ({children}) => (
  <span
    style={{
      display: 'inline-block',
      padding: '4px 10px',
      background: '#E1E1E1',
      borderTop: '3px solid #fff',
      borderLeft: '3px solid #fff',
      borderRight: '3px solid #7A7A7A',
      borderBottom: '3px solid #7A7A7A',
      fontFamily: TIMES,
      fontSize: 22,
      color: '#000',
    }}
  >
    {children}
  </span>
);

export type Focus = 'all' | 'headline' | 'cta' | 'trust';
const FOCUS: Record<Focus, {s: number; o: string}> = {
  all: {s: 1, o: '50% 0%'},
  // zoom anchored to the left edge: page text is left-aligned, so nothing important gets cropped
  headline: {s: 1.22, o: '0% 22%'},
  cta: {s: 1.22, o: '0% 60%'},
  trust: {s: 1.16, o: '0% 92%'},
};

/** The fictional cleaning company's homepage, section by section old → new. */
export const SitePage: React.FC<{headline: number; cta: number; trust: number; marquee?: boolean}> = ({headline, cta, trust, marquee = true}) => {
  const f = useCurrentFrame();
  const marqueeX = marquee ? 800 - ((f * 6) % 1500) : 40;
  return (
    <div style={{position: 'relative', width: 800, height: 690, overflow: 'hidden', fontFamily: UI}}>
      <div style={{position: 'absolute', inset: 0, background: RETRO_BG}} />
      <div style={{position: 'absolute', inset: 0, background: '#FFFFFF', opacity: headline}} />
      <div style={{position: 'relative', padding: '18px 30px'}}>
        {/* top bar */}
        <Swap
          q={headline}
          height={70}
          old={
            <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
              <div style={{fontFamily: TIMES, fontWeight: 900, fontSize: 40, color: '#7B1FA2', fontStyle: 'italic'}}>✧ SPARKLE CLEAN ✧</div>
            </div>
          }
          neu={
            <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
              <div style={{display: 'flex', alignItems: 'center', gap: 10, fontFamily: DISPLAY, fontWeight: 900, fontSize: 36, color: '#111'}}>
                <div style={{width: 18, height: 18, borderRadius: 99, background: C.yellow}} />
                Sparkle
              </div>
              <div style={{fontSize: 24, fontWeight: 700, color: '#555'}}>Services · Prices · FAQ</div>
            </div>
          }
        />
        {/* hero */}
        <Swap
          q={headline}
          height={230}
          old={
            <div>
              <div style={{whiteSpace: 'nowrap', fontFamily: TIMES, fontWeight: 900, fontSize: 46, color: '#D32F2F', transform: `translateX(${marqueeX}px)`, marginTop: 6}}>
                *** WELCOME TO OUR WEBSITE!!! ***
              </div>
              <div style={{fontFamily: TIMES, fontSize: 28, color: '#222', marginTop: 18, lineHeight: 1.25}}>
                We are the best cleaning company. Please click the links below to learn more about us and our history.
              </div>
            </div>
          }
          neu={
            <div>
              <div style={{fontFamily: DISPLAY, fontWeight: 900, fontSize: 60, color: '#111', lineHeight: 1.04, marginTop: 6}}>House cleaning in Springfield</div>
              <div style={{fontSize: 30, color: '#555', marginTop: 14, fontWeight: 500}}>Weekly, deep and move-out cleaning.</div>
              <div style={{display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, fontSize: 26, fontWeight: 700, color: '#333'}}>
                <Pin size={30} color="#111" stroke={2.4} /> Springfield &amp; nearby
              </div>
            </div>
          }
        />
        {/* call to action */}
        <Swap
          q={cta}
          height={150}
          old={
            <div>
              <div style={{display: 'flex', flexWrap: 'wrap', gap: 8}}>
                {['Home', 'About Us', 'Our History', 'Gallery', 'Links', 'Guestbook'].map((l) => (
                  <Bevel key={l}>{l}</Bevel>
                ))}
              </div>
              <div style={{fontFamily: TIMES, fontSize: 22, color: '#1A0DAB', textDecoration: 'underline', marginTop: 14}}>Click HERE to contact us · tel. 555-0134</div>
            </div>
          }
          neu={
            <div style={{display: 'flex', alignItems: 'center', gap: 20, marginTop: 10}}>
              <div style={{padding: '24px 40px', borderRadius: 18, background: C.yellow, color: '#111', fontFamily: DISPLAY, fontWeight: 900, fontSize: 40, boxShadow: '0 12px 26px rgba(0,0,0,0.15)'}}>
                Book a cleaning →
              </div>
            </div>
          }
        />
        {/* trust */}
        <Swap
          q={trust}
          height={170}
          old={
            <div style={{display: 'flex', alignItems: 'center', gap: 16}}>
              <div style={{fontFamily: 'monospace', fontSize: 30, background: '#000', color: '#0F0', padding: '6px 12px', letterSpacing: 3}}>000127</div>
              <div style={{fontFamily: TIMES, fontSize: 24, color: '#333'}}>visitors since 2009 · under construction</div>
            </div>
          }
          neu={
            <div>
              <div style={{display: 'flex', alignItems: 'center', gap: 6}}>
                {[0, 1, 2, 3, 4].map((i) => (
                  <Star key={i} size={34} color={C.yellow} />
                ))}
                <span style={{marginLeft: 10, fontSize: 28, fontWeight: 800, color: '#111'}}>Reviews</span>
              </div>
              <div style={{display: 'flex', gap: 14, marginTop: 14}}>
                {[0, 1].map((i) => (
                  <div key={i} style={{flex: 1, borderRadius: 18, border: '2px solid #EEE', padding: 16, display: 'flex', gap: 12}}>
                    <div style={{width: 44, height: 44, borderRadius: 99, background: '#EDEBE4', flexShrink: 0}} />
                    <div style={{flex: 1}}>
                      <div style={{height: 12, borderRadius: 6, background: '#DDD', width: '90%'}} />
                      <div style={{height: 12, borderRadius: 6, background: '#E8E8E8', width: '70%', marginTop: 10}} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          }
        />
      </div>
    </div>
  );
};

const BrowserFrame: React.FC<{children: React.ReactNode; url?: string}> = ({children, url = 'sparkle-clean.example'}) => (
  <div style={{width: 800, borderRadius: 30, overflow: 'hidden', background: '#E9E9E6', boxShadow: '0 40px 100px rgba(0,0,0,0.6)', border: '2px solid #333'}}>
    <div style={{display: 'flex', alignItems: 'center', gap: 10, padding: '16px 22px'}}>
      {['#FF5F57', '#FEBC2E', '#28C840'].map((c) => (
        <div key={c} style={{width: 16, height: 16, borderRadius: 99, background: c}} />
      ))}
      <div style={{marginLeft: 12, flex: 1, background: '#fff', borderRadius: 99, padding: '7px 20px', fontSize: 24, color: '#666', fontFamily: UI}}>{url}</div>
    </div>
    {children}
  </div>
);

const ConceptPill: React.FC = () => (
  <div style={{position: 'absolute', right: 16, top: -26, padding: '10px 20px', borderRadius: 999, background: C.yellow, color: '#111', fontFamily: UI, fontWeight: 800, fontSize: 24, zIndex: 5}}>
    CONCEPT · fictional business
  </div>
);

/** Highlight box around the section being fixed. */
const Outline: React.FC<{top: number; height: number; at: number}> = ({top, height, at}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  if (f < at) return null;
  const p = sp(f - at, fps, 220);
  return (
    <div
      style={{
        position: 'absolute',
        left: 14,
        right: 14,
        top,
        height,
        border: `6px solid ${C.yellow}`,
        borderRadius: 18,
        boxShadow: '0 0 30px rgba(255,230,0,0.6)',
        opacity: p,
        transform: `scale(${1.08 - 0.08 * p})`,
      }}
    />
  );
};

const OUTLINES: Record<Exclude<Focus, 'all'>, {top: number; height: number}> = {
  headline: {top: 86, height: 240},
  cta: {top: 330, height: 160},
  trust: {top: 488, height: 190},
};

export const Redesign: React.FC<{
  focus?: Focus;
  headlineAt?: number;
  ctaAt?: number;
  trustAt?: number;
  outline?: {region: Exclude<Focus, 'all'>; at: number};
  enter?: boolean;
}> = ({focus = 'all', headlineAt = 9999, ctaAt = 9999, trustAt = 9999, outline, enter = false}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const p = enter ? sp(f, fps) : 1;
  const fo = FOCUS[focus];
  return (
    <Stage y={560}>
      <div style={{position: 'relative', opacity: p, transform: `translateY(${(1 - p) * 30}px)`}}>
        <ConceptPill />
        <BrowserFrame>
          <div style={{width: 800, height: 690, overflow: 'hidden', position: 'relative'}}>
            <div style={{transform: `scale(${fo.s})`, transformOrigin: fo.o}}>
              <SitePage headline={useQ(headlineAt)} cta={useQ(ctaAt)} trust={useQ(trustAt)} />
              {outline ? <Outline {...OUTLINES[outline.region]} at={outline.at} /> : null}
            </div>
          </div>
        </BrowserFrame>
      </div>
    </Stage>
  );
};

/* ---------- Desktop → phone ---------- */
const PhoneSite: React.FC<{tapAt?: number}> = ({tapAt = 9999}) => {
  const f = useCurrentFrame();
  const tap = f >= tapAt ? Math.min(1, (f - tapAt) / 10) : 0;
  return (
    <div style={{width: 400, height: 800, borderRadius: 64, background: '#0B0B0B', padding: 16, boxShadow: '0 40px 100px rgba(0,0,0,0.6)', border: '3px solid #333'}}>
      <div style={{width: '100%', height: '100%', borderRadius: 50, background: '#fff', overflow: 'hidden', padding: '56px 26px', fontFamily: UI, position: 'relative'}}>
        <div style={{display: 'flex', alignItems: 'center', gap: 8, fontFamily: DISPLAY, fontWeight: 900, fontSize: 28}}>
          <div style={{width: 14, height: 14, borderRadius: 99, background: C.yellow}} /> Sparkle
        </div>
        <div style={{fontFamily: DISPLAY, fontWeight: 900, fontSize: 44, lineHeight: 1.05, marginTop: 30}}>House cleaning in Springfield</div>
        <div style={{fontSize: 22, color: '#555', marginTop: 12}}>Weekly, deep and move-out cleaning.</div>
        <div style={{position: 'relative', marginTop: 30, padding: '20px 0', borderRadius: 16, background: C.yellow, textAlign: 'center', fontFamily: DISPLAY, fontWeight: 900, fontSize: 30, transform: `scale(${tap > 0 && tap < 0.5 ? 0.95 : 1})`}}>
          Book a cleaning →
          {tap > 0 && tap < 1 ? (
            <div style={{position: 'absolute', left: '50%', top: '50%', width: 60 + tap * 160, height: 60 + tap * 160, borderRadius: 999, border: '6px solid rgba(0,0,0,0.35)', transform: 'translate(-50%,-50%)', opacity: 1 - tap}} />
          ) : null}
        </div>
        <div style={{display: 'flex', gap: 4, marginTop: 26}}>
          {[0, 1, 2, 3, 4].map((i) => (
            <Star key={i} size={28} color={C.yellow} />
          ))}
        </div>
        <div style={{borderRadius: 16, border: '2px solid #EEE', padding: 14, marginTop: 14}}>
          <div style={{height: 10, borderRadius: 6, background: '#DDD', width: '90%'}} />
          <div style={{height: 10, borderRadius: 6, background: '#E8E8E8', width: '65%', marginTop: 8}} />
        </div>
      </div>
    </div>
  );
};

export const ToMobile: React.FC<{morphAt: number; tapAt?: number; morphed?: boolean}> = ({morphAt, tapAt, morphed}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const m = morphed ? 1 : f >= morphAt ? sp(f - morphAt, fps, 120, 18) : 0;
  return (
    <Stage y={560}>
      <div style={{position: 'relative', width: 800, height: 820, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
        {m < 1 && (
          <div style={{position: 'absolute', opacity: 1 - m, transform: `scale(${1 - 0.5 * m})`}}>
            <BrowserFrame>
              <SitePage headline={1} cta={1} trust={1} />
            </BrowserFrame>
          </div>
        )}
        <div style={{opacity: m, transform: `scale(${0.7 + 0.3 * m})`}}>
          <PhoneSite tapAt={tapAt} />
        </div>
      </div>
    </Stage>
  );
};

/* ---------- Before / after slider ---------- */
export const BeforeAfter: React.FC<{afterAt: number}> = ({afterAt}) => {
  const f = useCurrentFrame();
  const x = interpolate(f, [afterAt, afterAt + 30], [100, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const label = (t: string, left: boolean) => (
    <div style={{position: 'absolute', top: 18, [left ? 'left' : 'right']: 18, padding: '8px 18px', borderRadius: 999, background: left ? '#111' : C.yellow, color: left ? '#fff' : '#111', fontFamily: DISPLAY, fontWeight: 900, fontSize: 26, zIndex: 3}}>
      {t}
    </div>
  );
  return (
    <Stage y={560}>
      <div style={{position: 'relative'}}>
        <ConceptPill />
        <BrowserFrame>
          <div style={{position: 'relative', width: 800, height: 690}}>
            <div style={{position: 'absolute', inset: 0}}>
              <SitePage headline={0} cta={0} trust={0} marquee={false} />
            </div>
            <div style={{position: 'absolute', inset: 0, clipPath: `inset(0 0 0 ${x}%)`}}>
              <SitePage headline={1} cta={1} trust={1} />
            </div>
            {label('BEFORE', true)}
            {x < 96 ? label('AFTER', false) : null}
            <div style={{position: 'absolute', top: 0, bottom: 0, left: `${x}%`, width: 8, marginLeft: -4, background: C.yellow, boxShadow: '0 0 24px rgba(255,230,0,0.8)'}}>
              <div style={{position: 'absolute', top: '50%', left: '50%', width: 70, height: 70, borderRadius: 99, background: C.yellow, transform: 'translate(-50%,-50%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: DISPLAY, fontWeight: 900, fontSize: 30}}>
                ‹›
              </div>
            </div>
          </div>
        </BrowserFrame>
      </div>
    </Stage>
  );
};
