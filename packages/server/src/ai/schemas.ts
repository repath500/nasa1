import { z } from 'zod';
import type { AskFilters, JevJudgement, Pillar } from '@fire/contracts';

export const PILLARS = ['prevention', 'detection', 'suppression', 'fundamental', 'unknown'] as const;
export const CONCERNS = ['prevention', 'detection', 'suppression', 'explore'] as const;
export const FUEL_PHASES = ['solid', 'liquid-droplet', 'gas', 'aerosol', 'unknown'] as const;
export const PRESET_IDS = ['earth-iss', 'lunar-cabin-example', 'exploration-upper', 'suit'] as const;
export const SCENARIO_IDS = [...PRESET_IDS, 'custom'] as const;

export const NoulAnswerSchema = z.object({
  type: z.literal('noul'),
  noul: z.number().min(0).max(1),
  confidence: z.number().min(0).max(1).optional(),
});

export const ChoiceAnswerSchema = z.object({
  type: z.literal('choice'),
  choice: z.enum(PILLARS),
  confidence: z.number().min(0).max(1),
  probabilities: z.record(z.string(), z.number().min(0).max(1)),
});

export const ScoreAnswerSchema = z.object({
  type: z.literal('score'),
  score: z.number().finite(),
  confidence: z.number().min(0).max(1),
  probabilities: z.record(z.string(), z.number().min(0).max(1)),
});

export const JevUpstreamSchema = z.object({
  model: z.string().min(1).max(80),
  answers: z.object({
    pillar: ChoiceAnswerSchema,
    regime_relevance: NoulAnswerSchema,
    evidence_directness: ScoreAnswerSchema,
  }),
});

export const DecisionUpstreamSchema = z.object({
  answers: z.object({
    pillar: ChoiceAnswerSchema,
    regime_relevance: NoulAnswerSchema,
    evidence_directness: ScoreAnswerSchema,
  }),
});

const judgementSource = z.enum(['jev-live', 'decision-1', 'cache', 'fixture']);

export const JevJudgementSchema = z.object({
  accession: z.string().min(1).max(40),
  scenarioId: z.enum(SCENARIO_IDS),
  regimeRelevance: z.number().min(0).max(1).nullable(),
  evidenceDirectness: z.number().min(0).max(3).nullable(),
  directnessProbs: z.array(z.number().min(0).max(1)).length(4).nullable(),
  pillar: z
    .object({
      choice: z.enum(PILLARS),
      probabilities: z.record(z.string(), z.number().min(0).max(1)),
      confidence: z.number().min(0).max(1),
    })
    .nullable(),
  source: judgementSource,
  modelId: z.string().min(1).max(80),
  recordedAt: z.string().min(1).max(40),
});

export const JevJudgementsSchema = z.array(JevJudgementSchema);

export const CachedRankSchema = z.object({
  level: z.enum(['L0-live', 'L1-decision-1', 'L2-cache', 'L3-baseline']),
  modelId: z.string().min(1).max(80),
  recordedAt: z.string().min(1).max(40),
  judgements: JevJudgementsSchema,
});

export const AskFiltersSchema = z.object({
  material: z.string().min(1).max(80).nullable(),
  fuelPhase: z.enum(FUEL_PHASES).nullable(),
  scenarioId: z.enum(SCENARIO_IDS).nullable(),
  concern: z.enum(CONCERNS).nullable(),
  o2Pct: z.number().min(0).max(100).nullable(),
  totalKpa: z.number().positive().max(5000).nullable(),
});

export const AskUpstreamSchema = AskFiltersSchema;

export const ExplainUpstreamSchema = z.object({
  summary: z.string().min(1).max(1200),
  claim_ids: z.array(z.string().min(1).max(80)).max(20),
  limitations: z.array(z.string().max(300)).max(10),
});

export const NarrationAlignmentSchema = z.object({
  characters: z.array(z.string()),
  character_start_times_seconds: z.array(z.number().finite()),
  character_end_times_seconds: z.array(z.number().finite()),
});

export const ElevenLabsResponseSchema = z.object({
  audio_base64: z.string().min(1),
  alignment: NarrationAlignmentSchema.nullable().optional(),
  normalized_alignment: NarrationAlignmentSchema.nullable().optional(),
});

export const CheckoutRequestSchema = z
  .object({
    plan: z.enum(['researcher', 'lab', 'support']),
    interval: z.enum(['month', 'year', 'once']),
    amountCents: z.number().int().min(100).max(500000).optional(),
  })
  .superRefine((value, ctx) => {
    if (value.plan === 'support' && value.interval !== 'once') {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'support requires interval once', path: ['interval'] });
    }
    if (value.plan !== 'support' && value.interval === 'once') {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'subscriptions require month or year', path: ['interval'] });
    }
    if (value.amountCents !== undefined && value.plan !== 'support') {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'custom amount is support only', path: ['amountCents'] });
    }
    if (value.plan === 'lab' && value.interval === 'year') {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'lab yearly price is not configured', path: ['interval'] });
    }
  });

export const LicenseTokenPayloadSchema = z
  .object({
    plan: z.enum(['explorer', 'researcher', 'lab']),
    customer: z.string().min(1).max(120),
    exp: z.number().int().positive(),
    nonce: z.string().min(8).max(80),
  })
  .strict();

export const LicenseClaimSchema = z.object({ sessionId: z.string().min(8).max(200) });

export const StripeSessionSchema = z
  .object({
    id: z.string().min(3),
    object: z.literal('checkout.session').optional(),
    status: z.string().nullable().optional(),
    payment_status: z.string().nullable().optional(),
    mode: z.string().nullable().optional(),
    customer: z.union([z.string(), z.object({ id: z.string() }).passthrough()]).nullable().optional(),
    subscription: z.union([z.string(), z.object({ id: z.string() }).passthrough()]).nullable().optional(),
    metadata: z.record(z.string(), z.string()).nullable().optional(),
    amount_total: z.number().nullable().optional(),
  })
  .passthrough();

export const StripeSubscriptionSchema = z
  .object({
    id: z.string().min(3),
    status: z.string().optional(),
    current_period_end: z.number().int().optional(),
    customer: z.union([z.string(), z.object({ id: z.string() }).passthrough()]).nullable().optional(),
    metadata: z.record(z.string(), z.string()).nullable().optional(),
  })
  .passthrough();

export const StripeCheckoutResponseSchema = z.object({ url: z.string().url() }).passthrough();

export const StripePortalResponseSchema = z.object({ url: z.string().url() }).passthrough();

export const PlanForToken = (plan: string): 'explorer' | 'researcher' | 'lab' => {
  if (plan === 'researcher' || plan === 'lab') return plan;
  return 'explorer';
};

export const toPillarRecord = (value: unknown): Partial<Record<Pillar, number>> => {
  if (!value || typeof value !== 'object') return {};
  const out: Partial<Record<Pillar, number>> = {};
  for (const pillar of PILLARS) {
    const raw = (value as Record<string, unknown>)[pillar];
    if (typeof raw === 'number' && Number.isFinite(raw)) out[pillar] = raw;
  }
  return out;
};

export type CachedRank = z.infer<typeof CachedRankSchema>;
export type StoredJudgement = JevJudgement;
export type AskFilterInput = AskFilters;

export const RankRequestSchema = z.object({
  scenarioId: z.enum(PRESET_IDS),
  concern: z.enum(CONCERNS),
  corpusHash: z.string().regex(/^[0-9a-f]{8,128}$/i),
});

export const AskRequestSchema = z.object({
  question: z.string().trim().min(1).max(200),
});

export const ExplainRequestSchema = z.object({
  accession: z.string().min(1).max(40),
  scenarioId: z.enum(PRESET_IDS),
});

export const NarrateRequestSchema = z
  .object({
    scenarioKey: z.string().min(1).max(80).optional(),
    customScenario: z
      .object({
        o2Pct: z.number().min(0).max(100),
        totalKpa: z.number().positive().max(5000),
        concern: z.enum(CONCERNS),
      })
      .optional(),
  })
  .superRefine((value, ctx) => {
    if (!value.scenarioKey && !value.customScenario) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'scenarioKey or customScenario required' });
    }
    if (value.scenarioKey && value.customScenario) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'send one of scenarioKey or customScenario' });
    }
  });

export const NarrationCueSchema = z.discriminatedUnion('kind', [
  z.object({ at: z.number().min(0), kind: z.literal('focusHabitat'), habitat: z.enum(SCENARIO_IDS) }),
  z.object({ at: z.number().min(0), kind: z.literal('highlightRows'), rowIds: z.array(z.string()) }),
  z.object({ at: z.number().min(0), kind: z.literal('filterPhase'), phases: z.array(z.enum(FUEL_PHASES)) }),
  z.object({ at: z.number().min(0), kind: z.literal('openStudy'), accession: z.string() }),
  z.object({ at: z.number().min(0), kind: z.literal('openLedger') }),
  z.object({ at: z.number().min(0), kind: z.literal('clear') }),
]);

export const NarrationManifestSchema = z.object({
  scenarioKey: z.string().min(1).max(120),
  scriptHash: z.string().min(16).max(128),
  segments: z.array(
    z.object({
      id: z.string().min(1),
      title: z.string().min(1),
      text: z.string().min(1),
      claimIds: z.array(z.string()),
      cues: z.array(NarrationCueSchema),
      startSec: z.number().min(0).nullable(),
      endSec: z.number().min(0).nullable(),
    }),
  ),
  words: z.array(z.object({ w: z.string(), start: z.number(), end: z.number() })).nullable(),
  audioUrl: z.string().nullable(),
  voice: z.object({
    provider: z.enum(['elevenlabs', 'device', 'none']),
    voiceId: z.string().nullable(),
    modelId: z.string().nullable(),
  }),
  generatedAt: z.string().min(1),
  disclosure: z.string().min(1),
});
