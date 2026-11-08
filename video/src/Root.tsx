import React from 'react';
import {Composition, Still} from 'remotion';
import {Stars, STARS_FRAMES} from './stars/Stars';
import {Cover} from './stars/Cover';

export const RemotionRoot: React.FC = () => (
	<>
		<Composition id="WhyYouSeeStars" component={Stars} durationInFrames={STARS_FRAMES} fps={60} width={1080} height={1920} />
		<Still id="WhyYouSeeStarsCover" component={Cover} width={1080} height={1920} />
	</>
);
