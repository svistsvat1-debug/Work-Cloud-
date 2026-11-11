import React, {useId, useMemo} from 'react';
import {geoBounds, geoMercator, geoPath, GeoProjection} from 'd3-geo';
import {feature} from 'topojson-client';
// Natural Earth 1:110m via world-atlas (public domain data) - light enough for fast renders
import world from 'world-atlas/countries-110m.json';
import {easeInOut, easeOut, prog} from '../lib/anim';
import {useScene} from '../lib/scene';
import {C} from './draw';

const countries: any[] = (feature(world as any, (world as any).objects.countries) as any).features;

export type Extent = [[number, number], [number, number]]; // [[lonW, latS],[lonE, latN]]

export const makeProj = (extent: Extent, box: [number, number, number, number]): GeoProjection => {
  const [[w, s], [e, n]] = extent;
  // MultiPoint of the corners (a Polygon ring would be winding-sensitive on the sphere)
  const bboxFeature = {type: 'Feature', geometry: {type: 'MultiPoint', coordinates: [[w, s], [e, s], [e, n], [w, n], [(w + e) / 2, s], [(w + e) / 2, n]]}} as any;
  const [x, y, bw, bh] = box;
  return geoMercator().fitExtent([[x, y], [x + bw, y + bh]], bboxFeature);
};

/** Country outlines that draw on, with optional ink fills that spread. */
export const WorldMap: React.FC<{
  extent: Extent;
  box?: [number, number, number, number];
  at?: number;
  dur?: number;
  fills?: {name: string; color: string; at: number}[];
  instant?: boolean;
  children?: (proj: GeoProjection) => React.ReactNode;
  stroke?: number;
  dim?: boolean;
}> = ({extent, box = [80, 160, 1760, 860], at = 0, dur = 1.4, fills = [], instant, children, stroke = 3, dim}) => {
  const {t} = useScene();
  const uid = useId().replace(/:/g, '');
  const proj = useMemo(() => makeProj(extent, box), [JSON.stringify(extent), JSON.stringify(box)]);
  const path = useMemo(() => geoPath(proj), [proj]);
  const [[w0, s0], [e0, n0]] = extent;
  const padW = (e0 - w0) * 0.25;
  const padH = (n0 - s0) * 0.25;
  const visible = useMemo(
    () =>
      countries
        .map((f) => ({f, d: path(f) as string, b: geoBounds(f)}))
        .filter(({d, b}) => d && (b[0][0] > b[1][0] || (b[1][0] > w0 - padW && b[0][0] < e0 + padW)) && b[1][1] > s0 - padH && b[0][1] < n0 + padH),
    [path],
  );
  if (t < at) return null;
  const p = instant ? 1 : easeInOut(prog(t, at, dur));
  const [bx, by, bw, bh] = box;
  return (
    <g>
      <defs>
        <clipPath id={`mapclip${uid}`}>
          <rect x={bx - 20} y={by - 20} width={bw + 40} height={bh + 40} />
        </clipPath>
      </defs>
      <g clipPath={`url(#mapclip${uid})`}>
        {fills.map((fl) => {
          const f = visible.find((v) => v.f.properties.name === fl.name);
          if (!f || t < fl.at) return null;
          const fp = easeOut(prog(t, fl.at, 1.0));
          const c = path.centroid(f.f);
          return (
            <g key={fl.name}>
              <defs>
                <clipPath id={`ink${uid}-${fl.name.replace(/\W/g, '')}`}>
                  <circle cx={c[0]} cy={c[1]} r={60 + 900 * fp} />
                </clipPath>
              </defs>
              <path d={f.d} fill={fl.color} opacity={0.55} clipPath={`url(#ink${uid}-${fl.name.replace(/\W/g, '')})`} />
            </g>
          );
        })}
        {visible.map(({f, d}, i) => (
          <path
            key={i}
            d={d}
            fill="none"
            stroke={dim ? '#8a8a8a' : C.ink}
            strokeWidth={stroke}
            strokeLinejoin="round"
            pathLength={1}
            strokeDasharray="1 1"
            strokeDashoffset={1 - p}
            opacity={dim ? 0.6 : 0.9}
          />
        ))}
      </g>
      {children && children(proj)}
    </g>
  );
};

/** A route along lon/lat points, drawn on. */
export const Route: React.FC<{proj: GeoProjection; pts: [number, number][]; at: number; dur?: number; color?: string; w?: number; dash?: boolean}> = ({
  proj,
  pts,
  at,
  dur = 1.2,
  color = C.red,
  w = 7,
  dash,
}) => {
  const {t} = useScene();
  if (t < at) return null;
  const xy = pts.map((p) => proj(p) as [number, number]);
  const d = 'M' + xy.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' L');
  const p = easeInOut(prog(t, at, dur));
  if (dash) {
    // draw solid mask by growing a clipping length: approximate with partial point list
    const n = Math.max(2, Math.ceil(xy.length * p));
    const part = 'M' + xy.slice(0, n).map((q) => `${q[0].toFixed(1)},${q[1].toFixed(1)}`).join(' L');
    return <path d={part} fill="none" stroke={color} strokeWidth={w} strokeDasharray="2 16" strokeLinecap="round" />;
  }
  return <path d={d} fill="none" stroke={color} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - p} />;
};

/** Interpolate a position along lon/lat points (for moving icons). */
export const along = (proj: GeoProjection, pts: [number, number][], f: number): [number, number] => {
  const xy = pts.map((p) => proj(p) as [number, number]);
  const segs = xy.slice(1).map((p, i) => Math.hypot(p[0] - xy[i][0], p[1] - xy[i][1]));
  const total = segs.reduce((a, b) => a + b, 0);
  let d = Math.max(0, Math.min(1, f)) * total;
  for (let i = 0; i < segs.length; i++) {
    if (d <= segs[i]) {
      const r = segs[i] ? d / segs[i] : 0;
      return [xy[i][0] + (xy[i + 1][0] - xy[i][0]) * r, xy[i][1] + (xy[i + 1][1] - xy[i][1]) * r];
    }
    d -= segs[i];
  }
  return xy[xy.length - 1];
};
