import { Reveal } from './Reveal';

/**
 * How we built it: the human process behind the app, and the decisions we made ourselves.
 * Layout family: timeline rail plus a decision list.
 */
const STEPS: { title: string; body: string }[] = [
  {
    title: 'Talked it through and shaped the plan',
    body: 'We read the Space Apps challenges, argued about which one we could do justice to in a weekend, picked Flame in Freefall, and kept refining the idea until it was one clear question: has NASA tested fire in the air future crews will breathe?',
  },
  {
    title: 'Researched with Perplexity',
    body: 'We used Perplexity to find our way around NASA’s Physical Sciences Informatics archive, the technical reports behind experiments such as FLEX, BASS and Saffire, and how other teams had approached the challenge.',
  },
  {
    title: 'Learned the science with Claude and ChatGPT',
    body: 'Neither of us is a combustion scientist, so we used Claude and ChatGPT as tutors: what a flame is without gravity, why it turns into a slow blue sphere, how oxygen fraction and pressure differ, and why a Moon base with more oxygen at lower pressure changes the risk picture. We then checked what we learned against NASA’s own sources.',
  },
  {
    title: 'Built it with AI coding agents, to our spec',
    body: 'We wrote the plan and the rules, then had AI coding agents build parts in parallel while we reviewed, merged and tested. Every agent commit is labelled in the history.',
  },
];

const DECISIONS: string[] = [
  'Flame in Freefall over the other challenges, because the data was real and the question mattered for the Moon.',
  'A map of tested air against habitat air, not a chatbot. You should see the evidence, not be told about it.',
  'Code owns every number. AI only judges and explains, and every AI output is labelled.',
  'A missing value is shown as unknown, never as zero or “not tested”.',
  'No guesses about lunar or Martian gravity. Partial-gravity combustion data: none in PSI.',
  'Two rankings side by side, so anyone can see whether the AI adds anything.',
  'Free and open source. No accounts, no payments, no paywall on NASA’s data.',
  'A dithered, mission-control look, with the dither kept off the numbers so the data stays sharp.',
];

export function Process() {
  return (
    <Reveal aria-labelledby="process-h" className="border-t border-hairline bg-surface">
      <div className="mx-auto max-w-[1280px] px-4 py-20 md:px-8 lg:py-28">
        <h2 id="process-h" className="max-w-[20ch] text-4xl leading-[1.05] md:text-5xl">How we built it</h2>
        <div className="mt-12 grid gap-14 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-16">
          <ol className="relative space-y-10 border-l border-hairline pl-8" aria-label="Our process">
            {STEPS.map((step) => (
              <li key={step.title} className="relative">
                <span aria-hidden className="absolute -left-[37px] top-1.5 h-3 w-3 border border-accent bg-bg" />
                <h3 className="text-xl leading-snug md:text-2xl">{step.title}</h3>
                <p className="mt-3 max-w-[62ch] text-muted">{step.body}</p>
              </li>
            ))}
          </ol>
          <div>
            <h3 className="text-xl md:text-2xl">Things we decided</h3>
            <ul className="mt-5 grid gap-px border border-hairline bg-hairline">
              {DECISIONS.map((decision) => (
                <li key={decision} className="bg-bg px-4 py-3 text-[15px] leading-6 text-ink/90">{decision}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </Reveal>
  );
}
