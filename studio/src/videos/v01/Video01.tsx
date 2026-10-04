import React from 'react';
import {AbsoluteFill, Html5Audio, staticFile} from 'remotion';
import tsJson from '../../../../videos/01-ask-chatgpt/timestamps.json';
import {BrandBackground} from '../../components/BrandBackground';
import {CameraMotion, type Punch} from '../../components/CameraMotion';
import {Flash} from '../../components/Flash';
import {KineticSubtitles} from '../../components/KineticSubtitles';
import {SfxLayer, type SfxCue, type SfxName} from '../../components/SfxLayer';
import {Shot} from '../../components/Shot';
import {timeline, toFrame as F, type Timestamps} from '../../lib/timeline';
import {
  BigQuestion,
  CantRecommend,
  FixedSite,
  FixIt,
  FollowCard,
  GhostSlot,
  HookTyping,
  NoGuessing,
  NotYours,
  PickYou,
  QueryCloud,
  ReadsTheWeb,
  ThreeNames,
  TypeQuery,
  VagueSite,
} from './scenes';

const ts = tsJson as Timestamps;
const T = timeline(ts);
export const video01Duration = T.durationInFrames;

// Cut points (sec): each cut lands just before the word that drives the next shot.
const lead = 0.03;
const cut = {
  a2: T.word(0, 2) - lead, // "who"
  b: T.seg(1) - lead, // "Are you there?"
  c: T.seg(2) - lead, // "People search..."
  d: T.seg(3) - lead, // "Best roofer near me"
  e: T.seg(4) - lead, // "AI gives them three names"
  f: T.seg(5) - lead, // "Not yours"
  g: T.seg(6) - lead, // "Why?"
  h: T.seg(7) - lead, // "AI doesn't guess"
  i: T.seg(8) - lead, // "It reads the web"
  j: T.seg(9) - lead, // "Including your site"
  k: T.seg(10) - lead, // "If your site doesn't..."
  l1: T.word(10, 5) - lead, // "say"
  l2: T.seg(11) - lead, // "where you work"
  l3: T.seg(12) - lead, // "and who it's for"
  m: T.seg(13) - lead, // "AI can't recommend you"
  n: T.seg(14) - lead, // "Fix it"
  o: T.seg(15) - lead, // "Clear services"
  p: T.seg(16) - lead, // "Your city"
  q: T.seg(17) - lead, // "Real answers..."
  q2: T.word(17, 3) - lead, // "real questions"
  r: T.seg(18) - lead, // "Give AI a reason..."
  s: T.seg(19) - lead, // "Follow for more"
};
const END = T.durationInFrames;
/** local frame inside a shot that starts at `shotSec` */
const L = (sec: number, shotSec: number) => F(sec) - F(shotSec);

const punches: Punch[] = [
  {at: F(T.word(0, 1)), strength: 0.6}, // ChatGPT
  {at: F(T.word(1, 1)), strength: 1}, // you
  {at: F(T.word(5, 0)), strength: 0.9}, // Not
  {at: F(T.word(5, 1)), strength: 1.2}, // yours
  {at: F(T.word(6, 0)), strength: 1}, // Why
  {at: F(T.word(7, 2)), strength: 0.6}, // guess
  {at: F(cut.l2), strength: 0.5},
  {at: F(cut.l3), strength: 0.5},
  {at: F(T.word(13, 1)), strength: 1.2}, // can't
  {at: F(T.word(14, 0)), strength: 1.4}, // Fix
  {at: F(T.word(18, 5)), strength: 1}, // pick
  {at: F(T.word(19, 0)), strength: 0.8}, // Follow
];

const s = (sec: number, sfx: SfxName, gain?: number): SfxCue => ({at: F(sec), sfx, gain});
const ticks = (from: number, to: number, every = 0.09) =>
  Array.from({length: Math.max(1, Math.floor((to - from) / every))}, (_, i) => s(from + i * every, 'tick'));

const sfx: SfxCue[] = [
  s(0, 'whoosh-short'),
  ...ticks(0.03, 0.7),
  s(cut.a2, 'whoosh-short'),
  s(cut.a2 + 0.03, 'pop'),
  s(cut.b, 'glitch'),
  s(T.word(1, 1), 'impact', 0.55),
  s(cut.c, 'whip'),
  ...[0, 1, 2, 4].map((k) => s(T.word(2, k), 'pop')),
  s(cut.d, 'whoosh-short'),
  ...[0, 1, 2, 3].flatMap((k) => ticks(T.word(3, k), T.word(3, k) + 0.18)),
  s(T.wordEnd(3) - 0.1, 'click'),
  s(cut.e, 'whoosh-short'),
  ...[1, 3, 4].map((k) => s(T.word(4, k), 'pop')),
  s(cut.f, 'glitch'),
  s(T.word(5, 0), 'impact', 0.7),
  s(T.word(5, 1), 'error'),
  s(cut.g, 'whoosh'),
  s(cut.g + 0.02, 'glitch', 0.6),
  s(cut.h, 'whip'),
  s(T.word(7, 2), 'click'),
  s(cut.i, 'whoosh'),
  s(cut.j, 'whoosh-short'),
  s(cut.k, 'whoosh-short'),
  s(T.word(10, 4), 'pop'),
  s(cut.l1, 'whoosh-short'),
  s(T.word(10, 6), 'pop'),
  s(T.word(11, 0), 'pop'),
  s(T.word(12, 1), 'pop'),
  s(cut.m, 'glitch'),
  s(T.word(13, 1), 'error'),
  s(T.word(14, 0) - 1.2, 'riser'),
  s(T.word(14, 0), 'impact'),
  s(cut.o, 'whip'),
  s(cut.o + 0.15, 'glitch', 0.5),
  s(T.word(15, 1), 'check'),
  s(cut.p, 'whoosh-short'),
  s(T.word(16, 1), 'check'),
  s(cut.q, 'whoosh-short'),
  s(T.word(17, 0), 'pop'),
  s(T.word(17, 1), 'check'),
  s(T.word(17, 2), 'pop'),
  s(cut.q2, 'whoosh-short'),
  s(T.word(17, 4), 'pop'),
  s(T.word(17, 4) + 0.2, 'click'),
  s(cut.r, 'glitch'),
  s(T.word(18, 5), 'impact', 0.8),
  s(T.word(18, 5) + 0.05, 'check'),
  s(cut.s, 'whoosh'),
  s(T.word(19, 0), 'pop'),
  s(T.word(19, 2), 'click'),
  s(T.word(19, 2) + 0.6, 'click'),
];

export const Video01: React.FC = () => (
  <AbsoluteFill>
    <BrandBackground />
    <CameraMotion punches={punches}>
      <Shot from={0} to={F(cut.a2)} transition="zoomOut">
        <HookTyping sendAt={9999} />
      </Shot>
      <Shot from={F(cut.a2)} to={F(cut.b)} transition="zoomIn">
        <HookTyping sendAt={0} />
      </Shot>
      <Shot from={F(cut.b)} to={F(cut.c)} transition="glitch">
        <GhostSlot />
      </Shot>
      <Shot from={F(cut.c)} to={F(cut.d)} transition="whipRight">
        <QueryCloud pops={[0, 1, 2, 4].map((k) => L(T.word(2, k), cut.c))} />
      </Shot>
      <Shot from={F(cut.d)} to={F(cut.e)} transition="zoomIn">
        <TypeQuery wordStarts={[0, 1, 2, 3].map((k) => L(T.word(3, k), cut.d))} sendAt={L(T.wordEnd(3) - 0.1, cut.d)} />
      </Shot>
      <Shot from={F(cut.e)} to={F(cut.f)} transition="zoomOut">
        <ThreeNames cardsAt={[1, 3, 4].map((k) => L(T.word(4, k), cut.e))} />
      </Shot>
      <Shot from={F(cut.f)} to={F(cut.g)} transition="glitch" glitchHits={[F(T.word(5, 1))]}>
        <NotYours strikeAt={L(T.word(5, 1), cut.f)} />
      </Shot>
      <Shot from={F(cut.g)} to={F(cut.h)} transition="glitch">
        <BigQuestion />
      </Shot>
      <Shot from={F(cut.h)} to={F(cut.i)} transition="whipLeft">
        <NoGuessing strikeAt={L(T.word(7, 2), cut.h)} />
      </Shot>
      <Shot from={F(cut.i)} to={F(cut.j)} transition="zoomIn">
        <ReadsTheWeb />
      </Shot>
      <Shot from={F(cut.j)} to={F(cut.k)} transition="zoomOut">
        <VagueSite scanUntil={L(T.wordEnd(9), cut.j)} />
      </Shot>
      <Shot from={F(cut.k)} to={F(cut.l1)} transition="zoomIn" push={0.06}>
        <VagueSite focus="hero" marks={[L(T.word(10, 4), cut.k)]} />
      </Shot>
      <Shot from={F(cut.l1)} to={F(cut.l2)} transition="zoomOut">
        <VagueSite marks={[-99, L(T.word(10, 6), cut.l1)]} />
      </Shot>
      <Shot from={F(cut.l2)} to={F(cut.l3)} transition="cut">
        <VagueSite marks={[-99, -99, L(T.word(11, 0), cut.l2)]} />
      </Shot>
      <Shot from={F(cut.l3)} to={F(cut.m)} transition="cut">
        <VagueSite marks={[-99, -99, -99, L(T.word(12, 1), cut.l3)]} />
      </Shot>
      <Shot from={F(cut.m)} to={F(cut.n)} transition="glitch" glitchHits={[F(T.word(13, 1))]}>
        <CantRecommend />
      </Shot>
      <Shot from={F(cut.n)} to={F(cut.o)} transition="zoomIn">
        <FixIt />
      </Shot>
      <Shot from={F(cut.o)} to={F(cut.p)} transition="whipRight" glitchHits={[F(cut.o + 0.15)]}>
        <FixedSite focus="services" rewriteAt={L(cut.o + 0.15, cut.o)} checks={{services: L(T.word(15, 1), cut.o)}} />
      </Shot>
      <Shot from={F(cut.p)} to={F(cut.q)} transition="zoomIn">
        <FixedSite focus="city" checks={{services: -99, city: L(T.word(16, 1), cut.p)}} />
      </Shot>
      <Shot from={F(cut.q)} to={F(cut.q2)} transition="zoomOut">
        <FixedSite focus="faq" checks={{services: -99, city: -99, faq: L(T.word(17, 1), cut.q)}} faqAt={[0, 2].map((k) => L(T.word(17, k), cut.q))} />
      </Shot>
      <Shot from={F(cut.q2)} to={F(cut.r)} transition="zoomIn">
        <FixedSite
          focus="faqOpen"
          checks={{services: -99, city: -99, faq: -99}}
          faqAt={[-99, -99, L(T.word(17, 4), cut.q2), L(T.word(17, 4), cut.q2) + 6]}
        />
      </Shot>
      <Shot from={F(cut.r)} to={F(cut.s)} transition="glitch">
        <PickYou revealAt={L(T.word(18, 5), cut.r)} />
      </Shot>
      <Shot from={F(cut.s)} to={END} transition="zoomIn" push={0.03}>
        <FollowCard pulses={[L(T.word(19, 2), cut.s), L(T.word(19, 2) + 0.6, cut.s)]} />
      </Shot>
    </CameraMotion>
    <Flash
      at={[
        {frame: F(cut.g), color: 'white', length: 3},
        {frame: F(T.word(14, 0)), color: 'yellow', length: 5},
        {frame: F(T.word(18, 5)), color: 'white', length: 3},
      ]}
    />
    <KineticSubtitles words={ts.words} />
    <Html5Audio src={staticFile('gen/01-ask-chatgpt/voice.wav')} />
    <SfxLayer cues={sfx} />
  </AbsoluteFill>
);
