import React, {useMemo} from 'react';
import {geoMercator, geoEquirectangular, GeoProjection} from 'd3-geo';
import {feature} from 'topojson-client';
import {C, FONT_LABEL} from './theme';
import {PathDraw, clamp01, pop, easeInOut} from './draw';
import {wobble, toPath, Pt, hashStr} from './rough';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import world50 from 'world-atlas/countries-50m.json';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import world110 from 'world-atlas/countries-110m.json';

export type Region = 'europe' | 'world' | 'japan' | 'pacific' | 'france' | 'atlantic' | 'normandy' | 'philippines' | 'usa';

const REGIONS: Record<Region, {lon: [number, number]; lat: [number, number]; rot?: number; res: 50 | 110; eq?: boolean}> = {
  europe: {lon: [-11, 27], lat: [41, 60], res: 50},
  world: {lon: [-170, 180], lat: [-45, 72], res: 110, eq: true},
  japan: {lon: [127, 147], lat: [29.5, 45.5], res: 50},
  pacific: {lon: [110, 245], lat: [0, 52], rot: -180, res: 110, eq: true},
  france: {lon: [-5, 9], lat: [42.5, 51.3], res: 50},
  normandy: {lon: [-2.5, 3.2], lat: [48.4, 51.2], res: 50},
  atlantic: {lon: [-104, 12], lat: [24, 58], res: 50},
  philippines: {lon: [100, 150], lat: [-2, 42], res: 50},
  usa: {lon: [-126, -66], lat: [24, 50], res: 50},
};

type Built = {proj: GeoProjection; rings: {id: string; d: string; area: number}[]};
const cache = new Map<string, Built>();

function build(region: Region, x: number, y: number, w: number, h: number): Built {
  const key = `${region}|${x}|${y}|${w}|${h}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const R = REGIONS[region];
  const topo = R.res === 50 ? world50 : world110;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fc = feature(topo as any, (topo as any).objects.countries) as unknown as {features: {id: string; geometry: {type: string; coordinates: number[][][] | number[][][][]}}[]};
  const proj = (R.eq ? geoEquirectangular() : geoMercator()).rotate([R.rot ?? 0, 0]);
  const toLon = (l: number) => (l > 180 ? l - 360 : l);
  const corners = {type: 'MultiPoint', coordinates: [[toLon(R.lon[0]), R.lat[0]], [toLon(R.lon[1]), R.lat[1]], [toLon(R.lon[0]), R.lat[1]], [toLon(R.lon[1]), R.lat[0]]]};
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  proj.fitExtent([[x, y], [x + w, y + h]], corners as any);
  const rings: Built['rings'] = [];
  for (const ft of fc.features) {
    const polys = ft.geometry.type === 'Polygon' ? [ft.geometry.coordinates as number[][][]] : (ft.geometry.coordinates as number[][][][]);
    for (const pg of polys) {
      const ring = pg[0];
      const pts: Pt[] = [];
      let prev: Pt | null = null;
      let jump = false;
      for (const c of ring) {
        const q = proj(c as [number, number]);
        if (!q) continue;
        if (prev && Math.abs(q[0] - prev[0]) > w * 0.5) jump = true;
        pts.push([q[0], q[1]]);
        prev = [q[0], q[1]];
      }
      if (jump || pts.length < 4) continue;
      let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
      for (const [px, py] of pts) {
        x0 = Math.min(x0, px); x1 = Math.max(x1, px); y0 = Math.min(y0, py); y1 = Math.max(y1, py);
      }
      if (x1 < x - 40 || x0 > x + w + 40 || y1 < y - 40 || y0 > y + h + 40) continue;
      const area = (x1 - x0) * (y1 - y0);
      if (area < 60) continue;
      // simplify: keep points at least 5px apart
      const simp: Pt[] = [pts[0]];
      for (const pt of pts) {
        const l = simp[simp.length - 1];
        if (Math.hypot(pt[0] - l[0], pt[1] - l[1]) > 5) simp.push(pt);
      }
      if (simp.length < 4) continue;
      const wob = wobble(simp, hashStr(ft.id + ':' + rings.length) % 9999, 1.2, true);
      rings.push({id: String(ft.id), d: toPath(wob), area});
    }
  }
  const b = {proj, rings};
  cache.set(key, b);
  return b;
}

export type MapLabel = {t: string; lon: number; lat: number; at: number; size?: number; color?: string; dx?: number; dy?: number; out?: number};
export type MapDot = {lon: number; lat: number; at: number; label?: string; color?: string; r?: number; dx?: number; dy?: number; out?: number};
export type MapArrow = {from: [number, number]; to: [number, number]; at: number; dur?: number; color?: string; bend?: number; out?: number};
export type MapRoute = {pts: [number, number][]; at: number; dur?: number; color?: string; ship?: boolean};

export const GeoMap: React.FC<{
  f: number;
  inF: number;
  dF: number;
  region: Region;
  x: number;
  y: number;
  w: number;
  h: number;
  seed: number;
  fills?: Record<string, string>; // country id -> color
  fillAt?: number;
  inkFrom?: [number, number];
  labels?: MapLabel[];
  dots?: MapDot[];
  arrows?: MapArrow[];
  routes?: MapRoute[];
  frame?: boolean;
}> = ({f, inF, dF, region, x, y, w, h, fills = {}, fillAt, inkFrom, labels = [], dots = [], arrows = [], routes = [], frame = true, seed}) => {
  const b = useMemo(() => build(region, x, y, w, h), [region, x, y, w, h]);
  const p = clamp01((f - inF) / Math.max(1, dF));
  const clipId = useMemo(() => `mapclip${seed}`, [seed]);
  const P = (lon: number, lat: number): [number, number] => (b.proj([lon > 180 ? lon - 360 : lon, lat]) as [number, number]) || [0, 0];
  const fa = fillAt ?? inF + dF;
  const inkR = clamp01((f - fa) / 40) * Math.hypot(w, h);
  const [ix, iy] = inkFrom ? P(inkFrom[0], inkFrom[1]) : [x + w / 2, y + h / 2];
  return (
    <g>
      <defs>
        <clipPath id={clipId}>
          <rect x={x} y={y} width={w} height={h} />
        </clipPath>
        <clipPath id={clipId + 'ink'}>
          <circle cx={ix} cy={iy} r={inkR} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clipId})`}>
        {Object.keys(fills).length && f >= fa ? (
          <g clipPath={`url(#${clipId}ink)`}>
            {b.rings.filter((r) => fills[r.id]).map((r, i) => (
              <path key={i} d={r.d} fill={fills[r.id]} opacity={0.55} />
            ))}
          </g>
        ) : null}
        {b.rings.map((r, i) => (
          <PathDraw key={i} d={r.d} p={p} color={C.ink} w={r.area > 4000 ? 3.2 : 2.4} />
        ))}
        {routes.map((rt, i) => {
          const pts = rt.pts.map((c) => P(c[0], c[1]));
          const d = toPath(wobble(pts, seed + 300 + i, 2));
          const rp = clamp01((f - rt.at) / Math.max(1, rt.dur ?? 45));
          // ship marker at the head of the route
          let head: [number, number] | null = null;
          if (rt.ship && rp > 0) {
            const seg = pts.length - 1;
            const u = easeInOut(rp) * seg;
            const k = Math.min(seg - 1, Math.floor(u));
            const t = u - k;
            head = [pts[k][0] + (pts[k + 1][0] - pts[k][0]) * t, pts[k][1] + (pts[k + 1][1] - pts[k][1]) * t];
          }
          return (
            <g key={'r' + i}>
              <mask id={`${clipId}rm${i}`}>
                <path d={d} fill="none" stroke="white" strokeWidth={14} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - easeInOut(rp)} />
              </mask>
              <path d={d} fill="none" stroke={rt.color ?? C.blue} strokeWidth={5} strokeDasharray="14 12" strokeLinecap="round" mask={`url(#${clipId}rm${i})`} />
              {head ? (
                <g transform={`translate(${head[0]} ${head[1] - 12}) scale(0.8)`}>
                  <path d="M-30,0 L30,0 L22,12 L-24,12Z M-8,0 L-8,-14 L10,-14 L10,0" fill={C.steel} stroke={C.ink} strokeWidth={3} />
                </g>
              ) : null}
            </g>
          );
        })}
        {arrows.map((a, i) => {
          const [x1, y1] = P(a.from[0], a.from[1]);
          const [x2, y2] = P(a.to[0], a.to[1]);
          const bend = a.bend ?? 0.18;
          const mx = (x1 + x2) / 2 - (y2 - y1) * bend;
          const my = (y1 + y2) / 2 + (x2 - x1) * bend;
          const ap = clamp01((f - a.at) / Math.max(1, a.dur ?? 30));
          const oa = a.out !== undefined ? 1 - clamp01((f - a.out) / 8) : 1;
          const ang = Math.atan2(y2 - my, x2 - mx);
          const hl = 30;
          const head = `M${x2 - hl * Math.cos(ang - 0.45)},${y2 - hl * Math.sin(ang - 0.45)} L${x2},${y2} L${x2 - hl * Math.cos(ang + 0.45)},${y2 - hl * Math.sin(ang + 0.45)}`;
          return (
            <g key={'a' + i} opacity={oa}>
              <PathDraw d={`M${x1},${y1} Q${mx},${my} ${x2},${y2}`} p={ap} color={a.color ?? C.red} w={9} />
              <PathDraw d={head} p={clamp01((ap - 0.92) * 14)} color={a.color ?? C.red} w={9} />
            </g>
          );
        })}
      </g>
      {frame ? <PathDraw d={toPath(wobble([[x, y], [x + w, y], [x + w, y + h], [x, y + h]], seed + 1, 1.5, true))} p={p} color={C.ink} w={3} opacity={0.35} /> : null}
      {dots.map((d, i) => {
        const [dx, dy] = P(d.lon, d.lat);
        const s = pop(f, d.at) * (d.out !== undefined ? 1 - clamp01((f - d.out) / 8) : 1);
        if (s <= 0) return null;
        return (
          <g key={'d' + i}>
            <circle cx={dx} cy={dy} r={(d.r ?? 11) * s} fill={d.color ?? C.red} stroke={C.ink} strokeWidth={3} />
            {d.label ? (
              <text x={dx + (d.dx ?? 18)} y={dy + (d.dy ?? 10)} fontFamily={FONT_LABEL} fontSize={38} fill={C.ink} opacity={clamp01(s)}>
                {d.label}
              </text>
            ) : null}
          </g>
        );
      })}
      {labels.map((l, i) => {
        const [lx, ly] = P(l.lon, l.lat);
        const o = clamp01((f - l.at) / 10) * (l.out !== undefined ? 1 - clamp01((f - l.out) / 8) : 1);
        return (
          <text key={'l' + i} x={lx + (l.dx ?? 0)} y={ly + (l.dy ?? 0)} textAnchor="middle" fontFamily={FONT_LABEL} fontSize={l.size ?? 40} fill={l.color ?? C.ink} opacity={o}>
            {l.t}
          </text>
        );
      })}
    </g>
  );
};
