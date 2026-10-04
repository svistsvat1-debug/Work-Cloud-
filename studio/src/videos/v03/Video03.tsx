import React from 'react';
import {AbsoluteFill, Html5Audio, staticFile} from 'remotion';
import tsJson from '../../../../videos/03-contact-form/timestamps.json';
import {CameraMotion, type Punch} from '../../components/CameraMotion';
import {Flash} from '../../components/Flash';
import {KineticSubtitles} from '../../components/KineticSubtitles';
import {SfxLayer, type SfxCue, type SfxName} from '../../components/SfxLayer';
import {Shot} from '../../components/Shot';
import {timeline, toFrame as F, type Timestamps} from '../../lib/timeline';
import {YellowBg} from '../../ui/Brutal';
import {
  BookedElsewhere,
  Chain,
  ContactForm,
  Inbox,
  LinkInBio,
  NoReply,
  StepAlert,
  StepCrm,
  StepReply,
  ThreeSteps,
  Unseen,
  WeBuild,
} from './scenes';

const ts = tsJson as unknown as Timestamps;
const T = timeline(ts);
export const video03Duration = T.durationInFrames;

const lead = 0.03;
const cut = {
  b: T.word(0, 3) - lead, // "is where leads die"
  c: T.seg(1) - lead, // A lead fills it out
  d: T.seg(2) - lead, // It lands in your inbox
  e: T.word(2, 5) - lead, // under a pile of newsletters
  f: T.seg(3) - lead, // Nobody sees it
  g: T.seg(4) - lead, // No reply
  h: T.seg(5) - lead, // So they book someone else
  i: T.seg(6) - lead, // Fix it in three steps
  j: T.seg(7) - lead, // One. Instant alert
  k: T.seg(8) - lead, // Two. Auto-reply
  l: T.seg(9) - lead, // Three. CRM
  m: T.seg(10) - lead, // Now nothing gets lost
  n: T.seg(11) - lead, // We build this for you
  o: T.seg(12) - lead, // Link in bio
};
const END = T.durationInFrames;
const L = (sec: number, shotSec: number) => F(sec) - F(shotSec);

const pile = [T.word(2, 5), T.word(2, 6), T.word(2, 7), T.word(2, 8), T.word(2, 9), T.word(2, 9) + 0.25];

const punches: Punch[] = [
  {at: F(T.word(0, 6)), strength: 1.2}, // die
  {at: F(T.word(1, 4)), strength: 0.5}, // out
  {at: F(T.word(2, 9)), strength: 0.7}, // newsletters
  {at: F(T.word(3, 1)), strength: 0.7}, // sees
  {at: F(T.word(4, 1)), strength: 1.3}, // reply
  {at: F(T.word(5, 4)), strength: 0.8}, // else
  {at: F(T.word(6, 0)), strength: 1.4}, // Fix
  {at: F(T.word(7, 2)), strength: 0.8}, // alert
  {at: F(T.word(8, 1)), strength: 0.6}, // Auto-reply
  {at: F(T.word(9, 6)), strength: 0.7}, // CRM
  {at: F(T.word(10, 3)), strength: 1.2}, // lost
  {at: F(T.word(11, 4)), strength: 0.6}, // you
  {at: F(T.word(12, 0)), strength: 0.9}, // Link
];

const s = (sec: number, sfx: SfxName, gain?: number): SfxCue => ({at: F(sec), sfx, gain});
const ticks = (from: number, to: number, every = 0.09) =>
  Array.from({length: Math.max(1, Math.floor((to - from) / every))}, (_, i) => s(from + i * every, 'tick'));

const sfx: SfxCue[] = [
  s(0, 'whoosh-short'),
  s(cut.b, 'whoosh-short'),
  s(T.word(0, 6), 'beep'),
  s(T.word(0, 6), 'impact', 0.5),
  s(cut.c, 'whip'),
  ...ticks(T.word(1, 1), T.word(1, 4) - 0.05),
  s(T.word(1, 4), 'click'),
  s(T.word(1, 4) + 0.05, 'check'),
  s(cut.d, 'whoosh-short'),
  s(T.word(2, 4), 'notify'),
  ...pile.map((t) => s(t, 'pop', 0.8)),
  s(cut.f, 'glitch'),
  s(T.word(3, 1), 'error', 0.5),
  s(cut.g, 'whoosh-short'),
  s(T.word(4, 1), 'impact', 0.8),
  s(cut.h, 'whip'),
  s(T.word(5, 2), 'pop'),
  s(T.word(6, 0) - 1.2, 'riser'),
  s(T.word(6, 0), 'impact'),
  s(cut.j, 'whip'),
  s(T.word(7, 2), 'buzz'),
  s(T.word(7, 2), 'notify', 0.8),
  s(cut.k, 'whip'),
  s(T.word(8, 3), 'check'),
  s(cut.l, 'whip'),
  s(T.word(9, 2), 'pop'),
  s(T.word(9, 4), 'pop'),
  s(T.word(9, 6), 'pop'),
  s(cut.m, 'whoosh'),
  ...[0, 5, 10, 15].map((fr) => ({at: F(cut.m) + fr, sfx: 'check' as SfxName, gain: 0.6})),
  s(T.word(10, 3), 'impact', 0.6),
  s(cut.n, 'glitch', 0.7),
  s(cut.o, 'whoosh'),
  s(T.word(12, 2), 'click'),
  s(T.word(12, 2) + 0.7, 'click'),
];

export const Video03: React.FC = () => (
  <AbsoluteFill>
    <YellowBg />
    <CameraMotion punches={punches}>
      <Shot from={0} to={F(cut.b)} transition="zoomOut">
        <ContactForm />
      </Shot>
      <Shot from={F(cut.b)} to={F(cut.c)} transition="zoomIn" push={0.06}>
        <ContactForm dieAt={L(T.word(0, 6), cut.b)} />
      </Shot>
      <Shot from={F(cut.c)} to={F(cut.d)} transition="whipRight">
        <ContactForm typed={{name: L(T.word(1, 1), cut.c), msg: L(T.word(1, 2), cut.c)}} sendAt={L(T.word(1, 4), cut.c)} />
      </Shot>
      <Shot from={F(cut.d)} to={F(cut.e)} transition="zoomIn">
        <Inbox leadAt={L(T.word(2, 4), cut.d)} pileAt={[]} />
      </Shot>
      <Shot from={F(cut.e)} to={F(cut.f)} transition="cut" push={0.05}>
        <Inbox leadAt={-99} pileAt={pile.map((t) => L(t, cut.e))} />
      </Shot>
      <Shot from={F(cut.f)} to={F(cut.g)} transition="glitch">
        <Unseen />
      </Shot>
      <Shot from={F(cut.g)} to={F(cut.h)} transition="zoomIn">
        <NoReply stampAt={L(T.word(4, 1), cut.g)} />
      </Shot>
      <Shot from={F(cut.h)} to={F(cut.i)} transition="whipLeft">
        <BookedElsewhere cardAt={L(T.word(5, 2), cut.h)} markAt={L(T.word(5, 3), cut.h)} />
      </Shot>
      <Shot from={F(cut.i)} to={F(cut.j)} transition="zoomIn">
        <ThreeSteps />
      </Shot>
      <Shot from={F(cut.j)} to={F(cut.k)} transition="whipRight">
        <StepAlert alertAt={L(T.word(7, 2), cut.j)} />
      </Shot>
      <Shot from={F(cut.k)} to={F(cut.l)} transition="whipRight">
        <StepReply sentAt={L(T.word(8, 3), cut.k)} />
      </Shot>
      <Shot from={F(cut.l)} to={F(cut.m)} transition="whipRight">
        <StepCrm
          cards={[
            {col: 0, title: 'Quote request', at: L(T.word(9, 2), cut.l)},
            {col: 1, title: 'Auto-reply ✓', at: L(T.word(9, 4), cut.l)},
            {col: 2, title: 'Tue 10:00', at: L(T.word(9, 6), cut.l)},
          ]}
        />
      </Shot>
      <Shot from={F(cut.m)} to={F(cut.n)} transition="zoomOut">
        <Chain />
      </Shot>
      <Shot from={F(cut.n)} to={F(cut.o)} transition="glitch">
        <WeBuild />
      </Shot>
      <Shot from={F(cut.o)} to={END} transition="zoomIn" push={0.03}>
        <LinkInBio tapAt={L(T.word(12, 2), cut.o)} />
      </Shot>
    </CameraMotion>
    <Flash at={[{frame: F(T.word(6, 0)), color: 'white', length: 4}]} />
    <KineticSubtitles words={ts.words} centerY={1310} theme="yellow" />
    <Html5Audio src={staticFile('gen/03-contact-form/voice.wav')} />
    <SfxLayer cues={sfx} />
  </AbsoluteFill>
);
