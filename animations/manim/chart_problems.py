"""
Which Method Solves the Problem Faster? — chart + math explainer (Manim Community Edition).

A bar chart of how long a student needed for 5 problems. Bars grow one by
one, then total, average, fastest and slowest are calculated on the side
(numbers fly from the bars into the formulas) and everything is summarised
on a clean card at the end.

Render (fast preview, 480p15):   manim -pql chart_problems.py ProblemTimeChart
Render (final, 1080p60):         manim -pqh chart_problems.py ProblemTimeChart

Length: ~31 seconds. Uses only Text (no LaTeX needed for this scene).
"""

from manim import *

# --------------------------------------------------------------------------
# DATA — edit the values here; every calculation below updates automatically
# --------------------------------------------------------------------------
DATA = [
    ("Problem 1", 12),
    ("Problem 2", 20),
    ("Problem 3", 8),
    ("Problem 4", 15),
    ("Problem 5", 25),
]
UNIT = "s"            # shown after numbers ("12 s")
Y_MAX, Y_STEP = 30, 5  # chart height and tick spacing (in seconds)

# --------------------------------------------------------------------------
# STYLE
# --------------------------------------------------------------------------
BG_COLOR = "#0E1117"
CARD_COLOR = "#161B26"
BAR_COLOR = "#4C8DFF"
FAST_COLOR = "#2EE59D"   # fastest bar
SLOW_COLOR = "#FF5C5C"   # slowest bar
AVG_COLOR = "#FFD166"
TEXT_MUTED = "#9AA4B2"


def fmt(x: float) -> str:
    """12.0 -> '12', 16.5 -> '16.5'."""
    return f"{x:g}"


class ProblemTimeChart(Scene):
    def construct(self):
        self.camera.background_color = BG_COLOR

        names = [n for n, _ in DATA]
        values = [v for _, v in DATA]
        total = sum(values)
        average = total / len(values)
        fast_i = values.index(min(values))
        slow_i = values.index(max(values))

        # ------------------------------------------------------------------
        # 1. TITLE
        # ------------------------------------------------------------------
        title = Text("Which Method Solves\nthe Problem Faster?", font_size=56,
                     weight=BOLD, line_spacing=0.9)
        title.set_color_by_gradient(BAR_COLOR, FAST_COLOR)
        self.play(Write(title), run_time=1.5)
        self.wait(1)
        self.play(FadeOut(title, shift=UP * 0.5), run_time=0.6)

        # ------------------------------------------------------------------
        # 2. PROBLEM STATEMENT (top of the screen)
        # ------------------------------------------------------------------
        problem = Text(
            f"A student solves {len(DATA)} problems. "
            "Each problem takes a different amount of time.",
            font_size=24, color=WHITE,
        ).to_edge(UP, buff=0.4)
        question = Text("How long did it take in total, on average, and which was fastest?",
                        font_size=20, color=TEXT_MUTED).next_to(problem, DOWN, buff=0.15)
        self.play(FadeIn(problem, shift=DOWN * 0.2), run_time=0.8)
        self.play(FadeIn(question), run_time=0.5)
        self.wait(0.7)

        # ------------------------------------------------------------------
        # 3. CHART (left side) — axes + manual Text tick labels
        # ------------------------------------------------------------------
        axes = Axes(
            x_range=[0, len(DATA) + 0.6, 1],
            y_range=[0, Y_MAX, Y_STEP],
            x_length=6.6,
            y_length=4.4,
            axis_config={"color": GREY_C, "stroke_width": 2, "include_tip": False},
            x_axis_config={"include_ticks": False},
        ).to_corner(DL, buff=0.75).shift(RIGHT * 0.35)

        grid = VGroup(*[
            DashedLine(axes.c2p(0, y), axes.c2p(len(DATA) + 0.6, y),
                       stroke_width=1, color=GREY_D, dash_length=0.08)
            for y in range(Y_STEP, Y_MAX + 1, Y_STEP)
        ])
        y_labels = VGroup(*[
            Text(str(y), font_size=18, color=TEXT_MUTED).next_to(axes.c2p(0, y), LEFT, buff=0.15)
            for y in range(0, Y_MAX + 1, Y_STEP)
        ])
        y_title = Text("seconds", font_size=18, color=TEXT_MUTED)
        y_title.next_to(axes.c2p(0, Y_MAX), UP, buff=0.2).align_to(y_labels, LEFT)

        self.play(Create(axes), FadeIn(grid), FadeIn(y_labels), FadeIn(y_title), run_time=1.2)

        # Bars grow one by one from the x-axis, value label pops above each
        bar_width = axes.x_axis.unit_size * 0.6
        bars, value_labels, x_labels = VGroup(), VGroup(), VGroup()
        for i, v in enumerate(values):
            x = i + 1
            height = axes.c2p(0, v)[1] - axes.c2p(0, 0)[1]
            bar = RoundedRectangle(width=bar_width, height=height, corner_radius=0.06,
                                   fill_color=BAR_COLOR, fill_opacity=0.9, stroke_width=0)
            bar.move_to(axes.c2p(x, 0), aligned_edge=DOWN)
            val = Text(f"{v} {UNIT}", font_size=22, weight=BOLD).next_to(bar, UP, buff=0.12)
            name = Text(f"P{x}", font_size=20, color=TEXT_MUTED).next_to(axes.c2p(x, 0), DOWN, buff=0.2)
            bars.add(bar)
            value_labels.add(val)
            x_labels.add(name)

        for bar, val, name in zip(bars, value_labels, x_labels):
            self.play(GrowFromEdge(bar, DOWN), FadeIn(name), run_time=0.5)
            self.play(FadeIn(val, shift=UP * 0.15), run_time=0.25)
        self.wait(0.6)

        # ------------------------------------------------------------------
        # 4. CALCULATIONS (right side)
        # ------------------------------------------------------------------
        panel_left = axes.get_right()[0] + 0.6     # left edge of the calculation column

        def heading(text, color=WHITE):
            return Text(text, font_size=24, weight=BOLD, color=color)

        # --- Total: numbers fly from the bars into the sum ----------------
        total_head = heading("Total time")
        terms = VGroup()
        for i, v in enumerate(values):
            if i:
                terms.add(Text("+", font_size=26, color=TEXT_MUTED))
            terms.add(Text(str(v), font_size=26))
        terms.arrange(RIGHT, buff=0.14)
        total_res = Text(f"= {total} {UNIT}", font_size=26, weight=BOLD, color=AVG_COLOR)
        total_line = VGroup(terms, total_res).arrange(RIGHT, buff=0.18)
        total_block = VGroup(total_head, total_line).arrange(DOWN, aligned_edge=LEFT, buff=0.15)
        total_block.move_to([panel_left, 1.55, 0], aligned_edge=LEFT)

        numbers_in_sum = terms[::2]           # every second item is a number
        pluses = terms[1::2]
        self.play(FadeIn(total_head, shift=RIGHT * 0.2), run_time=0.4)
        self.play(
            LaggedStart(*[TransformFromCopy(lbl, num)
                          for lbl, num in zip(value_labels, numbers_in_sum)], lag_ratio=0.15),
            FadeIn(pluses),
            run_time=1.4,
        )
        self.play(Write(total_res), run_time=0.6)
        self.wait(0.4)

        # --- Average: total ÷ count, plus an average line on the chart ----
        avg_head = heading("Average per problem")
        avg_line_text = Text(f"{total} ÷ {len(DATA)} = {fmt(average)} {UNIT}", font_size=26)
        avg_line_text[-(len(fmt(average)) + len(UNIT)):].set_color(AVG_COLOR)
        avg_block = VGroup(avg_head, avg_line_text).arrange(DOWN, aligned_edge=LEFT, buff=0.15)
        avg_block.move_to([panel_left, 0.35, 0], aligned_edge=LEFT)

        avg_marker = DashedLine(axes.c2p(0.3, average), axes.c2p(len(DATA) + 0.6, average),
                                color=AVG_COLOR, stroke_width=3, dash_length=0.12)
        avg_tag = Text(f"avg {fmt(average)} {UNIT}", font_size=18, color=AVG_COLOR)
        avg_tag.next_to(avg_marker, UP, buff=0.06).align_to(avg_marker, LEFT)

        self.play(FadeIn(avg_head, shift=RIGHT * 0.2), run_time=0.4)
        self.play(TransformFromCopy(total_res, avg_line_text), run_time=1)
        self.play(Create(avg_marker), FadeIn(avg_tag), run_time=0.9)
        self.wait(0.4)

        # --- Fastest & slowest: recolor bars, write the result -----------
        fast_block = VGroup(
            heading("Fastest", FAST_COLOR),
            Text(f"{names[fast_i]}  ·  {values[fast_i]} {UNIT}", font_size=26),
        ).arrange(DOWN, aligned_edge=LEFT, buff=0.15).move_to([panel_left, -0.85, 0], aligned_edge=LEFT)
        slow_block = VGroup(
            heading("Slowest", SLOW_COLOR),
            Text(f"{names[slow_i]}  ·  {values[slow_i]} {UNIT}", font_size=26),
        ).arrange(DOWN, aligned_edge=LEFT, buff=0.15).move_to([panel_left, -2.05, 0], aligned_edge=LEFT)

        for i, block, color in ((fast_i, fast_block, FAST_COLOR), (slow_i, slow_block, SLOW_COLOR)):
            self.play(
                bars[i].animate.set_fill(color),
                value_labels[i].animate.set_color(color),
                x_labels[i].animate.set_color(color),
                run_time=0.6,
            )
            self.play(
                Indicate(bars[i], color=color, scale_factor=1.06),
                FadeIn(block, shift=RIGHT * 0.2),
                run_time=0.9,
            )
            self.wait(0.3)
        self.wait(0.6)

        # ------------------------------------------------------------------
        # 5. SUMMARY CARD
        # ------------------------------------------------------------------
        # A dark translucent overlay pushes the chart into the background
        overlay = FullScreenRectangle(fill_color=BG_COLOR, fill_opacity=0.85, stroke_width=0)
        self.play(FadeIn(overlay), run_time=0.7)

        rows_data = [
            ("Total", f"{total} seconds", AVG_COLOR),
            ("Average", f"{fmt(average)} seconds", AVG_COLOR),
            ("Fastest", names[fast_i], FAST_COLOR),
            ("Slowest", names[slow_i], SLOW_COLOR),
        ]
        rows = VGroup()
        for label, value, color in rows_data:
            left = Text(label, font_size=30, color=TEXT_MUTED)
            right = Text(value, font_size=30, weight=BOLD, color=color)
            rows.add(VGroup(left, right))
        # align: labels in one column, values in another
        for r in rows:
            r[1].next_to(r[0], RIGHT, buff=0)
        rows.arrange(DOWN, buff=0.38, aligned_edge=LEFT)
        for r in rows:
            r[1].move_to(r[0].get_left() + RIGHT * 2.4, aligned_edge=LEFT)

        card_title = Text("Summary", font_size=40, weight=BOLD)
        divider = Line(LEFT * 2.6, RIGHT * 2.6, stroke_width=1.5, color=GREY_D)
        content = VGroup(card_title, divider, rows).arrange(DOWN, buff=0.35)
        card = RoundedRectangle(width=content.width + 1.2, height=content.height + 0.9,
                                corner_radius=0.25, fill_color=CARD_COLOR, fill_opacity=1,
                                stroke_color=BAR_COLOR, stroke_width=2).move_to(content)

        self.play(FadeIn(card, scale=0.92), FadeIn(card_title, shift=DOWN * 0.2),
                  Create(divider), run_time=0.8)
        self.play(LaggedStart(*[FadeIn(r, shift=RIGHT * 0.25) for r in rows], lag_ratio=0.25),
                  run_time=1.6)
        self.wait(3)
        self.play(FadeOut(Group(*self.mobjects)), run_time=0.8)
