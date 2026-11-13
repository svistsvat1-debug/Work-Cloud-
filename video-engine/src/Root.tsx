import React, { useEffect, useState } from "react";
import { AbsoluteFill, Composition, continueRender, delayRender, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { buildTimeline, SceneRenderer } from "./engine/Timeline";
import { scenes } from "./videos/blitz/scenes";
import data from "./videos/blitz/beats.json";

const FPS = 30;
const TOTAL = 497.81 + 0.6; // voice length + short tail
const tl = buildTimeline(scenes, data.beats as any, TOTAL);

const useFonts = () => {
  const [ok, setOk] = useState(false);
  const [h] = useState(() => delayRender("fonts"));
  useEffect(() => {
    const fs = [new FontFace("PM", `url(${staticFile("fonts/pm.woff2")})`), new FontFace("CB", `url(${staticFile("fonts/cb.woff2")})`)];
    Promise.all(fs.map(f => f.load())).then(list => { list.forEach(f => (document as any).fonts.add(f)); setOk(true); continueRender(h); });
  }, [h]);
  return ok;
};

const Blitz: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const ok = useFonts();
  if (!ok) return null;
  return <AbsoluteFill style={{ background: "#FAF8F3" }}><SceneRenderer t={frame / fps} tl={tl} /></AbsoluteFill>;
};

export const Root: React.FC = () => (
  <>
    <Composition id="Blitz" component={Blitz} durationInFrames={Math.ceil(TOTAL * FPS)} fps={FPS} width={1920} height={1080} />
  </>
);
