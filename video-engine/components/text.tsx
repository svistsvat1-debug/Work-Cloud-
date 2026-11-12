import React, {useMemo} from 'react';
import {C, FONT_LABEL, FONT_TITLE} from './theme';
import {PathDraw, clamp01} from './draw';
import {wobble, toPath} from './rough';

let ctx: CanvasRenderingContext2D | null = null;
export function measure(text: string, size: number, font: 'title' | 'label'): number {
  if (typeof document === 'undefined') return text.length * size * 0.55;
  if (!ctx) ctx = document.createElement('canvas').getContext('2d');
  if (!ctx) return text.length * size * 0.55;
  ctx.font = `${size}px ${font === 'title' ? FONT_TITLE : FONT_LABEL}`;
  return ctx.measureText(text).width;
}

export type TextProps = {
  text: string;
  x: number;
  y: number;
  size?: number;
  font?: 'title' | 'label';
  color?: string;
  anchor?: 'start' | 'middle' | 'end';
  p: number; // 0..1 writing progress
  ul?: number; // underline progress 0..1 (undefined = none)
  ulColor?: string;
  seed?: number;
  rot?: number;
  lineGap?: number;
};

// Text that writes on letter by letter; multi-line with "\n".
export const MText: React.FC<TextProps> = ({text, x, y, size = 48, font = 'label', color = C.ink, anchor = 'start', p, ul, ulColor = C.red, seed = 1, rot = 0, lineGap = 1.12}) => {
  const lines = text.split('\n');
  const total = text.replace(/\n/g, '').length;
  const shown = p * total;
  const widths = useMemo(() => lines.map((l) => measure(l, size, font)), [text, size, font]);
  const ulPath = useMemo(() => {
    const wMax = Math.max(...widths);
    const ly = y + (lines.length - 1) * size * lineGap + size * 0.2;
    const x0 = anchor === 'start' ? x : anchor === 'middle' ? x - wMax / 2 : x - wMax;
    return toPath(wobble([[x0 - 6, ly + 4], [x0 + wMax + 8, ly - 2]], seed + 11, 2.5));
  }, [widths, x, y, size, anchor, seed]);
  let idx = 0;
  return (
    <g transform={rot ? `rotate(${rot} ${x} ${y})` : undefined}>
      {lines.map((l, li) => (
        <text
          key={li}
          x={x}
          y={y + li * size * lineGap}
          fontFamily={font === 'title' ? FONT_TITLE : FONT_LABEL}
          fontSize={size}
          fill={color}
          textAnchor={anchor}
          style={{whiteSpace: 'pre'}}
        >
          {[...l].map((ch, ci) => {
            const i = idx++;
            const o = clamp01(shown - i);
            return (
              <tspan key={ci} opacity={o}>
                {ch}
              </tspan>
            );
          })}
        </text>
      ))}
      {ul !== undefined ? <PathDraw d={ulPath} p={ul} color={ulColor} w={Math.max(5, size * 0.11)} /> : null}
    </g>
  );
};
