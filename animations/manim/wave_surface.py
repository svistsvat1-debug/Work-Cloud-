"""
Living Wave Surface — cinematic 3D math animation (Manim Community Edition).

A colorful surface  z = sin(x^2 + y^2 - t) / 2  ripples over time while the
camera orbits, zooms in and pulls back. Glowing axis labels, a live formula
panel, "probe" points that sample the surface, and a short
"Calculating surface..." intro give it a futuristic, educational feel.

Render (fast preview, 480p15):   manim -pql wave_surface.py WavingSurface
Render (final, 1080p60):         manim -pqh wave_surface.py WavingSurface

Length: ~29 seconds. Needs LaTeX installed (used by MathTex for the formulas).
"""

from manim import *
import numpy as np

# --------------------------------------------------------------------------
# CONFIG — tweak these to change the look without touching the scene logic
# --------------------------------------------------------------------------
BG_COLOR = "#05070F"           # near-black, slightly blue background
WAVE_SPEED = 1.6               # how fast t grows (units of t per second)
DOMAIN = 2.2                   # surface spans [-DOMAIN, DOMAIN] in x and y
RESOLUTION = 36                # mesh density per side (higher = smoother, slower)
SURFACE_OPACITY = 0.9

# Surface color ramp: (color, z value) from valleys to peaks
COLORSCALE = [
    ("#1B1464", -0.5),         # deep indigo (valleys)
    ("#0652DD", -0.25),        # electric blue
    ("#12CBC4", 0.0),          # cyan (mid level)
    ("#C56CF0", 0.25),         # violet
    ("#FFC312", 0.5),          # gold (peaks)
]
NEON_CYAN = "#3CF0FF"
NEON_PINK = "#FF4FD8"
NEON_GOLD = "#FFD84F"
NEON_GREEN = "#7CFF6B"
PROBE_COLORS = [NEON_GOLD, NEON_PINK, NEON_CYAN, NEON_GREEN]


def wave(x, y, t):
    """The function being visualised (works on numbers and numpy arrays).
    Change this to animate any z = f(x, y, t)."""
    return np.sin(x**2 + y**2 - t) / 2


# LaTeX shown in the formula panel — keep it in sync with `wave` above.
WAVE_TEX = r"z = \frac{\sin\left(x^2 + y^2 - t\right)}{2}"


def glow(mob: VMobject, color: str, layers: int = 6, max_width: float = 14) -> VGroup:
    """Fake a neon glow: stacked, increasingly wide & transparent stroke copies
    behind the original mobject. Returns VGroup(halo, original)."""
    halo = VGroup()
    for i in range(layers, 0, -1):
        layer = mob.copy().set_fill(opacity=0)
        layer.set_stroke(color, width=max_width * i / layers, opacity=0.5 / layers)
        halo.add(layer)
    return VGroup(halo, mob)


def colors_for_heights(z: np.ndarray) -> np.ndarray:
    """Map an array of heights to RGB rows using COLORSCALE (linear blend)."""
    stops = np.array([v for _, v in COLORSCALE])
    rgbs = np.array([ManimColor(c).to_rgb() for c, _ in COLORSCALE])
    return np.stack([np.interp(z, stops, rgbs[:, k]) for k in range(3)], axis=1)


class WavingSurface(ThreeDScene):
    # ---- small helpers to pin overlays without instantly showing them ----
    def pin_to_screen(self, *mobs):
        """Like add_fixed_in_frame_mobjects, but doesn't add to the scene yet
        (so we can FadeIn / Write them later)."""
        self.renderer.camera.add_fixed_in_frame_mobjects(*mobs)

    def face_camera(self, *mobs):
        """Keep labels facing the camera while they stay at a 3D position."""
        self.renderer.camera.add_fixed_orientation_mobjects(*mobs)

    def construct(self):
        self.camera.background_color = BG_COLOR

        # ------------------------------------------------------------------
        # 1. CAMERA START + AXES
        # ------------------------------------------------------------------
        self.set_camera_orientation(phi=68 * DEGREES, theta=-50 * DEGREES, zoom=0.85)

        axes = ThreeDAxes(
            x_range=[-3, 3, 1],
            y_range=[-3, 3, 1],
            z_range=[-1.5, 1.5, 0.5],
            x_length=6.5,
            y_length=6.5,
            z_length=3.2,
            axis_config={"stroke_color": GREY_B, "stroke_width": 2},
        )

        # The axes are linear, so graph -> scene coordinates is just
        # origin + scale * (x, y, z). Precomputing it is ~50x faster than
        # calling axes.c2p for every surface point in every frame.
        origin = axes.c2p(0, 0, 0)
        scale = np.array([axes.c2p(1, 0, 0)[0], axes.c2p(0, 1, 0)[1],
                          axes.c2p(0, 0, 1)[2]]) - origin

        def to_scene(x, y, z):
            return origin + scale * np.array([x, y, z])

        # Glowing axis labels that always face the camera
        x_lab = glow(MathTex("x", color=NEON_CYAN).scale(1.1), NEON_CYAN)
        y_lab = glow(MathTex("y", color=NEON_PINK).scale(1.1), NEON_PINK)
        z_lab = glow(MathTex("z", color=NEON_GOLD).scale(1.1), NEON_GOLD)
        x_lab.move_to(to_scene(3.45, 0, 0))
        y_lab.move_to(to_scene(0, 3.45, 0))
        z_lab.move_to(to_scene(0, 0, 1.85))
        axis_labels = VGroup(x_lab, y_lab, z_lab)
        self.face_camera(*axis_labels)

        # Title overlay (fixed to the screen, not to the 3D world)
        title = Text("The Living Wave", font_size=40, weight=BOLD)
        title.set_color_by_gradient(NEON_CYAN, NEON_PINK)
        subtitle = Text("a surface that changes with time", font_size=22, color=GREY_B)
        header = VGroup(title, subtitle).arrange(DOWN, buff=0.12).to_corner(UL, buff=0.45)
        self.pin_to_screen(header)

        self.play(Create(axes, lag_ratio=0.1), run_time=2.5)
        self.play(
            FadeIn(header, shift=DOWN * 0.2),
            LaggedStart(*[FadeIn(l, scale=0.5) for l in axis_labels], lag_ratio=0.3),
            run_time=1.5,
        )

        # ------------------------------------------------------------------
        # 2. LIVE SURFACE
        #    Two trackers drive it:
        #      t   -> time inside the wave function (makes it move)
        #      amp -> lets the surface "rise" out of the flat plane at the start
        #    Instead of rebuilding the Surface every frame (slow), we build it
        #    once flat and then only rewrite the z-coordinate of its points
        #    and the color of each face in a vectorised updater.
        # ------------------------------------------------------------------
        t = ValueTracker(0)
        amp = ValueTracker(0)

        surface = Surface(
            lambda u, v: to_scene(u, v, 0),
            u_range=[-DOMAIN, DOMAIN],
            v_range=[-DOMAIN, DOMAIN],
            resolution=(RESOLUTION, RESOLUTION),
            fill_opacity=SURFACE_OPACITY,
            stroke_width=0.35,
            stroke_color=WHITE,
            stroke_opacity=0.22,
        )
        faces = list(surface)
        flat_pts = np.array([f.points for f in faces])                   # (faces, pts, 3)
        graph_x = (flat_pts[..., 0] - origin[0]) / scale[0]              # graph coords
        graph_y = (flat_pts[..., 1] - origin[1]) / scale[1]
        center_u = np.array([(f.u1 + f.u2) / 2 for f in faces])          # face centers
        center_v = np.array([(f.v1 + f.v2) / 2 for f in faces])

        def update_surface(mob):
            tt, a = t.get_value(), amp.get_value()
            z = origin[2] + scale[2] * a * wave(graph_x, graph_y, tt)
            rgba = np.ones((len(faces), 4)) * SURFACE_OPACITY
            rgba[:, :3] = colors_for_heights(a * wave(center_u, center_v, tt))
            for i, face in enumerate(faces):
                face.points[:, 2] = z[i]
                face.fill_rgbas = rgba[i : i + 1]

        surface.add_updater(update_surface)
        update_surface(surface)

        # A global clock (seconds) used by the blinking dots and the probe points
        clock = ValueTracker(0)
        clock.add_updater(lambda m, dt: m.increment_value(dt))
        self.add(clock)

        # "Calculating surface..." text with blinking dots + progress bar
        calc = Text("Calculating surface", font_size=26, color=NEON_CYAN)
        dots = VGroup(*[Text(".", font_size=26, color=NEON_CYAN) for _ in range(3)])
        dots.arrange(RIGHT, buff=0.06).next_to(calc, RIGHT, buff=0.08).align_to(calc, DOWN)
        bar_bg = RoundedRectangle(width=3.6, height=0.08, corner_radius=0.04,
                                  stroke_width=0, fill_color=GREY_E, fill_opacity=1)
        bar = Rectangle(width=3.6, height=0.08, stroke_width=0,
                        fill_color=NEON_CYAN, fill_opacity=1)
        calc_text = VGroup(calc, dots)
        calc_group = VGroup(calc_text, bar_bg).arrange(DOWN, buff=0.2).to_edge(DOWN, buff=0.6)
        bar.move_to(bar_bg).stretch_to_fit_width(0.02, about_edge=LEFT)
        calc_group.add(bar)
        self.pin_to_screen(calc_group)

        def blink(m):  # show 0, 1, 2, 3 dots in a loop
            n = int(clock.get_value() * 3) % 4
            for i, d in enumerate(m):
                d.set_opacity(1 if i < n else 0)

        dots.add_updater(blink)

        self.play(FadeIn(calc_group, shift=UP * 0.2), FadeIn(surface), run_time=0.8)
        # The surface rises out of the plane while the progress bar fills
        self.play(
            amp.animate.set_value(1),
            bar.animate.stretch_to_fit_width(3.6, about_edge=LEFT),
            run_time=3,
            rate_func=smooth,
        )
        done = Text("Surface ready ✓", font_size=26, color=NEON_GREEN).move_to(calc_text)
        self.pin_to_screen(done)
        self.play(FadeOut(calc_text), FadeIn(done), run_time=0.4)
        self.play(FadeOut(done), FadeOut(bar_bg), FadeOut(bar), run_time=0.6)

        # From now on the wave moves by itself: t grows with real time,
        # so every play()/wait() below keeps the surface alive.
        t.add_updater(lambda m, dt: m.increment_value(WAVE_SPEED * dt))
        self.add(t)

        # ------------------------------------------------------------------
        # 3. LIVE FORMULA PANEL (fixed on screen, numbers update every frame)
        # ------------------------------------------------------------------
        formula = MathTex(WAVE_TEX, font_size=36)
        t_label = MathTex("t =", font_size=34, color=NEON_GOLD)
        t_value = DecimalNumber(0, num_decimal_places=2, font_size=34, color=NEON_GOLD)
        t_row = VGroup(t_label, t_value).arrange(RIGHT, buff=0.15)

        probe_label = MathTex(r"z(P) =", font_size=34, color=PROBE_COLORS[0])
        probe_value = DecimalNumber(0, num_decimal_places=3, include_sign=True,
                                    font_size=34, color=PROBE_COLORS[0])
        probe_row = VGroup(probe_label, probe_value).arrange(RIGHT, buff=0.15)

        panel_body = VGroup(formula, t_row, probe_row).arrange(DOWN, aligned_edge=LEFT, buff=0.3)
        panel_box = SurroundingRectangle(panel_body, buff=0.3, corner_radius=0.15,
                                         stroke_color=NEON_CYAN, stroke_width=1.5,
                                         fill_color=BLACK, fill_opacity=0.55)
        panel = VGroup(panel_box, panel_body).to_corner(UR, buff=0.4)
        self.pin_to_screen(panel)

        def track_t(m):
            m.set_value(t.get_value())
            # DecimalNumber rebuilds its digits on set_value -> re-pin them
            self.pin_to_screen(m)

        t_value.add_updater(track_t)
        self.play(FadeIn(panel, shift=LEFT * 0.3), run_time=1)

        # ------------------------------------------------------------------
        # 4. PROBE POINTS — small glowing dots that wander over the surface,
        #    "sampling" z = f(x, y, t) in real time, with fading trails and a
        #    thin measurement line down to the xy-plane.
        # ------------------------------------------------------------------
        def probe_xy(i: int):
            """Lissajous-style path inside the domain for probe number i."""
            s, r = clock.get_value(), 1.0 + 0.35 * i
            return r * np.cos(0.55 * s + i * 1.7), r * np.sin(0.8 * s + i * 2.3)

        probes, stems, trails = VGroup(), VGroup(), VGroup()
        for i, col in enumerate(PROBE_COLORS):
            dot = Dot3D(radius=0.07, color=col, resolution=(8, 8))
            stem = Line(ORIGIN, UP, stroke_width=1.5, color=col, stroke_opacity=0.7)

            def follow_dot(m, i=i):
                x, y = probe_xy(i)
                m.move_to(to_scene(x, y, wave(x, y, t.get_value())))

            def follow_stem(m, i=i):
                x, y = probe_xy(i)
                m.put_start_and_end_on(to_scene(x, y, 0),
                                       to_scene(x, y, wave(x, y, t.get_value()) + 1e-4))

            dot.add_updater(follow_dot)
            stem.add_updater(follow_stem)
            follow_dot(dot)
            follow_stem(stem)
            probes.add(dot)
            stems.add(stem)
            trails.add(TracedPath(dot.get_center, stroke_color=col,
                                  stroke_width=3, dissipating_time=0.8))

        def track_probe(m):
            x, y = probe_xy(0)
            m.set_value(wave(x, y, t.get_value()))
            self.pin_to_screen(m)

        probe_value.add_updater(track_probe)

        # ------------------------------------------------------------------
        # 5. CINEMATIC CAMERA: slow orbit -> zoom in -> pull back
        # ------------------------------------------------------------------
        self.begin_ambient_camera_rotation(rate=0.12)
        self.wait(2)

        # Probes appear, then the camera dives in closer
        self.add(trails)
        self.play(
            LaggedStart(*[FadeIn(p, scale=3) for p in probes], lag_ratio=0.25),
            FadeIn(stems),
            run_time=1.5,
        )
        self.move_camera(phi=58 * DEGREES, zoom=1.05, run_time=4, rate_func=smooth)
        self.play(Indicate(probe_row, color=WHITE, scale_factor=1.1), run_time=1.2)
        self.wait(1.5)

        # Pull back to reveal the whole surface again
        self.move_camera(phi=74 * DEGREES, zoom=0.8, run_time=4, rate_func=smooth)
        self.wait(1.5)

        # ------------------------------------------------------------------
        # 6. OUTRO
        # ------------------------------------------------------------------
        outro = Text("Every point is a calculation.", font_size=30, color=WHITE)
        outro.to_edge(DOWN, buff=0.6)
        self.pin_to_screen(outro)
        self.play(FadeIn(outro, shift=UP * 0.2), run_time=1)
        self.wait(1)

        self.stop_ambient_camera_rotation()
        self.play(
            *[FadeOut(m) for m in (surface, axes, axis_labels, probes, stems, trails,
                                   panel, header, outro)],
            run_time=1.5,
        )
        self.wait(0.3)
