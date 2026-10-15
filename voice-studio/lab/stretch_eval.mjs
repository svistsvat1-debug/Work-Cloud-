// Round 9: the page's time stretch (cloud/public/index.html, "time stretch" block) on real takes, so evaluate.py can
// score the slowed voice: is a Chatterbox voice slowed to a narrator's pace still natural? Kokoro slowed this way is
// compared with Kokoro's own speed setting. Usage: node stretch_eval.mjs   (reads and extends out/synth.json)
import fs from "fs";

const page = fs.readFileSync("../cloud/public/index.html", "utf8");
const stretch = new Function(page.slice(page.indexOf("// ---- time stretch"), page.indexOf("// ---- end time stretch")) + "; return stretch;")();
const JOBS = [ // id regex, speeds
  [/^de-cb8-de_cb-v3@r8/, [0.9]], [/^es-cb7-es_cb-v2@r7/, [0.9]], [/^fr-cb7-fr_cb-v2@r7/, [0.8, 0.85]],
  [/^fr-cb8-fr_f_n1-v3@r8/, [0.9]], [/^en-kokoro-(af_heart|bf_emma)@r6long/, [0.9]],
];

function readWav(path) {
  const b = fs.readFileSync(path);
  let off = 12, fmt = null;
  while (off + 8 <= b.length) {
    const id = b.toString("ascii", off, off + 4), size = b.readUInt32LE(off + 4), body = off + 8;
    if (id === "fmt ") fmt = { format: b.readUInt16LE(body), channels: b.readUInt16LE(body + 2), rate: b.readUInt32LE(body + 4), bits: b.readUInt16LE(body + 14) };
    if (id === "data") {
      const n = Math.floor((Math.min(size, b.length - body)) / (fmt.bits / 8) / fmt.channels), x = new Float32Array(n);
      for (let i = 0; i < n; i++) {
        const p = body + i * fmt.channels * (fmt.bits / 8);
        x[i] = fmt.bits === 16 ? b.readInt16LE(p) / 32768 : fmt.format === 3 ? b.readFloatLE(p) : b.readInt32LE(p) / 2 ** 31;
      }
      return { x, rate: fmt.rate };
    }
    off = body + size + (size % 2);
  }
  throw new Error("no data chunk in " + path);
}
function writeWav(path, x, rate) {
  const b = Buffer.alloc(44 + x.length * 2);
  b.write("RIFF", 0); b.writeUInt32LE(36 + x.length * 2, 4); b.write("WAVEfmt ", 8); b.writeUInt32LE(16, 16); b.writeUInt16LE(1, 20);
  b.writeUInt16LE(1, 22); b.writeUInt32LE(rate, 24); b.writeUInt32LE(rate * 2, 28); b.writeUInt16LE(2, 32); b.writeUInt16LE(16, 34);
  b.write("data", 36); b.writeUInt32LE(x.length * 2, 40);
  for (let i = 0; i < x.length; i++) b.writeInt16LE(Math.round(Math.max(-1, Math.min(1, x[i])) * 32767), 44 + i * 2);
  fs.writeFileSync(path, b);
}

const synth = JSON.parse(fs.readFileSync("out/synth.json", "utf8"));
const added = [];
for (const r of synth) {
  if (!r.ok || !r.file || r.id.includes("@r9")) continue;
  for (const [re, speeds] of JOBS) {
    if (!re.test(r.id)) continue;
    const { x, rate } = readWav(r.file);
    if (rate !== 24000) { console.log(`skip ${r.id}: ${rate} Hz (the page works at 24 kHz)`); continue; }
    for (const sp of speeds) {
      const t0 = performance.now(), y = stretch(x, sp), ms = performance.now() - t0;
      const [voice, text] = r.id.split(/@r\d+/);
      const id = `${voice}-st${String(Math.round(sp * 100)).padStart(3, "0")}@r9${text}`, file = `out/audio/${id.replace("@", "__")}.wav`;
      writeWav(file, y, rate);
      added.push({ ...r, id, file, new: true, params: { ...r.params, stretch: sp } });
      console.log(`${id}: ${(x.length / rate).toFixed(2)}s -> ${(y.length / rate).toFixed(2)}s in ${ms.toFixed(0)} ms`);
    }
  }
}
fs.writeFileSync("out/synth.json", JSON.stringify([...synth.filter((r) => !r.id.includes("@r9")), ...added], null, 1));
console.log(added.length, "stretched takes");
