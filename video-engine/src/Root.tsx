import React from 'react';
import {Composition, Still} from 'remotion';
import {Habakkuk} from './Habakkuk';
import {Thumbnail, ThumbB, ThumbC} from './Thumbnail';
import {FoodVideo, FOOD_FRAMES} from './FoodVideo';
import timing from './habakkuk-timing.json';

export const Root: React.FC = () => (
  <>
    <Composition id="PaintTest" component={Habakkuk} durationInFrames={timing.end} fps={30} width={1920} height={1080} />
    <Composition id="FoodRanked" component={FoodVideo} durationInFrames={FOOD_FRAMES} fps={30} width={1920} height={1080} />
    <Still id="Thumbnail" component={Thumbnail} width={1280} height={720} />
    <Still id="ThumbB" component={ThumbB} width={1280} height={720} />
    <Still id="ThumbC" component={ThumbC} width={1280} height={720} />
  </>
);
