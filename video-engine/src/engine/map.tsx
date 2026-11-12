// Stylized 2D maps: paper texture, muted land, darker sea, thin borders, animated arrows/routes/dots.
import React, {createContext, useContext, useMemo} from 'react';
import {geoMercator, geoPath, GeoProjection} from 'd3-geo';
import {feature} from 'topojson-client';
// Natural Earth via world-atlas (public domain)
import world50 from 'world-atlas/countries-50m.json';
import {useShot, useUid, clamp, smooth, W, H} from './core';
import {FONT_TYPE, FONT_STENCIL} from './text';

const countries = (feature(world50 as any, (world50 as any).objects.countries) as any).features as any[];

type MapCtxT = {proj: GeoProjection};
const MapCtx = createContext<MapCtxT>({proj: geoMercator()});
export const useProj = () => useContext(MapCtx).proj;

export type MapStyle = {sea: [string, string]; land: string; landShade: string; border: string; coast?: string; highlight?: Record<string, string>};

export const MAP_PAPER: MapStyle = {sea: ['#5d6f73', '#46575c'], land: '#c9b994', landShade: '#b3a27c', border: '#8a7a5c', coast: '#e8dcbc'};
export const MAP_NIGHT: MapStyle = {sea: ['#16263a', '#0d1828'], land: '#3a4a52', landShade: '#2f3d44', border: '#5b6b70', coast: '#7f9aa3'};
export const MAP_COLD: MapStyle = {sea: ['#4d6a72', '#36505a'], land: '#b9c2b4', landShade: '#a2ad9f', border: '#7f8a80', coast: '#e3ead8'};

/** bbox = [lonW, latS, lonE, latN] */
export const MapView: React.FC<{bbox: [number, number, number, number]; style?: MapStyle; children?: React.ReactNode; pad?: number}> = ({
  bbox,
  style = MAP_PAPER,
  children,
  pad = 0,
}) => {
  const u = useUid();
  const proj = useMemo(() => {
    const [w, s, e, n] = bbox;
    const box = {type: 'Feature', geometry: {type: 'Polygon', coordinates: [[[w, s], [w, n], [e, n], [e, s], [w, s]]]}} as any;
    return geoMercator().fitExtent([[pad, pad], [W - pad, H - pad]], box);
  }, [bbox, pad]);
  const path = useMemo(() => geoPath(proj), [proj]);
  const ds = useMemo(() => countries.map((c) => ({id: String(c.id), name: c.properties?.name as string, d: path(c) || ''})), [path]);
  return (
    <MapCtx.Provider value={{proj}}>
      <defs>
        <linearGradient id={u('mapsea')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={style.sea[0]} />
          <stop offset="1" stopColor={style.sea[1]} />
        </linearGradient>
      </defs>
      <rect x={-200} y={-200} width={W + 400} height={H + 400} fill={`url(#${u('mapsea')})`} />
      {/* faint graticule */}
      <g stroke={style.coast ?? style.border} strokeOpacity={0.08} strokeWidth={1}>
        {Array.from({length: 13}).map((_, i) => (
          <line key={`v${i}`} x1={-200 + i * 190} y1={-200} x2={-200 + i * 190} y2={H + 200} />
        ))}
        {Array.from({length: 8}).map((_, i) => (
          <line key={`h${i}`} x1={-200} y1={-200 + i * 190} x2={W + 200} y2={-200 + i * 190} />
        ))}
      </g>
      {/* coast halo then land */}
      <g fill="none" stroke={style.coast ?? style.border} strokeOpacity={0.25} strokeWidth={6} strokeLinejoin="round">
        {ds.map((c) => (
          <path key={`h${c.id}${c.name}`} d={c.d} />
        ))}
      </g>
      <g stroke={style.border} strokeWidth={1.2} strokeLinejoin="round">
        {ds.map((c) => (
          <path key={c.id + c.name} d={c.d} fill={style.highlight?.[c.name] ?? style.land} />
        ))}
      </g>
      {children}
    </MapCtx.Provider>
  );
};

/** point on map */
export const useXY = () => {
  const proj = useProj();
  return (lon: number, lat: number) => proj([lon, lat]) as [number, number];
};

export const MapLabel: React.FC<{lon: number; lat: number; text: string; size?: number; color?: string; dx?: number; dy?: number; at?: number; font?: 'type' | 'stencil'; anchor?: 'start' | 'middle' | 'end'}> = ({
  lon,
  lat,
  text,
  size = 30,
  color = '#2b2620',
  dx = 0,
  dy = 0,
  at = 0,
  font = 'type',
  anchor = 'middle',
}) => {
  const xy = useXY();
  const {t} = useShot();
  const [x, y] = xy(lon, lat);
  return (
    <text x={x + dx} y={y + dy} textAnchor={anchor} fontFamily={font === 'type' ? FONT_TYPE : FONT_STENCIL} fontSize={size} letterSpacing={3} fill={color} opacity={clamp((t - at) / 0.4)}>
      {text}
    </text>
  );
};

export const MapDot: React.FC<{lon: number; lat: number; r?: number; color?: string; at?: number; pulse?: boolean}> = ({lon, lat, r = 9, color = '#b8442e', at = 0, pulse = false}) => {
  const xy = useXY();
  const {t} = useShot();
  const [x, y] = xy(lon, lat);
  const o = clamp((t - at) / 0.3);
  const ring = pulse ? ((t - at) % 2) / 2 : 0;
  return (
    <g opacity={o}>
      {pulse && t > at && <circle cx={x} cy={y} r={r + ring * 30} fill="none" stroke={color} strokeWidth={2} opacity={1 - ring} />}
      <circle cx={x} cy={y} r={r} fill={color} stroke="#1b1712" strokeWidth={2} />
    </g>
  );
};

/** animated route/arrow along a list of lon/lat points (curved through quadratic midpoints) */
export const MapRoute: React.FC<{
  pts: [number, number][];
  color?: string;
  width?: number;
  from?: number;
  to?: number;
  dashed?: boolean;
  arrow?: boolean;
  bend?: number;
}> = ({pts, color = '#9c2f22', width = 6, from = 0.1, to = 0.8, dashed = false, arrow = true, bend = 0.2}) => {
  const xy = useXY();
  const {p} = useShot();
  const k = smooth(clamp((p - from) / Math.max(0.01, to - from)));
  const P = pts.map(([lo, la]) => xy(lo, la));
  let d = `M${P[0][0]} ${P[0][1]}`;
  for (let i = 1; i < P.length; i++) {
    const [x0, y0] = P[i - 1];
    const [x1, y1] = P[i];
    const mx = (x0 + x1) / 2 - (y1 - y0) * bend;
    const my = (y0 + y1) / 2 + (x1 - x0) * bend;
    d += ` Q${mx} ${my} ${x1} ${y1}`;
  }
  const L = 4000;
  // arrow head position: approximate by sampling with an invisible path is not possible in SSR; use last segment direction
  const [ax, ay] = P[P.length - 1];
  const [bx, by] = P[P.length - 2] ?? P[0];
  const ang = (Math.atan2(ay - by, ax - bx) * 180) / Math.PI;
  return (
    <g>
      <path
        d={d}
        fill="none"
        stroke={color}
        strokeWidth={width}
        strokeLinecap="round"
        strokeDasharray={dashed ? `14 12` : `${L}`}
        strokeDashoffset={dashed ? 0 : L * (1 - k)}
        pathLength={dashed ? undefined : L}
        opacity={dashed ? k : 1}
      />
      {arrow && k > 0.97 && (
        <path transform={`translate(${ax} ${ay}) rotate(${ang})`} d={`M6 0 L-22 -14 L-16 0 L-22 14z`} fill={color} />
      )}
    </g>
  );
};

/** straight-ish front arrow in screen space (for land advances) */
export const ScreenArrow: React.FC<{x0: number; y0: number; x1: number; y1: number; color?: string; width?: number; from?: number; to?: number}> = ({
  x0,
  y0,
  x1,
  y1,
  color = '#9c2f22',
  width = 26,
  from = 0.1,
  to = 0.7,
}) => {
  const {p} = useShot();
  const k = smooth(clamp((p - from) / (to - from)));
  const x = x0 + (x1 - x0) * k;
  const y = y0 + (y1 - y0) * k;
  const ang = (Math.atan2(y1 - y0, x1 - x0) * 180) / Math.PI;
  const len = Math.hypot(x - x0, y - y0);
  return (
    <g transform={`translate(${x0} ${y0}) rotate(${ang})`} opacity={k > 0 ? 0.92 : 0}>
      <rect x={0} y={-width / 2} width={Math.max(0, len - 30)} height={width} fill={color} />
      <path transform={`translate(${len} 0)`} d={`M0 0 L-44 -${width * 1.3} L-44 ${width * 1.3}z`} fill={color} />
    </g>
  );
};
