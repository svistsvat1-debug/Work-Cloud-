import React from 'react';
import {AbsoluteFill, Html5Audio, staticFile} from 'remotion';
import tsJson from '../../../../videos/04-instagram-myth/timestamps.json';
import {AvatarCloseup, AvatarPipTrack} from '../../avatar/Presenter';
import {CameraMotion, type Punch} from '../../components/CameraMotion';
import {KineticSubtitles} from '../../components/KineticSubtitles';
import {SfxLayer, type SfxCue, type SfxName} from '../../components/SfxLayer';
import {Shot} from '../../components/Shot';
import {timeline, toFrame as F, type Timestamps} from '../../lib/timeline';
import type {Phone} from '../../lib/visemes';
import {PaperBg} from '../../ui/Light';
import {Algorithm, AroundTheClock, FollowPill, Funnel, MythQuote, NightBooking, OwnedSite, RentedProfile} from './scenes';

const ts = tsJson as unknown as Timestamps & {phones: Phone[]};
const T = timeline(ts);
export const video04Duration = T.durationInFrames;
const voice = {phones: ts.phones, words: ts.words};

const lead = 0.03;
const cut = {
  b: T.word(0, 5) - lead, // I have Instagram
  c: T.seg(1) - lead, // Sound familiar?
  d: T.seg(2) - lead, // Here's the catch
  e: T.seg(3) - lead, // On Instagram, you rent your audience
  f: T.seg(4) - lead, // The algorithm decides
  g: T.word(4, 3) - lead, // who sees your posts
  h: T.seg(5) - lead, // Your website is the place you own
  i: T.seg(6) - lead, // It works 24/7
  j: T.word(6, 3) - lead, // even when you don't post
  k: T.seg(7) - lead, // So use Instagram to get attention
  l: T.seg(8) - lead, // And your website to turn it into clients
  m: T.seg(9) - lead, // Follow for more
};
const END = T.durationInFrames;
const L = (sec: number, shotSec: number) => F(sec) - F(shotSec);

const quoteWords = ts.words.filter((w) => w.seg === 0).map((w) => ({text: w.text.replace(/"/g, ''), abs: F(w.start)}));
const quote = (shotSec: number) => quoteWords.map((w) => ({text: w.text, at: w.abs - F(shotSec)}));

// calmer edit: soft punches only on the key beats
const punches: Punch[] = [
  {at: F(T.word(2, 2)), strength: 0.5}, // catch
  {at: F(T.word(3, 3)), strength: 0.35}, // rent
  {at: F(T.word(5, 6)), strength: 0.35}, // own
  {at: F(T.word(8, 7)), strength: 0.4}, // clients
  {at: F(T.word(9, 0)), strength: 0.35}, // Follow
];

const s = (sec: number, sfx: SfxName, gain?: number): SfxCue => ({at: F(sec), sfx, gain});
const sfx: SfxCue[] = [
  s(0.05, 'whoosh-short', 0.5),
  s(T.word(0, 7), 'whoosh-short', 0.35),
  s(cut.c, 'whoosh-short', 0.4),
  s(T.word(2, 2), 'pop', 0.6),
  s(cut.e, 'whoosh-short', 0.5),
  s(T.word(3, 3), 'pop', 0.7),
  s(cut.f, 'whoosh-short', 0.4),
  s(T.word(4, 2), 'whoosh-short', 0.35),
  s(cut.h, 'whoosh-short', 0.4),
  s(T.word(5, 6), 'pop', 0.7),
  s(cut.i, 'whoosh-short', 0.4),
  s(T.word(6, 6), 'notify', 0.8),
  s(cut.k, 'whoosh-short', 0.4),
  s(T.word(7, 2), 'pop', 0.5),
  s(T.word(7, 5), 'pop', 0.5),
  s(T.word(8, 2), 'pop', 0.5),
  s(T.word(8, 7), 'check', 0.8),
  s(cut.m, 'whoosh-short', 0.4),
  s(T.word(9, 0), 'pop', 0.7),
];

export const Video04: React.FC = () => (
  <AbsoluteFill>
    <PaperBg />
    <CameraMotion punches={punches} idle={0.5}>
      <Shot from={0} to={F(cut.b)} transition="soft" push={0.02}>
        <MythQuote words={quote(0)} />
      </Shot>
      <Shot from={F(cut.b)} to={F(cut.c)} transition="cut" push={0.03}>
        <MythQuote words={quote(cut.b)} markAt={L(T.word(0, 7), cut.b)} enter={false} />
      </Shot>
      <Shot from={F(cut.c)} to={F(cut.d)} transition="soft" push={0.02}>
        <AvatarCloseup {...voice} from={F(cut.c)} />
      </Shot>
      <Shot from={F(cut.d)} to={F(cut.e)} transition="cut" push={0.02}>
        <AvatarCloseup {...voice} from={F(cut.d)} zoom={1.15} />
      </Shot>
      <Shot from={F(cut.e)} to={F(cut.f)} transition="slide" push={0.02}>
        <RentedProfile rentAt={L(T.word(3, 3), cut.e)} />
      </Shot>
      <Shot from={F(cut.f)} to={F(cut.g)} transition="slide" push={0.02}>
        <Algorithm filterAt={L(T.word(4, 2), cut.f)} eyesAt={9999} />
      </Shot>
      <Shot from={F(cut.g)} to={F(cut.h)} transition="cut" push={0.03}>
        <Algorithm filterAt={-99} eyesAt={L(T.word(4, 4), cut.g)} enter={false} />
      </Shot>
      <Shot from={F(cut.h)} to={F(cut.i)} transition="slide" push={0.02}>
        <OwnedSite ownAt={L(T.word(5, 6), cut.h)} />
      </Shot>
      <Shot from={F(cut.i)} to={F(cut.j)} transition="soft" push={0.02}>
        <AroundTheClock />
      </Shot>
      <Shot from={F(cut.j)} to={F(cut.k)} transition="soft" push={0.02}>
        <NightBooking bookAt={L(T.word(6, 6), cut.j)} />
      </Shot>
      <Shot from={F(cut.k)} to={F(cut.l)} transition="slide" push={0.02}>
        <Funnel socialAt={L(T.word(7, 2), cut.k)} attentionAt={L(T.word(7, 5), cut.k)} siteAt={9999} clientsAt={9999} />
      </Shot>
      <Shot from={F(cut.l)} to={F(cut.m)} transition="cut" push={0.02}>
        <Funnel socialAt={-99} attentionAt={-99} siteAt={L(T.word(8, 2), cut.l)} clientsAt={L(T.word(8, 7), cut.l)} />
      </Shot>
      <Shot from={F(cut.m)} to={END} transition="soft" push={0.02}>
        <AvatarCloseup {...voice} from={F(cut.m)}>
          <FollowPill at={L(T.word(9, 0), cut.m)} />
        </AvatarCloseup>
      </Shot>
      <AvatarPipTrack
        {...voice}
        ranges={[
          [0, F(cut.c)],
          [F(cut.e), F(cut.m)],
        ]}
      />
    </CameraMotion>
    <KineticSubtitles words={ts.words} centerY={1330} theme="light" />
    <Html5Audio src={staticFile('gen/04-instagram-myth/voice.wav')} />
    <SfxLayer cues={sfx} />
  </AbsoluteFill>
);
