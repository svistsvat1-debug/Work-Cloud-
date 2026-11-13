import React from "react";
import { AbsoluteFill, Img, staticFile } from "remotion";
import { SPR } from "./sprites";
import { FONT, Trefoil, useNukeFonts } from "./Short";
import { World } from "../shared/World";
import { WH, WW } from "./scene";

// Cover (1080 x 1920): the frame-0 premise (the guy hammering a DANGER sign) + the cover text = three things.
// Kept away from the bottom ~20 % and the right edge where the YouTube buttons sit.
const F = (n: string) => staticFile(`nuclear-warning/${n}.png`);
export const NuclearWarningCover: React.FC = () => {
  useNukeFonts();
  const up = SPR.up;
  const k = 128 / 126; // head radius 128 px
  const fx = 395;
  const fy = 1500;
  const sg = SPR.sign;
  const ss = 0.76;
  const sx = 770;
  const sy = 1505;
  const bcx = sx + (((sg.board[0] + sg.board[2]) / 2 - sg.post[0]) * ss);
  const bcy = sy + (((sg.board[1] + sg.board[3]) / 2 - sg.post[1]) * ss);
  return (
    <AbsoluteFill style={{ background: "#9ED3F0" }}>
      <World cam={{ x: 700, y: 1150, k: 1.0 }}>
        <Img src={F("bg")} style={{ position: "absolute", left: 0, top: 0, width: WW, height: WH }} />
      </World>
      {/* soft radioactive glow seeping out of the ground under the sign */}
      <div
        style={{
          position: "absolute",
          left: sx - 330,
          top: sy - 170,
          width: 660,
          height: 340,
          borderRadius: "50%",
          background: "radial-gradient(closest-side, rgba(156,255,58,0.75), rgba(156,255,58,0))",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: fx - 150,
          top: fy - 18,
          width: 300,
          height: 36,
          borderRadius: "50%",
          background: "rgba(52, 70, 30, 0.28)",
          filter: "blur(3px)",
        }}
      />
      <Img src={F("sign")} style={{ position: "absolute", left: sx - sg.post[0] * ss, top: sy - sg.post[1] * ss, width: sg.w * ss, height: sg.h * ss }} />
      <div
        style={{
          position: "absolute",
          left: bcx,
          top: bcy,
          transform: "translate(-50%, -50%)",
          fontFamily: FONT,
          textAlign: "center",
          color: "#111",
          lineHeight: 0.95,
          whiteSpace: "nowrap",
        }}
      >
        <svg width={70} height={70} style={{ overflow: "visible", display: "block", margin: "0 auto 4px" }}>
          <Trefoil x={35} y={35} r={28} />
        </svg>
        <div style={{ fontSize: 66 }}>DANGER</div>
      </div>
      <Img src={F("up")} style={{ position: "absolute", left: fx - up.feet[0] * k, top: fy - up.feet[1] * k, width: up.w * k, height: up.h * k }} />
      <div
        style={{
          position: "absolute",
          left: 500,
          top: 390,
          transform: "translate(-50%, -50%) rotate(-4deg)",
          fontFamily: FONT,
          fontSize: 156,
          lineHeight: 1.0,
          textAlign: "center",
          color: "#fff",
          WebkitTextStroke: "26px #000",
          paintOrder: "stroke fill",
          whiteSpace: "nowrap",
        }}
      >
        <div>RUN FROM</div>
        <div>
          THE <span style={{ color: "#9CFF3A" }}>CAT?</span>
        </div>
      </div>
    </AbsoluteFill>
  );
};
