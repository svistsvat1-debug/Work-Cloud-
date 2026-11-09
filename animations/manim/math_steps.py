"""
Solving Math Problems Step by Step — educational animation (Manim Community Edition).

Three problems, solved one step at a time:
  1. Linear equation      2x + 5 = 17
  2. Quadratic equation   x^2 - 5x + 6 = 0
  3. Pythagorean theorem  a^2 + b^2 = c^2  with a = 3, b = 4

Every step: a caption explains it, the changing part is highlighted, terms
physically move to their new place, and the final answer lands in a box.

Render (fast preview, 480p15):   manim -pql math_steps.py SolvingMathProblems
Render (final, 1080p60):         manim -pqh math_steps.py SolvingMathProblems

Length: ~44 seconds. Needs LaTeX installed (used by MathTex).
"""

from manim import *
import numpy as np

# --------------------------------------------------------------------------
# STYLE — change colors / sizes here
# --------------------------------------------------------------------------
BG_COLOR = "#0E1117"
NUM = "#FFD166"        # important numbers
VAR = "#4CC9F0"        # variables
CHANGE = "#FF6B6B"     # the part that is changing in the current step
ANSWER = "#06D6A0"     # final answers
MUTED = "#9AA4B2"      # captions / secondary text
EQ_SIZE = 56           # font size of the main equations

STEP_PAUSE = 0.35      # pause after each step (raise it to slow the video down)


class SolvingMathProblems(Scene):
    # ======================================================================
    # Reusable helpers
    # ======================================================================
    def caption(self, text: str, y: float = -3.0):
        """Swap the step caption at the bottom of the screen."""
        new = Text(text, font_size=30, color=MUTED).move_to(UP * y)
        if self.current_caption is None:
            self.play(FadeIn(new, shift=UP * 0.2), run_time=0.5)
        else:
            self.play(FadeOut(self.current_caption, shift=UP * 0.2),
                      FadeIn(new, shift=UP * 0.2), run_time=0.4)
        self.current_caption = new

    def highlight(self, *mobs, color=CHANGE):
        """Draw a temporary box around the part that is about to change."""
        boxes = VGroup(*[SurroundingRectangle(m, color=color, buff=0.08,
                                              corner_radius=0.06) for m in mobs])
        self.play(Create(boxes), *[m.animate.set_color(color) for m in mobs], run_time=0.5)
        return boxes

    def box_answer(self, *mobs):
        """Put the final answer(s) inside a glowing box."""
        anims = []
        for mob in mobs:
            mob.set_color(ANSWER)
            box = SurroundingRectangle(mob, color=ANSWER, buff=0.25, corner_radius=0.12,
                                       stroke_width=4)
            halo = box.copy().set_stroke(ANSWER, width=14, opacity=0.25)
            anims += [Create(box), FadeIn(halo),
                      Indicate(mob, color=ANSWER, scale_factor=1.12)]
        self.play(*anims, run_time=1)

    def problem_header(self, number: int, name: str):
        """'Problem 1 of 3 — Linear equation' + progress dots in the top bar."""
        label = Text(f"Problem {number}", font_size=34, weight=BOLD, color=WHITE)
        kind = Text(name, font_size=26, color=VAR)
        head = VGroup(label, kind).arrange(RIGHT, buff=0.35, aligned_edge=DOWN)
        head.to_corner(UL, buff=0.5)
        dots = VGroup(*[Dot(radius=0.09, color=ANSWER if i < number else GREY_D)
                        for i in range(3)]).arrange(RIGHT, buff=0.2)
        dots.to_corner(UR, buff=0.6)
        line = Line(LEFT * 6.6, RIGHT * 6.6, stroke_width=1, color=GREY_D)
        line.next_to(head, DOWN, buff=0.25).set_x(0)
        group = VGroup(head, dots, line)
        self.play(FadeIn(head, shift=RIGHT * 0.3), FadeIn(dots), Create(line), run_time=0.6)
        return group

    def clear_problem(self):
        """Smooth transition: everything slides up and fades away."""
        self.play(*[FadeOut(m, shift=UP * 0.5) for m in self.mobjects], run_time=0.7)
        self.current_caption = None

    # ======================================================================
    # Scene
    # ======================================================================
    def construct(self):
        self.camera.background_color = BG_COLOR
        self.current_caption = None

        self.intro()
        self.problem_linear()
        self.clear_problem()
        self.problem_quadratic()
        self.clear_problem()
        self.problem_pythagoras()
        self.clear_problem()
        self.outro()

    # ----------------------------------------------------------------------
    def intro(self):
        title = Text("Solving Math Problems", font_size=60, weight=BOLD)
        title2 = Text("Step by Step", font_size=60, weight=BOLD)
        title2.set_color_by_gradient(VAR, ANSWER)
        titles = VGroup(title, title2).arrange(DOWN, buff=0.2)
        underline = Line(LEFT * 3, RIGHT * 3, color=NUM, stroke_width=4).next_to(titles, DOWN, buff=0.35)
        sub = Text("3 problems  ·  every step explained", font_size=26, color=MUTED)
        sub.next_to(underline, DOWN, buff=0.35)

        self.play(Write(title), run_time=1)
        self.play(FadeIn(title2, shift=UP * 0.3), GrowFromCenter(underline), run_time=0.7)
        self.play(FadeIn(sub), run_time=0.4)
        self.wait(0.6)
        self.play(FadeOut(VGroup(titles, underline, sub), shift=UP * 0.5), run_time=0.6)

    # ----------------------------------------------------------------------
    # PROBLEM 1:  2x + 5 = 17
    # ----------------------------------------------------------------------
    def problem_linear(self):
        self.problem_header(1, "Linear equation")

        # Each string is a separate part, so we can move parts independently
        eq0 = MathTex("2x", "+", "5", "=", "17", font_size=EQ_SIZE)
        eq0[0][1].set_color(VAR)
        eq0[2].set_color(NUM)
        eq0[4].set_color(NUM)
        self.play(Write(eq0), run_time=0.9)

        # Step 1 — move +5 to the other side (it becomes -5)
        self.caption("Subtract 5 from both sides")
        boxes = self.highlight(VGroup(eq0[1], eq0[2]))
        eq1 = MathTex("2x", "=", "17", "-", "5", font_size=EQ_SIZE)
        eq1[0][1].set_color(VAR)
        eq1[2].set_color(NUM)
        eq1[3:].set_color(CHANGE)
        self.play(
            FadeOut(boxes),
            ReplacementTransform(eq0[0], eq1[0]),
            ReplacementTransform(eq0[3], eq1[1]),
            ReplacementTransform(eq0[4], eq1[2]),
            # the +5 jumps over the "=" sign along an arc and flips its sign
            ReplacementTransform(eq0[1], eq1[3], path_arc=-PI * 0.8),
            ReplacementTransform(eq0[2], eq1[4], path_arc=-PI * 0.8),
            run_time=1.1,
        )
        self.wait(STEP_PAUSE)

        # Step 2 — simplify 17 - 5
        self.caption("Simplify:  17 − 5 = 12")
        boxes = self.highlight(eq1[2:])
        eq2 = MathTex("2x", "=", "12", font_size=EQ_SIZE)
        eq2[0][1].set_color(VAR)
        eq2[2].set_color(NUM)
        self.play(
            FadeOut(boxes),
            ReplacementTransform(eq1[0:2], eq2[0:2]),
            ReplacementTransform(eq1[2:], eq2[2]),
            run_time=1,
        )
        self.wait(STEP_PAUSE)

        # Step 3 — divide by 2: the "2" slides under the 12
        self.caption("Divide both sides by 2")
        boxes = self.highlight(eq2[0][0])
        eq3 = MathTex("x", "=", r"\frac{12}{2}", font_size=EQ_SIZE)
        eq3[0].set_color(VAR)
        eq3[2][0:2].set_color(NUM)
        eq3[2][3].set_color(CHANGE)
        self.play(
            FadeOut(boxes),
            ReplacementTransform(eq2[0][1], eq3[0]),
            ReplacementTransform(eq2[1], eq3[1]),
            ReplacementTransform(eq2[2], eq3[2][0:2]),
            GrowFromCenter(eq3[2][2]),                                 # fraction bar
            ReplacementTransform(eq2[0][0], eq3[2][3], path_arc=PI / 2),
            run_time=1.1,
        )
        self.wait(STEP_PAUSE)

        # Step 4 — final answer
        self.caption("12 ÷ 2 = 6")
        eq4 = MathTex("x", "=", "6", font_size=EQ_SIZE)
        self.play(ReplacementTransform(eq3[0:2], eq4[0:2]),
                  ReplacementTransform(eq3[2], eq4[2]), run_time=0.9)
        self.box_answer(eq4)
        self.wait(0.7)

    # ----------------------------------------------------------------------
    # PROBLEM 2:  x^2 - 5x + 6 = 0
    # ----------------------------------------------------------------------
    def problem_quadratic(self):
        self.problem_header(2, "Quadratic equation")

        eq0 = MathTex("x^2", "-", "5x", "+", "6", "=", "0", font_size=EQ_SIZE).shift(UP * 1.2)
        eq0[2][0].set_color(NUM)
        eq0[4].set_color(NUM)
        self.play(Write(eq0), run_time=0.9)

        # Step 1 — find two numbers: product 6, sum -5
        self.caption("Find two numbers:  product = 6,  sum = −5")
        product = MathTex(r"(-2)\cdot(-3)", "=", "6", font_size=42)
        total = MathTex(r"(-2)+(-3)", "=", "-5", font_size=42)
        helpers = VGroup(product, total).arrange(DOWN, buff=0.3).shift(DOWN * 0.4)
        for h in helpers:
            h[0].set_color(CHANGE)
            h[2].set_color(NUM)
        self.play(Indicate(eq0[4], color=NUM), FadeIn(product, shift=DOWN * 0.2), run_time=0.7)
        self.play(Indicate(eq0[1:3], color=NUM), FadeIn(total, shift=DOWN * 0.2), run_time=0.7)
        self.wait(STEP_PAUSE)

        # Step 2 — factor
        self.caption("Factor the expression")
        eq1 = MathTex("(x-2)", "(x-3)", "=", "0", font_size=EQ_SIZE).move_to(eq0)
        eq1[0][3].set_color(CHANGE)
        eq1[1][3].set_color(CHANGE)
        self.play(
            ReplacementTransform(eq0[0:5], eq1[0:2]),
            ReplacementTransform(eq0[5:], eq1[2:]),
            FadeOut(helpers, shift=UP * 0.3),
            run_time=1.2,
        )
        self.wait(STEP_PAUSE)

        # Step 3 — zero-product rule: split into two small equations
        self.caption("If a product is 0, one of the factors is 0")
        left = MathTex("x-2", "=", "0", font_size=48).move_to(LEFT * 2.6 + DOWN * 0.5)
        right = MathTex("x-3", "=", "0", font_size=48).move_to(RIGHT * 2.6 + DOWN * 0.5)
        word_or = Text("or", font_size=30, color=MUTED).move_to(DOWN * 0.5)
        for side in (left, right):
            side[0][2].set_color(CHANGE)
        self.play(
            TransformFromCopy(eq1[0], left[0]),
            TransformFromCopy(eq1[1], right[0]),
            FadeIn(left[1:]), FadeIn(right[1:]), FadeIn(word_or),
            run_time=1.2,
        )
        self.wait(STEP_PAUSE)

        # Step 4 — solve each: the number jumps over "=" (TransformMatchingShapes
        # automatically moves matching symbols to their new spots)
        self.caption("Move the number to the other side")
        left_sol = MathTex("x", "=", "2", font_size=48).move_to(left)
        right_sol = MathTex("x", "=", "3", font_size=48).move_to(right)
        self.play(TransformMatchingShapes(left, left_sol, path_arc=PI / 2),
                  TransformMatchingShapes(right, right_sol, path_arc=PI / 2), run_time=1.2)
        self.box_answer(left_sol, right_sol)
        self.wait(0.7)

    # ----------------------------------------------------------------------
    # PROBLEM 3:  a^2 + b^2 = c^2   (a = 3, b = 4)
    # ----------------------------------------------------------------------
    def problem_pythagoras(self):
        self.problem_header(3, "Pythagorean theorem")

        # Right triangle drawn to scale: a = 3 (vertical), b = 4 (horizontal)
        corner = np.array([-5.6, -1.9, 0])
        A, B, C = corner, corner + RIGHT * 4, corner + UP * 3
        tri = Polygon(A, B, C, color=WHITE, stroke_width=4, fill_color=VAR, fill_opacity=0.12)
        right_angle = Square(0.3, stroke_width=2, color=WHITE).move_to(A + np.array([0.15, 0.15, 0]))
        hyp = Line(B, C, color=NUM, stroke_width=6)
        lab_a = MathTex("a", "=", "3", font_size=38).next_to(Line(A, C), LEFT, buff=0.2)
        lab_b = MathTex("b", "=", "4", font_size=38).next_to(Line(A, B), DOWN, buff=0.2)
        lab_c = MathTex("c", "=", "?", font_size=38).move_to(
            (B + C) / 2 + np.array([0.75, 0.55, 0]))
        lab_a[2].set_color(NUM)
        lab_b[2].set_color(NUM)
        lab_c[2].set_color(CHANGE)

        self.play(Create(tri), FadeIn(right_angle), run_time=1)
        self.play(FadeIn(lab_a), FadeIn(lab_b), Create(hyp), FadeIn(lab_c), run_time=0.8)

        # Solution is written as a column on the right, one line per step
        def row(*parts, y):
            return MathTex(*parts, font_size=48).move_to(RIGHT * 2.6 + UP * y)

        r0 = row("a^2", "+", "b^2", "=", "c^2", y=2.1)
        self.play(Write(r0), run_time=0.9)

        # Step 1 — substitute: the 3 and 4 fly from the triangle into the formula
        self.caption("Substitute a = 3 and b = 4")
        r1 = row("3^2", "+", "4^2", "=", "c^2", y=1.25)
        r1[0].set_color(NUM)
        r1[2].set_color(NUM)
        self.play(
            TransformFromCopy(lab_a[2], r1[0]),
            TransformFromCopy(lab_b[2], r1[2]),
            TransformFromCopy(r0[1], r1[1]),
            TransformFromCopy(r0[3:], r1[3:]),
            run_time=1.1,
        )
        self.wait(STEP_PAUSE * 0.5)

        # Step 2 — square the numbers
        self.caption("Square each number:  3² = 9,  4² = 16")
        r2 = row("9", "+", "16", "=", "c^2", y=0.4)
        r2[0].set_color(NUM)
        r2[2].set_color(NUM)
        self.play(*[TransformFromCopy(r1[i], r2[i]) for i in range(5)], run_time=1)
        self.wait(STEP_PAUSE * 0.5)

        # Step 3 — add
        self.caption("Add:  9 + 16 = 25")
        r3 = row("25", "=", "c^2", y=-0.45)
        r3[0].set_color(NUM)
        self.play(TransformFromCopy(r2[0:3], r3[0]),
                  TransformFromCopy(r2[3:], r3[1:]), run_time=1)
        self.wait(STEP_PAUSE * 0.5)

        # Step 4 — square root -> answer
        self.caption("Take the square root:  √25 = 5")
        r4 = row("c", "=", "5", y=-1.45)
        self.play(TransformFromCopy(r3[2], r4[0]), TransformFromCopy(r3[1], r4[1]),
                  TransformFromCopy(r3[0], r4[2]), run_time=1)
        self.box_answer(r4)

        # The triangle's "c = ?" becomes "c = 5"
        lab_c_new = MathTex("c", "=", "5", font_size=38, color=ANSWER).move_to(lab_c)
        self.play(TransformMatchingTex(lab_c, lab_c_new),
                  hyp.animate.set_color(ANSWER), Flash(hyp.get_center(), color=ANSWER),
                  run_time=0.9)
        self.wait(0.8)

    # ----------------------------------------------------------------------
    def outro(self):
        heading = Text("All three solved", font_size=44, weight=BOLD)
        rows = VGroup(
            MathTex(r"2x + 5 = 17", r"\;\Rightarrow\;", r"x = 6"),
            MathTex(r"x^2 - 5x + 6 = 0", r"\;\Rightarrow\;", r"x = 2,\ x = 3"),
            MathTex(r"3^2 + 4^2 = c^2", r"\;\Rightarrow\;", r"c = 5"),
        ).arrange(DOWN, buff=0.45, aligned_edge=LEFT)
        for r in rows:
            r[1].set_color(MUTED)
            r[2].set_color(ANSWER)
        card = VGroup(heading, rows).arrange(DOWN, buff=0.6)
        frame = SurroundingRectangle(card, buff=0.45, corner_radius=0.2,
                                     color=GREY_D, fill_color="#161B26", fill_opacity=1)
        self.play(FadeIn(frame, scale=0.95), FadeIn(heading, shift=DOWN * 0.2), run_time=0.7)
        self.play(LaggedStart(*[FadeIn(r, shift=RIGHT * 0.3) for r in rows], lag_ratio=0.3),
                  run_time=1.3)
        self.wait(1.5)
        self.play(FadeOut(VGroup(frame, card)), run_time=0.7)
