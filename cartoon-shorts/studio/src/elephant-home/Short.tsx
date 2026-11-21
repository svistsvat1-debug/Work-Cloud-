import React from 'react';
import {AbsoluteFill, Audio, Img, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {SPR} from './sprites';
import {camAt, clamp, easeInOutCubic, easeOutCubic, lerp, pop, prog, rnd, shake, spring, type Cam} from '../shared/anim';
import {SweatDrop} from '../shared/SweatDrop';
import {SoundCues, type Cue} from '../shared/Sound';
import {useFont} from '../shared/useFont';

// "How do you send 14 elephants home?" - PART 2 of the 2021 viral wandering elephants of Yunnan, told as a story.
// Facts (AP / NBC / China Daily, Aug 2021): a herd of wild Asian elephants (14 by the time it turned back) walked ~500 km
// north from Xishuangbanna to the edge of Kunming; drone pictures of the herd napping went viral; officials blocked roads
// with lines of trucks and used food (pineapples, corn) - more than 180 tonnes in total - to lead the herd; on 8 Aug 2021
// the herd crossed the Yuanjiang river bridge heading home.

export const FPS = 60;
export const VO_AT = 0.1;
export const DURATION = 24.3;
const W = (s: number) => s + VO_AT; // Scribe word start -> video time
export const T = {
  fourteen: W(0), elephants: W(1.04), walk: W(1.6), north: W(3.2), city: W(4.4), millions: W(5.04), whole: W(6.36), internet: W(6.56),
  watches: W(7.04), nap: W(7.72), but: W(8.4), home1: W(10.0), you: W(10.72), carry: W(11.68), so: W(12.72), block: W(13.28),
  wrong: W(14.08), road: W(14.4), trucks: W(14.92), drop: W(15.72), pine: W(15.96), corn: W(16.64), right: W(17.24), a: W(18.08),
  eighty: W(18.8), tons: W(19.04), snacks: W(19.56), later: W(19.92), herd: W(20.72), crosses: W(21.12), bridge: W(21.64), home2: W(21.84),
  end: W(22.32),
};

const F = (n: string) => staticFile(`elephant-home/${n}`);
export const FONT = 'EHInter';
export const useEHFont = () => useFont(FONT, staticFile('fonts/Inter-Black.otf'));
const PS = 1.4;
const PW = 1024 * PS;
const PH = 1536 * PS;
const DECK = 710 * PS;

type SprInfo = {w: number; h: number; feet: [number, number]};
const S = (n: string) => (SPR as unknown as Record<string, SprInfo>)[n];

// sprite anchored at its feet
const Spr: React.FC<{n: string; x: number; y: number; s: number; sx?: number; sy?: number; rot?: number; op?: number}> = ({n, x, y, s, sx = 1, sy = 1, rot = 0, op = 1}) => {
  const sp = S(n);
  if (s <= 0.001) return null;
  return (
    <div style={{position: 'absolute', left: x, top: y, transform: `rotate(${rot}deg) scale(${sx}, ${sy})`, transformOrigin: '0 0', opacity: op}}>
      <Img src={F(`${n}.png`)} style={{position: 'absolute', left: -sp.feet[0] * s, top: -sp.feet[1] * s, width: sp.w * s, height: sp.h * s}} />
    </div>
  );
};
const Shadow: React.FC<{x: number; y: number; w: number}> = ({x, y, w}) => (
  <div style={{position: 'absolute', left: x - w / 2, top: y - w * 0.09, width: w, height: w * 0.18, borderRadius: '50%', background: 'rgba(40,50,30,0.25)', filter: 'blur(3px)'}} />
);
const Txt: React.FC<{x: number; y: number; size: number; color?: string; rot?: number; s?: number; children: React.ReactNode}> = ({x, y, size, color = '#FFE45C', rot = 0, s = 1, children}) =>
  s <= 0.001 ? null : (
    <div
      style={{
        position: 'absolute', left: x, top: y, transform: `translate(-50%, -50%) rotate(${rot}deg) scale(${s})`, fontFamily: FONT, fontSize: size,
        lineHeight: 1.02, textAlign: 'center', color, WebkitTextStroke: `${size * 0.2}px #000`, paintOrder: 'stroke fill', whiteSpace: 'nowrap',
      }}
    >
      {children}
    </div>
  );

// squash on a pose swap
const swapSq = (t: number, ts: number): [number, number] => {
  if (t < ts) return [1, 1];
  const s = spring(t - ts, 3.2, 7);
  return [1 - 0.05 * s, 1 + 0.06 * s];
};
const breathe = (t: number) => 1 + 0.009 * Math.sin(2 * Math.PI * 0.6 * t);

// a walking elephant: bob + rock (one walk drawing, the gait is code)
const Walker: React.FC<{x: number; y: number; s: number; t: number; i: number; dir?: 1 | -1; n?: string}> = ({x, y, s, t, i, dir = 1, n = 'eWalk'}) => {
  const ph = 2 * Math.PI * 1.6 * t + i * 1.7;
  const bob = Math.abs(Math.sin(ph)) * 10 * s;
  return (
    <>
      <Shadow x={x} y={y} w={380 * s} />
      <Spr n={n} x={x} y={y - bob} s={s} sx={dir} rot={2.2 * Math.sin(ph)} />
    </>
  );
};

const Heart: React.FC<{x: number; y: number; s: number}> = ({x, y, s}) => (
  <svg style={{position: 'absolute', left: x - 40 * s, top: y - 40 * s, overflow: 'visible'}} width={80 * s} height={80 * s} viewBox="-40 -40 80 80">
    <path d="M0 30 C-40 5 -38 -28 -16 -28 C-6 -28 0 -20 0 -14 C0 -20 6 -28 16 -28 C38 -28 40 5 0 30 Z" fill="#FF4F6D" stroke="#000" strokeWidth={6} />
  </svg>
);

// pineapple / corn trail on the road home (left side)
const SNACKS: {x: number; y: number; n: string; at: number}[] = Array.from({length: 7}, (_, i) => ({
  x: 640 - i * 105,
  y: 1930 - i * 8 + (i % 2) * 22,
  n: i % 2 ? 'corn' : 'pine',
  at: T.pine - 0.15 + i * 0.16,
}));

const clampCam = (c: Cam): Cam => ({k: c.k, x: clamp(c.x, 540 / c.k, PW - 540 / c.k), y: clamp(c.y, 960 / c.k, PH - 960 / c.k)});
const WorldDiv: React.FC<{cam: Cam; children: React.ReactNode}> = ({cam: c0, children}) => { const cam = clampCam(c0); return (
  <div style={{position: 'absolute', left: 0, top: 0, transformOrigin: '0 0', transform: `translate(540px, 960px) scale(${cam.k}) translate(${-cam.x}px, ${-cam.y}px)`}}>{children}</div>
); };

export const EHScene: React.FC<{t: number; cover?: boolean}> = ({t, cover}) => {
  const river = t >= T.a + 0.02 && !cover;
  const sh = shake(t, (t > T.carry && t < T.carry + 0.7 ? 7 * (1 - prog(t, T.carry, T.carry + 0.7)) : 0) + (t > T.block && t < T.block + 0.35 ? 9 * (1 - prog(t, T.block, T.block + 0.35)) : 0) + (t > T.road && t < T.road + 0.35 ? 8 * (1 - prog(t, T.road, T.road + 0.35)) : 0));

  if (!river) {
    // ---------------- ROAD WORLD (acts 1-3) ----------------
    const cam = camAt(t, [
      {t: 0, x: 717, y: 1330, k: 1.15},
      {t: T.walk, x: 717, y: 1300, k: 1.13},
      {t: T.city, x: 717, y: 900, k: 1.25, ease: 'io'},
      {t: T.millions + 0.4, x: 717, y: 760, k: 1.5, ease: 'io'},
      {t: T.whole - 0.12, x: 717, y: 760, k: 1.5},
      {t: T.whole - 0.1, x: 760, y: 1640, k: 1.45, ease: 'cut'},
      {t: T.nap + 0.4, x: 760, y: 1660, k: 1.5, ease: 'io'},
      {t: T.you, x: 820, y: 1700, k: 1.55, ease: 'io'},
      {t: T.carry + 0.6, x: 800, y: 1720, k: 1.7, ease: 'io'},
      {t: T.so, x: 800, y: 1720, k: 1.7},
      {t: T.block - 0.1, x: 717, y: 1320, k: 1.15, ease: 'io'},
      {t: T.drop, x: 717, y: 1330, k: 1.15},
      {t: T.right + 0.3, x: 560, y: 1520, k: 1.3, ease: 'io'},
    ]);
    const c = cover ? {x: 717, y: 1420, k: 1.22} : cam;
    // herd: act 1 walks up the road toward the city
    const herd1 = [0, 1, 2, 3, 4].map((i) => {
      const u = easeInOutCubic(prog(t, T.walk - 0.1 + i * 0.08, T.city + 0.3));
      const x0 = 460 + i * 130 + (i % 2) * 20;
      const y0 = 1880 + (i % 2) * 70 - i * 6;
      return {x: lerp(x0, 640 + i * 42, u), y: lerp(y0, 820 + (i % 2) * 18, u), s: lerp(0.72 - (i % 2) * 0.04, 0.17, u), i};
    });
    const napping = t >= T.whole - 0.1 && t < T.drop + 0.25;
    const walkHome = t >= T.drop + 0.25;
    // guy
    let guy = 'binoc';
    let gx = 880;
    let gy = 2040;
    let gsx = 1;
    let gs = 0.62;
    if (t >= T.whole - 0.1) { guy = 'binoc'; gx = 1190; gy = 2000; }
    if (t >= T.but) guy = 'shock';
    if (t >= T.you) { guy = 'push'; gx = 1090 - 14 * easeOutCubic(prog(t, T.carry, T.carry + 0.4)); gsx = -1; }
    if (t >= T.so) { guy = 'point'; gx = 1080; gy = 2040; gsx = -1; gs = 0.6; }
    if (t >= T.right + 0.3) { guy = 'cheer'; gsx = 1; }
    if (cover) { guy = 'shock'; gx = 930; gy = 2010; gs = 0.66; }
    const swapT = t >= T.right + 0.3 ? T.right + 0.3 : t >= T.so ? T.so : t >= T.you ? T.you : t >= T.but ? T.but : 0;
    const [qx, qy] = swapSq(t, swapT);
    const pushStrain = guy === 'push' && t > T.carry ? 1 + 0.02 * Math.sin(2 * Math.PI * 9 * t) : 1;
    // trucks (scaled for depth)
    const truckIn = (t0: number, xFrom: number, xTo: number) => (t < t0 - 0.55 ? xFrom : lerp(xFrom, xTo, easeOutCubic(prog(t, t0 - 0.55, t0))));
    const truck1x = truckIn(T.block, 1600, 760);
    const truck2x = truckIn(T.road, 1700, 1180);
    const kmU = prog(t, T.walk, T.north + 0.5);
    return (
      <AbsoluteFill style={{background: '#BEE3F2', overflow: 'hidden'}}>
        <div style={{position: 'absolute', inset: 0, transform: `translate(${sh.x}px, ${sh.y}px)`}}>
          <WorldDiv cam={c}>
            <Img src={F('road.jpg')} style={{position: 'absolute', left: 0, top: 0, width: PW, height: PH}} />
            {/* city glow + label */}
            {t > T.city - 0.1 && t < T.whole && !cover ? (
              <Txt x={717} y={470} size={64} s={pop(t, T.millions - 0.1, 0.3)} rot={-3}>
                CITY OF MILLIONS
              </Txt>
            ) : null}
            {/* trucks: one on the road to the city, one on the right branch */}
            {t > T.block - 0.6 && !cover ? (
              <>
                <Spr n="truck" x={truck1x} y={760} s={0.34} />
                <Spr n="truck" x={truck2x} y={705} s={0.3} />
                {t > T.wrong ? <Txt x={760} y={660} size={46} color="#FF4A3D" s={pop(t, T.wrong, 0.25)}>✕</Txt> : null}
                {t > T.road ? <Txt x={1180} y={610} size={42} color="#FF4A3D" s={pop(t, T.road, 0.25)}>✕</Txt> : null}
              </>
            ) : null}
            {/* act 1: walking north */}
            {!napping && !walkHome && !cover
              ? [...herd1].sort((a, b) => a.y - b.y).map((e) => <Walker key={e.i} x={e.x} y={e.y} s={e.s} t={t < T.walk ? 0 : t} i={e.i} />)
              : null}
            {/* nap pile (the viral moment) */}
            {(napping || cover) && t < T.drop + 0.25
              ? [0, 1, 2, 3, 4].map((i) => {
                  const x = [380, 600, 820, 480, 720][i];
                  const y = [1900, 1880, 1910, 2010, 2030][i];
                  const s = 0.66 + (i > 2 ? 0.06 : 0);
                  const br = 1 + 0.02 * Math.sin(2 * Math.PI * 0.5 * t + i);
                  const wake = t > T.drop - 0.05 ? spring(t - (T.drop - 0.05) - i * 0.05, 3, 6) : 0;
                  return (
                    <React.Fragment key={i}>
                      <Shadow x={x} y={y} w={420 * s} />
                      <Spr n="eSleep" x={x} y={y} s={s} sx={i % 2 ? -1 : 1} sy={br + 0.1 * wake} />
                    </React.Fragment>
                  );
                })
              : null}
            {/* Zzz */}
            {napping && t < T.drop && !cover
              ? [0, 1, 2].map((i) => {
                  const u = ((t - T.nap + i * 0.6) % 1.8) / 1.8;
                  if (t < T.nap - 0.3) return null;
                  return <Txt key={i} x={620 + i * 30 + 40 * u} y={1690 - 220 * u} size={50 + 20 * u} color="#fff" s={u < 0.85 ? 1 : 1 - (u - 0.85) / 0.15}>Z</Txt>;
                })
              : null}
            {walkHome && !cover
              ? [0, 1, 2, 3, 4].map((i) => {
                  const u = prog(t, T.drop + 0.25 + i * 0.05, T.a + 0.1);
                  const x = lerp(720 + i * 150, -120 + i * 150, u);
                  const y = 1960 + (i % 2) * 60;
                  return <Walker key={i} x={x} y={y} s={0.62} t={t} i={i} dir={-1} />;
                })
              : null}
            {/* act 3: snacks trail + the herd walks home (left) */}
            {!cover
              ? SNACKS.map((sn, i) => {
                  if (t < sn.at) return null;
                  const fall = easeOutCubic(prog(t, sn.at, sn.at + 0.3));
                  const eatT = T.right + 0.25 + i * 0.16;
                  if (t > eatT + 0.12) return null;
                  const sq = t > sn.at + 0.3 ? 1 - 0.15 * spring(t - sn.at - 0.3, 4, 8) : 1;
                  return <Spr key={i} n={sn.n} x={sn.x} y={lerp(sn.y - 700, sn.y, fall)} s={0.4 * (t > eatT ? 1 - prog(t, eatT, eatT + 0.12) : 1)} sy={sq} />;
                })
              : null}
            {/* the ranger */}
            {true ? (
              <>
                <Shadow x={gx} y={gy} w={260 * gs} />
                <Spr n={guy} x={gx} y={gy} s={gs} sx={gsx * qx * pushStrain} sy={qy * breathe(t)} />
              </>
            ) : null}
            {guy === 'push' && t > T.carry ? (
              <svg style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}} width={10} height={10}>
                <SweatDrop x={gx + 70} y={gy - 360 + 60 * prog(t, T.carry + 0.1, T.so)} r={16} s={pop(t, T.carry + 0.1, 0.2)} />
                <SweatDrop x={gx - 60} y={gy - 380 + 50 * prog(t, T.carry + 0.3, T.so)} r={12} s={pop(t, T.carry + 0.3, 0.2)} />
              </svg>
            ) : null}
            {/* HOME sign (act 2-3) */}
            {t > T.home1 && !cover ? (
              <Txt x={430} y={1560} size={58} color="#fff" rot={-6} s={pop(t, T.home1, 0.3) * (t > T.so ? 1 : 1)}>
                ← HOME
                <br />
                <span style={{fontSize: 40}}>500 KM</span>
              </Txt>
            ) : null}
          </WorldDiv>
        </div>
        {/* HUD: km counter (act 1) */}
        {t > T.walk - 0.2 && t < T.whole - 0.1 && !cover ? (
          <Txt x={540} y={250} size={84} s={pop(t, T.walk - 0.2, 0.3)}>
            {Math.round(500 * kmU)} KM NORTH
          </Txt>
        ) : null}
        {/* the internet watching: phone frame + LIVE + hearts + camera flashes */}
        {t > T.internet - 0.1 && t < T.but && !cover ? <Phone t={t} /> : null}
        {/* x14 tag */}
        {t < T.walk + 0.6 && !cover ? (
          <Txt x={300} y={1450} size={96} s={1 - prog(t, T.walk + 0.4, T.walk + 0.6)} rot={-6}>
            ×14
          </Txt>
        ) : null}
        {/* "CAN'T CARRY" */}
        {t > T.carry && t < T.so && !cover ? (
          <Txt x={540} y={330} size={78} color="#fff" s={pop(t, T.carry, 0.3)} rot={-3}>
            TOO HEAVY!
          </Txt>
        ) : null}
        {/* but: freeze-flash */}
        {t > T.but && t < T.but + 0.12 && !cover ? <AbsoluteFill style={{background: 'rgba(255,255,255,0.35)'}} /> : null}
      </AbsoluteFill>
    );
  }

  // ---------------- RIVER WORLD (act 4 + tail) ----------------
  const cam = camAt(t, [
    {t: T.a, x: 900, y: 1150, k: 1.25},
    {t: T.herd, x: 700, y: 1130, k: 1.2, ease: 'io'},
    {t: T.home2 + 0.3, x: 520, y: 1120, k: 1.32, ease: 'io'},
    {t: T.end + 0.5, x: 520, y: 1120, k: 1.32},
    {t: DURATION, x: 717, y: 1150, k: 1.15, ease: 'io'},
  ]);
  const tonsU = easeInOutCubic(prog(t, T.a + 0.1, T.later + 0.2));
  const homeX = 200;
  const lead = t > T.home2;
  return (
    <AbsoluteFill style={{background: '#FFE3B0', overflow: 'hidden'}}>
      <WorldDiv cam={cam}>
        <Img src={F('river.jpg')} style={{position: 'absolute', left: 0, top: 0, width: PW, height: PH}} />
        {[0, 1, 2, 3, 4].map((i) => {
          const u = prog(t, T.a - 0.1 + i * 0.1, T.home2 + 0.05 + i * 0.25);
          const x = lerp(1560 + i * 190, homeX + 20 + i * 190, easeInOutCubic(u));
          const happy = i === 0 && lead;
          const s = 0.56;
          if (happy) {
            const [qx, qy] = swapSq(t, T.home2);
            return (
              <React.Fragment key={i}>
                <Shadow x={x} y={DECK + 4} w={380 * s} />
                <Spr n="eHappy" x={x} y={DECK + 4} s={s} sx={-qx} sy={qy * breathe(t)} />
              </React.Fragment>
            );
          }
          return <Walker key={i} x={x} y={DECK + 4} s={s} t={u >= 1 ? 0 : t} i={i} dir={-1} />;
        })}
        {/* ranger cheering at the far end */}
        <Spr n={t > T.home2 ? 'cheer' : 'point'} x={1320} y={DECK + 6} s={0.36} sx={t > T.home2 ? swapSq(t, T.home2)[0] : -1} sy={swapSq(t, T.home2)[1] * breathe(t)} />
        <Txt x={homeX + 120} y={DECK - 230} size={70} color="#fff" rot={-5} s={pop(t, T.bridge, 0.3) * (1 - prog(t, T.end, T.end + 0.15))}>
          HOME
        </Txt>
        {/* confetti on "home" */}
        {t > T.home2
          ? Array.from({length: 26}, (_, i) => {
              const tt = t - T.home2;
              const a = rnd(i) * Math.PI - Math.PI;
              const v = 500 + 400 * rnd(i + 9);
              const x = homeX + 60 + Math.cos(a) * v * tt;
              const y = DECK - 200 + Math.sin(a) * v * tt + 700 * tt * tt;
              if (tt > 1.8) return null;
              return <div key={i} style={{position: 'absolute', left: x, top: y, width: 18, height: 10, background: ['#FF4F6D', '#FFE45C', '#4FC3F7', '#7CD36B'][i % 4], border: '2px solid #000', transform: `rotate(${tt * 600 + i * 40}deg)`}} />;
            })
          : null}
      </WorldDiv>
      {/* HUD: snack counter */}
      {t < T.end + 0.2 ? (
        <Txt x={540} y={260} size={84} s={pop(t, T.a, 0.3)}>
          {Math.round(180 * tonsU)} TONS OF SNACKS
        </Txt>
      ) : null}
      {t > T.a ? <Spr n="pine" x={170} y={430} s={0.3 * pop(t, T.a + 0.1, 0.3)} rot={-8} /> : null}
      {t > T.a ? <Spr n="corn" x={920} y={430} s={0.28 * pop(t, T.a + 0.2, 0.3)} rot={8} /> : null}
      {/* comment hook end card */}
      {t > T.end + 0.15 ? (
        <>
          <Txt x={540} y={300} size={76} color="#fff" s={pop(t, T.end + 0.15, 0.35)} rot={-2}>
            HOW MANY PINEAPPLES
            <br />
            IS 180 TONS?
          </Txt>
          <Txt x={540} y={520} size={64} s={pop(t, T.end + 0.6, 0.3) * (1 + 0.06 * Math.sin(2 * Math.PI * 2 * t))}>
            GUESS ↓
          </Txt>
        </>
      ) : null}
    </AbsoluteFill>
  );
};

const Phone: React.FC<{t: number}> = ({t}) => {
  const s = pop(t, T.internet - 0.1, 0.3);
  const flashes = [T.watches, T.watches + 0.25, T.watches + 0.45, T.nap + 0.1];
  return (
    <AbsoluteFill>
      {/* screen frame */}
      <div style={{position: 'absolute', left: 90, top: 190, width: 900, height: 1540, border: '26px solid #1d1d1f', borderRadius: 70, transform: `scale(${s})`, transformOrigin: '50% 50%', boxShadow: '0 0 0 6px #000'}} />
      <Txt x={250} y={290} size={52} color="#fff" s={s}>
        <span style={{background: '#FF3B30', padding: '0 16px', borderRadius: 12, WebkitTextStroke: '0px'}}>● LIVE</span>
      </Txt>
      <Txt x={640} y={290} size={52} color="#fff" s={s}>
        THE WHOLE INTERNET
      </Txt>
      {Array.from({length: 9}, (_, i) => {
        const t0 = T.watches + i * 0.17;
        if (t < t0) return null;
        const u = (t - t0) / 1.4;
        if (u > 1) return null;
        return <Heart key={i} x={820 + 60 * Math.sin(i * 2.1 + u * 5)} y={1600 - 900 * u} s={0.8 + 0.4 * rnd(i)} />;
      })}
      {flashes.map((f, i) => (t > f && t < f + 0.08 ? <AbsoluteFill key={i} style={{background: 'rgba(255,255,255,0.55)'}} /> : null))}
    </AbsoluteFill>
  );
};

const CUES: Cue[] = [
  {f: 'trumpet', at: 0.15, db: -16},
  ...[0, 1, 2, 3, 4, 5].map((i) => ({f: 'stone_step', at: T.walk + i * 0.42, db: -20 - i, rate: 0.8})),
  {f: 'whoosh', at: T.city - 0.1, db: -30},
  {f: 'car_horn', at: T.millions, db: -24},
  {f: 'press_frenzy', at: T.watches - 0.05, db: -21},
  {f: 'snore', at: T.nap, db: -17},
  {f: 'boing', at: T.but, db: -22},
  {f: 'pop', at: T.home1, db: -22},
  {f: 'zip', at: T.you, db: -26},
  {f: 'stone_step', at: T.carry, db: -18, rate: 0.7},
  {f: 'crickets', at: T.carry + 0.55, db: -24},
  {f: 'truck_brake', at: T.block - 0.5, db: -16},
  {f: 'truck_brake', at: T.road - 0.5, db: -18, rate: 0.92},
  ...SNACKS.map((s, i) => ({f: 'pop', at: s.at + 0.3, db: -24 - (i % 3), rate: 0.9 + 0.05 * i})),
  {f: 'munch', at: T.right + 0.25, db: -17},
  {f: 'munch', at: T.right + 0.75, db: -19},
  {f: 'whoosh', at: T.a - 0.05, db: -26},
  ...[0, 1, 2, 3].map((i) => ({f: 'stone_step', at: T.eighty + i * 0.6, db: -24, rate: 0.85})),
  {f: 'kaching', at: T.later, db: -20},
  {f: 'trumpet', at: T.home2, db: -12},
  {f: 'party_horn', at: T.home2 + 0.15, db: -19},
  {f: 'pop', at: T.end + 0.15, db: -20},
];

export const ElephantHomeShort: React.FC = () => {
  useEHFont();
  const frame = useCurrentFrame();
  const t = frame / FPS;
  return (
    <AbsoluteFill style={{background: '#000'}}>
      <EHScene t={t} />
      <Sequence from={Math.round(VO_AT * FPS)} layout="none">
        <Audio src={F('vo/take1.wav')} />
      </Sequence>
      <Sequence from={Math.round(VO_AT * FPS)} layout="none">
        <Audio src={F('music/bed.wav')} />
      </Sequence>
      <SoundCues cues={CUES} dir="elephant-home/sfx" fps={FPS} />
    </AbsoluteFill>
  );
};
export const EH_DURATION = DURATION;
export const EH_FPS = FPS;
export {clamp};
