// On-screen text: location/date stamp, chapter title card, number card. Minimal by design.
import React, {useEffect, useState} from 'react';
import {AbsoluteFill, continueRender, delayRender} from 'remotion';
import '@fontsource/special-elite';
import '@fontsource/black-ops-one';
import '@fontsource/oswald/500.css';
import '@fontsource/oswald/700.css';
import {useShot, clamp, smooth, W, H, Frame, Layer} from './core';
import {Sky, Clouds} from './fx';

export const FONT_TYPE = "'Special Elite', 'Courier New', monospace";
export const FONT_STENCIL = "'Black Ops One', 'Impact', sans-serif";
export const FONT_NUM = "'Oswald', 'Arial Narrow', sans-serif";

/** block rendering until web fonts are ready (prevents fallback-font frames) */
export const useFontsReady = () => {
  const [h] = useState(() => delayRender('fonts'));
  useEffect(() => {
    const fs = (document as any).fonts;
    Promise.all([
      fs.load(`32px 'Special Elite'`),
      fs.load(`32px 'Black Ops One'`),
      fs.load(`500 32px 'Oswald'`),
      fs.load(`700 32px 'Oswald'`),
    ])
      .catch(() => null)
      .then(() => fs.ready)
      .then(() => continueRender(h));
  }, [h]);
};

/** small typewriter label in a corner, fades in over 0.4 s after `at` seconds */
export const Stamp: React.FC<{text: string; at?: number; corner?: 'bl' | 'tl' | 'br' | 'tr'; color?: string}> = ({
  text,
  at = 0.3,
  corner = 'bl',
  color = '#efe6d2',
}) => {
  const {t} = useShot();
  const o = clamp((t - at) / 0.4);
  const pos: React.CSSProperties = {
    position: 'absolute',
    ...(corner.includes('b') ? {bottom: 70} : {top: 64}),
    ...(corner.includes('l') ? {left: 84} : {right: 84}),
  };
  return (
    <div
      style={{
        ...pos,
        fontFamily: FONT_TYPE,
        fontSize: 30,
        letterSpacing: 3,
        color,
        opacity: o * 0.92,
        textShadow: '0 2px 8px rgba(0,0,0,0.65)',
        borderLeft: `3px solid ${color}`,
        paddingLeft: 16,
      }}
    >
      {text}
    </div>
  );
};

/** in-world text drawn inside the SVG (stencil on crate, chalk, typed paper ...) */
export const SvgText: React.FC<{
  x: number;
  y: number;
  text: string;
  size?: number;
  font?: 'type' | 'stencil' | 'num';
  color?: string;
  anchor?: 'start' | 'middle' | 'end';
  opacity?: number;
  rotate?: number;
  spacing?: number;
  weight?: number;
}> = ({x, y, text, size = 40, font = 'stencil', color = '#eadfc8', anchor = 'middle', opacity = 1, rotate = 0, spacing = 2, weight}) => (
  <text
    x={x}
    y={y}
    fontFamily={font === 'type' ? FONT_TYPE : font === 'num' ? FONT_NUM : FONT_STENCIL}
    fontSize={size}
    fontWeight={weight}
    fill={color}
    textAnchor={anchor}
    letterSpacing={spacing}
    opacity={opacity}
    transform={rotate ? `rotate(${rotate} ${x} ${y})` : undefined}
  >
    {text}
  </text>
);

/** typed-on text: reveals characters over `dur` seconds starting at `at` */
export const useTyped = (text: string, at = 0.2, dur = 1.2) => {
  const {t} = useShot();
  const n = Math.floor(clamp((t - at) / dur) * text.length);
  return text.slice(0, n);
};

/** chapter / title card: stencil text on textured dark paper with a faint emblem drawn by `bg` */
export const TitleCard: React.FC<{title: string; sub?: string; bg?: React.ReactNode; palette?: [string, string]}> = ({
  title,
  sub,
  bg,
  palette = ['#1c1a20', '#2c2526'],
}) => {
  const {t} = useShot();
  const o = smooth(clamp((t - 0.15) / 0.6));
  const sp = 10 + 6 * (1 - o);
  return (
    <Frame move={{type: 'push', amount: 0.02}}>
      <Layer depth={0}>
        <Sky stops={[[0, palette[0]], [1, palette[1]]]} />
        {bg}
      </Layer>
      <Layer depth={0.6}>
        <text
          x={W / 2}
          y={H / 2 + 30}
          textAnchor="middle"
          fontFamily={FONT_STENCIL}
          fontSize={118}
          letterSpacing={sp}
          fill="#e9dcc0"
          opacity={o}
        >
          {title}
        </text>
        {sub && (
          <text x={W / 2} y={H / 2 + 110} textAnchor="middle" fontFamily={FONT_TYPE} fontSize={36} letterSpacing={6} fill="#c9b99a" opacity={o * 0.9}>
            {sub}
          </text>
        )}
        <rect x={W / 2 - 260 * o} y={H / 2 - 92} width={520 * o} height={3} fill="#c96a3c" opacity={0.9} />
      </Layer>
    </Frame>
  );
};

/** big clean number card in a scene palette (used only when the number can't live inside the world) */
export const NumberCard: React.FC<{value: string; label: string; colors?: [string, string, string]}> = ({value, label, colors = ['#1d2433', '#2e3a4f', '#e9dcc0']}) => {
  const {t} = useShot();
  const o = smooth(clamp((t - 0.1) / 0.5));
  return (
    <Frame move={{type: 'push', amount: 0.025}}>
      <Layer depth={0}>
        <Sky stops={[[0, colors[0]], [1, colors[1]]]} />
        <Clouds color={colors[2]} opacity={0.05} n={5} />
      </Layer>
      <Layer depth={0.7}>
        <text x={W / 2} y={H / 2 + 40} textAnchor="middle" fontFamily={FONT_NUM} fontWeight={700} fontSize={220} fill={colors[2]} opacity={o}>
          {value}
        </text>
        <text x={W / 2} y={H / 2 + 130} textAnchor="middle" fontFamily={FONT_TYPE} fontSize={40} letterSpacing={6} fill={colors[2]} opacity={o * 0.85}>
          {label}
        </text>
      </Layer>
    </Frame>
  );
};

export const Fill: React.FC<{color: string; opacity?: number}> = ({color, opacity = 1}) => <AbsoluteFill style={{background: color, opacity}} />;
