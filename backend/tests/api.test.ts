import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { createApp } from '../src/app.ts';
import { createStore } from '../src/store.ts';

const store = createStore();
const app = createApp(store);
const server = createServer(app);

await new Promise<void>((resolve) => {
  server.listen(0, '127.0.0.1', () => resolve());
});

const address = server.address();
if (!address || typeof address === 'string') {
  throw new Error('Failed to bind test server');
}

const BASE_URL = `http://127.0.0.1:${address.port}`;
const results: Array<{ name: string; passed: boolean; error?: string }> = [];

async function run(name: string, fn: () => Promise<void>) {
  try {
    await fn();
    results.push({ name, passed: true });
    console.log(`  ✓ ${name}`);
  } catch (err: any) {
    results.push({ name, passed: false, error: err?.message || String(err) });
    console.error(`  ✗ ${name}: ${err?.message || String(err)}`);
  }
}

console.log('\n--- Backend HTTP contract tests ---');

await run('GET /api/health', async () => {
  const res = await fetch(`${BASE_URL}/api/health`);
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.ok, true);
});

await run('GET /api/shifts returns windows and workspace', async () => {
  const res = await fetch(`${BASE_URL}/api/shifts`);
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.ok(Array.isArray(data.shiftWindows));
  assert.ok(data.shiftWindows.length >= 2);
  assert.ok(data.serverTimeUtc);
  assert.equal(typeof data.workspaces.activeSeats, 'number');
});

await run('GET /api/stream filters and invalid limit fallback', async () => {
  const all = await (await fetch(`${BASE_URL}/api/stream`)).json();
  assert.ok(all.events.length > 0);
  const ci = await (await fetch(`${BASE_URL}/api/stream?source=ci_cd`)).json();
  assert.ok(ci.events.every((event: { source: string }) => event.source === 'ci_cd'));
  const critical = await (await fetch(`${BASE_URL}/api/stream?urgency=critical`)).json();
  assert.ok(critical.events.every((event: { urgency: string }) => event.urgency === 'critical'));
  const invalid = await (await fetch(`${BASE_URL}/api/stream?limit=invalid_nan`)).json();
  assert.ok(invalid.events.length > 0);
  const negative = await (await fetch(`${BASE_URL}/api/stream?limit=-15`)).json();
  assert.ok(negative.events.length > 0);
});

await run('POST /api/stream/simulate-event ingest and sanitize', async () => {
  const res = await fetch(`${BASE_URL}/api/stream/simulate-event`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      source: 'github_commit',
      summary: 'TDD Test commit for idempotency check',
      urgency: 'normal',
      tags: ['test', 'tdd'],
    }),
  });
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.success, true);
  assert.ok(data.event.id.startsWith('evt-'));

  const empty = await fetch(`${BASE_URL}/api/stream/simulate-event`, { method: 'POST' });
  assert.notEqual(empty.status, 500);
  assert.equal((await empty.json()).success, true);

  const invalid = await fetch(`${BASE_URL}/api/stream/simulate-event`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ summary: 'Invalid urgency event', urgency: 'nonexistent_urgency_level' }),
  });
  assert.equal((await invalid.json()).event.urgency, 'normal');
});

await run('handoff latest and synthesize', async () => {
  const latest = await (await fetch(`${BASE_URL}/api/handoff/latest`)).json();
  assert.ok(latest.id);
  assert.ok(latest.healthScore >= 0 && latest.healthScore <= 100);
  assert.ok(latest.sleepSafeGuards.emergencyContact);

  const synth = await fetch(`${BASE_URL}/api/handoff/synthesize`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ shiftWindowId: 'usw-to-ist' }),
  });
  const synthData = await synth.json();
  assert.equal(synthData.success, true);
  assert.equal(synthData.brief.shiftWindowId, 'usw-to-ist');

  const empty = await fetch(`${BASE_URL}/api/handoff/synthesize`, { method: 'POST' });
  assert.notEqual(empty.status, 500);
  assert.equal((await empty.json()).success, true);

  const unknown = await fetch(`${BASE_URL}/api/handoff/synthesize`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ shiftWindowId: 'non-existent-shift-id' }),
  });
  assert.equal((await unknown.json()).success, true);
});

await run('Shift Brain query contracts', async () => {
  const redis = await fetch(`${BASE_URL}/api/handoff/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question: 'Why is the CI build failing on Redis?' }),
  });
  const redisData = await redis.json();
  assert.ok(redisData.answer);
  assert.ok(Array.isArray(redisData.citations));

  const elena = await fetch(`${BASE_URL}/api/handoff/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question: 'Is Elena asleep and when will she wake?' }),
  });
  assert.ok((await elena.json()).answer.includes('Elena'));

  const missing = await fetch(`${BASE_URL}/api/handoff/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  });
  assert.equal(missing.status, 400);

  const empty = await fetch(`${BASE_URL}/api/handoff/query`, { method: 'POST' });
  assert.equal(empty.status, 400);
});

await run('checklist patch and 404', async () => {
  const brief = await (await fetch(`${BASE_URL}/api/handoff/latest`)).json();
  const item = brief.oncomingActionChecklist[0];
  const patch = await fetch(`${BASE_URL}/api/handoff/checklist/${item.id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ completed: true, claimedBy: 'TDD Test Engineer' }),
  });
  const patchData = await patch.json();
  assert.equal(patchData.success, true);
  assert.equal(patchData.item.claimedBy, 'TDD Test Engineer');

  const missing = await fetch(`${BASE_URL}/api/handoff/checklist/nonexistent-item-999`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ completed: true }),
  });
  assert.equal(missing.status, 404);

  const empty = await fetch(`${BASE_URL}/api/handoff/checklist/${item.id}`, { method: 'PATCH' });
  assert.notEqual(empty.status, 500);
});

await run('workspace and webhook', async () => {
  const updated = await fetch(`${BASE_URL}/api/workspaces`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ activeSeats: 75, privacySetting: 'full_text_redacted' }),
  });
  const updatedData = await updated.json();
  assert.equal(updatedData.workspace.activeSeats, 75);

  const webhook = await fetch(`${BASE_URL}/api/handoff/export-webhook`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ channel: '#eng-handoffs-apac', message: 'Test broadcast' }),
  });
  const webhookData = await webhook.json();
  assert.equal(webhookData.success, true);
  assert.equal(webhookData.channel, '#eng-handoffs-apac');
});

server.close();
const failed = results.filter((result) => !result.passed).length;
console.log(`\nHTTP tests: ${results.length - failed}/${results.length} passed`);
if (failed > 0) process.exit(1);
