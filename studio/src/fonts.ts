import {loadFont} from '@remotion/fonts';
import {staticFile} from 'remotion';

const faces: [string, number][] = [
  ['Montserrat', 800],
  ['Montserrat', 900],
  ['Inter', 400],
  ['Inter', 500],
  ['Inter', 600],
  ['Inter', 700],
  ['Inter', 800],
];

for (const [family, weight] of faces) {
  loadFont({
    family,
    weight: String(weight),
    url: staticFile(`fonts/${family.toLowerCase()}-latin-${weight}-normal.woff2`),
  });
}
