import React from 'react';
import {AbsoluteFill, Html5Audio, staticFile} from 'remotion';
import tsJson from '../../../../videos/02-hold-it-down/timestamps.json';
import {C} from '../../brand';
import {CameraMotion, type Punch} from '../../components/CameraMotion';
import {Flash} from '../../components/Flash';
import {KineticSubtitles} from '../../components/KineticSubtitles';
import {SfxLayer, type SfxCue, type SfxName} from '../../components/SfxLayer';
import {Shot} from '../../components/Shot';
import {timeline, toFrame as F, type Timestamps} from '../../lib/timeline';
import {FollowCard} from '../../ui/Common';
import {Bolt, CalendarIcon, Globe, Mail} from '../../ui/Icons';
import {Wallpaper} from '../../ui/Phone';
import {LockHook, NotEmployee, NotifStack, Pipeline, SystemFlow, type Notif} from './scenes';

const ts = tsJson as Timestamps;
const T = timeline(ts);
export const video02Duration = T.durationInFrames;

const lead = 0.03;
const cut = {
  b: T.seg(1) - lead, // Someone's gotta hold it down
  c: T.seg(2) - lead, // New lead at 9PM?
  d: T.seg(3) - lead, // Replied in seconds
  e: T.seg(4) - lead, // Booking request?
  g: T.seg(5) - lead, // Confirmed
  h: T.seg(6) - lead, // No reply in two days?
  i: T.seg(7) - lead, // Follow-up sent
  j: T.seg(8) - lead, // Every lead, in the CRM
  k: T.seg(9) - lead, // So who's holding it down?
  l: T.seg(10) - lead, // Not an employee
  m: T.seg(11) - lead, // A system
  n: T.seg(12) - lead, // Follow for more
};
const END = T.durationInFrames;
const L = (sec: number, shotSec: number) => F(sec) - F(shotSec);

const icon = (I: typeof Globe) => <I size={42} color={C.yellow} stroke={2.4} />;
const iconDark = (I: typeof Globe) => <I size={42} color="#000" stroke={2.4} />;

// Every notification is timed to the word that announces it.
const NOTIFS: Notif[] = [
  {at: F(T.word(2, 0)), icon: icon(Globe), app: 'Website', title: 'New lead', body: '"Need a quote this week. Can you help?"'},
  {at: F(T.word(3, 0)), icon: iconDark(Bolt), app: 'Automation', title: 'Auto-reply sent', body: '"Thanks! Pick a time that works →"', accent: true, done: true},
  {
    at: F(T.word(4, 0)),
    icon: icon(CalendarIcon),
    app: 'Calendar',
    title: 'Booking request',
    body: 'Tue · 10:00 AM',
    change: {at: F(T.word(5, 0)), title: 'Booking confirmed', body: 'Tue · 10:00 AM · reminder set', accent: true, done: true},
  },
  {at: F(T.word(6, 0)), icon: icon(Mail), app: 'Inbox', title: 'No reply from lead', body: 'Quote sent 2 days ago'},
  {at: F(T.word(7, 0)), icon: iconDark(Bolt), app: 'Automation', title: 'Follow-up sent', body: '"Just checking in. Still need help?"', accent: true, done: true},
];

const punches: Punch[] = [
  {at: F(T.word(0, 1)), strength: 0.8}, // away
  {at: F(T.word(1, 2)), strength: 1.1}, // hold
  {at: F(T.word(2, 3)), strength: 0.7}, // 9PM
  {at: F(T.word(5, 0)), strength: 0.9}, // Confirmed
  {at: F(T.word(6, 3)), strength: 0.6}, // two days
  {at: F(T.word(8, 4)), strength: 0.7}, // CRM
  {at: F(T.word(10, 2)), strength: 0.9}, // employee
  {at: F(T.word(11, 1)), strength: 1.5}, // system
  {at: F(T.word(12, 0)), strength: 0.8}, // Follow
];

const s = (sec: number, sfx: SfxName, gain?: number): SfxCue => ({at: F(sec), sfx, gain});
const sfx: SfxCue[] = [
  s(0, 'whoosh-short'),
  s(T.word(0, 1), 'notify'),
  s(cut.b, 'whoosh-short'),
  s(T.word(1, 1), 'whip', 0.6),
  s(T.word(1, 2), 'buzz'),
  s(cut.c, 'whoosh-short'),
  s(T.word(2, 0), 'notify'),
  s(T.word(2, 0), 'buzz', 0.5),
  s(T.word(3, 0), 'notify'),
  s(T.word(3, 2), 'check'),
  s(cut.e, 'whoosh-short'),
  s(T.word(4, 0), 'notify'),
  s(cut.g, 'glitch', 0.7),
  s(T.word(5, 0), 'check'),
  s(cut.h, 'whip'),
  s(T.word(6, 0), 'notify'),
  s(T.word(6, 3), 'error', 0.6),
  s(cut.i, 'whoosh-short'),
  s(T.word(7, 0), 'notify'),
  s(T.word(7, 1), 'check'),
  s(cut.j, 'whip'),
  ...[0, 1, 4].map((k) => s(T.word(8, k), 'pop')),
  s(cut.k, 'whoosh'),
  s(T.word(9, 1), 'whoosh-short'),
  s(cut.l, 'glitch'),
  s(T.word(10, 2), 'click'),
  s(T.word(10, 2), 'error', 0.5),
  s(T.word(11, 1) - 1.2, 'riser'),
  s(cut.m, 'whoosh'),
  s(T.word(11, 1), 'impact'),
  s(cut.n, 'whoosh'),
  s(T.word(12, 0), 'pop'),
  s(T.word(12, 2), 'click'),
  s(T.word(12, 2) + 0.6, 'click'),
];

export const Video02: React.FC = () => (
  <AbsoluteFill style={{backgroundColor: '#070707'}}>
    <CameraMotion punches={punches}>
      <Shot from={0} to={F(cut.b)} transition="zoomOut">
        <LockHook from={0} calendarAt={F(T.word(0, 1))} dismissAt={9999} buzzAt={9999} />
      </Shot>
      <Shot from={F(cut.b)} to={F(cut.c)} transition="zoomIn" push={0.06}>
        <LockHook from={F(cut.b)} calendarAt={-99} dismissAt={F(T.word(1, 1))} buzzAt={F(T.word(1, 2))} />
      </Shot>
      <Shot from={F(cut.c)} to={F(cut.d)} transition="zoomIn">
        <NotifStack from={F(cut.c)} items={NOTIFS} />
      </Shot>
      <Shot from={F(cut.d)} to={F(cut.e)} transition="cut">
        <NotifStack from={F(cut.d)} items={NOTIFS} />
      </Shot>
      <Shot from={F(cut.e)} to={F(cut.g)} transition="zoomOut">
        <NotifStack from={F(cut.e)} items={NOTIFS} />
      </Shot>
      <Shot from={F(cut.g)} to={F(cut.h)} transition="glitch">
        <NotifStack from={F(cut.g)} items={NOTIFS} />
      </Shot>
      <Shot from={F(cut.h)} to={F(cut.i)} transition="whipLeft">
        <NotifStack from={F(cut.h)} items={NOTIFS} />
      </Shot>
      <Shot from={F(cut.i)} to={F(cut.j)} transition="zoomIn">
        <NotifStack from={F(cut.i)} items={NOTIFS} />
      </Shot>
      <Shot from={F(cut.j)} to={F(cut.k)} transition="whipRight">
        <Pipeline
          cards={[
            {col: 0, title: 'Quote request', meta: 'Website · new', at: L(T.word(8, 0), cut.j)},
            {col: 1, title: 'Tue 10:00', meta: 'Booked · reminder set', at: L(T.word(8, 1), cut.j)},
            {col: 2, title: 'Quote follow-up', meta: 'Sent automatically', at: L(T.word(8, 4), cut.j)},
          ]}
        />
      </Shot>
      <Shot from={F(cut.k)} to={F(cut.l)} transition="zoomOut">
        <NotifStack
          from={F(cut.k)}
          items={NOTIFS}
          collapseAt={F(T.word(9, 1))}
          summary="5 things handled while you were away"
          pillGlowAt={F(T.word(9, 4))}
        />
      </Shot>
      <Shot from={F(cut.l)} to={F(cut.m)} transition="glitch">
        <NotEmployee strikeAt={L(T.word(10, 2), cut.l)} />
      </Shot>
      <Shot from={F(cut.m)} to={F(cut.n)} transition="zoomIn">
        <SystemFlow />
      </Shot>
      <Shot from={F(cut.n)} to={END} transition="zoomIn" push={0.03}>
        <AbsoluteFill>
          <Wallpaper dim={0.35} />
          <FollowCard pulses={[L(T.word(12, 2), cut.n), L(T.word(12, 2) + 0.6, cut.n)]} />
        </AbsoluteFill>
      </Shot>
    </CameraMotion>
    <Flash at={[{frame: F(T.word(11, 1)), color: 'yellow', length: 5}]} />
    <KineticSubtitles words={ts.words} centerY={1300} />
    <Html5Audio src={staticFile('gen/02-hold-it-down/voice.wav')} />
    <SfxLayer cues={sfx} />
  </AbsoluteFill>
);
