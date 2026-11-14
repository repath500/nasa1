/**
 * Gate G3 (BUILD_PLAN §4.2): does Jev earn its place beside the transparent baseline?
 *
 *   pnpm g3:label        one person labels (study x habitat) pairs, blind to any ranking or model output
 *   pnpm g3:adjudicate   merges two labellers; a person settles each disagreement
 *   pnpm g3:metrics      top-3 hit rate and Spearman for baseline vs Jev, Wilson 95% interval, keep/hide decision
 *
 * Labels are human input only. Nothing here generates a label.
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { DEFAULT_PRIORITY, DEFAULT_TOLERANCES, PRESETS, type Concern, type Corpus, type JevJudgement } from '@fire/contracts';
import { baselineRankAll, jevRank } from '@fire/core';
import { CORE_STUDIES } from '../src/ai/studies.ts';
import { keepJevColumn, spearman, wilson95 } from '../src/ai/g3.ts';

export type Ask = (question: string) => Promise<string>;
export type Say = (line: string) => void;
type PresetId = 'earth-iss' | 'lunar-cabin-example' | 'exploration-upper' | 'suit';
const PRESET_IDS: PresetId[] = ['earth-iss', 'lunar-cabin-example', 'exploration-upper', 'suit'];
/** 2 = belongs in the top 3 to read first, 1 = relevant, 0 = not relevant. */
type Label = 0 | 1 | 2;
interface LabelFile { name: string; concern: Concern; labelledAt: string; labels: Record<string, Label> }
interface Adjudicated { concern: Concern; labellers: string[]; adjudicator: string | null; at: string; labels: Record<string, Label>; disagreements: { pair: string; labels: Label[]; final: Label }[] }

const pairKey = (scenario: PresetId, accession: string) => `${scenario}|${accession}`;
const slug = (name: string) => name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const write = (path: string, value: unknown) => { mkdirSync(join(path, '..'), { recursive: true }); writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, 'utf8'); };

async function askName(ask: Ask, say: Say): Promise<string> {
  for (;;) {
    const name = (await ask('Your full name (typed by you): ')).trim();
    if (name.length >= 2) return name;
    say('A name is required.');
  }
}

async function askLabel(ask: Ask, prompt: string): Promise<Label | null> {
  for (;;) {
    const answer = (await ask(prompt)).trim().toLowerCase();
    if (answer === '2' || answer === '1' || answer === '0') return Number(answer) as Label;
    if (answer === 'q') return null;
  }
}

export async function label(dir: string, concern: Concern, ask: Ask, say: Say, now = () => new Date().toISOString()): Promise<LabelFile | null> {
  const name = await askName(ask, say);
  const file: LabelFile = { name, concern, labelledAt: now(), labels: {} };
  say(`\nLabelling for the "${concern}" question. You see only the habitat and each study's own description: no ranking, no model output.`);
  say('Answer 2 (read first: top 3), 1 (relevant), 0 (not relevant), or q to stop and save.\n');
  outer: for (const scenarioId of PRESET_IDS) {
    const scenario = PRESETS[scenarioId];
    say(`\n=== ${scenario.label}: ${scenario.o2Pct}% O2 at ${scenario.totalKpa} kPa (${scenario.sourceNote}) ===`);
    for (const study of CORE_STUDIES) {
      say(`\n${study.acronym} (${study.accession}): ${study.title}\n  ${study.objective}\n  Fuel: ${study.phases.join(', ')}. Hardware: ${study.hardware}.`);
      const value = await askLabel(ask, 'Label [2/1/0, q]: ');
      if (value === null) break outer;
      file.labels[pairKey(scenarioId, study.accession)] = value;
    }
  }
  const count = Object.keys(file.labels).length;
  if (count === 0) { say('Nothing labelled.'); return null; }
  write(join(dir, `labeller-${slug(name)}.json`), file);
  say(`\nSaved ${count} labels to data/labels/labeller-${slug(name)}.json. At least 16 pairs from two people are needed.`);
  return file;
}

export async function adjudicate(dir: string, ask: Ask, say: Say, now = () => new Date().toISOString()): Promise<Adjudicated | null> {
  const files = existsSync(dir) ? readdirSync(dir).filter((f) => f.startsWith('labeller-') && f.endsWith('.json')) : [];
  const labellers = files.map((f) => JSON.parse(readFileSync(join(dir, f), 'utf8')) as LabelFile);
  if (labellers.length < 2) { say('Two independent labellers are needed first (pnpm g3:label, run by two people).'); return null; }
  const [a, b] = labellers as [LabelFile, LabelFile];
  if (slug(a.name) === slug(b.name)) { say('The two label files are from the same person.'); return null; }
  const shared = Object.keys(a.labels).filter((pair) => pair in b.labels);
  const result: Adjudicated = { concern: a.concern, labellers: [a.name, b.name], adjudicator: null, at: now(), labels: {}, disagreements: [] };
  const conflicts = shared.filter((pair) => a.labels[pair] !== b.labels[pair]);
  if (conflicts.length) {
    say(`${conflicts.length} disagreements. A person settles each one.`);
    result.adjudicator = await askName(ask, say);
  }
  for (const pair of shared) {
    const left = a.labels[pair]!, right = b.labels[pair]!;
    if (left === right) { result.labels[pair] = left; continue; }
    const final = await askLabel(ask, `${pair}: ${a.name} said ${left}, ${b.name} said ${right}. Final [2/1/0]: `);
    if (final === null) { say('Stopped; nothing saved.'); return null; }
    result.labels[pair] = final;
    result.disagreements.push({ pair, labels: [left, right], final });
  }
  write(join(dir, 'adjudicated.json'), result);
  say(`Saved ${shared.length} adjudicated pairs (${result.disagreements.length} disagreements settled).`);
  return result;
}

export interface Metrics {
  pairs: number; labellers: number; concern: Concern;
  baseline: { top3HitRate: number | null; hits: number; possible: number; ci: ReturnType<typeof wilson95>; spearman: number | null };
  jev: { top3HitRate: number | null; hits: number; possible: number; ci: ReturnType<typeof wilson95>; spearman: number | null; scenariosWithJudgements: number };
  keep: boolean;
  sentence: string;
}

function scoreOrder(order: string[], truth: Record<string, Label>, scenarioId: PresetId) {
  const labelled = order.filter((accession) => pairKey(scenarioId, accession) in truth);
  const top = new Set(labelled.filter((accession) => truth[pairKey(scenarioId, accession)] === 2));
  const possible = Math.min(3, top.size);
  const hits = labelled.slice(0, 3).filter((accession) => top.has(accession)).length;
  const rho = spearman(labelled.map((_, index) => -index), labelled.map((accession) => truth[pairKey(scenarioId, accession)]!));
  return { hits: Math.min(hits, possible), possible, rho };
}

export function computeMetrics(corpus: Corpus, adjudicated: Adjudicated, judgements: JevJudgement[], prefs: { informativeDisagreement: boolean; reviewersPreferJev: boolean }): Metrics {
  const concern = adjudicated.concern;
  const tally = () => ({ hits: 0, possible: 0, rhos: [] as number[] });
  const base = tally(), jev = tally();
  let scenariosWithJudgements = 0;
  for (const scenarioId of PRESET_IDS) {
    const order = baselineRankAll(corpus.cards, corpus.rows, PRESETS[scenarioId], concern, DEFAULT_TOLERANCES, DEFAULT_PRIORITY).map((row) => row.accession);
    const b = scoreOrder(order, adjudicated.labels, scenarioId);
    base.hits += b.hits; base.possible += b.possible; if (b.rho !== null) base.rhos.push(b.rho);
    const forScenario = judgements.filter((judgement) => judgement.scenarioId === scenarioId);
    if (!forScenario.length) continue;
    scenariosWithJudgements++;
    const j = scoreOrder(jevRank(forScenario, concern, order).map((judgement) => judgement.accession), adjudicated.labels, scenarioId);
    jev.hits += j.hits; jev.possible += j.possible; if (j.rho !== null) jev.rhos.push(j.rho);
  }
  const mean = (values: number[]) => (values.length ? values.reduce((a, b) => a + b, 0) / values.length : null);
  const rate = (t: { hits: number; possible: number }) => (t.possible ? t.hits / t.possible : null);
  const pairs = Object.keys(adjudicated.labels).length;
  const keep = keepJevColumn({
    adjudicatedPairs: pairs, independentLabellers: adjudicated.labellers.length,
    baselineTop3HitRate: rate(base), jevTop3HitRate: scenariosWithJudgements ? rate(jev) : null, ...prefs,
  });
  const sentence = !scenariosWithJudgements
    ? 'No recorded Jev judgements yet, so G3 cannot be decided. The Jev ranking column stays hidden.'
    : keep
      ? `Jev was not worse than the baseline on top-3 picks (${rate(jev)?.toFixed(2)} vs ${rate(base)?.toFixed(2)}, n=${pairs} pairs) and reviewers found its differences useful. Show the Jev column beside the baseline.`
      : `Jev did not improve on the transparent baseline here (top-3 ${rate(jev)?.toFixed(2)} vs ${rate(base)?.toFixed(2)}, n=${pairs} pairs). Hide the Jev ranking column and say so.`;
  return {
    pairs, labellers: adjudicated.labellers.length, concern,
    baseline: { top3HitRate: rate(base), hits: base.hits, possible: base.possible, ci: wilson95(base.hits, base.possible), spearman: mean(base.rhos) },
    jev: { top3HitRate: rate(jev), hits: jev.hits, possible: jev.possible, ci: wilson95(jev.hits, jev.possible), spearman: mean(jev.rhos), scenariosWithJudgements },
    keep, sentence,
  };
}

export function loadRecordedJudgements(repoRoot: string, concern: Concern): JevJudgement[] {
  const dir = join(repoRoot, 'cache/model_responses');
  if (!existsSync(dir)) return [];
  return readdirSync(dir).filter((f) => f.endsWith('.json')).map((f) => JSON.parse(readFileSync(join(dir, f), 'utf8')) as { concern: Concern; scenarioId: JevJudgement['scenarioId']; median: JevJudgement })
    .filter((record) => record.concern === concern).map((record) => ({ ...record.median, scenarioId: record.scenarioId }));
}

export async function metrics(repoRoot: string, ask: Ask, say: Say): Promise<Metrics | null> {
  const dir = join(repoRoot, 'data/labels');
  const adjudicatedPath = join(dir, 'adjudicated.json');
  if (!existsSync(adjudicatedPath)) { say('Run pnpm g3:adjudicate first.'); return null; }
  const adjudicated = JSON.parse(readFileSync(adjudicatedPath, 'utf8')) as Adjudicated;
  const corpus = JSON.parse(readFileSync(join(repoRoot, 'data/corpus.v1.json'), 'utf8')) as Corpus;
  const judgements = loadRecordedJudgements(repoRoot, adjudicated.concern);
  say('These two questions come AFTER labelling, when reviewers have seen both orders in the app.');
  const yes = async (q: string) => (await ask(`${q} [y/n]: `)).trim().toLowerCase().startsWith('y');
  const informativeDisagreement = await yes('Did a disagreement between Jev and the baseline point reviewers to something useful?');
  const reviewersPreferJev = await yes('Do reviewers prefer the Jev order?');
  const result = computeMetrics(corpus, adjudicated, judgements, { informativeDisagreement, reviewersPreferJev });
  write(join(dir, 'g3-report.json'), result);
  const pct = (v: number | null) => (v === null ? 'n/a' : `${(v * 100).toFixed(0)}%`);
  const ci = (c: ReturnType<typeof wilson95>) => (c ? `${pct(c.lower)} to ${pct(c.upper)}` : 'n/a');
  writeFileSync(join(dir, 'g3-report.md'), [
    '# G3 report: does Jev earn its place?', '',
    `Concern: ${result.concern}. Adjudicated pairs: ${result.pairs}. Independent labellers: ${result.labellers}.`, '',
    '| Method | Top-3 hit rate | 95% interval (Wilson) | Mean Spearman |', '|---|---|---|---|',
    `| Transparent baseline (code) | ${pct(result.baseline.top3HitRate)} (${result.baseline.hits}/${result.baseline.possible}) | ${ci(result.baseline.ci)} | ${result.baseline.spearman?.toFixed(2) ?? 'n/a'} |`,
    `| Jev (median of 3 calls) | ${pct(result.jev.top3HitRate)} (${result.jev.hits}/${result.jev.possible}) | ${ci(result.jev.ci)} | ${result.jev.spearman?.toFixed(2) ?? 'n/a'} |`, '',
    `**Decision:** ${result.sentence}`, '',
    'This is a small smoke test, not calibration. Jev values are ordinal model judgements, not probabilities that the science is true.', '',
  ].join('\n'));
  say(`\n${result.sentence}\nReport: data/labels/g3-report.md`);
  return result;
}

async function main() {
  const repoRoot = new URL('../../../', import.meta.url).pathname;
  const { createInterface } = await import('node:readline/promises');
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const ask: Ask = (q) => rl.question(q);
  const say: Say = (line) => console.log(line);
  const [command, concernArg] = process.argv.slice(2);
  const concern = (['prevention', 'detection', 'suppression'].includes(concernArg ?? '') ? concernArg : 'prevention') as Concern;
  try {
    if (command === 'label') await label(join(repoRoot, 'data/labels'), concern, ask, say);
    else if (command === 'adjudicate') await adjudicate(join(repoRoot, 'data/labels'), ask, say);
    else if (command === 'metrics') await metrics(repoRoot, ask, say);
    else say('Usage: pnpm g3:label [prevention|detection|suppression] | pnpm g3:adjudicate | pnpm g3:metrics');
  } finally {
    rl.close();
  }
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) main();
