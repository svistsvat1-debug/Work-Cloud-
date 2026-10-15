// Checks the natural-reading rules in the browser engine and the cloud page against tests/natural_cases.json
// (and the cloud page's German, Spanish and French against tests/natural_cases_cloud.json: its voices read digits themselves,
// except Chatterbox, which gets numbers as words: tests/number_words_cases.json).
// Run from voice-studio/: node tests/check_natural.mjs
import fs from "fs";

const cases = JSON.parse(fs.readFileSync("tests/natural_cases.json", "utf8"));
const cloudCases = JSON.parse(fs.readFileSync("tests/natural_cases_cloud.json", "utf8"));
const blocks = [
  ["web/engine/worker.mjs", "English", "naturalEn", "en", cases],
  ["web/engine/worker.mjs", "German, Spanish", "naturalDe", "de", cases],
  ["web/engine/worker.mjs", "German, Spanish", "naturalEs", "es", cases],
  ["cloud/public/index.html", "English", "naturalEn", "en", cases],
  ["cloud/public/index.html", "German, Spanish, French", "naturalDe", "de", cloudCases],
  ["cloud/public/index.html", "German, Spanish, French", "naturalEs", "es", cloudCases],
  ["cloud/public/index.html", "German, Spanish, French", "naturalFr", "fr", cloudCases],
];
let failed = 0, total = 0;
for (const [file, name, fn, lang, set] of blocks) {
  const src = fs.readFileSync(file, "utf8");
  const start = src.indexOf(`// ---- natural reading (${name})`), end = src.indexOf(`// ---- end natural reading (${name})`);
  const run = new Function(src.slice(start, end) + `\nreturn ${fn};`)();
  for (const [input, want] of set[lang]) {
    const got = run(input);
    total++;
    if (got !== want) { failed++; console.log(`${file} ${fn}: ${JSON.stringify(input)}\n  got  ${JSON.stringify(got)}\n  want ${JSON.stringify(want)}`); }
  }
}
// Numbers as words, for the cloud voices that misread digits (Chatterbox): tests/number_words_cases.json
{
  const src = fs.readFileSync("cloud/public/index.html", "utf8"), set = JSON.parse(fs.readFileSync("tests/number_words_cases.json", "utf8"));
  const start = src.indexOf("// ---- numbers as words"), end = src.indexOf("// ---- end numbers as words");
  const run = new Function(src.slice(start, end) + "\nreturn numbersToWords;")();
  for (const [lang, list] of Object.entries(set)) for (const [input, want] of list) {
    const got = run(input, lang);
    total++;
    if (got !== want) { failed++; console.log(`numbersToWords ${lang}: ${JSON.stringify(input)}\n  got  ${JSON.stringify(got)}\n  want ${JSON.stringify(want)}`); }
  }
}
console.log(failed ? `${failed} of ${total} failed` : `all ${total} passed`);
process.exit(failed ? 1 : 0);
