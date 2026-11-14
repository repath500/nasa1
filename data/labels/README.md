# G3 labels

No human labels or adjudication are included. The labelling and reporting CLI is
not implemented yet. Do not interpret the statistical helpers in
`packages/server/src/ai/g3.ts` as a G3 result. Reviewers must independently
label at least 16 study/scenario pairs and adjudicate disagreements before a
decision under BUILD_PLAN §4.2. Files ending in `.human.json` are ignored to
avoid accidentally committing reviewer identities.
