"""Project Natural Earth (public domain) country outlines into SVG paths for the map components.
usage: python tools/prep_maps.py countries50.geojson src/data/maps.json"""
import json, math, sys

def simplify(pts, tol):
    if len(pts) < 3: return pts
    a, b = pts[0], pts[-1]
    dx, dy = b[0]-a[0], b[1]-a[1]; L = math.hypot(dx, dy) or 1e-9
    dmax, idx = 0, 0
    for i in range(1, len(pts)-1):
        p = pts[i]
        d = abs(dy*p[0]-dx*p[1]+b[0]*a[1]-b[1]*a[0])/L if L > 1e-9 else math.hypot(p[0]-a[0], p[1]-a[1])
        if d > dmax: dmax, idx = d, i
    if dmax > tol:
        return simplify(pts[:idx+1], tol)[:-1] + simplify(pts[idx:], tol)
    return [a, b]

def build(geo, codes, box, W, H, tol, minarea=0):
    lon0, lon1, lat0, lat1 = box
    latc = math.radians((lat0+lat1)/2)
    kx = W/((lon1-lon0)*math.cos(latc)); ky = H/(lat1-lat0); k = min(kx, ky)
    def P(lon, lat): return ((lon-lon0)*math.cos(latc)*k, (lat1-lat)*k)
    out = {}
    for f in geo['features']:
        c = f['properties']['ADM0_A3']
        if c not in codes: continue
        g = f['geometry']; polys = g['coordinates'] if g['type'] == 'MultiPolygon' else [g['coordinates']]
        ds = []
        for poly in polys:
            ring = poly[0]
            if any(lon < -100 for lon, lat in ring) and c == 'RUS': continue  # Chukotka over antimeridian
            if max(l for l, _ in ring) < lon0-5 or min(l for l, _ in ring) > lon1+5: continue
            pts = [P(lon, lat) for lon, lat in ring]
            xs = [p[0] for p in pts]; ys = [p[1] for p in pts]
            if (max(xs)-min(xs))*(max(ys)-min(ys)) < minarea: continue
            pts = simplify(pts, tol)
            if len(pts) < 4: continue
            ds.append('M' + 'L'.join(f'{x:.1f},{y:.1f}' for x, y in pts) + 'Z')
        if ds: out[c] = ' '.join(ds)
    return {'w': W, 'h': H, 'paths': out, 'proj': [lon0, lat1, math.cos(latc)*k, k]}

geo = json.load(open(sys.argv[1]))
SOV = ['RUS','UKR','BLR','KAZ','GEO','ARM','AZE','UZB','TKM','KGZ','TJK','MDA','LTU','LVA','EST']
EUR = SOV + ['POL','ROU','SVK','HUN','DEU','CZE','FIN','AUT','SWE','NOR','DNK','BGR','SRB','HRV','SVN','BIH','MNE','ALB','MKD','GRC','TUR','ITA','CHE','NLD','BEL','LUX','FRA','KOS']
maps = {
    'ussr': build(geo, SOV, (20, 180, 36, 78), 1500, 640, 2.2, 60),
    'east': build(geo, EUR, (8, 52, 42, 62), 1400, 760, 1.6, 30),
    'world': build(geo, ['USA','CAN','MEX'] + SOV, (-128, 180, 18, 75), 1600, 520, 2.0, 80),
}
json.dump(maps, open(sys.argv[2], 'w'))
for k, v in maps.items(): print(k, len(v['paths']), sum(len(p) for p in v['paths'].values()))
