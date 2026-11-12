import React from 'react';
import {Composition} from 'remotion';
import {OneShot} from './engine/timeline';
import {TestHarbor, TestField} from './videos/test';

const ALL: Record<string, React.FC> = {TestHarbor, TestField};
const ShotPreview: React.FC<{id: string}> = ({id}) => <OneShot id={id} shots={ALL} />;

export const Root: React.FC = () => (
  <>
    <Composition id="Shot" component={ShotPreview} durationInFrames={180} fps={30} width={1920} height={1080} defaultProps={{id: 'TestHarbor'}} />
  </>
);
