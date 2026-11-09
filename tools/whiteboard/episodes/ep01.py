"""Episode 1 storyboard: "The Day Hitler Lost World War 2" (whiteboard style, no subtitles).

Timing comes from the voice-over SRT: c(i) = start time (s) of cue i (1-based).
"""
import os
import re

import maps
import wb
from kit import (answer_card, arrow, big, bubble, calendar, check, dashed_arrow, flag, key_slots, label,
                 level_map, lightning, note_bg, path_arrow, quest_card, quote, ring, shape, snowflake, sprite,
                 stamp, stop_sign, target, title, xmark, zigzag_tear)
from wb import BLUE, GREEN, GREY, INK, ORANGE, RED, SAND, YELLOW, LIGHTBLUE, Scene

PALE_RED = (240, 150, 140)
PALE_YELLOW = (250, 222, 140)
PALE_GREEN = (170, 215, 150)
DARK_RED = (165, 25, 30)


def parse_srt(path):
    cues = []
    for block in open(path, encoding="utf-8").read().strip().split("\n\n"):
        lines = block.strip().split("\n")
        if len(lines) < 2:
            continue
        m = re.match(r"(\d+):(\d+):(\d+),(\d+)\s*-->\s*(\d+):(\d+):(\d+),(\d+)", lines[1])
        if not m:
            continue
        g = list(map(int, m.groups()))
        s = g[0] * 3600 + g[1] * 60 + g[2] + g[3] / 1000
        e = g[4] * 3600 + g[5] * 60 + g[6] + g[7] / 1000
        cues.append((s, e, " ".join(lines[2:])))
    return cues


def build(srt_path, geo_path, audio_end):
    C = parse_srt(srt_path)

    def c(i):
        return C[i - 1][0]

    geo = maps.load_geo(geo_path)
    scenes = []

    def S(start_cue, **kw):
        sc = Scene(c(start_cue) if start_cue > 1 else 0.0, None, **kw)
        scenes.append(sc)
        return sc

    def land(sc, v, t, dur=1.5):
        ol, fl = maps.land_layers(v, geo, seed=3)
        sc.add(ol, t, dur)
        sc.add(fl, t + dur * 0.6, dur * 0.8)

    def region(sc, v, names, color, t, dur=1.0, filt=None, outline=True):
        ol, fl = maps.region_layers(v, geo, names, color, seed=len(names) * 7, extra_mask=filt, outline=outline)
        if fl is not None:
            sc.add(fl, t, dur)
        if ol is not None:
            sc.add(ol, t, dur * 0.8)

    def mlabel(sc, v, text, lon, lat, t, size=46, color=INK):
        x, y = v.p(lon, lat)
        return label(sc, text, t, x, y, size=size, color=color)

    def city(sc, v, name, t, color=RED, text=None, dx=0, dy=-38, size=36):
        ring_l, fill_l, (x, y) = maps.city_dot(v, name, color=color)
        sc.add(fill_l, t, 0.3)
        sc.add(ring_l, t, 0.3)
        if text:
            label(sc, text, t + 0.2, x + dx, y + dy, size=size, color=INK, fname="marker")
        return x, y

    def marrow(sc, v, lonlats, t, color=RED, width=18, dur=1.0):
        path_arrow(sc, [v.p(*ll) for ll in lonlats], t, color=color, width=width, dur=dur)

    # ============================== COLD OPEN ==============================
    sc = S(1)
    title(sc, "November 1918", 0.3, size=96)
    sprite(sc, "forest", c(2) - 0.3, 1400, 360, h=430)
    label(sc, "Compiègne, France", c(2) + 1.0, 1440, 640, size=50, color=RED)
    sprite(sc, "carriage", c(3) - 0.2, 900, 740, w=860, h=430, dur=2.4)
    sprite(sc, "signing", c(3) + 2.2, 1620, 860, h=300)
    sprite(sc, "helmet", c(4), 270, 420, h=210)
    label(sc, "Germany *lost*", c(4) + 1.0, 280, 590, size=58, color=INK)

    sc = S(5)
    big(sc, "1940", c(5) + 0.1, 400, 230, size=170)
    label(sc, "+22 years", c(5) + 1.4, 400, 380, size=60, color=BLUE)
    car = sprite(sc, "carriage", c(6) - 0.3, 1220, 440, w=820, h=420, dur=2.0)
    label(sc, "the same carriage", c(6) + 1.6, 1220, 110, size=54, color=RED)
    ring(sc, 1220, 735, 440, 55, c(6) + 3.0)
    label(sc, "the same spot!", c(6) + 3.4, 1220, 830, size=54, color=RED)
    flag(sc, "FR", c(7) - 0.2, 420, 690, w=300)
    label(sc, "France signs", c(7) + 0.9, 420, 930, size=56, color=BLUE)

    sc = S(8, zoom=(1.0, 1.05), focus=(620, 520))
    v = maps.MapView(-11, 40, 35, 62, 40, 130, 1180, 900)
    land(sc, v, c(8) - 0.2, 1.6)
    title(sc, "1918 → 1940", c(8), size=78)
    cx, cy = v.p(9, 49.5)
    rx = (v.p(23, 49.5)[0] - v.p(-3, 49.5)[0]) / 2
    ry = (v.p(9, 44.0)[1] - v.p(9, 56.5)[1]) / 2
    ring(sc, cx, cy, rx, ry, c(8) + 2.6, width=11, dur=1.0)
    label(sc, "Hitler's Europe", c(8) + 3.4, cx, cy - ry - 40, size=56, color=RED)
    big(sc, "1945", c(9), 1560, 230, size=150)
    sprite(sc, "bunker", c(10) - 0.2, 1560, 540, h=300)
    sprite(sc, "ruins", c(10) + 1.4, 1560, 860, h=250)

    sc = S(11)
    label(sc, "When did Hitler *lose* the war?", c(11) + 0.2, 960, 200, size=104, color=INK, max_w=1600)
    big(sc, "1945", c(12) - 0.2, 600, 520, size=150, bursts=False)
    xmark(sc, 600, 520, 110, c(12) + 0.5)
    label(sc, "much earlier!", c(13), 1360, 520, size=80, color=RED)
    arrow(sc, (1130, 560), (800, 600), c(13) + 0.6, width=10, bend=-0.25)
    label(sc, "MAIN QUEST:", c(14), 640, 760, size=66, color=RED)
    label(sc, "find the exact day", c(14) + 0.8, 640, 860, size=82, color=INK)
    calendar(sc, c(15) - 0.3, 1340, 830, "???", "?", "19??", w=230)
    sprite(sc, "magnifier", c(15) + 0.9, 1640, 830, h=300)

    # ============================== QUEST MAP ==============================
    sc = S(16)
    title(sc, "5 questions", c(16), size=84)
    nodes = [(270, 640), (580, 440), (930, 650), (1270, 440), (1620, 640)]
    level_map(sc, c(16) + 0.6, nodes,
              ["a banned army?", "nobody stopped him?", "France in 6 weeks?", "Britain?", "the USSR?"],
              ["tank", "handshake", "eiffel", "spitfire", "kremlin"],
              [c(17), c(19), c(20), c(21), c(22)])
    label(sc, "3 CLUES", c(23), 520, 960, size=70, color=RED)
    key_slots(sc, c(23) + 0.4, 960, [800, 1000, 1200], size=110)
    label(sc, "= THE DAY", c(24) + 0.6, 1480, 960, size=70, color=INK)

    # ============================== QUEST 1 ==============================
    sc = S(25)
    quest_card(sc, c(25), 1, "How do you build an army you're *not allowed* to have?")

    sc = S(27)
    title(sc, "Treaty of Versailles", c(27), size=86)
    sprite(sc, "treaty", c(27) + 0.6, 400, 600, h=560)
    big(sc, "*100,000* _men_", c(28), 1300, 260, size=120)
    sprite(sc, "soldiers", c(28) + 1.0, 1300, 440, h=170, dur=1.0)
    for i, (k, x, cc) in enumerate([("tank", 950, 29), ("plane", 1300, 30), ("submarine", 1650, 31)]):
        sprite(sc, k, c(28) + 1.6 + 0.35 * i, x, 760, w=300, dur=0.9)
        xmark(sc, x, 760, 120, c(cc) - 0.05, dur=0.35)

    sc = S(32)
    title(sc, "War guilt + reparations", c(32), size=78)
    sprite(sc, "money", c(32) + 0.7, 520, 600, h=470)
    sprite(sc, "sad_crowd", c(33) - 0.2, 1400, 560, h=480)
    label(sc, "humiliated", c(33) + 1.4, 1400, 900, size=74, color=RED)

    sc = S(34)
    sprite(sc, "hospital", c(34), 680, 560, w=900, dur=2.2)
    label(sc, "a corporal, aged 29", c(34) + 1.3, 1480, 280, size=56, color=BLUE)
    label(sc, "temporarily blinded by gas", c(35) + 1.6, 1480, 420, size=48, color=RED, max_w=620)
    title(sc, "Adolf Hitler", c(36) - 0.1, x=1480, y=780, anchor="mm", size=100)

    sc = S(37)
    title(sc, "January 1933", c(37), size=88)
    sprite(sc, "dictator", c(37) + 0.5, 520, 620, h=700, dur=2.4)
    label(sc, "Chancellor", c(37) + 2.6, 1350, 300, size=76, color=BLUE)
    for i, (x, col) in enumerate([(1120, (200, 60, 60)), (1350, (60, 140, 70)), (1580, (60, 100, 190))]):
        shape(sc, [wb.rect_poly(x - 80, 480, x + 80, 590)], c(38) + 0.2 * i, col, dur=0.6)
    label(sc, "rival parties", c(38) + 0.5, 1350, 650, size=44, color=INK, fname="hand")
    for i, x in enumerate([1120, 1350, 1580]):
        xmark(sc, x, 535, 70, c(38) + 1.3 + 0.3 * i, dur=0.3)
    stamp(sc, c(39) + 0.4, "DICTATORSHIP", 1350, 860, size=84)

    sc = S(40)
    sprite(sc, "treaty", c(40), 360, 480, h=460)
    zigzag_tear(sc, 300, 260, 420, 700, c(40) + 1.4)
    label(sc, "step by step", c(40) + 2.2, 360, 780, size=52, color=RED)
    big(sc, "1935", c(41), 1000, 150, size=110)
    sprite(sc, "marching", c(41) + 0.5, 1000, 420, w=600, dur=1.8)
    label(sc, "conscription", c(41) + 2.0, 1000, 610, size=48, color=BLUE)
    sprite(sc, "warplanes", c(41) + 2.3, 1600, 380, w=440, dur=1.5)
    label(sc, "Luftwaffe", c(41) + 3.6, 1600, 590, size=56, color=RED)
    flag(sc, "UK", c(42) - 0.1, 840, 860, w=190, dur=1.0)
    flag(sc, "FR", c(42) + 0.4, 1110, 860, w=190, dur=1.0)
    label(sc, "protested...", c(42) + 1.2, 980, 1010, size=46, color=BLUE)
    label(sc, "...and did *nothing*", c(43), 1580, 880, size=60, color=INK)

    sc = S(44, zoom=(1.0, 1.035))
    v = maps.MapView(-5, 17, 45.5, 55.5, 40, 150, 1250, 900)
    title(sc, "March 1936: the biggest bet", c(44), size=74)
    sprite(sc, "dice", c(44) + 1.4, 1720, 130, h=160, dur=0.8)
    land(sc, v, c(44) + 0.3, 1.4)
    region(sc, v, ["France"], LIGHTBLUE, c(44) + 1.8)
    mlabel(sc, v, "FRANCE", 2.3, 47.2, c(44) + 2.3, color=BLUE)
    mlabel(sc, v, "GERMANY", 11.6, 51.4, c(44) + 2.5)
    region(sc, v, ["Germany"], PALE_RED, c(45) + 0.3, filt=maps.west_of_rhine_filter(), outline=False)
    marrow(sc, v, [(11.0, 50.6), (9.2, 50.4), (7.3, 50.3)], c(45) + 1.0, width=16)
    label(sc, "Rhineland:", c(46), 1590, 330, size=60, color=RED)
    label(sc, "no soldiers allowed", c(46) + 0.7, 1590, 420, size=46, color=INK, max_w=520)
    sprite(sc, "french_soldier", c(47), 1590, 740, h=380)
    label(sc, "far _stronger_", c(47) + 1.2, 1590, 980, size=56, color=INK)
    dashed_arrow(sc, v.p(3.5, 48.3), v.p(6.6, 49.9), c(48) + 0.2, bend=0.25)
    mlabel(sc, v, "?", 4.4, 49.6, c(48) + 1.0, size=110, color=BLUE)

    sc = S(49)
    sprite(sc, "hourglass", c(49), 330, 500, h=520)
    big(sc, "48 hours", c(49) + 1.6, 330, 900, size=84, bursts=False)
    quote(sc, "The forty-eight hours after the march into the Rhineland were the most nerve-racking in my life.",
          c(49) + 0.3, 1200, 330, size=56, max_w=1100, dur=6.0)
    quote(sc, "If the French had then marched in, we would have had to withdraw with our tails between our legs.",
          c(51), 1200, 700, size=56, max_w=1100, dur=5.0)
    label(sc, "— Hitler, as recalled by his interpreter", c(52) + 1.2, 1200, 960, size=34, color=GREY,
          fname="hand")

    sc = S(53)
    sprite(sc, "french_soldier", c(53) - 0.2, 330, 520, h=520)
    label(sc, "France didn't march.", c(53) + 0.3, 330, 900, size=54, color=RED)
    answer_card_x = 1180
    big(sc, "ANSWER", c(54), answer_card_x, 200, size=90, color=GREEN)
    label(sc, "He bet nobody would stop him — and *won*.", c(54) + 0.8, answer_card_x, 430, size=72,
          color=INK, max_w=1050)
    sprite(sc, "dice", c(56), 900, 790, h=220)
    label(sc, "bold gambles pay off", c(56) + 1.2, 1430, 790, size=64, color=RED)

    sc = S(57)
    sprite(sc, "key", c(57) - 0.1, 500, 540, h=520, dur=1.5)
    big(sc, "CLUE #1", c(57) + 0.2, 1290, 320, size=110)
    label(sc, "Every gamble pays off", c(58), 1290, 520, size=80, color=INK)
    key_slots(sc, c(58) + 0.3, 800, [1090, 1290, 1490], fill_at={0: c(58) + 0.9})

    sc = S(59)
    label(sc, "Why were Britain & France *letting him*?", c(59) + 0.1, 960, 260, size=92, color=INK, max_w=1500)
    flag(sc, "UK", c(60), 640, 700, w=300)
    flag(sc, "FR", c(60) + 0.5, 1140, 700, w=300)
    big(sc, "?", c(60) + 1.3, 1620, 700, size=260, color=BLUE)

    # ============================== QUEST 2 ==============================
    sc = S(61)
    quest_card(sc, c(61), 2, "Why did *nobody* stop him?")

    sc = S(63)
    title(sc, "The shadow of WWI", c(63), size=84)
    sprite(sc, "graves", c(63) + 0.4, 540, 560, w=800, dur=2.2)
    big(sc, "*millions* _killed_", c(64), 1400, 300, size=100)
    sprite(sc, "family", c(65), 1400, 660, h=400)
    label(sc, "\"Never again!\"", c(66) + 0.3, 540, 960, size=80, color=RED)

    sc = S(67)
    sprite(sc, "dictator", c(67), 1470, 610, h=620, flip=True)
    sprite(sc, "chamberlain", c(67) + 1.2, 450, 610, h=620)
    dashed_arrow(sc, (700, 470), (1230, 470), c(67) + 2.6, color=BLUE, bend=-0.2)
    label(sc, "just enough to keep the peace", c(67) + 3.0, 960, 360, size=40, color=BLUE, fname="hand")
    big(sc, "APPEASEMENT", c(68), 960, 150, size=118)

    sc = S(69, zoom=(1.0, 1.035))
    v = maps.MapView(3, 25, 45, 55.5, 40, 120, 1300, 920)
    land(sc, v, c(69) - 0.2, 1.3)
    mlabel(sc, v, "GERMANY", 9.8, 51.6, c(69) + 0.9)
    region(sc, v, ["Austria"], PALE_RED, c(69) + 1.5)
    marrow(sc, v, [(11.2, 49.6), (13.2, 48.6), (14.6, 47.7)], c(69) + 1.9, width=14, dur=0.8)
    mlabel(sc, v, "AUSTRIA", 14.0, 46.6, c(69) + 2.3, size=40, color=RED)
    label(sc, "March 1938", c(69) + 0.3, 1620, 200, size=60, color=RED)
    label(sc, "no war", c(70) - 0.1, 1620, 300, size=56, color=GREEN)
    region(sc, v, ["Czechia", "Slovakia"], PALE_GREEN, c(71))
    region(sc, v, ["Czechia"], ORANGE, c(71) + 1.0, filt=maps.border_band_filter(16, lon_max=17.4), outline=False)
    mlabel(sc, v, "SUDETENLAND", 14.6, 51.2, c(72) + 0.2, size=36, color=ORANGE)
    mlabel(sc, v, "CZECHOSLOVAKIA", 17.6, 49.0, c(72) + 1.4, size=30)
    city(sc, v, "Munich", c(73), text="MUNICH")
    sprite(sc, "conference", c(73) + 0.6, 1620, 520, w=420)
    label(sc, "Sept 1938", c(73) + 1.6, 1620, 700, size=50, color=BLUE)
    label(sc, "UK + France: hand it over", c(74), 1620, 810, size=40, color=INK, max_w=520, fname="hand")
    label(sc, "Czechoslovakia wasn't even in the room!", c(75), 1620, 960, size=38, color=RED, max_w=520,
          fname="hand")

    sc = S(76)
    sprite(sc, "chamberlain", c(76), 480, 600, h=660)
    sprite(sc, "crowd_cheer", c(77) - 0.2, 1360, 820, w=760)
    bubble(sc, c(77) + 0.6, 980, 150, 1720, 470, "\"Peace for our time!\"", tail=(760, 420), size=72)

    sc = S(78)
    big(sc, "< 6 months", c(78), 520, 200, size=120)
    sprite(sc, "torn_paper", c(79) - 0.2, 520, 580, h=420)
    label(sc, "promises meant nothing", c(80), 520, 900, size=52, color=RED)
    label(sc, "March 1939: the rest of Czechoslovakia", c(79) + 0.6, 1380, 260, size=48, color=INK, max_w=760)
    target(sc, c(81), 1380, 690, r=180)
    label(sc, "POLAND", c(81) + 0.8, 1380, 690, size=66, color=INK)
    label(sc, "next target", c(81) + 1.6, 1380, 930, size=56, color=RED)

    sc = S(82)
    label(sc, "a move nobody expected", c(82) + 0.3, 960, 110, size=64, color=RED)
    label(sc, "August 1939", c(83) + 0.3, 960, 230, size=56, color=BLUE)
    sprite(sc, "dictator", c(83) + 0.2, 330, 560, h=540)
    sprite(sc, "stalin", c(84) - 0.3, 1590, 560, h=540)
    sprite(sc, "handshake", c(84) + 1.3, 960, 500, h=300)
    label(sc, "in public: no attacks", c(85), 960, 760, size=48, color=INK)
    sprite(sc, "envelope", c(86) - 0.2, 700, 930, h=180, dur=1.0)
    label(sc, "in secret: _split Eastern Europe_", c(86) + 0.6, 1180, 930, size=46, color=INK)

    sc = S(87, zoom=(1.0, 1.035))
    v = maps.MapView(8, 33, 46, 57, 40, 110, 1300, 930)
    land(sc, v, c(87) - 0.2, 1.2)
    mlabel(sc, v, "GERMANY", 11.2, 51.2, c(87) + 0.6)
    mlabel(sc, v, "POLAND", 19.6, 51.3, c(87) + 0.8, color=BLUE)
    city(sc, v, "Warsaw", c(87) + 1.0)
    label(sc, "1 Sept 1939", c(87), 1600, 160, size=60, color=RED)
    marrow(sc, v, [(14.6, 52.6), (17.5, 52.5), (20.4, 52.3)], c(87) + 1.2, width=16)
    marrow(sc, v, [(19.5, 54.6), (20.6, 53.6), (20.9, 52.6)], c(87) + 1.6, width=16)
    marrow(sc, v, [(17.0, 50.4), (19.0, 51.0), (20.6, 51.9)], c(87) + 2.0, width=16)
    flag(sc, "UK", c(88) - 0.1, 1520, 320, w=170, dur=0.9)
    flag(sc, "FR", c(88) + 0.3, 1740, 320, w=170, dur=0.9)
    label(sc, "declare war!", c(88) + 1.0, 1630, 460, size=54, color=RED)
    mlabel(sc, v, "USSR", 29.5, 54.8, c(89), size=56, color=DARK_RED)
    marrow(sc, v, [(28.5, 53.1), (26.0, 52.9), (23.6, 52.6)], c(89) + 0.6, color=DARK_RED, width=16)
    marrow(sc, v, [(28.8, 50.3), (26.5, 50.4), (24.2, 50.7)], c(89) + 1.0, color=DARK_RED, width=16)
    mlabel(sc, v, "17 Sept", 29.0, 51.6, c(89) + 1.5, size=38, color=DARK_RED)
    sprite(sc, "burning", c(90) - 0.2, 1630, 680, h=260)
    label(sc, "within weeks: Poland *gone*", c(90) + 0.6, 1630, 920, size=46, color=INK, max_w=520)

    sc = S(91)
    answer_card(sc, c(91), "They feared another world war *more* than they feared Hitler.", y=440)
    label(sc, "...and then it was too late.", c(93) + 0.2, 960, 830, size=64, color=RED)

    sc = S(94)
    flag(sc, "FR", c(94) - 0.2, 480, 170, w=160, dur=0.8)
    sprite(sc, "soldiers", c(94) + 0.3, 480, 520, w=620)
    label(sc, "one of the _largest armies_", c(94) + 1.4, 480, 820, size=48, color=INK)
    flag(sc, "UK", c(95) - 0.2, 1440, 170, w=160, dur=0.8)
    sprite(sc, "battleship", c(95) + 0.3, 1440, 520, w=760)
    label(sc, "the _largest navy_", c(95) + 1.4, 1440, 820, size=48, color=INK)
    sprite(sc, "dice", c(96), 960, 520, h=170, dur=0.8)
    label(sc, "gambled too far?", c(96) + 0.6, 960, 980, size=66, color=RED)

    # ============================== QUEST 3 ==============================
    sc = S(97)
    quest_card(sc, c(97), 3, "How did France fall in just *six weeks*?")

    sc = S(100)
    big(sc, "8 months", c(100), 450, 220, size=120)
    sprite(sc, "trench", c(100) + 0.8, 1260, 540, w=880, dur=2.2)
    label(sc, "waiting...", c(101) + 0.4, 1260, 900, size=60, color=BLUE)
    title(sc, "PHONEY WAR", c(102), x=450, y=520, anchor="mm", size=96)

    sc = S(103)
    label(sc, "France felt _safe_", c(103), 520, 130, size=70, color=INK)
    sprite(sc, "fortress", c(104), 520, 500, w=760, dur=2.0)
    label(sc, "MAGINOT LINE", c(104) + 2.0, 520, 820, size=66, color=RED)
    label(sc, "France + Britain: _more tanks_", c(106), 1380, 230, size=50, color=INK, max_w=820)
    for i, x in enumerate([1150, 1380, 1610]):
        sprite(sc, "tank", c(106) + 1.0 + 0.3 * i, x, 400, w=200, dur=0.7)
    label(sc, "Germany", c(106) + 2.0, 1380, 560, size=50, color=RED)
    for i, x in enumerate([1270, 1490]):
        sprite(sc, "tank", c(106) + 2.3 + 0.3 * i, x, 690, w=200, dur=0.7, flip=True)
    label(sc, "on paper, they should have won", c(107), 1380, 900, size=50, color=BLUE)

    sc = S(108, zoom=(1.0, 1.05), focus=(980, 500))
    v = maps.MapView(-3.2, 10.8, 47.4, 53.7, 30, 40, 1860, 1010)
    land(sc, v, c(108) - 0.3, 1.3)
    region(sc, v, ["France"], LIGHTBLUE, c(108) + 0.4, dur=0.9)
    mlabel(sc, v, "FRANCE", 1.6, 48.1, c(108) + 0.8, color=BLUE, size=54)
    mlabel(sc, v, "GERMANY", 9.2, 51.6, c(108) + 1.0, size=54)
    mlabel(sc, v, "BRITAIN", -1.6, 52.5, c(108) + 1.2, size=44)
    maginot = [(5.85, 49.5), (6.6, 49.42), (7.5, 49.12), (8.1, 48.95), (7.8, 48.4), (7.6, 47.7)]
    sc.add(wb.stroke_layer([v.pts(maginot)], GREY, 16, seed=91), c(108) + 0.9, 0.9)
    mlabel(sc, v, "Maginot", 9.0, 48.1, c(108) + 1.6, size=40, color=GREY)
    xx, yy = v.p(7.3, 48.9)
    xmark(sc, xx, yy, 60, c(108) + 2.3)
    marrow(sc, v, [(9.6, 50.6), (7.8, 50.9), (6.0, 50.7)], c(109), width=14, dur=0.8)
    label(sc, "10 May 1940", c(110), 330, 120, size=64, color=RED)
    marrow(sc, v, [(7.4, 52.3), (6.3, 52.2), (5.1, 52.1)], c(110) + 1.2, width=18)
    marrow(sc, v, [(7.0, 51.2), (5.9, 51.0), (4.6, 50.8)], c(110) + 1.6, width=18)
    marrow(sc, v, [(2.4, 49.6), (3.0, 50.2), (3.9, 50.75)], c(111) + 0.2, color=BLUE, width=16)
    marrow(sc, v, [(3.8, 49.3), (4.4, 49.9), (4.8, 50.4)], c(111) + 0.6, color=BLUE, width=16)
    for i, (lo, la) in enumerate([(5.4, 50.05), (5.95, 49.85), (6.15, 50.25)]):
        x, y = v.p(lo, la)
        sprite(sc, "forest", c(113) + 0.6 + 0.25 * i, x, y, h=90, dur=0.6)
    mlabel(sc, v, "ARDENNES", 5.8, 50.6, c(113) + 1.5, size=40, color=GREEN)
    marrow(sc, v, [(7.3, 50.0), (6.1, 49.85), (5.0, 49.72)], c(115), width=24, dur=1.2)
    city(sc, v, "Sedan", c(115) + 1.2, text="SEDAN", dy=40)
    marrow(sc, v, [(4.8, 49.8), (3.5, 49.95), (1.95, 50.12)], c(116) + 0.4, width=24, dur=1.4)
    x, y = v.p(1.6, 50.1)
    sc.add(wb.burst_layer(x, y, 50, 40, length=34, seed=92), c(117) + 1.2, 0.4)
    mlabel(sc, v, "20 May: the Channel!", -0.6, 49.75, c(117) + 0.6, size=50, color=RED)
    cx, cy = v.p(3.4, 50.85)
    ring(sc, cx, cy, 190, 95, c(119), width=10)
    mlabel(sc, v, "CUT OFF", 3.2, 51.85, c(119) + 0.7, size=50, color=RED)

    sc = S(120)
    lightning(sc, c(120), 360, 330, h=380)
    sprite(sc, "tank_column", c(120) + 0.2, 1000, 760, w=1100, dur=2.2)
    big(sc, "BLITZKRIEG", c(120) + 2.4, 1100, 260, size=150)
    label(sc, "= lightning war", c(121), 1500, 440, size=66, color=BLUE)

    sc = S(122)
    sprite(sc, "churchill", c(122) + 0.3, 540, 600, h=760, dur=2.4)
    label(sc, "10 May 1940: new Prime Minister", c(123), 1350, 200, size=48, color=BLUE, max_w=820)
    title(sc, "Winston Churchill", c(123) + 0.9, x=1350, y=360, anchor="mm", size=88)
    ring(sc, 540, 600, 320, 420, c(124), width=9)
    label(sc, "the problem Hitler *can't solve*", c(125) + 0.3, 1350, 700, size=62, color=INK, max_w=760)

    sc = S(126)
    sprite(sc, "eiffel", c(126), 280, 560, h=660)
    label(sc, "mid-June: Paris falls", c(126) + 0.9, 280, 960, size=44, color=RED)
    big(sc, "22 June 1940", c(127) + 0.9, 1150, 160, size=104)
    sprite(sc, "carriage", c(128) - 0.2, 1150, 480, w=840, h=400, dur=2.0)
    label(sc, "same carriage, same spot", c(128) + 2.3, 1150, 770, size=50, color=BLUE)
    flag(sc, "FR", c(129), 1000, 940, w=150, dur=0.8, pole=False)
    sprite(sc, "signing", c(129) + 0.8, 1330, 930, h=200, dur=1.0)

    sc = S(130)
    calendar(sc, c(130) - 0.2, 500, 560, "JUNE", "22", "1940", w=420)
    big(sc, "CLUE #2", c(130) + 0.6, 1300, 300, size=110)
    label(sc, "22 June", c(131), 1300, 500, size=96, color=INK)
    key_slots(sc, c(131) + 0.4, 790, [1100, 1300, 1500], filled_now=(0,), fill_at={1: c(132)})

    sc = S(133)
    answer_card(sc, c(133), "Germany struck where France *didn't expect* — at lightning speed.", y=470)

    sc = S(135, zoom=(1.0, 1.035))
    v = maps.MapView(-11, 22, 41, 61, 40, 120, 1240, 900)
    land(sc, v, c(135) - 0.2, 1.2)
    region(sc, v, ["France", "Belgium", "Netherlands", "Luxembourg", "Germany", "Austria", "Czechia", "Denmark",
                   "Norway"], PALE_RED, c(135) + 1.0, dur=1.4)
    mlabel(sc, v, "Hitler", 8.0, 49.8, c(135) + 2.0, size=60, color=RED)
    region(sc, v, ["United Kingdom"], LIGHTBLUE, c(136))
    label(sc, "only Britain left", c(136) + 0.4, 1600, 230, size=60, color=BLUE)
    bubble(sc, c(137) + 0.4, 1330, 360, 1870, 600, "peace within weeks?", tail=v.p(11, 52), thought=True, size=56)
    big(sc, "It didn't.", c(138), 1600, 790, size=90, bursts=False)
    big(sc, "WHY?", c(139) - 0.1, 1600, 950, size=96, color=BLUE)

    # ============================== QUEST 4 ==============================
    sc = S(140)
    quest_card(sc, c(140), 4, "Why didn't *Britain* give up?")

    sc = S(143)
    sprite(sc, "beach", c(143) + 0.1, 620, 520, w=1000, dur=2.4)
    title(sc, "Dunkirk", c(143) + 0.4, size=92)
    label(sc, "hundreds of thousands _trapped_", c(145) + 0.3, 620, 920, size=52, color=INK, max_w=980)
    sprite(sc, "tank", c(146) - 0.4, 1480, 380, w=330, dur=1.0)
    stop_sign(sc, c(146) + 1.6, 1740, 230, r=85)
    label(sc, "24 May", c(146) + 0.4, 1480, 560, size=56, color=RED)
    label(sc, "HALT ORDER", c(147) + 0.1, 1520, 700, size=70, color=INK)
    big(sc, "?", c(148) + 0.3, 1520, 900, size=170, color=BLUE, bursts=False)
    label(sc, "historians still argue", c(148) + 1.0, 1520, 1020, size=36, color=BLUE, fname="hand")

    sc = S(149)
    sprite(sc, "boats", c(149), 560, 520, w=900, dur=2.2)
    dashed_arrow(sc, (230, 170), (900, 170), c(150), color=BLUE, bend=-0.12)
    dashed_arrow(sc, (900, 900), (230, 900), c(150) + 0.6, color=BLUE, bend=-0.12)
    label(sc, "again and again", c(150) + 1.0, 565, 90, size=46, color=BLUE)
    big(sc, "338,000", c(151) + 1.4, 1450, 330, size=150)
    label(sc, "soldiers saved", c(152) + 1.2, 1450, 480, size=56, color=BLUE)
    label(sc, "lost the equipment", c(153), 1450, 640, size=48, color=INK)
    xmark(sc, 1780, 640, 34, c(153) + 0.9)
    label(sc, "kept the army", c(153) + 1.4, 1450, 760, size=48, color=INK)
    check(sc, 1760, 750, 40, c(153) + 2.1)

    sc = S(154)
    sprite(sc, "parliament", c(154), 1430, 640, w=800, dur=2.0)
    sprite(sc, "churchill", c(154) + 0.2, 430, 620, h=660, dur=2.0)
    quote(sc, "We shall fight on the beaches... we shall *never surrender*.", c(154) + 1.2, 1300, 180, size=60,
          max_w=1000, dur=3.2)

    sc = S(156)
    sprite(sc, "spitfire", c(156) + 0.2, 520, 640, w=720)
    label(sc, "first: control of the _air_", c(157) + 0.2, 960, 150, size=60, color=INK)
    sprite(sc, "bomber", c(158) + 0.5, 1450, 420, w=420, dur=1.2)
    sprite(sc, "bomber", c(158) + 1.3, 1690, 700, w=320, dur=1.0)
    big(sc, "BATTLE OF BRITAIN", c(160) + 0.1, 960, 960, size=96)

    sc = S(161)
    sprite(sc, "radar", c(161), 380, 580, h=720, dur=2.0)
    big(sc, "RADAR", c(161) + 1.6, 1150, 150, size=110)
    radar_waves_t = c(162)
    from kit import radar_waves
    radar_waves(sc, radar_waves_t, 430, 330, a0=-50, a1=30)
    sprite(sc, "bomber", c(162) + 1.2, 1600, 300, w=360, dur=1.0)
    sprite(sc, "spitfire", c(163), 1260, 720, w=460, dur=1.2)
    arrow(sc, (640, 480), (1060, 690), c(163) + 1.3, color=BLUE, width=9, bend=-0.2)
    arrow(sc, (1380, 610), (1540, 400), c(164), color=BLUE, width=9, bend=0.15)
    label(sc, "as if they were _waiting_", c(164) + 1.4, 1450, 990, size=48, color=INK)

    sc = S(165)
    title(sc, "September 1940", c(165), size=80)
    sprite(sc, "london_fire", c(165) + 0.3, 640, 580, w=900, dur=2.2)
    label(sc, "bombing _London_", c(165) + 2.4, 640, 960, size=60, color=INK)
    label(sc, "breathing space for the RAF", c(167) + 0.3, 1500, 560, size=56, color=GREEN, max_w=620)
    check(sc, 1500, 760, 60, c(167) + 1.6)

    sc = S(168)
    calendar(sc, c(168), 460, 540, "SEPT", "17", "1940", w=400)
    label(sc, "Invasion of Britain:", c(168) + 1.6, 1300, 300, size=66, color=INK)
    stamp(sc, c(168) + 3.2, "POSTPONED", 1300, 540, size=100)
    label(sc, "It never came.", c(169), 1300, 820, size=74, color=BLUE)

    sc = S(170)
    sprite(sc, "pilot", c(170), 470, 560, h=660)
    quote(sc, "Never in the field of human conflict was so much owed by so many to *so few*.", c(170) + 1.3, 1280,
          480, size=66, max_w=1000, dur=4.2)
    label(sc, "— Churchill, August 1940", c(171) + 2.6, 1280, 830, size=36, color=GREY, fname="hand")

    sc = S(172)
    big(sc, "ANSWER", c(172), 960, 150, size=96, color=GREEN)
    sprite(sc, "boats", c(172) + 1.4, 470, 560, w=440, dur=1.2)
    label(sc, "Dunkirk", c(172) + 2.0, 470, 820, size=64, color=INK)
    sprite(sc, "radar", c(173) + 0.2, 960, 560, h=420, dur=1.2)
    label(sc, "Radar", c(173) + 0.8, 960, 820, size=64, color=INK)
    sprite(sc, "churchill", c(173) + 2.2, 1450, 560, h=440, dur=1.2)
    label(sc, "Churchill", c(173) + 2.8, 1450, 820, size=64, color=INK)

    sc = S(174)
    sprite(sc, "dice", c(174), 470, 440, h=380)
    xmark(sc, 470, 440, 170, c(174) + 1.9)
    big(sc, "CLUE #3", c(175) - 0.3, 1300, 220, size=110)
    label(sc, "the first *lost* gamble", c(175) + 0.4, 1300, 400, size=76, color=INK)
    key_slots(sc, c(175) + 0.5, 600, [1100, 1300, 1500], filled_now=(0, 1), fill_at={2: c(175) + 1.3})
    label(sc, "stuck in a war he couldn't end", c(176), 470, 780, size=48, color=INK, max_w=760)
    sprite(sc, "chips", c(177) + 0.4, 1120, 880, h=220, dur=1.0)
    label(sc, "he *raised the stakes*", c(178), 1540, 880, size=62, color=INK)

    # ============================== QUEST 5 ==============================
    sc = S(179)
    quest_card(sc, c(179), 5, "Why attack the Soviet Union while Britain was *still fighting*?")

    sc = S(181)
    sprite(sc, "hitler_map", c(181), 540, 560, h=720, dur=2.4)
    big(sc, "LEBENSRAUM", c(182) + 1.4, 1380, 240, size=100)
    label(sc, "\"living space\" in the East", c(182) + 2.2, 1380, 380, size=52, color=BLUE)
    arrow(sc, (1130, 480), (1650, 480), c(182) + 2.8, width=12, bend=0.0)
    label(sc, "a war of destruction in the East — Nazi ideology", c(183) + 0.2, 1380, 620, size=42,
          color=INK, max_w=760, fname="hand")
    sprite(sc, "handshake", c(184), 1260, 860, h=220, dur=1.0)
    zigzag_tear(sc, 1250, 760, 1270, 960, c(184) + 1.1)
    label(sc, "only temporary", c(184) + 1.5, 1620, 860, size=52, color=RED)

    sc = S(185)
    title(sc, "The cold calculation", c(185), size=84)
    flag(sc, "UK", c(186), 380, 600, w=280)
    flag(sc, "SU", c(187) - 0.3, 1060, 420, w=240, dur=1.0)
    flag(sc, "US", c(187) + 1.2, 1060, 800, w=240, dur=1.2)
    dashed_arrow(sc, (560, 560), (900, 440), c(186) + 1.6, color=BLUE, bend=-0.15)
    dashed_arrow(sc, (560, 640), (900, 790), c(187) + 2.4, color=BLUE, bend=0.15)
    label(sc, "hope", c(186) + 2.2, 720, 600, size=46, color=BLUE)
    xmark(sc, 1060, 420, 120, c(188) + 0.9)
    label(sc, "crush the USSR → Britain loses all hope", c(188) + 1.8, 1560, 600, size=50, color=RED,
          max_w=560)

    sc = S(189)
    label(sc, "Poland", c(189) + 0.2, 380, 280, size=70, color=INK)
    check(sc, 580, 270, 46, c(189) + 0.8)
    label(sc, "France", c(189) + 1.2, 380, 420, size=70, color=INK)
    check(sc, 580, 410, 46, c(189) + 1.8)
    label(sc, "USSR?", c(190), 380, 580, size=70, color=RED)
    big(sc, "A FEW MONTHS", c(191) - 0.1, 1260, 330, size=110)
    snowflake(sc, c(192), 1260, 640, r=110)
    label(sc, "...before winter", c(192) + 0.4, 1260, 870, size=70, color=BLUE)

    sc = S(193)
    calendar(sc, c(193) - 0.1, 470, 500, "JUNE", "22", "1940", w=400, cross_year_t=c(193) + 2.4, new_year="1941")
    label(sc, "exactly *one year* later", c(194) + 0.2, 560, 900, size=58, color=INK)
    sprite(sc, "key", c(194) + 1.4, 960, 330, h=150, dur=0.6)
    label(sc, "clue #2!", c(194) + 1.8, 960, 450, size=40, color=RED)
    big(sc, "3,000,000+", c(195) + 0.6, 1440, 300, size=118)
    label(sc, "German soldiers", c(195) + 1.8, 1440, 450, size=56, color=BLUE)
    title(sc, "Operation Barbarossa", c(196) - 0.1, x=1400, y=720, anchor="mm", size=84)

    sc = S(197, zoom=(1.0, 1.06), focus=(1000, 500))
    v = maps.MapView(8, 48, 43, 63, 30, 40, 1860, 1010)
    land(sc, v, c(197) - 0.3, 1.2)
    region(sc, v, ["Russia", "Ukraine", "Belarus", "Lithuania", "Latvia", "Estonia", "Moldova"], PALE_YELLOW,
           c(197) + 0.4, dur=1.2)
    mlabel(sc, v, "USSR", 40.0, 58.0, c(197) + 0.9, size=90, color=DARK_RED)
    mlabel(sc, v, "GERMANY", 11.6, 51.6, c(197) + 0.9, size=48)
    city(sc, v, "Leningrad", c(197) + 1.0, text="Leningrad")
    city(sc, v, "Moscow", c(197) + 1.2, text="Moscow")
    city(sc, v, "Kyiv", c(197) + 1.4, text="Kyiv", dy=40)
    marrow(sc, v, [(21.5, 55.0), (25.5, 57.2), (29.6, 59.5)], c(197) + 1.6, width=22)
    marrow(sc, v, [(23.5, 52.6), (29.5, 54.4), (36.8, 55.6)], c(197) + 2.1, width=22)
    marrow(sc, v, [(23.6, 50.5), (27.0, 50.2), (30.2, 50.4)], c(197) + 2.6, width=22)
    for i, (lo, la) in enumerate([(26.6, 53.9), (31.5, 54.8)]):
        x, y = v.p(lo, la)
        ring(sc, x, y, 70, 45, c(198) + 0.3 + 0.5 * i, color=INK, width=7)
    mlabel(sc, v, "surrounded", 29.0, 53.0, c(198) + 1.2, size=34, color=INK)
    x, y = v.p(30.52, 50.45)
    ring(sc, x, y, 80, 60, c(199) + 0.4)
    mlabel(sc, v, "Sept: Kyiv falls", 30.5, 48.9, c(199) + 0.8, size=42, color=RED)
    note_bg(sc, c(200) - 0.2, 1340, 700, 1830, 1010)
    sprite(sc, "prisoners", c(200), 1585, 855, w=450, dur=1.2)

    sc = S(201)
    label(sc, "...but it didn't collapse", c(201), 960, 120, size=76, color=INK)
    big(sc, "ENORMOUS", c(202) - 0.1, 480, 360, size=110)
    for i, x in enumerate([1080, 1380, 1680]):
        sprite(sc, "soldiers", c(203) + 0.2 + 0.6 * i, x, 380, w=280, dur=0.7)
    label(sc, "another army... and another", c(203) + 2.0, 1380, 540, size=46, color=BLUE)
    sprite(sc, "factory_train", c(204), 760, 820, w=640)
    arrow(sc, (1150, 830), (1650, 830), c(204) + 1.4, width=14, bend=0.0)
    label(sc, "EAST", c(204) + 1.8, 1400, 760, size=56, color=RED)

    sc = S(205)
    sprite(sc, "mud_truck", c(205), 520, 500, w=760)
    label(sc, "rain + _mud_", c(205) + 1.2, 520, 860, size=66, color=INK)
    sprite(sc, "frozen", c(205) + 2.0, 1400, 560, h=640)
    for i, (x, y) in enumerate([(1060, 230), (1760, 200), (1780, 760), (1050, 760)]):
        snowflake(sc, c(205) + 2.4 + 0.2 * i, x, y, r=40)
    label(sc, "no winter clothing", c(206) + 0.6, 1400, 970, size=56, color=RED)

    sc = S(208)
    sprite(sc, "kremlin", c(208), 1500, 480, h=600)
    label(sc, "MOSCOW", c(208) + 1.2, 1500, 860, size=70, color=RED)
    arrow(sc, (200, 420), (1050, 420), c(208) + 0.6, width=16, bend=0.0)
    label(sc, "a few dozen km away", c(208) + 1.6, 620, 330, size=46, color=INK)
    big(sc, "5 Dec 1941", c(209) + 0.8, 560, 170, size=84, color=BLUE, bursts=False)
    sprite(sc, "ski_troops", c(209) + 1.0, 560, 700, w=660)
    arrow(sc, (1120, 980), (220, 980), c(209) + 2.6, color=BLUE, width=18, bend=0.0)
    label(sc, "the first German retreat", c(210) + 0.3, 1530, 990, size=46, color=BLUE)

    sc = S(211)
    label(sc, "six days later...", c(211), 960, 150, size=64, color=BLUE)
    flag(sc, "US", c(211) + 0.5, 960, 520, w=440, dur=1.4)
    label(sc, "Hitler declares war on the USA", c(211) + 2.0, 960, 880, size=60, color=RED)

    sc = S(212)
    answer_card(sc, c(212), "One more lightning victory... that *never came*.", y=360, size=78)
    for i, (k, x, tt) in enumerate([("UK", 640, c(214) + 0.4), ("SU", 960, c(215) - 0.1), ("US", 1280, c(215) + 0.9)]):
        flag(sc, k, tt, x, 690, w=220, dur=0.9, pole=False)
    label(sc, "all at once", c(215) + 1.8, 960, 900, size=72, color=RED)

    # ============================== FINALE ==============================
    sc = S(216)
    label(sc, "So — when did Hitler *lose* the war?", c(216), 960, 220, size=100, color=INK, max_w=1600)
    big(sc, "1945", c(217) + 0.2, 640, 600, size=130, bursts=False)
    xmark(sc, 640, 600, 120, c(217) + 1.4)
    big(sc, "Stalingrad", c(218), 1300, 600, size=100, bursts=False)
    xmark(sc, 1300, 600, 150, c(218) + 0.9)

    sc = S(219)
    title(sc, "Our 3 clues", c(219), size=84)
    for i, x in enumerate([380, 960, 1540]):
        sprite(sc, "key", c(219) + 0.4 + 0.3 * i, x, 330, h=170, dur=0.6)
    sprite(sc, "dice", c(220) + 0.2, 380, 590, h=190, dur=0.8)
    label(sc, "every gamble paid off", c(220) + 0.8, 380, 820, size=46, color=INK, max_w=480)
    calendar(sc, c(221) + 0.2, 960, 600, "JUNE", "22", "1940", w=210)
    label(sc, "his greatest triumph", c(221) + 1.4, 960, 820, size=46, color=INK, max_w=480)
    flag(sc, "UK", c(222) + 0.2, 1540, 600, w=230, dur=0.9)
    label(sc, "the first lost gamble", c(222) + 1.0, 1540, 820, size=46, color=INK, max_w=480)

    sc = S(223)
    label(sc, "...the biggest bet of all", c(223) + 1.6, 960, 110, size=64, color=INK)
    big(sc, "22 JUNE 1941", c(224) + 0.9, 960, 300, size=150)
    stamp(sc, c(224) + 2.4, "MAIN QUEST COMPLETE", 960, 500, size=70, color=GREEN, rot=-5)
    sprite(sc, "carriage", c(225), 470, 800, w=560, h=280)
    label(sc, "one year to the day after the carriage", c(225) + 1.0, 1340, 720, size=48, color=BLUE,
          max_w=820)
    label(sc, "victory convinced him he *could not lose*", c(226) + 0.6, 1340, 900, size=50, color=INK,
          max_w=820)

    sc = S(228)
    lightning(sc, c(228), 480, 400, h=300)
    label(sc, "short wars", c(228) + 0.6, 480, 660, size=70, color=INK)
    check(sc, 480, 820, 70, c(228) + 1.2)
    for i, (k, x) in enumerate([("UK", 1230), ("SU", 1450), ("US", 1670)]):
        flag(sc, k, c(229) + 0.2 + 0.4 * i, x, 400, w=180, dur=0.7, pole=False)
    label(sc, "a long war", c(229) + 1.6, 1450, 660, size=70, color=INK)
    xmark(sc, 1450, 820, 70, c(229) + 2.6)

    sc = S(230)
    calendar(sc, c(230), 400, 520, "APRIL", "30", "1945", w=360)
    sprite(sc, "bunker", c(230) + 1.6, 1000, 560, h=520)
    sprite(sc, "white_flag", c(231), 1560, 520, h=520)
    label(sc, "8 May 1945: surrender", c(231) + 0.8, 1560, 900, size=50, color=INK)

    sc = S(232)
    sprite(sc, "carriage", c(232) - 0.1, 960, 470, w=1000, h=500, dur=1.8)
    label(sc, "taken to Germany as a trophy", c(233) + 0.3, 960, 790, size=56, color=BLUE)
    sprite(sc, "flames", c(234) + 0.1, 960, 420, h=480, dur=1.1)
    big(sc, "1945: destroyed", c(234) + 0.8, 960, 930, size=84)

    sc = S(235)
    sprite(sc, "hospital", c(235) - 0.1, 470, 470, w=600, dur=1.2)
    label(sc, "1918", c(235) + 0.6, 470, 760, size=70, color=INK)
    sprite(sc, "bunker", c(235) + 0.4, 1450, 470, h=420, dur=1.2)
    label(sc, "1945", c(235) + 1.0, 1450, 760, size=70, color=INK)
    arrow(sc, (780, 330), (1170, 330), c(235) + 1.4, width=9, bend=-0.3)
    arrow(sc, (1170, 620), (780, 620), c(235) + 1.8, width=9, bend=-0.3)
    big(sc, "in defeat", c(235) + 2.6, 960, 930, size=96)

    sc = S(236)
    label(sc, "Why 4 more years?", c(236) + 0.6, 720, 280, size=100, color=INK)
    label(sc, "...and millions more lives", c(237) + 0.2, 720, 430, size=58, color=RED)
    big(sc, "NEXT STORY", c(238), 640, 720, size=104)
    arrow(sc, (1000, 720), (1420, 720), c(239), width=14, bend=0.0)

    for i, sc in enumerate(scenes):
        sc.t1 = scenes[i + 1].t0 if i + 1 < len(scenes) else audio_end
    return scenes
