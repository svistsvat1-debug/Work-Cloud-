import React from 'react';
import {Img, staticFile} from 'remotion';
import META from '../sprites.json';
import {SweatDrop} from './Characters';

/**
 * Cut-out sprites: M1 = ElevenLabs GPT Image 2.5, the rest = ChatGPT edits of the same character
 * (see images/mosquito/prep_sprites.py). Each component is anchored like the old code-drawn art.
 */
const src = (n: string) => staticFile(`mosquito/sprites/${n}.png`);
type V = [number, number];

/* ------------------------------------------------------------------ mosquito */
export type MosqPose = 'M1' | 'M2' | 'M3' | 'M4' | 'M5';
const MS = 0.5; // world px per M1 px
const M1P = META.M1.pivot as V;
const THORAX: V = [M1P[0] + 63, M1P[1] + 33]; // anchor = thorax centre in M1 pixels
const HEAD: V = [(556 - THORAX[0]) * MS, (318 - THORAX[1]) * MS]; // head centre in world units (r ~ 59)
const kOf = (p: MosqPose) => (p === 'M1' ? 1 : 1024 / 1254);

export const MosqSprite: React.FC<{
  pose: MosqPose;
  t: number;
  flapHz?: number;
  flapAmp?: number;
  full?: boolean; // single image, no separate wing motion (for the swarm)
  sweat?: number;
  sweatSlide?: number;
  part?: 'all' | 'wings' | 'body'; // draw only one layer (e.g. wings behind another sprite)
}> = ({pose, t, flapHz = 15, flapAmp = 11, full = false, sweat = 0, sweatSlide = 0, part = 'all'}) => {
  const m = META[pose];
  const k = kOf(pose) * MS;
  const piv = m.pivot as V;
  // place the pose so its wing pivot lands on M1's wing pivot
  const left = (M1P[0] - THORAX[0]) * MS - piv[0] * k;
  const top = (M1P[1] - THORAX[1]) * MS - piv[1] * k;
  const w = m.w * k;
  const h = m.h * k;
  const box: React.CSSProperties = {position: 'absolute', left, top, width: w, height: h};
  const ang = flapAmp * Math.sin(2 * Math.PI * flapHz * t);
  return (
    <>
      {full ? (
        <Img src={src(`${pose}_full`)} style={box} />
      ) : (
        <>
          {part !== 'body' && <Img
            src={src(`${pose}_wings`)}
            style={{...box, transformOrigin: `${piv[0] * k}px ${piv[1] * k}px`, transform: `rotate(${ang}deg) scaleY(${1 - 0.06 * Math.abs(Math.sin(2 * Math.PI * flapHz * t))})`}}
          />}
          {part !== 'wings' && <Img src={src(`${pose}_body`)} style={box} />}
        </>
      )}
      {sweat > 0.01 && part !== 'wings' && (
        <svg style={{position: 'absolute', left: HEAD[0] - 120, top: HEAD[1] - 140, overflow: 'visible'}} width={1} height={1}>
          <SweatDrop x={60 - 6 * sweatSlide} y={70 + 46 * sweatSlide} s={sweat * 0.9} rot={-10} />
        </svg>
      )}
    </>
  );
};

/* ------------------------------------------------------------------ raindrop with a face */
export type DropExpr = 'D1' | 'D2' | 'D3' | 'D4';
/** Anchored at the centre of the round part; R = radius of the round part (world units). */
export const DropSprite: React.FC<{expr: DropExpr; R: number}> = ({expr, R}) => {
  const m = META[expr];
  const k = (2 * R) / m.width;
  const ax = m.cx;
  const ay = m.bottom - m.width / 2;
  return <Img src={src(expr)} style={{position: 'absolute', left: -ax * k, top: -ay * k, width: m.w * k, height: m.h * k}} />;
};

/* ------------------------------------------------------------------ guy */
export type GuyPose = 'G1' | 'G2' | 'G3';
const GS = 380 / META.G1.height;
/** Anchored at the bottom centre of the feet. */
export const GuySprite: React.FC<{pose: GuyPose; sweat?: number; sweatSlide?: number}> = ({pose, sweat = 0, sweatSlide = 0}) => {
  const m = META[pose];
  const f = m.feet as V;
  return (
    <>
      <Img src={src(pose)} style={{position: 'absolute', left: -f[0] * GS, top: -f[1] * GS, width: m.w * GS, height: m.h * GS}} />
      {sweat > 0.01 && (
        <svg style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}} width={1} height={1}>
          <SweatDrop x={-82 + 8 * sweatSlide} y={-318 + 60 * sweatSlide} s={sweat} rot={-16} />
        </svg>
      )}
    </>
  );
};

/* ------------------------------------------------------------------ bus (front view) */
const BS = 760 / META.B1.width;
/** Anchored at the bottom centre (wheels on the ground). */
export const BusSprite: React.FC = () => {
  const m = META.B1;
  const b = m.bottom as V;
  return <Img src={src('B1')} style={{position: 'absolute', left: -b[0] * BS, top: -b[1] * BS, width: m.w * BS, height: m.h * BS}} />;
};

/* ------------------------------------------------------------------ balance scale (stand + beam + 2 pans) */
const STAND_H = 470;
const SS = STAND_H / (META.S_stand.bottom[1] - META.S_stand.top[1]);
const PIVOT_Y = -STAND_H - 6;
const ARM = (META.S_beam.right[0] - META.S_beam.left[0]) * 0.5 * SS;
const HANG = (META.S_pan.rimY - META.S_pan.ring[1]) * SS;

/** World positions (relative to the base bottom centre) of the beam rings and the pan rims. */
export const scaleGeom = (angleDeg: number) => {
  const a = (angleDeg * Math.PI) / 180;
  const c = Math.cos(a);
  const s = Math.sin(a);
  const ringL = {x: -ARM * c, y: PIVOT_Y - ARM * s};
  const ringR = {x: ARM * c, y: PIVOT_Y + ARM * s};
  return {ringL, ringR, rimL: {x: ringL.x, y: ringL.y + HANG}, rimR: {x: ringR.x, y: ringR.y + HANG}};
};

const Pan: React.FC<{x: number; y: number; part: 'back' | 'front'}> = ({x, y, part}) => {
  const m = META.S_pan;
  const r = m.ring as V;
  return <Img src={src(`S_pan_${part}`)} style={{position: 'absolute', left: x - r[0] * SS, top: y - r[1] * SS, width: m.w * SS, height: m.h * SS}} />;
};

/** Everything behind the pan contents: stand, beam, strings and pan rims. */
export const ScaleBack: React.FC<{angle: number}> = ({angle}) => {
  const g = scaleGeom(angle);
  const st = META.S_stand;
  const bm = META.S_beam;
  const sb = st.bottom as V;
  const bp = bm.pivot as V;
  return (
    <>
      <Img src={src('S_stand')} style={{position: 'absolute', left: -sb[0] * SS, top: -sb[1] * SS, width: st.w * SS, height: st.h * SS}} />
      <Img
        src={src('S_beam')}
        style={{
          position: 'absolute',
          left: -bp[0] * SS,
          top: PIVOT_Y - bp[1] * SS,
          width: bm.w * SS,
          height: bm.h * SS,
          transformOrigin: `${bp[0] * SS}px ${bp[1] * SS}px`,
          transform: `rotate(${angle}deg)`,
        }}
      />
      <Pan x={g.ringL.x} y={g.ringL.y} part="back" />
      <Pan x={g.ringR.x} y={g.ringR.y} part="back" />
    </>
  );
};

/** The bowls' front halves, drawn over the pan contents. */
export const ScaleFront: React.FC<{angle: number}> = ({angle}) => {
  const g = scaleGeom(angle);
  return (
    <>
      <Pan x={g.ringL.x} y={g.ringL.y} part="front" />
      <Pan x={g.ringR.x} y={g.ringR.y} part="front" />
    </>
  );
};
