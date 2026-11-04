// Bundle once to build/ (Remotion copies public/ into the bundle)
import {bundle} from '@remotion/bundler';
import path from 'node:path';
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
await bundle({entryPoint: path.join(root, 'src/index.ts'), outDir: path.join(root, 'build'), publicDir: path.join(root, 'public')});
console.log('bundled -> build/');
