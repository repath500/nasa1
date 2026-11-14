/** `pnpm review` (gold records) and `pnpm review:sign k5|d5` (gates). A person runs these; agents never do. */
import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';
import { runReview, runSign } from './review.ts';

const rl = createInterface({ input: stdin, output: stdout });
const ask = (question: string) => rl.question(question);
const say = (line: string) => console.log(line);
const [command, gate] = process.argv.slice(2);

try {
  if (command === 'sign') {
    if (gate !== 'k5' && gate !== 'd5') throw new Error('Usage: pnpm review:sign k5|d5');
    await runSign(gate, ask, say);
  } else {
    await runReview(ask, say);
  }
} finally {
  rl.close();
}
