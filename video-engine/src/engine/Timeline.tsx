import React from "react";
import { Drawable } from "./shapes";
import { C } from "./shapes";
import { Defs, Label, labelDuration, NumberCard, numberCardDuration, Rays, Reveal, WriteOn, writeDuration } from "./core";

// ---------- scene description language ----------
export type El =
  | { k: "title"; text: string; delay?: number }
  | { k: "obj"; dw: Drawable; x: number; y: number; h?: number; w?: number; dur?: number; rays?: boolean | "l" | "r"; delay?: number; rot?: number }
  | { k: "row"; items: { dw: Drawable; x: number; y: number; h?: number; w?: number }[]; dur?: number; stagger?: number; delay?: number }
  | { k: "label"; text: string; x: number; y: number; to?: [number, number]; from?: [number, number]; anchor?: "start" | "middle" | "end"; size?: number; color?: string; delay?: number }
  | { k: "num"; num: string; unit?: string; caption?: string; y?: number; delay?: number }
  | { k: "text"; lines: { text: string; color?: string; size?: number }[]; x: number; y: number; size?: number; font?: "pm" | "cb"; anchor?: "start" | "middle"; underline?: boolean; rot?: number; lineH?: number; color?: string; delay?: number; lps?: number }
  | { k: "rays"; box: [number, number, number, number]; color?: string; delay?: number }
  | { k: "uline"; x0: number; x1: number; y: number; double?: boolean; delay?: number };
export type SceneSpec = { beats: El[][]; sfx?: { beat: number; name: string; delay?: number; gain?: number }[] };
export type Beat = { scene: number; beat: number; vo: string; start: number; end: number };

/** map a point in drawable coordinates to screen coordinates for an obj placement */
export const at = (dw: Drawable, x: number, y: number, size: { h?: number; w?: number }) => {
  const s = size.w ? size.w / dw.w : (size.h ?? 400) / dw.h;
  return (px: number, py: number): [number, number] => [x - (dw.w * s) / 2 + px * s, y - (dw.h * s) / 2 + py * s];
};

export const splitTitle = (text: string) => {
  const words = text.split(" ");
  if (text.length <= 16) return [text];
  let best = [text], bd = 1e9;
  for (let k = 1; k < words.length; k++) {
    const a = words.slice(0, k).join(" "), b = words.slice(k).join(" ");
    const d = Math.max(a.length, b.length);
    if (d < bd) { bd = d; best = [a, b]; }
  }
  return best;
};

export type Placed = { el: El; t0: number; dur: number; scene: number; key: string };

const objDur = (beatDur: number, d?: number) => d ?? Math.max(1.6, Math.min(4.0, beatDur - 0.35));
export const elDuration = (el: El, beatDur: number): number => {
  switch (el.k) {
    case "title": return writeDuration(splitTitle(el.text).map(t => ({ text: t })));
    case "obj": return objDur(beatDur, el.dur) + (el.rays ? 0.35 : 0);
    case "row": return objDur(beatDur, el.dur) + (el.items.length - 1) * (el.stagger ?? 0.35);
    case "label": return labelDuration(el.text, !!el.to);
    case "num": return numberCardDuration(el.num, el.unit, el.caption);
    case "text": return writeDuration(el.lines, el.lps ?? 12);
    case "rays": return 0.4;
    case "uline": return el.double ? 0.6 : 0.35;
  }
};

/** compute cut times and element start times from beat timings */
export const buildTimeline = (scenes: SceneSpec[], beats: Beat[], total: number) => {
  const byScene: Beat[][] = scenes.map((_, i) => beats.filter(b => b.scene === i));
  const cuts: number[] = byScene.map((bs, i) => {
    if (i === 0) return 0;
    const prev = byScene[i - 1][byScene[i - 1].length - 1];
    return Math.max(prev.end + 0.05, bs[0].start - 0.22);
  });
  const placed: Placed[] = [];
  scenes.forEach((sc, si) => {
    sc.beats.forEach((els, bi) => {
      const b = byScene[si][bi];
      if (!b) throw new Error(`scene ${si} beat ${bi} has no timing`);
      const beatDur = b.end - b.start;
      let chain = Math.max(cuts[si], b.start + 0.1);
      els.forEach((el, ei) => {
        const t0 = (el as any).delay !== undefined ? b.start + 0.1 + (el as any).delay : chain;
        const dur = elDuration(el, beatDur);
        placed.push({ el, t0, dur, scene: si, key: `s${si}b${bi}e${ei}` });
        // titles and labels chain the next element after them; objects start right away after a title
        if (el.k === "title" || el.k === "label" || el.k === "text") chain = t0 + dur + 0.1;
        else chain = t0 + Math.min(dur, 1.2);
      });
    });
  });
  // every element must finish drawing before its scene cuts away
  placed.forEach(p => {
    const end = p.scene + 1 < cuts.length ? cuts[p.scene + 1] : total;
    const room = end - p.t0 - 0.25;
    if (p.dur > room) {
      if (p.el.k === "obj" || p.el.k === "row") { p.dur = Math.max(0.8, room); (p.el as any).dur = undefined; (p as any).squeeze = true; }
      if (p.t0 + p.dur > end) p.t0 = Math.max(cuts[p.scene], end - p.dur - 0.25);
    }
  });
  return { cuts, placed, total };
};

export const holds = (tl: ReturnType<typeof buildTimeline>) => {
  const out: { scene: number; from: number; to: number; len: number }[] = [];
  tl.cuts.forEach((c, si) => {
    const end = si + 1 < tl.cuts.length ? tl.cuts[si + 1] : tl.total;
    const iv = tl.placed.filter(p => p.scene === si).map(p => [p.t0, p.t0 + p.dur]).sort((a, b) => a[0] - b[0]);
    let cur = c;
    for (const [a, b] of iv) { if (a - cur > 0) out.push({ scene: si, from: cur, to: a, len: a - cur }); cur = Math.max(cur, b); }
    if (end - cur > 0) out.push({ scene: si, from: cur, to: end, len: end - cur });
  });
  return out;
};

// ---------- renderer ----------
export const SceneRenderer: React.FC<{ t: number; tl: ReturnType<typeof buildTimeline> }> = ({ t, tl }) => {
  let si = 0;
  for (let i = 0; i < tl.cuts.length; i++) if (t >= tl.cuts[i]) si = i;
  const items = tl.placed.filter(p => p.scene === si);
  return (
    <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{ position: "absolute", inset: 0 }}>
      <Defs />
      <rect width={1920} height={1080} fill={C.board} />
      {items.map(p => <Element key={p.key} p={p} t={t} />)}
    </svg>
  );
};

const Element: React.FC<{ p: Placed; t: number }> = ({ p, t }) => {
  const { el, t0, dur, key } = p;
  if (t < t0) return null;
  switch (el.k) {
    case "title":
      return <WriteOn id={key} t={t} t0={t0} lines={splitTitle(el.text).map(x => ({ text: x }))} x={70} y={150} size={78} lineH={108} />;
    case "obj": {
      const rd = dur - (el.rays ? 0.35 : 0);
      const s = el.w ? el.w / el.dw.w : (el.h ?? 400) / el.dw.h;
      const box: [number, number, number, number] = [el.x - (el.dw.w * s) / 2, el.y - (el.dw.h * s) / 2, el.x + (el.dw.w * s) / 2, el.y + (el.dw.h * s) / 2];
      return (
        <g>
          <Reveal id={key} dw={el.dw} t={t} t0={t0} dur={rd} x={el.x} y={el.y} h={el.h} w={el.w} rot={el.rot} />
          {el.rays && <Rays t={t} t0={t0 + rd} box={box} sides={el.rays === true ? "lr" : el.rays} />}
        </g>
      );
    }
    case "row": {
      const st = el.stagger ?? 0.35; const d = dur - (el.items.length - 1) * st;
      return <g>{el.items.map((it, i) => <Reveal key={i} id={`${key}r${i}`} dw={it.dw} t={t} t0={t0 + i * st} dur={d} x={it.x} y={it.y} h={it.h} w={it.w} />)}</g>;
    }
    case "label":
      return <Label id={key} t={t} t0={t0} text={el.text} x={el.x} y={el.y} to={el.to} from={el.from} anchor={el.anchor} size={el.size} color={el.color} />;
    case "num":
      return <NumberCard id={key} t={t} t0={t0} num={el.num} unit={el.unit} caption={el.caption} y={el.y} />;
    case "text":
      return <WriteOn id={key} t={t} t0={t0} lines={el.lines} x={el.x} y={el.y} size={el.size} font={el.font} anchor={el.anchor} underline={el.underline ?? false} rot={el.rot ?? -2} lineH={el.lineH} color={el.color} lps={el.lps} stroke={el.font !== "cb"} />;
    case "rays":
      return <Rays t={t} t0={t0} box={el.box} color={el.color} />;
    case "uline": {
      const f1 = Math.min(1, Math.max(0, (t - t0) / 0.3)), f2 = Math.min(1, Math.max(0, (t - t0 - 0.3) / 0.3));
      const d1 = `M${el.x0} ${el.y} Q${(el.x0 + el.x1) / 2} ${el.y + 8} ${el.x1} ${el.y - 4}`;
      const d2 = `M${el.x0 + 20} ${el.y + 22} Q${(el.x0 + el.x1) / 2} ${el.y + 30} ${el.x1 - 20} ${el.y + 18}`;
      return (
        <g fill="none" stroke={C.red} strokeWidth={11} strokeLinecap="round" filter="url(#wobS)">
          <path d={d1} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - f1} />
          {el.double && f2 > 0 && <path d={d2} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - f2} />}
        </g>
      );
    }
  }
};
