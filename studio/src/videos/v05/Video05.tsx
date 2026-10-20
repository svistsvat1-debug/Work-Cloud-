import React from 'react';
import {AbsoluteFill, Html5Audio, staticFile} from 'remotion';
import tsJson from '../../../../videos/05-site-redesign/timestamps.json';
import {AvatarCloseup, AvatarPipTrack} from '../../avatar/Presenter';
import {BrandBackground} from '../../components/BrandBackground';
import {CameraMotion, type Punch} from '../../components/CameraMotion';
import {KineticSubtitles} from '../../components/KineticSubtitles';
import {SfxLayer, type SfxCue, type SfxName} from '../../components/SfxLayer';
import {Shot} from '../../components/Shot';
import {timeline, toFrame as F, type Timestamps} from '../../lib/timeline';
import type {Phone} from '../../lib/visemes';
import {FollowPill} from '../v04/scenes';
import {BeforeAfter, Redesign, ToMobile} from './scenes';

const ts = tsJson as unknown as Timestamps & {phones: Phone[]};
const T = timeline(ts);
export const video05Duration = T.durationInFrames;
const voice = {phones: ts.phones, words: ts.words};

const lead = 0.03;
const cut = {
  b: T.word(0, 3) - lead, // losing clients
  c: T.seg(1) - lead, // Let's fix it, step by step
  d: T.seg(2) - lead, // First, the headline
  e: T.seg(3) - lead, // Say what you do, and where
  f: T.seg(4) - lead, // Next, one button
  g: T.seg(5) - lead, // One clear next step: Book a cleaning
  h: T.seg(6) - lead, // Then, trust
  i: T.seg(7) - lead, // Show reviews right next to the button
  j: T.seg(8) - lead, // Finally, mobile
  k: T.seg(9) - lead, // Your clients probably see it on their phone
  l: T.seg(10) - lead, // Before. And after.
  m: T.seg(11) - lead, // Follow for more
};
const END = T.durationInFrames;
const L = (sec: number, shotSec: number) => F(sec) - F(shotSec);

const punches: Punch[] = [
  {at: F(T.word(0, 4)), strength: 0.4}, // clients
  {at: F(T.word(2, 2)), strength: 0.3}, // headline
  {at: F(T.word(5, 4)), strength: 0.4}, // Book
  {at: F(T.word(7, 1)), strength: 0.3}, // reviews
  {at: F(T.word(8, 1)), strength: 0.3}, // mobile
  {at: F(T.word(10, 2)), strength: 0.6}, // after
  {at: F(T.word(11, 0)), strength: 0.35}, // Follow
];

const s = (sec: number, sfx: SfxName, gain?: number): SfxCue => ({at: F(sec), sfx, gain});
const sfx: SfxCue[] = [
  s(0.05, 'whoosh-short', 0.5),
  s(cut.b, 'whoosh-short', 0.4),
  s(cut.c, 'whoosh-short', 0.4),
  s(cut.d, 'whoosh-short', 0.4),
  s(T.word(2, 2), 'pop', 0.6),
  s(T.word(3, 1), 'whoosh-short', 0.4),
  s(T.word(3, 1) + 0.3, 'check', 0.7),
  s(T.word(3, 5), 'pop', 0.5),
  s(cut.f, 'whoosh-short', 0.4),
  s(T.word(4, 2), 'pop', 0.6),
  s(T.word(5, 4), 'whoosh-short', 0.4),
  s(T.word(5, 4) + 0.3, 'check', 0.7),
  s(cut.h, 'whoosh-short', 0.4),
  s(cut.i, 'whoosh-short', 0.4),
  s(T.word(7, 1), 'whoosh-short', 0.4),
  s(T.word(7, 1) + 0.3, 'check', 0.7),
  s(cut.j, 'whoosh-short', 0.4),
  s(T.word(8, 1), 'whoosh', 0.5),
  s(T.word(9, 7), 'click', 0.8),
  s(cut.l, 'whoosh-short', 0.4),
  s(T.word(10, 2), 'whoosh', 0.6),
  s(T.word(10, 2) + 0.9, 'check', 0.7),
  s(cut.m, 'whoosh-short', 0.4),
  s(T.word(11, 0), 'pop', 0.7),
];

export const Video05: React.FC = () => (
  <AbsoluteFill>
    <BrandBackground />
    <CameraMotion punches={punches} idle={0.5}>
      <Shot from={0} to={F(cut.b)} transition="soft" push={0.03}>
        <Redesign focus="headline" enter />
      </Shot>
      <Shot from={F(cut.b)} to={F(cut.c)} transition="soft" push={0.02}>
        <Redesign focus="all" />
      </Shot>
      <Shot from={F(cut.c)} to={F(cut.d)} transition="soft" push={0.02}>
        <AvatarCloseup {...voice} from={F(cut.c)} halo />
      </Shot>
      <Shot from={F(cut.d)} to={F(cut.e)} transition="slide" push={0.02}>
        <Redesign focus="headline" outline={{region: 'headline', at: L(T.word(2, 2), cut.d)}} />
      </Shot>
      <Shot from={F(cut.e)} to={F(cut.f)} transition="cut" push={0.02}>
        <Redesign focus="headline" headlineAt={L(T.word(3, 1), cut.e)} outline={{region: 'headline', at: -99}} />
      </Shot>
      <Shot from={F(cut.f)} to={F(cut.g)} transition="slide" push={0.02}>
        <Redesign focus="cta" headlineAt={-99} outline={{region: 'cta', at: L(T.word(4, 2), cut.f)}} />
      </Shot>
      <Shot from={F(cut.g)} to={F(cut.h)} transition="cut" push={0.02}>
        <Redesign focus="cta" headlineAt={-99} ctaAt={L(T.word(5, 4), cut.g)} outline={{region: 'cta', at: -99}} />
      </Shot>
      <Shot from={F(cut.h)} to={F(cut.i)} transition="soft" push={0.02}>
        <AvatarCloseup {...voice} from={F(cut.h)} zoom={1.15} halo />
      </Shot>
      <Shot from={F(cut.i)} to={F(cut.j)} transition="slide" push={0.02}>
        <Redesign focus="trust" headlineAt={-99} ctaAt={-99} trustAt={L(T.word(7, 1), cut.i)} outline={{region: 'trust', at: 0}} />
      </Shot>
      <Shot from={F(cut.j)} to={F(cut.k)} transition="soft" push={0.02}>
        <ToMobile morphAt={L(T.word(8, 1), cut.j)} />
      </Shot>
      <Shot from={F(cut.k)} to={F(cut.l)} transition="cut" push={0.03}>
        <ToMobile morphAt={-99} morphed tapAt={L(T.word(9, 7), cut.k)} />
      </Shot>
      <Shot from={F(cut.l)} to={F(cut.m)} transition="soft" push={0.02}>
        <BeforeAfter afterAt={L(T.word(10, 2), cut.l)} />
      </Shot>
      <Shot from={F(cut.m)} to={END} transition="soft" push={0.02}>
        <AvatarCloseup {...voice} from={F(cut.m)} halo>
          <FollowPill at={L(T.word(11, 0), cut.m)} />
        </AvatarCloseup>
      </Shot>
      <AvatarPipTrack
        {...voice}
        halo
        ranges={[
          [0, F(cut.c)],
          [F(cut.d), F(cut.h)],
          [F(cut.i), F(cut.m)],
        ]}
      />
    </CameraMotion>
    <KineticSubtitles words={ts.words} centerY={1330} />
    <Html5Audio src={staticFile('gen/05-site-redesign/voice.wav')} />
    <SfxLayer cues={sfx} />
  </AbsoluteFill>
);
