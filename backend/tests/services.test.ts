import assert from 'node:assert/strict';
import { createInitialEvents } from '../src/seed.ts';
import { createStore } from '../src/store.ts';
import {
  buildSimulatedEvent,
  filterEvents,
  parsePositiveLimit,
  resolveUrgency,
} from '../src/services/stream.ts';
import { generateHeuristicBrief, resolveShiftWindow } from '../src/services/synthesis.ts';
import { answerShiftQuestion, isValidQuestion, stripJsonFences } from '../src/services/query.ts';
import { updateChecklistItem } from '../src/services/checklist.ts';
import {
  applyWorkspacePatch,
  classifyHealth,
  hoursSavedPerMonth,
  monthlyWorkspaceCost,
} from '../src/services/workspace.ts';

const results: Array<{ name: string; passed: boolean; error?: string }> = [];

async function run(name: string, fn: () => void) {
  try {
    fn();
    results.push({ name, passed: true });
    console.log(`  ✓ ${name}`);
  } catch (err: any) {
    results.push({ name, passed: false, error: err?.message || String(err) });
    console.error(`  ✗ ${name}: ${err?.message || String(err)}`);
  }
}

console.log('\n--- Backend unit tests ---');

await run('parsePositiveLimit falls back for invalid and negative values', () => {
  assert.equal(parsePositiveLimit('invalid_nan'), 50);
  assert.equal(parsePositiveLimit('-15'), 50);
  assert.equal(parsePositiveLimit(0), 50);
  assert.equal(parsePositiveLimit(3), 3);
});

await run('filterEvents filters by source and urgency', () => {
  const events = createInitialEvents();
  const ci = filterEvents(events, { source: 'ci_cd' });
  assert.ok(ci.length > 0);
  assert.ok(ci.every((event) => event.source === 'ci_cd'));
  const critical = filterEvents(events, { urgency: 'critical' });
  assert.ok(critical.every((event) => event.urgency === 'critical'));
});

await run('buildSimulatedEvent sanitizes unknown urgency and empty body', () => {
  const empty = buildSimulatedEvent({});
  assert.equal(empty.urgency, 'normal');
  assert.ok(empty.id.startsWith('evt-'));
  const invalid = buildSimulatedEvent({ urgency: 'nonexistent_urgency_level', summary: 'Invalid urgency event' });
  assert.equal(invalid.urgency, 'normal');
  assert.equal(resolveUrgency('critical'), 'critical');
});

await run('generateHeuristicBrief scores critical events as blockers', () => {
  const store = createStore();
  const brief = generateHeuristicBrief(store.events, store.shiftWindows[0], store.brief);
  assert.equal(brief.shiftWindowId, 'usw-to-ist');
  assert.ok(brief.healthScore >= 0 && brief.healthScore <= 100);
  assert.ok(['healthy', 'at_risk', 'critical_blocker'].includes(brief.healthStatus));
  assert.ok(brief.immediateBlockers.length >= 1);
  assert.ok(brief.oncomingActionChecklist.length >= 1);
});

await run('resolveShiftWindow falls back for unknown ids', () => {
  const store = createStore();
  const fallback = resolveShiftWindow(store.shiftWindows, 'non-existent-shift-id');
  assert.equal(fallback.id, store.shiftWindows[0].id);
});

await run('Shift Brain answers Redis and Elena sleep questions', () => {
  const store = createStore();
  const redis = answerShiftQuestion('Why is the CI build failing on Redis?', store.brief, store.events);
  assert.ok(redis.answer.includes('Redis'));
  assert.ok(redis.citations.length > 0);
  const sleep = answerShiftQuestion('Is Elena asleep and when will she wake?', store.brief, store.events);
  assert.ok(sleep.answer.includes('Elena'));
  assert.equal(isValidQuestion('   '), false);
  assert.equal(isValidQuestion('ok'), true);
});

await run('checklist update and 404', () => {
  const store = createStore();
  const item = store.brief.oncomingActionChecklist[0];
  const updated = updateChecklistItem(store.brief, item.id, { completed: true, claimedBy: 'TDD Test Engineer' });
  assert.equal(updated.ok, true);
  if (updated.ok) {
    assert.equal(updated.item.completed, true);
    assert.equal(updated.item.claimedBy, 'TDD Test Engineer');
  }
  const missing = updateChecklistItem(store.brief, 'nonexistent-item-999', { completed: true });
  assert.equal(missing.ok, false);
});

await run('workspace patch clamps seats and ignores invalid privacy', () => {
  const store = createStore();
  const negative = applyWorkspacePatch(store.workspace, { activeSeats: -10 });
  assert.ok(negative.activeSeats >= 1);
  const nanSafe = applyWorkspacePatch(store.workspace, { activeSeats: 'not_a_number' });
  assert.ok(!Number.isNaN(nanSafe.activeSeats));
  const privacy = applyWorkspacePatch(store.workspace, { privacySetting: 'malicious_arbitrary_setting' });
  assert.equal(privacy.privacySetting, store.workspace.privacySetting);
  const ok = applyWorkspacePatch(store.workspace, { activeSeats: 75, privacySetting: 'full_text_redacted' });
  assert.equal(ok.activeSeats, 75);
  assert.equal(ok.privacySetting, 'full_text_redacted');
});

await run('ROI and health classification math', () => {
  assert.equal(monthlyWorkspaceCost(48, 6), 288);
  assert.equal(hoursSavedPerMonth(48), 720);
  assert.equal(classifyHealth(50), 'critical');
  assert.equal(classifyHealth(85), 'optimal');
  assert.equal(classifyHealth(90, 'critical_blocker'), 'critical');
  const parsed = JSON.parse(stripJsonFences('```json\n{"answer":"Test answer"}\n```'));
  assert.equal(parsed.answer, 'Test answer');
});

const failed = results.filter((result) => !result.passed).length;
console.log(`\nUnit tests: ${results.length - failed}/${results.length} passed`);
if (failed > 0) process.exit(1);
