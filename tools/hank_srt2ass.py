# SRT + silence log -> ASS with centred subtitles and current-word highlight
# python3 -I srt2ass.py voice.srt silences.txt out.ass [fade]
# mode 'fade': no word highlight; each phrase drifts up, sharpens and fades in, then dissolves out
import sys, re, os
srt_p, sil_p, out_p = sys.argv[1:4]
MODE = sys.argv[4] if len(sys.argv) > 4 else 'karaoke'
def ts(t):
    h, m, s = t.replace(',', '.').split(':'); return int(h) * 3600 + int(m) * 60 + float(s)
cues = []
for b in open(srt_p, encoding='utf-8').read().strip().split('\n\n'):
    p = b.strip().split('\n'); a, z = p[1].split(' --> ')
    cues.append(dict(s=ts(a), e=ts(z), lines=[l.strip() for l in p[2:]]))
# silences
ev = [l.split() for l in open(sil_p)]
sil, cur = [], None
for k, v in ev:
    if k == 'start': cur = float(v)
    elif cur is not None: sil.append((cur, float(v))); cur = None

def speech_segments(s, e):
    segs, t = [], s
    for a, b in sil:
        if b <= s or a >= e: continue
        if a > t: segs.append((t, min(a, e)))
        t = max(t, b)
    if t < e: segs.append((t, e))
    segs = [(a, b) for a, b in segs if b - a > 0.02]
    return segs if sum(b - a for a, b in segs) > 0.15 else [(s, e)]

def at(segs, frac):
    tot = sum(b - a for a, b in segs); x = frac * tot
    for a, b in segs:
        if x <= b - a + 1e-9: return a + x
        x -= b - a
    return segs[-1][1]

# optional bigger text (env): HANK_FS font size, HANK_Y centre y, HANK_WRAP max line width px.
# With HANK_WRAP the lines are re-broken (max 2 per screen); longer cues are split in time.
FS = float(os.environ.get('HANK_FS', 78))
CY = int(os.environ.get('HANK_Y', 540))
WRAP = int(os.environ.get('HANK_WRAP', 0))
if WRAP:
    from PIL import ImageFont
    fp = os.environ.get('HANK_FONTFILE', '.claude/skills/ui-styling/canvas-fonts/InstrumentSans-Bold.ttf')
    a1, d1 = ImageFont.truetype(fp, 1000).getmetrics()
    FONT = ImageFont.truetype(fp, round(FS * 1000 / (a1 + d1)))
    def width(ws):
        t = ' '.join(ws); return FONT.getlength(t) + len(t)
    PUNCT = (',', '.', '?', '!', ';', ':', '—', '"')
    def best_cut(ws, lo=1):
        best = None
        for i in range(lo, len(ws)):
            sc = abs(width(ws[:i]) - width(ws[i:])) - (250 if ws[i - 1].endswith(PUNCT) else 0)
            if best is None or sc < best[0]: best = (sc, i)
        return best[1]
    def two_lines(ws):
        if width(ws) <= WRAP * 0.75 or len(ws) < 3: return [ws]
        i = best_cut(ws); return [ws[:i], ws[i:]]
    def fits(ws):
        return all(width(l) <= WRAP for l in two_lines(ws))
    def chunks(ws):
        if fits(ws) or len(ws) < 2: return [ws]
        i = best_cut(ws); return chunks(ws[:i]) + chunks(ws[i:])
    new = []
    for c in cues:
        ws = ' '.join(c['lines']).split()
        parts = chunks(ws)
        if len(parts) > 1:
            segs = speech_segments(c['s'], c['e'])
            wts = [len(re.sub(r'[^A-Za-z0-9]', '', w)) + 1.2 for w in ws]
            tot, acc, k, t0 = sum(wts), 0, 0, c['s']
            for j, p in enumerate(parts):
                acc += sum(wts[k:k + len(p)]); k += len(p)
                t1 = c['e'] if j == len(parts) - 1 else at(segs, acc / tot)
                new.append(dict(s=t0, e=t1, lines=[' '.join(l) for l in two_lines(p)])); t0 = t1
        else:
            new.append(dict(s=c['s'], e=c['e'], lines=[' '.join(l) for l in two_lines(ws)]))
    cues = new

def fmt(t):
    t = max(t, 0); h = int(t // 3600); m = int(t % 3600 // 60); s = t % 60
    return f'{h}:{m:02d}:{s:05.2f}'

WHITE, AMBER = '&H00FFFFFF&', '&H0057C8FF&'
out = ['[Script Info]', 'ScriptType: v4.00+', 'PlayResX: 1920', 'PlayResY: 1080', 'WrapStyle: 0',
       'ScaledBorderAndShadow: yes', '', '[V4+ Styles]',
       'Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding',
       f'Style: Main,Instrument Sans,{FS:g},&H00FFFFFF,&H00FFFFFF,&H00141414,&H00000000,-1,0,0,0,100,100,1,0,1,{3.5 * FS / 78:.1f},0,5,100,100,0,1',
       f'Style: Halo,Instrument Sans,{FS:g},&HFF000000,&HFF000000,&H50000000,&HFF000000,-1,0,0,0,100,100,1,0,1,{20 * FS / 78:.0f},0,5,100,100,0,1',
       '', '[Events]', 'Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text']
in_q = False
for i, c in enumerate(cues):
    nxt = cues[i + 1]['s'] if i + 1 < len(cues) else c['e'] + 0.6
    gap = nxt - c['e']
    end = nxt if gap < 1.2 else c['e'] + 0.35
    fade_out = 0 if gap < 1.2 else 220
    words, breaks = [], []
    for li, l in enumerate(c['lines']):
        ws = l.split(); words += ws; breaks.append(len(words))
    # italics for quoted speech
    ital = []
    for w in words:
        it = in_q or w.startswith('"'); ital.append(it)
        if w.count('"') % 2: in_q = not in_q
    weights = [len(re.sub(r'[^A-Za-z0-9]', '', w)) + 1.2 for w in words]
    tot = sum(weights); segs = speech_segments(c['s'], c['e'])
    starts, acc = [], 0
    for wgt in weights:
        starts.append(at(segs, acc / tot)); acc += wgt
    starts[0] = c['s']
    def text(hi):
        parts = []
        for k, w in enumerate(words):
            tag = ''
            if ital[k]: tag += r'\i1'
            if k == hi: tag += r'\c' + AMBER
            w2 = w.replace('{', '(').replace('}', ')')
            seg = ('{' + tag + '}' if tag else '') + w2
            if tag: seg += '{' + (r'\i0' if ital[k] else '') + (r'\c' + WHITE if k == hi else '') + '}'
            parts.append(seg)
            if k + 1 in breaks[:-1]: parts.append(r'\N')
            elif k + 1 < len(words): parts.append(' ')
        return ''.join(parts).replace(' \\N', '\\N')
    if MODE == 'fade':
        nxt_s = cues[i + 1]['s'] if i + 1 < len(cues) else c['e'] + 1.0
        e2 = min(c['e'] + 0.15, nxt_s)
        dur = int((e2 - c['s']) * 1000)
        fin, fout = min(260, dur // 3), min(200, dur // 3)
        mv = f'\\an5\\move(960,{CY + 14},960,{CY},0,{fin + 60})\\fad({fin},{fout})'
        txt = text(-1)
        out.append(f'Dialogue: 0,{fmt(c["s"])},{fmt(e2)},Halo,,0,0,0,,'
                   f'{{{mv}\\fsp6\\blur18\\t(0,{fin + 60},\\fsp1)}}{txt}')
        out.append(f'Dialogue: 1,{fmt(c["s"])},{fmt(e2)},Main,,0,0,0,,'
                   f'{{{mv}\\fsp6\\blur5\\t(0,{fin + 60},\\fsp1\\blur0.6)\\t({max(dur - fout, 0)},{dur},\\blur4)}}{txt}')
        continue
    pop = r'{\fad(150,0)\fscx93\fscy93\t(0,170,\fscx100\fscy100)}'
    halo_txt = text(-1)
    out.append(f'Dialogue: 0,{fmt(c["s"])},{fmt(end)},Halo,,0,0,0,,{{\\fad(150,{fade_out})\\blur18}}{halo_txt}')
    for k in range(len(words)):
        a = starts[k]; b = starts[k + 1] if k + 1 < len(words) else end
        if b - a < 0.02: continue
        lead = pop if k == 0 else ''
        tail = f'{{\\fad(0,{fade_out})}}' if (k == len(words) - 1 and fade_out) else ''
        out.append(f'Dialogue: 1,{fmt(a)},{fmt(b)},Main,,0,0,0,,{lead}{tail}{{\\blur0.6}}{text(k)}')
open(out_p, 'w', encoding='utf-8').write('\n'.join(out) + '\n')
print('cues', len(cues), 'events', len(out))
