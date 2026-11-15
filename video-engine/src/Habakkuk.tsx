import React from 'react';
import {AbsoluteFill, Sequence, useCurrentFrame, interpolate, staticFile, Audio, useVideoConfig} from 'remotion';
import {PShape, PLine, PText, Pop} from './paint/Paint';
import {Stick} from './paint/Stick';
import {ell, rect, PAL, P} from './paint/wobble';
import timing from './habakkuk-timing.json';

// scene starts in frames (from the voice timings; estimate until the real voice arrives)
const T = timing as {fps: number; scenes: number[]; end: number; voice: string | null};

const font = `
@font-face{font-family:'PatrickHand';src:url('${staticFile('PatrickHand.woff2')}') format('woff2');}
@font-face{font-family:'Bangers';src:url('${staticFile('Bangers.woff2')}') format('woff2');}`;

// static camera with a very slow push-in per scene (Paint-Explainer feel), hard cuts between scenes
const Board: React.FC<{len: number; children: React.ReactNode}> = ({len, children}) => {
  const f = useCurrentFrame();
  const k = interpolate(f, [0, len], [1, 1.035], {extrapolateRight: 'clamp'});
  return (
    <AbsoluteFill style={{background: PAL.white}}>
      <svg viewBox="0 0 1920 1080" width={1920} height={1080} style={{transform: `scale(${k})`}}>{children}</svg>
    </AbsoluteFill>
  );
};

const Header: React.FC = () => (
  <g>
    <PText x={60} y={95} at={0} size={70} color={PAL.red}>#1</PText>
    <PText x={150} y={95} at={0} size={70}>PROJECT HABAKKUK</PText>
  </g>
);

const wave = (y: number, amp: number, x0 = -40, x1 = 1960): P[] => {
  const pts: P[] = [];
  for (let x = x0; x <= x1; x += 110) pts.push([x, y + Math.sin(x / 140) * amp]);
  return pts;
};

// ---------- scene 1: title card ----------
const S1: React.FC = () => (
  <Board len={T.scenes[1] - T.scenes[0]}>
    <PShape pts={ell(420, 520, 180, 165, 30, -0.4)} at={2} draw={10} color={PAL.red} sw={10} amp={4} seed={3} />
    <PText x={420} y={600} at={6} size={230} font="bang" color={PAL.red} anchor="middle">#1</PText>
    <PText x={680} y={440} at={8} size={130}>PROJECT</PText>
    <PText x={670} y={660} at={24} size={220} font="bang">HABAKKUK</PText>
    <PLine pts={[[680, 700], [1020, 690], [1360, 700]]} at={32} draw={7} color={PAL.red} sw={11} amp={3} seed={9} />
    {/* teaser: a grumpy ice cube */}
    <Pop at={40} x={1650} y={540}><g transform="translate(110,0)">
      <PShape pts={[[1540, 440], [1760, 430], [1770, 650], [1530, 660]]} fill={PAL.turq} at={40} draw={0} seed={21} />
      <PLine pts={[[1565, 470], [1620, 468]]} at={40} draw={0} color={PAL.white} sw={12} seed={22} />
      <PLine pts={[[1565, 500], [1585, 499]]} at={40} draw={0} color={PAL.white} sw={12} seed={23} />
      <PShape pts={ell(1610, 540, 9, 12, 8)} fill={PAL.black} at={40} draw={0} sw={2} seed={24} />
      <PShape pts={ell(1690, 540, 9, 12, 8)} fill={PAL.black} at={40} draw={0} sw={2} seed={25} />
      <PLine pts={[[1620, 600], [1650, 590], [1680, 600]]} at={40} draw={0} sw={6} seed={26} />
    </g></Pop>
    <PText x={1760} y={400} at={46} size={80} color={PAL.blue} anchor="middle" rot={-6}>?</PText>
  </Board>
);

// ---------- scene 2: ships lost to U-boats ----------
const S2: React.FC = () => {
  const f = useCurrentFrame();
  const len = T.scenes[2] - T.scenes[1];
  const tilt = interpolate(f, [44, len], [0, -13], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const sink = interpolate(f, [44, len], [0, 70], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <Board len={len}>
      <Header />
      <PText x={1830} y={210} at={4} size={130} color={PAL.red} anchor="end">1942</PText>
      {/* merchant ship (drawn before the sea, so the sea hides its lower hull) */}
      <g transform={`translate(620,${585 + sink}) rotate(${tilt}) scale(1.3)`}>
        <PShape pts={[[-90, -150], [60, -150], [60, -70], [-90, -70]]} fill={PAL.lgrey} at={12} draw={5} seed={31} />
        <PShape pts={[[80, -205], [130, -205], [130, -70], [80, -70]]} fill={PAL.red} at={14} draw={4} seed={32} />
        <PShape pts={[[80, -205], [130, -205], [130, -180], [80, -180]]} fill={PAL.black} at={14} draw={0} seed={33} />
        <PShape pts={[[-60, -130], [-30, -130], [-30, -100], [-60, -100]]} fill={PAL.turq} at={16} draw={0} sw={5} seed={34} />
        <PShape pts={[[-290, -80], [280, -80], [220, 60], [-230, 60]]} fill={PAL.brown} at={10} draw={7} seed={35} />
        <Stick x={-200} y={-80} s={0.42} at={18} face="panic" arms="up" seed={40} />
      </g>
      {/* sea */}
      <PShape pts={[...wave(640, 14), [1960, 1120], [-40, 1120]]} fill={PAL.blue} at={0} draw={8} seed={50} />
      {/* U-boat */}
      <g>
        <PLine pts={[[1360, 770], [1360, 600], [1395, 600]]} at={26} draw={5} sw={7} seed={51} />
        <PShape pts={[[1300, 815], [1310, 760], [1400, 760], [1420, 815]]} fill={PAL.grey} at={22} draw={4} seed={52} />
        <PShape pts={ell(1360, 850, 250, 48)} fill={PAL.grey} at={20} draw={6} seed={53} />
        <PText x={1360} y={870} at={26} size={52} color={PAL.white} anchor="middle">U-BOAT</PText>
      </g>
      {/* torpedo track + cartoon hit */}
      <PLine pts={[[1100, 850], [930, 760], [800, 690]]} at={30} draw={10} color={PAL.white} sw={9} seed={54} />
      <Pop at={42} x={760} y={650}>
        <PShape pts={Array.from({length: 16}, (_, i) => {
          const a = (i / 16) * Math.PI * 2; const r = i % 2 ? 55 : 120;
          return [760 + Math.cos(a) * r, 650 + Math.sin(a) * r * 0.8] as P;
        })} fill={PAL.yellow} at={42} draw={0} seed={55} />
        <PShape pts={ell(760, 650, 45, 35, 14)} fill={PAL.orange} at={42} draw={0} sw={5} seed={56} />
      </Pop>
      {[0, 1, 2].map((i) => {
        const at = 60 + i * 9;
        const rise = Math.max(0, f - at) * 1.6;
        return f >= at ? <PShape key={i} pts={ell(560 + i * 70, 760 - rise, 14 + i * 4, 14 + i * 4, 12)} at={at} draw={0} sw={5} color={PAL.white} seed={60 + i} /> : null;
      })}
    </Board>
  );
};

// ---------- scene 3: losses vs new ships ----------
const S3: React.FC = () => (
  <Board len={T.scenes[3] - T.scenes[2]}>
    <Header />
    <PLine pts={[[440, 860], [1380, 860]]} at={0} draw={6} sw={8} seed={70} />
    <PShape pts={rect(540, 300, 280, 560)} fill={PAL.red} at={2} draw={6} seed={71} />
    <PText x={680} y={950} at={4} size={80} anchor="middle">SUNK</PText>
    <PShape pts={rect(980, 520, 280, 340)} fill={PAL.green} at={14} draw={6} seed={72} />
    <PText x={1120} y={950} at={16} size={80} anchor="middle">BUILT</PText>
    <PLine pts={[[1300, 300], [1300, 520]]} at={28} draw={6} color={PAL.red} sw={8} seed={73} />
    <PLine pts={[[1280, 330], [1300, 300], [1320, 330]]} at={32} draw={0} color={PAL.red} sw={8} seed={74} />
    <PLine pts={[[1280, 490], [1300, 520], [1320, 490]]} at={32} draw={0} color={PAL.red} sw={8} seed={75} />
    <Stick x={1650} y={980} s={1.05} at={20} face="worry" arms="pointLeft" sweat cap={PAL.dblue} seed={80} />
    <PText x={1720} y={560} at={34} size={120} color={PAL.red} rot={8}>?!</PText>
  </Board>
);

// ---------- scene 4: the ice carrier idea (+ sawdust beat accumulates) ----------
const S4: React.FC = () => {
  const saw = T.scenes[4] - T.scenes[3]; // local frame of the "sawdust" sentence
  return (
    <Board len={T.end - T.scenes[3]}>
      <Header />
      <Stick x={360} y={1000} s={1.2} at={0} face="grin" arms="point" glasses beard seed={90} />
      <PText x={360} y={560} at={22} size={64} color={PAL.red} anchor="middle">GEOFFREY PYKE</PText>
      {/* light bulb */}
      <Pop at={44} x={560} y={420}>
        <PShape pts={ell(560, 400, 52, 58)} fill={PAL.yellow} at={44} draw={0} seed={91} />
        <PShape pts={rect(535, 455, 50, 36)} fill={PAL.lgrey} at={44} draw={0} sw={6} seed={92} />
        {[[-95, -40, -70, -30], [95, -40, 70, -30], [0, -110, 0, -80], [-75, -95, -55, -72], [75, -95, 55, -72]].map(([a, b, c, d], i) => (
          <PLine key={i} pts={[[560 + a, 400 + b], [560 + c, 400 + d]]} at={44} draw={0} color={PAL.orange} sw={8} seed={93 + i} />
        ))}
      </Pop>
      {/* thought bubble */}
      <PShape pts={ell(670, 650, 22, 20, 12)} fill={PAL.white} at={58} draw={3} seed={100} />
      <PShape pts={ell(740, 580, 34, 30, 14)} fill={PAL.white} at={61} draw={3} seed={101} />
      <PShape pts={ell(1280, 430, 560, 300, 40)} fill={PAL.white} at={64} draw={9} amp={4} seed={102} />
      {/* aircraft carrier made of ice */}
      <g>
        <PShape pts={[[1400, 420], [1480, 420], [1480, 330], [1400, 330]]} fill={PAL.turq} at={78} draw={4} seed={110} />
        <PShape pts={[[880, 450], [1700, 430], [1640, 560], [940, 570]]} fill={PAL.turq} at={76} draw={7} seed={111} />
        <PShape pts={[[850, 420], [1720, 405], [1720, 440], [850, 455]]} fill={PAL.turq} at={80} draw={5} seed={112} />
        <PLine pts={[[980, 480], [1100, 478]]} at={86} draw={0} color={PAL.white} sw={12} seed={113} />
        <PLine pts={[[1000, 515], [1040, 514]]} at={86} draw={0} color={PAL.white} sw={12} seed={114} />
        <PLine pts={[[1420, 350], [1440, 350]]} at={86} draw={0} color={PAL.white} sw={10} seed={115} />
        {/* small plane on the deck */}
        <PShape pts={[[1050, 400], [1180, 400], [1190, 385], [1050, 385]]} fill={PAL.grey} at={88} draw={0} sw={5} seed={116} />
        <PShape pts={[[1095, 392], [1130, 392], [1150, 360], [1120, 360]]} fill={PAL.grey} at={88} draw={0} sw={5} seed={117} />
      </g>
      <PText x={1280} y={260} at={104} size={110} color={PAL.blue} anchor="middle" font="bang" outline={PAL.black}>ICE!</PText>
      {/* beat: mixed with sawdust */}
      <PLine pts={[[1100, 880], [1200, 880]]} at={saw + 2} draw={3} color={PAL.red} sw={16} seed={140} />
      <PLine pts={[[1150, 830], [1150, 930]]} at={saw + 3} draw={3} color={PAL.red} sw={16} seed={141} />
      <Pop at={saw + 4} x={1470} y={930}><g transform="translate(0,-60)">
        <PShape pts={[[1280, 990], [1340, 900], [1430, 850], [1530, 860], [1610, 920], [1660, 990]]} fill={PAL.tan} at={saw + 4} draw={0} seed={120} />
        {Array.from({length: 22}, (_, i) => {
          const x = 1330 + ((i * 53) % 290); const y = 900 + ((i * 37) % 80);
          return <PShape key={i} pts={ell(x, y, 6, 4, 6)} fill={PAL.brown} at={saw + 4} draw={0} sw={2} color={PAL.brown} seed={130 + i} />;
        })}
      </g></Pop>
      <PText x={1470} y={1000} at={saw + 10} size={70} anchor="middle">SAWDUST</PText>
    </Board>
  );
};

const sfx = (name: string, at: number, vol: number) => (
  <Sequence from={at} key={name + at}><Audio src={staticFile(`sfx/${name}.wav`)} volume={vol} /></Sequence>
);

export const Habakkuk: React.FC = () => {
  const {durationInFrames} = useVideoConfig();
  const s = T.scenes;
  return (
    <AbsoluteFill style={{background: PAL.white}}>
      <style>{font}</style>
      <Sequence from={s[0]} durationInFrames={s[1] - s[0]}><S1 /></Sequence>
      <Sequence from={s[1]} durationInFrames={s[2] - s[1]}><S2 /></Sequence>
      <Sequence from={s[2]} durationInFrames={s[3] - s[2]}><S3 /></Sequence>
      <Sequence from={s[3]} durationInFrames={durationInFrames - s[3]}><S4 /></Sequence>
      {T.voice ? <Audio src={staticFile(T.voice)} /> : null}
      <Audio src={staticFile('music/habakkuk_bed.wav')} volume={1} />
      {sfx('pop', s[0] + 40, 0.18)}
      {sfx('splash', s[1] + 42, 0.16)}
      {sfx('bubbles', s[1] + 58, 0.10)}
      {sfx('pop', s[3] + 44, 0.16)}
      {sfx('pop', s[4] + 4, 0.2)}
    </AbsoluteFill>
  );
};
