import React, {useMemo} from 'react';
import {useCurrentFrame} from 'remotion';
import {Mini, Person} from '../components/people';
import {Burst, Circle, Fade, Label, Line, MText, Pop, Stroke} from '../components/primitives';
import {Bag, Envelope, Folder, Pot, Stop, Tank, Truck} from '../components/props';
import {markerPath, Pt, seedOf} from '../lib/sketch';
import {C} from '../lib/theme';
import {prog, useCue} from '../lib/timing';

const PCX = 620, PCY = 650, PR = 290;
type Slice = {from: number; to: number; color: string; at: number; label: string; lx: number; ly: number};

const wedge = (a0: number, a1: number, r = PR): string => {
  const pts: Pt[] = [[PCX, PCY]];
  const n = Math.max(4, Math.ceil((a1 - a0) * 40));
  for (let i = 0; i <= n; i++) {
    const a = -Math.PI / 2 + (a0 + ((a1 - a0) * i) / n) * Math.PI * 2;
    pts.push([PCX + Math.cos(a) * r, PCY + Math.sin(a) * r]);
  }
  return `M${pts.map((q) => q.map((v) => v.toFixed(1)).join(',')).join('L')}Z`;
};

const Pie: React.FC<{at: number; slices: Slice[]; dim?: number; highlight?: number}> = ({at, slices, dim = 0, highlight = -1}) => {
  const f = useCurrentFrame();
  const ring = useMemo(() => {
    const pts: Pt[] = [];
    for (let i = 0; i <= 40; i++) {
      const a = (i / 40) * Math.PI * 2;
      pts.push([PCX + Math.cos(a) * PR, PCY + Math.sin(a) * PR]);
    }
    return markerPath(pts, false, seedOf('pie'), 2);
  }, []);
  return (
    <g>
      {slices.map((s, i) => {
        const p = prog(f, s.at, 14);
        if (p <= 0) return null;
        const faded = dim > 0 && i !== highlight ? 1 - 0.8 * dim : 1;
        return (
          <g key={i} opacity={faded}>
            <path d={wedge(s.from, s.from + (s.to - s.from) * p)} fill={s.color} stroke={C.ink} strokeWidth={5} strokeLinejoin="round" />
            <text x={s.lx} y={s.ly} fontFamily="PermanentMarker" fontSize={54} textAnchor="middle" fill={C.ink} opacity={prog(f, s.at + 10, 6)}>
              {s.label}
            </text>
          </g>
        );
      })}
      <Stroke d={ring} at={at} dur={16} w={6} />
      {highlight >= 0 && dim > 0 ? (
        <path d={wedge(slices[highlight].from, slices[highlight].to, PR + 14)} fill="none" stroke={C.red} strokeWidth={10 + 4 * Math.sin(f / 4)} strokeLinejoin="round" />
      ) : null}
    </g>
  );
};

const lab = (a: number, r = PR * 0.62): [number, number] => {
  const ang = -Math.PI / 2 + a * Math.PI * 2;
  return [PCX + Math.cos(ang) * r, PCY + Math.sin(ang) * r + 18];
};

const useSlices = (c: {inf: number; tank: number; sup: number; rest: number}): Slice[] => [
  {from: 0, to: 0.14, color: C.olive, at: c.inf, label: '14%', lx: lab(0.07, PR * 1.18)[0], ly: lab(0.07, PR * 1.18)[1]},
  {from: 0.14, to: 0.22, color: C.steel, at: c.tank, label: '8%', lx: lab(0.18, PR * 1.18)[0], ly: lab(0.18, PR * 1.18)[1]},
  {from: 0.22, to: 0.67, color: C.orange, at: c.sup, label: '45%', lx: lab(0.445)[0], ly: lab(0.445)[1]},
  {from: 0.67, to: 1, color: C.blue, at: c.rest, label: '33%', lx: lab(0.835)[0], ly: lab(0.835)[1]},
];

const Legend: React.FC<{at: number; color: string; text: string; y: number}> = ({at, color, text, y}) => {
  const f = useCurrentFrame();
  const o = prog(f, at, 8);
  if (o <= 0) return null;
  return (
    <g opacity={o}>
      <rect x={1080} y={y - 42} width={54} height={54} rx={8} fill={color} stroke={C.ink} strokeWidth={4} />
      <text x={1160} y={y} fontFamily="CaveatBrush" fontSize={60} fill={C.ink}>
        {text}
      </text>
    </g>
  );
};

// 38 — the question again; First Army
export const S38: React.FC = () => {
  const {cue} = useCue();
  return (
    <g>
      <MText text="The Answer" x={70} y={112} at={0} size={70} underline cps={18} />
      <MText text="HOW MANY MEN?" x={1420} y={420} at={cue('many') - 6} size={88} anchor="middle" />
      <Person x={1460} y={960} at={cue('rifleman') - 4} hold="rifle" expr="neutral" s={1.5} />
      <Label text="FIRST ARMY · JUNE 1944" x={620} y={200} at={cue('First')} size={60} />
      <Pie at={cue('Look')} slices={[]} />
      <Label text="landed in Normandy" x={620} y={1010} at={cue('Normandy') - 4} size={52} />
    </g>
  );
};

// 39 — 14% infantry, 8% tanks, 45% support
export const S39: React.FC = () => {
  const {cue} = useCue();
  const sl = useSlices({inf: cue('fourteen'), tank: cue('eight'), sup: cue('forty-five'), rest: 99999});
  return (
    <g>
      <MText text="The Answer" x={70} y={112} at={-200} size={70} underline />
      <Label text="FIRST ARMY · JUNE 1944" x={620} y={200} at={-200} size={60} />
      <Pie at={-200} slices={sl} />
      <Burst x={lab(0.07, PR * 1.18)[0]} y={lab(0.07, PR * 1.18)[1] - 20} at={cue('infantry')} r={70} />
      <Legend at={cue('infantry')} color={C.olive} text="infantry" y={420} />
      <Legend at={cue('tanks')} color={C.steel} text="tanks" y={520} />
      <Legend at={cue('support')} color={C.orange} text="support: supply, maintenance," y={620} />
      <Label text="ordnance, medical" x={1160} y={700} at={cue('medical') - 6} size={60} anchor="start" />
    </g>
  );
};

// 40 — the rest; do the math: 1 : 6
export const S40: React.FC = () => {
  const {cue} = useCue();
  const sl = useSlices({inf: -200, tank: -200, sup: -200, rest: cue('rest')});
  const f = useCurrentFrame();
  const math = cue('math') - 4;
  return (
    <g>
      <MText text="The Answer" x={70} y={112} at={-200} size={70} underline />
      <Fade out={math} outDur={10}>
        <Label text="FIRST ARMY · JUNE 1944" x={620} y={200} at={-200} size={60} />
        <Pie at={-200} slices={sl} />
        <Legend at={-200} color={C.olive} text="infantry" y={420} />
        <Legend at={-200} color={C.steel} text="tanks" y={520} />
        <Legend at={-200} color={C.orange} text="support" y={620} />
        <Legend at={cue('rest')} color={C.blue} text="artillery, engineers, signals" y={720} />
      </Fade>
      {f >= math ? (
        <g>
          <MText text="DO THE MATH" x={960} y={260} at={math} size={90} anchor="middle" underline />
          <Person x={420} y={900} at={cue('every')} hold="rifle" expr="determined" s={1.5} />
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <Person key={i} x={760 + i * 190} y={900} at={cue('six') - 10 + i * 4} hold="none" gear={i === 0 ? 'chef' : i === 3 ? 'medic' : 'cap'} expr="happy" s={1.0} seed={60 + i} uniform={C.khaki} />
          ))}
          <MText text="1 : 6" x={960} y={480} at={cue('soldiers') - 4} size={150} anchor="middle" color={C.red} />
          <Burst x={960} y={430} at={cue('soldiers')} rx={260} ry={120} />
        </g>
      ) : null}
    </g>
  );
};

// 41 — six men he would never meet; the twist
export const S41: React.FC = () => {
  const {cue} = useCue();
  const keys: [string, string][] = [
    ['cook', 'cook'],
    ['driver', 'driver'],
    ['mail', 'mail clerk'],
    ['medic', 'medic'],
    ['engines', 'mechanic'],
    ['roads', 'engineer'],
  ];
  const twist = cue('twist') - 4;
  const sl = useSlices({inf: twist, tank: twist, sup: twist, rest: twist});
  return (
    <g>
      <MText text="The Answer" x={70} y={112} at={-200} size={70} underline />
      <Fade out={twist} outDur={10}>
        <MText text="1 : 6" x={960} y={300} at={-200} size={110} anchor="middle" color={C.red} />
        <Person x={240} y={920} at={-200} hold="rifle" expr="neutral" s={1.4} />
        {keys.map(([k, l], i) => (
          <g key={k}>
            <Person x={560 + i * 230} y={900} at={-200} hold="none" gear={i === 0 ? 'chef' : i === 3 ? 'medic' : 'cap'} expr="happy" s={1.0} seed={60 + i} uniform={C.khaki} />
            <Label text={l} x={560 + i * 230} y={990} at={cue(k)} size={52} color={C.red} />
          </g>
        ))}
        <Label text="he would mostly never meet them" x={960} y={450} at={cue('mostly')} size={56} />
        <Circle x={905} y={800} r={330} at={cue('team') - 2} color={C.green} w={9} dur={14} />
        <Label text="our team!" x={905} y={600} at={cue('team')} size={64} color={C.green} />
      </Fade>
      {useCurrentFrame() >= twist ? (
        <g>
          <MText text="THE TWIST" x={1400} y={300} at={twist} size={90} anchor="middle" underline />
          <Pie at={twist} slices={sl} dim={1} highlight={0} />
          <Label text="the small slice at the front..." x={1400} y={600} at={cue('slice')} size={58} />
          <MText text="paid the biggest price" x={1400} y={720} at={cue('price') - 4} size={64} anchor="middle" color={C.red} underline={C.ink} />
        </g>
      ) : null}
    </g>
  );
};

// 42 — 3 out of 4 killed were infantrymen
export const S42: React.FC = () => {
  const {cue} = useCue();
  const f = useCurrentFrame();
  return (
    <g>
      <MText text="The Answer" x={70} y={112} at={-200} size={70} underline />
      <Label text="American ground soldiers killed in battle" x={960} y={280} at={cue('killed') - 6} size={60} />
      {[0, 1, 2, 3].map((i) => {
        const x = 480 + i * 320;
        const filled = i < 3 && f >= cue('three') + i * 4;
        return (
          <Pop key={i} at={cue('killed') + i * 4} x={x} y={600}>
            <path d={`M${x - 110},620 A110,96 0 0 1 ${x + 110},620 L${x + 135},630 L${x - 135},630 Z`} fill={filled ? C.olive : C.white} stroke={C.ink} strokeWidth={7} strokeLinejoin="round" />
          </Pop>
        );
      })}
      <MText text="3 OUT OF 4: INFANTRY" x={960} y={790} at={cue('infantrymen') - 4} size={80} anchor="middle" underline />
      <Label text="142,962 of 191,701" x={960} y={880} at={cue('infantrymen') + 6} size={50} color={C.steel} />
      <Label text="two sides of the answer" x={960} y={1000} at={cue('two sides') - 4} size={60} />
    </g>
  );
};

// 43 — seven to put one in the line; the danger; the invisible line
export const S43: React.FC = () => {
  const {cue} = useCue();
  const f = useCurrentFrame();
  const battles = cue('Battles') - 4;
  const base: [number, number][] = [[560, 880], [760, 880], [960, 880], [1160, 880], [1360, 880], [1560, 880]];
  return (
    <g>
      <MText text="The Answer" x={70} y={112} at={-200} size={70} underline />
      <Fade out={battles} outDur={10}>
        <MText text="7 SOLDIERS = 1 IN THE LINE" x={960} y={260} at={cue('seven') - 4} size={74} anchor="middle" underline />
        {base.map(([x, y], i) => (
          <Mini key={i} x={x} y={y} at={cue('seven') + i * 2} s={2.4} color={C.khaki} />
        ))}
        <Line pts={[[500, 790], [1620, 790]]} at={cue('infantryman') - 4} w={10} color={C.brown} />
        <Mini x={1060} y={770} at={cue('infantryman')} s={2.8} />
        <Pop at={cue('danger') - 2} x={1060} y={500}>
          <rect x={960} y={420} width={200} height={130} rx={12} fill={C.ink} />
          <text x={1060} y={505} fontFamily="PermanentMarker" fontSize={44} textAnchor="middle" fill={C.yellow}>
            DANGER
          </text>
        </Pop>
        <Pop at={cue('Remember') - 2} x={1650} y={520}>
          <g>
            <Tank x={1650} y={600} at={-200} s={0.6} />
          </g>
        </Pop>
        <Stop x={1760} y={430} at={cue('stopped') - 4} s={0.8} />
      </Fade>
      {f >= battles ? (
        <g>
          <Line pts={[[120, 700], [500, 690], [900, 705], [1300, 695], [1640, 700]]} at={battles} dur={30} w={10} color={C.ink} />
          <Pot x={230} y={640} at={battles + 2} s={0.6} />
          <Truck x={520} y={660} at={battles + 8} s={0.55} />
          <Envelope x={820} y={620} at={battles + 14} s={0.6} />
          <Bag x={1060} y={630} at={battles + 20} s={0.7} />
          <Folder x={1300} y={620} at={battles + 26} label="" s={0.6} />
          <Person x={1720} y={760} at={battles + 30} pose="bust" hold="rifle" expr="determined" s={1.0} />
          <MText text="battles: won at the front" x={960} y={300} at={battles} size={70} anchor="middle" />
          <MText text="wars: won by THE LINE BEHIND" x={960} y={420} at={cue('wars') - 2} size={80} anchor="middle" color={C.red} underline={C.ink} ulAt={cue('invisible')} />
        </g>
      ) : null}
    </g>
  );
};

// 44 — outro: the replacements
export const S44: React.FC = () => {
  const {cue} = useCue();
  return (
    <g>
      <Truck x={560} y={860} at={cue('breaking') - 2} s={1.4} />
      <Person x={1000} y={900} at={cue('teenager') - 4} hold="rifle" expr="worried" s={1.5} />
      <Pop at={cue('nobody') - 4} x={1000} y={420}>
        <text x={1000} y={440} fontFamily="PermanentMarker" fontSize={140} textAnchor="middle" fill={C.steel}>
          ?
        </text>
      </Pop>
      <MText text="NEXT: THE REPLACEMENTS" x={960} y={220} at={cue('Next') - 4} size={86} anchor="middle" underline />
      <Label text="knowing nobody" x={1420} y={700} at={cue('nobody')} size={64} />
    </g>
  );
};

export const _refs = [Mini, Line];
