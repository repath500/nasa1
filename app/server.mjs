import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const choices = {
  inspect_evidence: 'Inspect matching rows; this is not a safety determination.',
  investigate_gap: 'Investigate missing conditions or incomplete pressure evidence.',
  seek_expert_review: 'Seek expert review before drawing a fire-safety conclusion.',
};

export function createServer({ key = process.env.TYPESAFE_API_KEY, fetcher = fetch } = {}) {
  return http.createServer(async (request, response) => {
    response.setHeader('Cache-Control', 'no-store');
    const send = (status, data) => {
      response.writeHead(status, { 'Content-Type': 'application/json' });
      response.end(JSON.stringify(data));
    };
    try {
      if (request.method === 'GET' && request.url === '/api/status') return send(200, { connected: Boolean(key) });
      if (request.method === 'GET' && ['/', '/fire-atlas.html'].includes(request.url)) {
        response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        return response.end(await readFile(new URL('./fire-atlas.html', import.meta.url)));
      }
      if (request.method !== 'POST' || request.url !== '/api/decision') return send(404, { error: 'Not found' });
      if (request.headers['sec-fetch-site'] === 'cross-site') return send(403, { error: 'Cross-site requests are not allowed' });
      if (!key) return send(503, { error: 'Jev is not connected. Local evidence checks remain available.' });
      let body = '';
      for await (const chunk of request) {
        body += chunk;
        if (Buffer.byteLength(body) > 12000) return send(413, { error: 'Request too large' });
      }
      let input;
      try { input = JSON.parse(body); } catch { return send(400, { error: 'Invalid JSON' }); }
      if (!input || typeof input !== 'object' || !Number.isFinite(input.oxygen) || input.oxygen < 0 || input.oxygen > 100 || !Number.isFinite(input.pressure) || input.pressure <= 0 || !Number.isInteger(input.matches) || input.matches < 0 || !Number.isInteger(input.total) || input.total < input.matches || !Number.isInteger(input.missingPressure) || input.missingPressure < 0 || input.missingPressure > input.matches) return send(400, { error: 'Invalid evidence summary' });
      const state = { oxygen: input.oxygen, pressure: input.pressure, matches: input.matches, total: input.total, missingPressure: input.missingPressure, partialGravityValidated: false };
      const upstream = await fetcher('https://api.typesafe.ai/v1/systemone', {
        method: 'POST', signal: AbortSignal.timeout(20000),
        headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'jev-latest', state: JSON.stringify(state), questions: { next_action: { type: 'choice', instructions: 'Choose a research next step using only this evidence summary. Matches use oxygen ±3 percentage points and pressure ±15%; missing pressure means oxygen-only matching. Approximate matches are not validated transfer or a safety verdict. No partial-gravity validation is available in this app. Never certify safety.', criteria: choices } } }),
      });
      if (!upstream.ok) return send(502, { error: 'Jev request failed. Local evidence checks are still available.' });
      const result = await upstream.json();
      const answer = result.answers?.next_action;
      if (!answer || !Object.hasOwn(choices, answer.choice) || !Number.isFinite(answer.confidence) || answer.confidence < 0 || answer.confidence > 1) return send(502, { error: 'Jev returned an invalid decision.' });
      const probabilities = Object.fromEntries(Object.keys(choices).map(choice => [choice, answer.probabilities?.[choice]]));
      if (Object.values(probabilities).some(value => !Number.isFinite(value) || value < 0 || value > 1) || Math.abs(Object.values(probabilities).reduce((sum, value) => sum + value, 0) - 1) > 0.02) return send(502, { error: 'Jev returned invalid probabilities.' });
      return send(200, { mode: 'live', model: result.model, decision: answer.choice, confidence: answer.confidence, probabilities, input: state });
    } catch (error) {
      return send(502, { error: error.name === 'TimeoutError' ? 'Jev timed out. Retry or continue with local checks.' : 'Decision service unavailable. Continue with local checks.' });
    }
  });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  createServer().listen(Number(process.env.PORT || 3000), '127.0.0.1', () => console.log('Fire Atlas: http://127.0.0.1:' + (process.env.PORT || 3000)));
}
