/** SPEC §5.2. Prices are proposals (D21). Shared by the pricing page and the landing teaser. */
export type PlanId = 'explorer' | 'researcher' | 'lab' | 'support';
export interface PlanCopy {
  id: PlanId; name: string; tagline: string; features: string[];
  price: { month: number | null; year: number | null; once?: number[] };
  cta: string;
}
export const PLANS: PlanCopy[] = [
  { id: 'explorer', name: 'Explorer', tagline: 'Everything evidence-related, free forever.', cta: 'Open the atlas',
    price: { month: 0, year: 0 },
    features: ['Gap Map, rankings, sources and the Caught by code ledger', 'Preset audio overviews', 'Learn mode', '3 notes', 'Print brief to PDF and BibTeX', 'Share links'] },
  { id: 'researcher', name: 'Researcher', tagline: 'For people who write proposals and papers with this data.', cta: 'Start Researcher',
    price: { month: 9, year: 79 },
    features: ['Live Jev and Ask', 'Custom-scenario audio overviews, 30 per month', 'Branded PDF brief with your lab name', 'Unlimited notes and saved workspaces', 'CSV and JSON provenance export', 'Priority alerts on new PSI data'] },
  { id: 'lab', name: 'Lab', tagline: 'Researcher for a team of up to 10 seats.', cta: 'Start Lab',
    price: { month: 49, year: null },
    features: ['Everything in Researcher', 'Shared workspaces', 'API key for the corpus and rankings', 'Bulk briefs', 'Invoice billing'] },
  { id: 'support', name: 'Support the mission', tagline: 'Keeps the free tier free. Name on the credits page if you opt in.', cta: 'Support',
    price: { month: null, year: null, once: [5, 15] },
    features: ['One-off $5, $15 or your own amount'] },
];
export const PRINCIPLE = 'Every piece of NASA-derived evidence is free.';
