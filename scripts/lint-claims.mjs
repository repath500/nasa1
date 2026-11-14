// SPEC §0.7 / §16: never-claim and dash lint over user-facing sources.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const ROOTS = ['apps/web/src', 'packages/core/src/narration', 'apps/web/public/audio'];
const EXT = /\.(tsx?|json|md)$/;
const RULES = [
  [/[—–]/, 'em or en dash in user-facing text'],
  [/\b(un)?safe\b/i, '"safe"/"unsafe"'],
  [/\bcertif(y|ied|ication)\b/i, 'certification language'],
  [/\bvalidated\b/i, '"validated"'],
  [/\bpredicts?\b/i, '"predicts"'],
  [/\bfire risk\b/i, '"fire risk"'],
  [/\bnone exists?\b/i, 'write "none in PSI"'],
  [/\b(novel|unprecedented|first[- ]of[- ]its[- ]kind|world'?s first|the first (?:tool|atlas|app|dashboard|platform)|first ever)\b/i, 'unsupported novelty claim'],
  [/\b(calibrated|predictive model|NASA[- ]approved|guarantee[sd]?)\b/i, 'never-claim list (RED_TEAM 2b)'],
  [/\b(bound|bounds) the Moon\b/i, 'partial-gravity inference'],
  [/\bextinction limit\b/i, 'write "visible flame extinction diameter"'],
  [/lunar gravity is safer/i, 'partial-gravity claim'],
];
// Lines may opt out with `lint-claims-ignore` (e.g. the lint rules themselves, flight-rules page quoting banned phrases).
const walk = (d) => { try { return readdirSync(d).flatMap((f) => { const p = join(d, f); return statSync(p).isDirectory() ? walk(p) : EXT.test(p) ? [p] : []; }); } catch { return []; } };
let hits = 0;
for (const file of ROOTS.flatMap(walk)) {
  readFileSync(file, 'utf8').split('\n').forEach((line, i) => {
    if (line.includes('lint-claims-ignore')) return;
    // Only check string-ish content: quoted text and JSX text. Cheap heuristic: skip pure import lines.
    if (/^\s*(import\s|\/\/|\/\*|\*)/.test(line)) return;
    for (const [re, why] of RULES) if (re.test(line)) { hits++; console.log(`${file}:${i + 1}  ${why}\n    ${line.trim().slice(0, 140)}`); }
  });
}
if (hits) { console.error(`\nlint:claims found ${hits} issue(s).`); process.exit(1); }
console.log('lint:claims clean');
