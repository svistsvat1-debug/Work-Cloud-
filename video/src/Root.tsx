import React from 'react';
import {Composition} from 'remotion';
import {Stars, STARS_FRAMES} from './stars/Stars';

export const RemotionRoot: React.FC = () => (
	<Composition id="WhyYouSeeStars" component={Stars} durationInFrames={STARS_FRAMES} fps={60} width={1080} height={1920} />
);
