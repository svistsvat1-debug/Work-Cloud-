import React from 'react';
import {Composition} from 'remotion';
import {FPS, H, W} from './brand';
import './fonts';
import {Video01, video01Duration} from './videos/v01/Video01';
import {Video02, video02Duration} from './videos/v02/Video02';
import {Video03, video03Duration} from './videos/v03/Video03';
import {Video04, video04Duration} from './videos/v04/Video04';
import {Video05, video05Duration} from './videos/v05/Video05';
import {AvatarLineup, AvatarSolo, avatarTestDuration} from './videos/avatar-test/AvatarTest';

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="v01-ask-chatgpt" component={Video01} durationInFrames={video01Duration} fps={FPS} width={W} height={H} />
    <Composition id="v02-hold-it-down" component={Video02} durationInFrames={video02Duration} fps={FPS} width={W} height={H} />
    <Composition id="v03-contact-form" component={Video03} durationInFrames={video03Duration} fps={FPS} width={W} height={H} />
    <Composition id="v04-instagram-myth" component={Video04} durationInFrames={video04Duration} fps={FPS} width={W} height={H} />
    <Composition id="v05-site-redesign" component={Video05} durationInFrames={video05Duration} fps={FPS} width={W} height={H} />
    <Composition id="avatar-lineup" component={AvatarLineup} durationInFrames={avatarTestDuration} fps={FPS} width={W} height={H} />
    <Composition
      id="avatar-solo"
      component={AvatarSolo}
      durationInFrames={avatarTestDuration}
      fps={FPS}
      width={W}
      height={H}
      defaultProps={{variant: 'bolt' as const}}
    />
  </>
);
