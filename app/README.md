# Fire Atlas

Open `fire-atlas.html` directly for the self-contained artifact, including the animated atlas, searchable test list, local evidence checks and developer inspector.

For live Jev decisions, use Node.js 22 or newer:

```sh
node app/server.mjs
```

Open `http://127.0.0.1:3000`. Set `TYPESAFE_API_KEY` in the server environment to enable live requests. No credentials are embedded in the artifact, sent to the browser, or included in exports. Without a key the UI clearly reports that Jev is disconnected; local matching still works. The server binds only to localhost and is not a public deployment/authentication solution.

## Decision flow

1. Choose a habitat or custom oxygen/pressure conditions.
2. Local code checks all loaded rows with the existing oxygen ±3 percentage-point and pressure ±15% rules. Missing pressure yields an oxygen-only match; burner oxygen is excluded.
3. Inspect the matching list and original source rows.
4. Optionally ask Jev for a research next step. This sends aggregate conditions and counts—not raw tables—to the TypeSafe System One API. Calls are explicit to avoid unexpected usage charges.
5. Expand Developer view to inspect inputs, baseline rules, validated model response, confidence, probabilities, elapsed time, and the session event log. Download a JSON record for review.

Changing habitat aborts the browser request and invalidates stale results. An upstream request already accepted may still finish and incur usage. Errors retain local evidence, not a simulated model response. Model confidence is not a fire-safety probability. The decision summary uses all dates; the replay can temporarily limit the visualization. Its evidence button restores all dates.

The app is a research prototype over the recovered dataset, not a complete PSI index or safety certification tool. Existing narrative/replay content remains illustrative. The old human-authored ranking fixture is no longer opened by the AI-check control; that control now opens the real decision inspector.

API contract checked against `https://docs.typesafe.ai/api.md` and `https://api.typesafe.ai/openapi.json` during implementation. No live request was verified without a user-provided key.
