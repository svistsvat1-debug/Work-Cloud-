import React from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';
import BG from '../bg.json';
import {Cam, Layer} from '../camera';
import {clamp} from '../util';

/** Background plates from ChatGPT (images/mosquito/prep_bg.py). */
const src = (n: string) => staticFile(`mosquito/bg/${n}`);

/** A horizontal strip repeated with mirrored neighbours (seamless edges); a solid fill continues below it. */
const Strip: React.FC<{file: string; w: number; h: number; scale: number; x0: number; y0: number; each: number; fill: string}> = ({
  file,
  w,
  h,
  scale,
  x0,
  y0,
  each,
  fill,
}) => {
  const tw = w * scale;
  const th = h * scale;
  const tiles: React.ReactNode[] = [];
  for (let i = -each; i <= each; i++) {
    tiles.push(
      <Img
        key={i}
        src={src(file)}
        style={{
          position: 'absolute',
          left: x0 + i * tw,
          top: y0,
          width: tw + 1,
          height: th,
          transform: i % 2 !== 0 ? 'scaleX(-1)' : undefined,
        }}
      />,
    );
  }
  return (
    <>
      <div style={{position: 'absolute', left: x0 - each * tw, top: y0 + th - 3, width: (2 * each + 1) * tw, height: 4000, background: fill}} />
      {tiles}
    </>
  );
};

/* ------------------------------------------------------------------ rainy meadow (scenes A, B, D) */
export const GROUND = (() => {
  const s = 0.75;
  const groundY = 1950;
  const dropX = 520;
  const y0 = groundY - BG.BG4.grassEdge * s;
  const x0 = dropX - BG.BG4.puddle[0] * s;
  return {s, y0, x0, puddleY: y0 + BG.BG4.puddle[1] * s, puddleRx: BG.BG4.puddle[2] * s};
})();

export const SkyPlate: React.FC<{cam: Cam}> = ({cam}) => {
  const shift = clamp(-(cam.y - 1000) * 0.06, -70, 70);
  return (
    <AbsoluteFill style={{backgroundColor: '#6c7f9c'}}>
      <Img src={src('BG1.jpg')} style={{position: 'absolute', left: -43, top: -77 + shift, width: 1166, height: 2074}} />
    </AbsoluteFill>
  );
};

export const MeadowLayers: React.FC<{cam: Cam}> = ({cam}) => {
  const hs = 1.6;
  const bs = 1.2;
  return (
    <>
      <SkyPlate cam={cam} />
      {/* far: rolling hills with trees (tree tops at world y 2158) */}
      <Layer cam={cam} z={3000}>
        <Strip file="BG2.png" w={BG.BG2.w} h={BG.BG2.h} scale={hs} x0={540 - (BG.BG2.w * hs) / 2} y0={2158 - BG.BG2.treeTop * hs} each={2} fill={BG.BG2.bottomColor} />
      </Layer>
      {/* middle: bushes and trees on a grass line at world y 2220 */}
      <Layer cam={cam} z={1700}>
        <Strip file="BG3.png" w={BG.BG3.w} h={BG.BG3.h} scale={bs} x0={540 - (BG.BG3.w * bs) / 2} y0={2220 - BG.BG3.grassLine * bs} each={2} fill={BG.BG3.bottomColor} />
      </Layer>
      {/* near: grass edge at world y 1950 with the puddle under the falling drop */}
      <Layer cam={cam} z={1000}>
        <Strip file="BG4.png" w={BG.BG4.w} h={BG.BG4.h} scale={GROUND.s} x0={GROUND.x0} y0={GROUND.y0} each={1} fill={BG.BG4.bottomColor} />
      </Layer>
    </>
  );
};

/* ------------------------------------------------------------------ street (scene C) */
const SS = 1080 / BG.BG5.w;
/** Screen-space position of the street's vanishing point = the camera's principal point for scene C. */
export const STREET_VP = {x: BG.BG5.vp[0] * SS, y: BG.BG5.vp[1] * SS};

/** Full street plate in screen space, zoomed about the vanishing point as the camera dollies in. */
export const StreetPlate: React.FC<{cam: Cam; refZ: number}> = ({cam, refZ}) => {
  const zoom = (1000 - refZ) / (1000 - cam.z);
  return (
    <AbsoluteFill style={{backgroundColor: '#4b5266'}}>
      <Img
        src={src('BG5.jpg')}
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: 1080,
          height: BG.BG5.h * SS,
          transformOrigin: `${STREET_VP.x}px ${STREET_VP.y}px`,
          transform: `scale(${zoom})`,
        }}
      />
    </AbsoluteFill>
  );
};
