"""Hand-drawn marker maps from Natural Earth country polygons."""
import json
import math

import cv2
import numpy as np

import wb

_geo = None


def load_geo(path):
    global _geo
    if _geo is None:
        d = json.load(open(path))
        _geo = {}
        for f in d["features"]:
            name = f["properties"]["ADMIN"]
            g = f["geometry"]
            polys = g["coordinates"] if g["type"] == "MultiPolygon" else [g["coordinates"]]
            _geo[name] = [np.array(p[0], float) for p in polys]  # outer rings only
    return _geo


class MapView:
    """Equirectangular view of lon/lat box placed into canvas rect (x, y, w, h)."""

    def __init__(self, lon0, lon1, lat0, lat1, x, y, w, h):
        self.lon0, self.lon1, self.lat0, self.lat1 = lon0, lon1, lat0, lat1
        latc = math.radians((lat0 + lat1) / 2)
        gw = (lon1 - lon0) * math.cos(latc)
        gh = lat1 - lat0
        s = min(w / gw, h / gh)
        self.s, self.k = s, math.cos(latc)
        self.ox = x + (w - gw * s) / 2
        self.oy = y + (h - gh * s) / 2
        self.rect = (x, y, w, h)
        self.box = (self.ox, self.oy, self.ox + gw * s, self.oy + gh * s)

    def p(self, lon, lat):
        return np.array([self.ox + (lon - self.lon0) * self.k * self.s, self.oy + (self.lat1 - lat) * self.s])

    def pts(self, lonlat):
        ll = np.asarray(lonlat, float)
        return np.stack([self.ox + (ll[:, 0] - self.lon0) * self.k * self.s,
                         self.oy + (self.lat1 - ll[:, 1]) * self.s], 1)


def _view_mask(view, polys_ll, pad=40):
    x0, y0, x1, y1 = view.box
    X0, Y0 = int(x0) - pad, int(y0) - pad
    w, h = int(x1 - x0) + 2 * pad, int(y1 - y0) + 2 * pad
    m = np.zeros((h, w), np.uint8)
    rings = []
    for ring in polys_ll:
        lon, lat = ring[:, 0], ring[:, 1]
        if lon.max() < view.lon0 - 5 or lon.min() > view.lon1 + 5 or lat.max() < view.lat0 - 5 or lat.min() > view.lat1 + 5:
            continue
        rings.append(np.round(view.pts(ring) - [X0, Y0]).astype(np.int32))
    if rings:
        cv2.fillPoly(m, rings, 1)
    # clip to view box
    clip = np.zeros_like(m)
    clip[pad:pad + int(y1 - y0), pad:pad + int(x1 - x0)] = 1
    return m & clip, X0, Y0


def region_mask(view, names, geo):
    rings = []
    for n in names:
        rings += geo.get(n, [])
    return _view_mask(view, rings)


def mask_outline_paths(m, x0, y0, min_len=25, eps=1.2, clip=None):
    """Contours of a mask as canvas paths. With clip=(bx0,by0,bx1,by1) the parts that run
    along the view-box edge are dropped, so the map fades out instead of being boxed."""
    cs, _ = cv2.findContours(m.astype(np.uint8), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
    paths = []
    for c in sorted(cs, key=lambda c: -cv2.arcLength(c, True)):
        if cv2.arcLength(c, True) < min_len:
            continue
        pts = c[:, 0, :].astype(float) + [x0, y0]
        pts = np.vstack([pts, pts[:1]])
        if clip is None:
            seg_list = [pts]
        else:
            bx0, by0, bx1, by1 = clip
            on_edge = ((np.abs(pts[:, 0] - bx0) < 2.5) | (np.abs(pts[:, 0] - bx1) < 2.5) |
                       (np.abs(pts[:, 1] - by0) < 2.5) | (np.abs(pts[:, 1] - by1) < 2.5))
            seg_list, cur = [], []
            for p, e in zip(pts, on_edge):
                if e:
                    if len(cur) > 3:
                        seg_list.append(np.array(cur))
                    cur = []
                else:
                    cur.append(p)
            if len(cur) > 3:
                seg_list.append(np.array(cur))
        for sgm in seg_list:
            if len(sgm) < 3:
                continue
            ap = cv2.approxPolyDP(sgm.astype(np.float32).reshape(-1, 1, 2), eps, False)[:, 0, :].astype(float)
            if len(ap) >= 2:
                paths.append(ap)
    return paths


def _edge_fade(layer, view, ramp=70.0):
    bx0, by0, bx1, by1 = view.box
    h, w = layer.a.shape
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    X, Y = xx + layer.x, yy + layer.y
    d = np.minimum.reduce([X - bx0, bx1 - X, Y - by0, by1 - Y])
    layer.a *= np.clip(d / ramp, 0, 1)
    return layer


def land_layers(view, geo, fill=wb.SAND, width=4.0, seed=0):
    m, x0, y0 = region_mask(view, list(geo.keys()), geo)
    paths = mask_outline_paths(m, x0, y0, clip=view.box)
    outline = wb.stroke_layer(paths, wb.INK, width, wobble=0.7, seed=seed, tex=0.08)
    _edge_fade(outline, view, 40.0)
    fill_l = wb.hatch_layer(m.astype(bool), x0, y0, fill, spacing=12, seed=seed + 3, shade=0.07)
    _edge_fade(fill_l, view, 90.0)
    return outline, fill_l


def region_layers(view, geo, names, color, width=3.5, seed=0, outline=True, extra_mask=None):
    m, x0, y0 = region_mask(view, names, geo)
    if extra_mask is not None:
        m = m & extra_mask(m, x0, y0, view).astype(np.uint8)
    if m.sum() == 0:
        return None, None
    fill_l = wb.hatch_layer(m.astype(bool), x0, y0, color, spacing=10, seed=seed + 11, shade=0.12)
    _edge_fade(fill_l, view, 90.0)
    ol = None
    if outline:
        ol = wb.stroke_layer(mask_outline_paths(m, x0, y0, min_len=15, clip=view.box), wb.INK, width,
                             wobble=0.6, seed=seed)
        if ol is not None:
            _edge_fade(ol, view, 40.0)
    return ol, fill_l


# Rhine course (lon, lat) from Basel to the Dutch border
RHINE = np.array([(7.59, 47.56), (7.75, 48.3), (8.0, 48.8), (8.45, 49.05), (8.47, 49.5), (8.27, 50.0),
                  (7.6, 50.35), (7.1, 50.73), (6.96, 50.94), (6.77, 51.23), (6.6, 51.6), (6.1, 51.85)])


def west_of_rhine_filter(extra_lon=0.55):
    """Rhineland demilitarised zone ~ left bank of the Rhine + a ~50 km strip on the right bank."""
    lats, lons = RHINE[:, 1], RHINE[:, 0]

    def f(m, x0, y0, view):
        h, w = m.shape
        yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
        lon = view.lon0 + (xx + x0 - view.ox) / (view.k * view.s)
        lat = view.lat1 - (yy + y0 - view.oy) / view.s
        lim = np.interp(lat, lats, lons) + extra_lon
        return (lon <= lim) & (lat >= 47.5) & (lat <= 52.0)
    return f


def lon_lat_box_filter(lon_min=-180, lon_max=180, lat_min=-90, lat_max=90):
    def f(m, x0, y0, view):
        h, w = m.shape
        yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
        X, Y = xx + x0, yy + y0
        lon = view.lon0 + (X - view.ox) / (view.k * view.s)
        lat = view.lat1 - (Y - view.oy) / view.s
        return (lon >= lon_min) & (lon <= lon_max) & (lat >= lat_min) & (lat <= lat_max)
    return f


def border_band_filter(width_px, lon_max=None):
    """Keep only a band of `width_px` along the inside of the region border (e.g. Sudetenland)."""
    def f(m, x0, y0, view):
        er = cv2.erode(m.astype(np.uint8), np.ones((3, 3), np.uint8), iterations=int(width_px))
        band = (m > 0) & (er == 0)
        if lon_max is not None:
            band &= lon_lat_box_filter(lon_max=lon_max)(m, x0, y0, view)
        return band
    return f


CITIES = {
    "Berlin": (13.40, 52.52), "Paris": (2.35, 48.86), "London": (-0.13, 51.51), "Moscow": (37.62, 55.75),
    "Kyiv": (30.52, 50.45), "Leningrad": (30.32, 59.94), "Warsaw": (21.01, 52.23), "Vienna": (16.37, 48.21),
    "Prague": (14.42, 50.08), "Munich": (11.58, 48.14), "Dunkirk": (2.38, 51.03), "Sedan": (4.94, 49.70),
    "Abbeville": (1.83, 50.11), "Compiegne": (2.83, 49.42), "Brussels": (4.35, 50.85), "Amsterdam": (4.90, 52.37),
    "Rome": (12.50, 41.90), "Stalingrad": (44.52, 48.71), "Cologne": (6.96, 50.94),
}


def city_dot(view, name, color=wb.RED, r=9, seed=0):
    x, y = view.p(*CITIES[name])
    m = np.zeros((2 * r + 6, 2 * r + 6), np.uint8)
    cv2.circle(m, (r + 3, r + 3), r, 1, -1, cv2.LINE_AA)
    fill = wb.hatch_layer(m.astype(bool), int(x - r - 3), int(y - r - 3), color, spacing=5, seed=seed)
    ring = wb.circle_layer(x, y, r + 1, color=wb.INK, width=3.5, seed=seed)
    return ring, fill, (x, y)
