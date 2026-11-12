import React from "react";
import { AbsoluteFill } from "remotion";
import { FONT, Scene, useDesertFont } from "./Short";

// Shorts cover = the frame-0 premise (the guy holding ice in the desert) + the cover text.
// Three things only: the guy, the ice cube in his hand, the text (kept away from the bottom 20 % and the right edge).
export const DesertIceCover: React.FC = () => {
  useDesertFont();
  const txt = {
    fontFamily: FONT,
    color: "#FFFFFF",
    WebkitTextStroke: "22px #000",
    paintOrder: "stroke fill",
    textAlign: "center" as const,
    lineHeight: 0.95,
  };
  return (
    <AbsoluteFill>
      <Scene t={0.9} tr={0.9} cam={{ x: 790, y: 1360, k: 1.6 }} cover />
      <AbsoluteFill style={{ alignItems: "center", top: 110, left: -60 }}>
        <div style={{ ...txt, fontSize: 150, transform: "rotate(-4deg)" }}>
          FROZEN
        </div>
        <div
          style={{
            ...txt,
            fontSize: 112,
            color: "#8FD8FF",
            transform: "rotate(-4deg)",
            marginTop: 8,
          }}
        >
          BY THE SKY?
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
