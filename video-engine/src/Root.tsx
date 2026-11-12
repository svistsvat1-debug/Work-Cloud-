import React from 'react';
import {Composition} from 'remotion';
import {OneShot, Timeline, TL} from './engine/timeline';
import {JWM_SHOTS} from './videos/japan-war-machine';
import timeline from './videos/japan-war-machine/timeline.json';
import {Thumbnail} from './videos/japan-war-machine/Thumbnail';

const ShotPreview: React.FC<{id: string}> = ({id}) => <OneShot id={id} shots={JWM_SHOTS} />;
const JWM: React.FC = () => <Timeline tl={(timeline as any).shots as TL} shots={JWM_SHOTS} />;

export const Root: React.FC = () => (
  <>
    <Composition id="Shot" component={ShotPreview} durationInFrames={180} fps={30} width={1920} height={1080} defaultProps={{id: '01_1'}} />
    <Composition id="JWM" component={JWM} durationInFrames={(timeline as any).total} fps={30} width={1920} height={1080} />
    <Composition id="Thumb" component={Thumbnail} durationInFrames={1} fps={30} width={1920} height={1080} />
  </>
);
