// Checks the natural-reading rules in the browser engine and the cloud page against tests/natural_cases.json.
// Run from voice-studio/: node tests/check_natural.mjs
import fs from "fs";

const cases = JSON.parse(fs.readFileSync("tests/natural_cases.json", "utf8"));
const blocks = [
  ["web/engine/worker.mjs", "English", "naturalEn", "en"],
  ["web/engine/worker.mjs", "German, Spanish", "naturalDe", "de"],
  ["web/engine/worker.mjs", "German, Spanish", "naturalEs", "es"],
  ["cloud/public/index.html", "English", "naturalEn", "en"],
];
let failed = 0;
for (const [file, name, fn, lang] of blocks) {
  const src = fs.readFileSync(file, "utf8");
  const start = src.indexOf(`// ---- natural reading (${name})`), end = src.indexOf(`// ---- end natural reading (${name})`);
  const run = new Function(src.slice(start, end) + `\nreturn ${fn};`)();
  for (const [input, want] of cases[lang]) {
    const got = run(input);
    if (got !== want) { failed++; console.log(`${file} ${fn}: ${JSON.stringify(input)}\n  got  ${JSON.stringify(got)}\n  want ${JSON.stringify(want)}`); }
  }
}
console.log(failed ? `${failed} failed` : "all passed");
process.exit(failed ? 1 : 0);
