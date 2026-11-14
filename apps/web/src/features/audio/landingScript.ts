import type { NarrationManifest } from '@fire/contracts';

/** Local fallback for the 30 second landing overview when /audio/landing.json is not built yet. Plain copy, no numerals, no claims. */
export const LANDING_FALLBACK: NarrationManifest = {
  scenarioKey: 'landing',
  scriptHash: 'local-landing-fallback',
  disclosure: 'This fallback overview is read by your device voice. No AI voice service is called.',
  generatedAt: '2026-11-14T00:00:00Z',
  audioUrl: null,
  words: null,
  voice: { provider: 'none', voiceId: null, modelId: null },
  segments: [
    { id: 'intro', title: 'Intro', text: 'This fallback overview is read by your device voice. Fire Atlas maps reported test conditions from a curated set of NASA microgravity fire tests against the air of future habitats.', claimIds: [], cues: [], startSec: null, endSec: null },
    { id: 'how', title: 'How it works', text: 'Pick the air your crew will breathe. The map shows which tests ran near it, and where the record is thin or silent.', claimIds: [], cues: [], startSec: null, endSec: null },
    { id: 'source', title: 'Open the source', text: 'Every dot opens its source row, with a hash and a link to the paper. Nothing is shown that code could not trace.', claimIds: [], cues: [], startSec: null, endSec: null },
  ],
};
