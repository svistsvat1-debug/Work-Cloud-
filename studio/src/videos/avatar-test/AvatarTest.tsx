import React from 'react';
import {AbsoluteFill, Html5Audio, staticFile} from 'remotion';
import tsJson from '../../../../videos/_avatar-test/timestamps.json';
import {HumanAvatar} from '../../avatar/Human';
import {OrbAvatar} from '../../avatar/Orb';
import {RobotAvatar} from '../../avatar/Robot';
import {useAvatar} from '../../avatar/useAvatar';
import {C, DISPLAY} from '../../brand';
import {BrandBackground} from '../../components/BrandBackground';
import {KineticSubtitles} from '../../components/KineticSubtitles';
import {toFrame, type Timestamps} from '../../lib/timeline';
import type {Phone} from '../../lib/visemes';

const ts = tsJson as unknown as Timestamps & {phones: Phone[]};
export const avatarTestDuration = toFrame(ts.duration);

const VARIANTS = {
  bolt: {label: 'A · BOLT', C: RobotAvatar},
  sunny: {label: 'B · SUNNY', C: OrbAvatar},
  alex: {label: 'C · ALEX', C: HumanAvatar},
} as const;
export type Variant = keyof typeof VARIANTS;

const Label: React.FC<{text: string}> = ({text}) => (
  <div style={{fontFamily: DISPLAY, fontWeight: 900, fontSize: 40, color: C.yellow, textAlign: 'center', marginTop: 10}}>{text}</div>
);

/** All three concepts lip-syncing the same line, side by side. */
export const AvatarLineup: React.FC = () => {
  const s = useAvatar(ts.phones, ts.words);
  return (
    <AbsoluteFill>
      <BrandBackground />
      <div style={{position: 'absolute', top: 230, width: '100%', textAlign: 'center', fontFamily: DISPLAY, fontWeight: 900, fontSize: 64, color: C.white}}>
        AVATAR: <span style={{color: C.yellow}}>A, B OR C?</span>
      </div>
      <div style={{position: 'absolute', top: 470, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 10}}>
        {(Object.keys(VARIANTS) as Variant[]).map((k) => {
          const V = VARIANTS[k];
          return (
            <div key={k} style={{width: 340}}>
              <V.C s={s} width={340} />
              <Label text={V.label} />
            </div>
          );
        })}
      </div>
      <KineticSubtitles words={ts.words} centerY={1320} />
      <Html5Audio src={staticFile('gen/_avatar-test/voice.wav')} />
    </AbsoluteFill>
  );
};

/** One concept at full presenter size (how it would look in a video). */
export const AvatarSolo: React.FC<{variant: Variant}> = ({variant}) => {
  const s = useAvatar(ts.phones, ts.words);
  const V = VARIANTS[variant];
  return (
    <AbsoluteFill>
      <BrandBackground />
      <div style={{position: 'absolute', top: 250, left: 160, width: 760}}>
        <V.C s={s} width={760} />
      </div>
      <KineticSubtitles words={ts.words} centerY={1300} />
    </AbsoluteFill>
  );
};
