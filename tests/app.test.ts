import assert from 'node:assert/strict';

const BASE_URL = 'http://127.0.0.1:3000';

interface TestResult {
  suite: string;
  name: string;
  passed: boolean;
  error?: string;
  durationMs: number;
}

const results: TestResult[] = [];

async function runTest(suite: string, name: string, fn: () => Promise<void>) {
  const start = Date.now();
  try {
    await fn();
    const durationMs = Date.now() - start;
    results.push({ suite, name, passed: true, durationMs });
    console.log(`  ✓ PASS [${durationMs}ms]: ${name}`);
  } catch (err: any) {
    const durationMs = Date.now() - start;
    results.push({ suite, name, passed: false, error: err?.message || String(err), durationMs });
    console.error(`  ✗ FAIL [${durationMs}ms]: ${name}`);
    console.error(`    Error: ${err?.message || String(err)}`);
  }
}

async function main() {
  console.log('\n============================================================');
  console.log('   AsyncPulse Cross-Timezone Orchestrator TDD Test Suite');
  console.log('============================================================\n');

  // -------------------------------------------------------------
  // Suite 1: Shift Radar & Timezone Clocks API
  // -------------------------------------------------------------
  console.log('--- Suite 1: Shift Radar & Timezone Clocks API ---');
  await runTest('Radar', 'GET /api/shifts returns 200 with shiftWindows and workspace config', async () => {
    const res = await fetch(`${BASE_URL}/api/shifts`);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.ok(Array.isArray(data.shiftWindows), 'shiftWindows must be an array');
    assert.ok(data.shiftWindows.length >= 2, 'Must have at least 2 shift windows');
    assert.ok(data.serverTimeUtc, 'serverTimeUtc must exist');
    assert.ok(data.workspaces, 'workspaces must exist');
    assert.equal(typeof data.workspaces.activeSeats, 'number');
    assert.equal(typeof data.workspaces.pricePerSeat, 'number');
  });

  await runTest('Radar', 'Shift corridors contain valid offcoming and oncoming timezone descriptors', async () => {
    const res = await fetch(`${BASE_URL}/api/shifts`);
    const data = await res.json();
    for (const shift of data.shiftWindows) {
      assert.ok(shift.id, 'id required');
      assert.ok(shift.name, 'name required');
      assert.ok(shift.offcomingShift.timezone, 'offcoming timezone required');
      assert.ok(shift.oncomingShift.timezone, 'oncoming timezone required');
      assert.ok(typeof shift.overlapMinutesRemaining === 'number');
    }
  });

  // -------------------------------------------------------------
  // Suite 2: Passive Signal Stream API & Edge Cases
  // -------------------------------------------------------------
  console.log('\n--- Suite 2: Passive Signal Stream API & Query Filtering ---');
  await runTest('Stream', 'GET /api/stream returns full event stream', async () => {
    const res = await fetch(`${BASE_URL}/api/stream`);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.ok(Array.isArray(data.events));
    assert.ok(data.events.length > 0);
    assert.equal(typeof data.total, 'number');
  });

  await runTest('Stream', 'GET /api/stream filters by source correctly', async () => {
    const res = await fetch(`${BASE_URL}/api/stream?source=ci_cd`);
    assert.equal(res.status, 200);
    const data = await res.json();
    for (const evt of data.events) {
      assert.equal(evt.source, 'ci_cd', `Expected source to be ci_cd, got ${evt.source}`);
    }
  });

  await runTest('Stream', 'GET /api/stream filters by urgency correctly', async () => {
    const res = await fetch(`${BASE_URL}/api/stream?urgency=critical`);
    assert.equal(res.status, 200);
    const data = await res.json();
    for (const evt of data.events) {
      assert.equal(evt.urgency, 'critical', `Expected urgency to be critical, got ${evt.urgency}`);
    }
  });

  await runTest('Stream', 'GET /api/stream handles invalid or non-numeric limit parameter gracefully', async () => {
    const res = await fetch(`${BASE_URL}/api/stream?limit=invalid_nan`);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.ok(Array.isArray(data.events), 'Events should still be an array');
    assert.ok(data.events.length > 0, 'Invalid limit should fallback gracefully to default instead of 0');
  });

  await runTest('Stream', 'GET /api/stream handles negative limit gracefully', async () => {
    const res = await fetch(`${BASE_URL}/api/stream?limit=-15`);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.ok(Array.isArray(data.events));
    assert.ok(data.events.length > 0, 'Negative limit must fallback gracefully to default positive limit');
  });

  // -------------------------------------------------------------
  // Suite 3: Event Ingestion & Simulation
  // -------------------------------------------------------------
  console.log('\n--- Suite 3: Event Ingestion & Simulation ---');
  await runTest('Ingestion', 'POST /api/stream/simulate-event ingests normal event', async () => {
    const payload = {
      source: 'github_commit',
      sourceName: 'Git Commits',
      channelOrRepo: 'acme-corp/test-repo',
      authorName: 'Test Engineer',
      authorRole: 'QA Engineer',
      summary: 'TDD Test commit for idempotency check',
      details: 'Unit test commit verification',
      urgency: 'normal',
      tags: ['test', 'tdd'],
    };
    const res = await fetch(`${BASE_URL}/api/stream/simulate-event`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.event.summary, payload.summary);
    assert.ok(data.event.id.startsWith('evt-'));
  });

  await runTest('Ingestion', 'POST /api/stream/simulate-event handles missing Content-Type or empty body safely', async () => {
    const res = await fetch(`${BASE_URL}/api/stream/simulate-event`, {
      method: 'POST',
    });
    assert.notEqual(res.status, 500, 'Server crashed with 500 on empty POST body');
    const data = await res.json();
    assert.equal(data.success, true);
  });

  await runTest('Ingestion', 'POST /api/stream/simulate-event sanitizes unknown urgency levels to normal', async () => {
    const res = await fetch(`${BASE_URL}/api/stream/simulate-event`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        summary: 'Invalid urgency event',
        urgency: 'nonexistent_urgency_level',
      }),
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.event.urgency, 'normal', 'Must fallback invalid urgency to normal');
  });

  // -------------------------------------------------------------
  // Suite 4: Handoff Brief Data Contracts
  // -------------------------------------------------------------
  console.log('\n--- Suite 4: Handoff Brief Data Contracts ---');
  await runTest('BriefContract', 'GET /api/handoff/latest returns valid HandoffBrief data contract', async () => {
    const res = await fetch(`${BASE_URL}/api/handoff/latest`);
    assert.equal(res.status, 200);
    const brief = await res.json();

    assert.ok(brief.id, 'id is required');
    assert.ok(brief.shiftTitle, 'shiftTitle is required');
    assert.equal(typeof brief.healthScore, 'number');
    assert.ok(brief.healthScore >= 0 && brief.healthScore <= 100, 'healthScore must be between 0 and 100');
    assert.ok(['healthy', 'at_risk', 'critical_blocker'].includes(brief.healthStatus), 'Valid healthStatus');
    assert.ok(Array.isArray(brief.immediateBlockers), 'immediateBlockers must be array');
    assert.ok(Array.isArray(brief.oncomingActionChecklist), 'oncomingActionChecklist must be array');
    assert.ok(brief.codeVelocity, 'codeVelocity must exist');
    assert.ok(brief.sleepSafeGuards, 'sleepSafeGuards must exist');
    assert.ok(brief.sleepSafeGuards.emergencyContact, 'emergencyContact must exist');
  });

  // -------------------------------------------------------------
  // Suite 5: Shift Synthesis Engine
  // -------------------------------------------------------------
  console.log('\n--- Suite 5: Shift Synthesis Engine ---');
  await runTest('Synthesis', 'POST /api/handoff/synthesize generates fresh brief for given shiftWindowId', async () => {
    const res = await fetch(`${BASE_URL}/api/handoff/synthesize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ shiftWindowId: 'usw-to-ist' }),
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.ok(data.brief);
    assert.equal(data.brief.shiftWindowId, 'usw-to-ist');
  });

  await runTest('Synthesis', 'POST /api/handoff/synthesize handles empty or malformed body gracefully', async () => {
    const res = await fetch(`${BASE_URL}/api/handoff/synthesize`, {
      method: 'POST',
    });
    assert.notEqual(res.status, 500, 'Server crashed with 500 on empty POST body');
    const data = await res.json();
    assert.equal(data.success, true);
    assert.ok(data.brief);
  });

  await runTest('Synthesis', 'POST /api/handoff/synthesize with unknown shiftWindowId falls back gracefully', async () => {
    const res = await fetch(`${BASE_URL}/api/handoff/synthesize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ shiftWindowId: 'non-existent-shift-id' }),
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.ok(data.brief);
  });

  // -------------------------------------------------------------
  // Suite 6: Shift Brain Interactive Q&A
  // -------------------------------------------------------------
  console.log('\n--- Suite 6: Shift Brain Interactive Q&A ---');
  await runTest('ShiftBrain', 'POST /api/handoff/query answers question about Redis CI failure', async () => {
    const res = await fetch(`${BASE_URL}/api/handoff/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question: 'Why is the CI build failing on Redis?' }),
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.ok(data.answer, 'Must return an answer string');
    assert.ok(Array.isArray(data.citations), 'citations must be an array');
    assert.ok(data.suggestedNextStep, 'Must provide suggested next step');
  });

  await runTest('ShiftBrain', 'POST /api/handoff/query answers question about Sleep Safeguards', async () => {
    const res = await fetch(`${BASE_URL}/api/handoff/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question: 'Is Elena asleep and when will she wake?' }),
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.ok(data.answer);
    assert.ok(data.answer.includes('Elena'));
  });

  await runTest('ShiftBrain', 'POST /api/handoff/query rejects missing or empty question with 400', async () => {
    const res1 = await fetch(`${BASE_URL}/api/handoff/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    assert.equal(res1.status, 400, 'Expected 400 for missing question');

    const res2 = await fetch(`${BASE_URL}/api/handoff/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question: '   ' }), // whitespace only
    });
    assert.equal(res2.status, 400, 'Expected 400 for whitespace-only question');
  });

  await runTest('ShiftBrain', 'POST /api/handoff/query handles empty body without crashing', async () => {
    const res = await fetch(`${BASE_URL}/api/handoff/query`, {
      method: 'POST',
    });
    assert.notEqual(res.status, 500, 'Server should not crash with 500 when body is missing');
    assert.equal(res.status, 400, 'Expected 400 Bad Request');
  });

  // -------------------------------------------------------------
  // Suite 7: Checklist Item Management
  // -------------------------------------------------------------
  console.log('\n--- Suite 7: Checklist Item Management ---');
  await runTest('Checklist', 'PATCH /api/handoff/checklist/:id updates completed and claimedBy', async () => {
    const latestRes = await fetch(`${BASE_URL}/api/handoff/latest`);
    const brief = await latestRes.json();
    const item = brief.oncomingActionChecklist[0];
    assert.ok(item, 'Must have at least one checklist item');

    const patchRes = await fetch(`${BASE_URL}/api/handoff/checklist/${item.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ completed: true, claimedBy: 'TDD Test Engineer' }),
    });
    assert.equal(patchRes.status, 200);
    const patchData = await patchRes.json();
    assert.equal(patchData.success, true);
    assert.equal(patchData.item.completed, true);
    assert.equal(patchData.item.claimedBy, 'TDD Test Engineer');
  });

  await runTest('Checklist', 'PATCH /api/handoff/checklist/:id returns 404 for nonexistent id', async () => {
    const res = await fetch(`${BASE_URL}/api/handoff/checklist/nonexistent-item-999`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ completed: true }),
    });
    assert.equal(res.status, 404);
  });

  await runTest('Checklist', 'PATCH /api/handoff/checklist/:id handles empty body without crashing', async () => {
    const latestRes = await fetch(`${BASE_URL}/api/handoff/latest`);
    const brief = await latestRes.json();
    const item = brief.oncomingActionChecklist[0];

    const res = await fetch(`${BASE_URL}/api/handoff/checklist/${item.id}`, {
      method: 'PATCH',
    });
    assert.notEqual(res.status, 500, 'Server should not crash with 500 when body is empty');
  });

  // -------------------------------------------------------------
  // Suite 8: Workspace Configuration & Validation
  // -------------------------------------------------------------
  console.log('\n--- Suite 8: Workspace Configuration & Validation ---');
  await runTest('Workspace', 'PATCH /api/workspaces updates seats and privacy settings', async () => {
    const res = await fetch(`${BASE_URL}/api/workspaces`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        activeSeats: 75,
        privacySetting: 'full_text_redacted',
      }),
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.workspace.activeSeats, 75);
    assert.equal(data.workspace.privacySetting, 'full_text_redacted');
  });

  await runTest('Workspace', 'PATCH /api/workspaces sanitizes invalid seat numbers (negative or zero)', async () => {
    const res = await fetch(`${BASE_URL}/api/workspaces`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        activeSeats: -10,
      }),
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.ok(data.workspace.activeSeats >= 1, 'activeSeats must be clamped to >= 1');
  });

  await runTest('Workspace', 'PATCH /api/workspaces prevents NaN corruption in activeSeats', async () => {
    const res = await fetch(`${BASE_URL}/api/workspaces`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        activeSeats: 'not_a_number',
      }),
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.ok(!Number.isNaN(data.workspace.activeSeats), 'activeSeats must never be NaN');
  });

  await runTest('Workspace', 'PATCH /api/workspaces ignores invalid privacySetting values', async () => {
    const prevSetting = (await (await fetch(`${BASE_URL}/api/shifts`)).json()).workspaces.privacySetting;
    const res = await fetch(`${BASE_URL}/api/workspaces`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        privacySetting: 'malicious_arbitrary_setting',
      }),
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.workspace.privacySetting, prevSetting, 'Must not accept unrecognized privacy enum');
  });

  // -------------------------------------------------------------
  // Suite 9: Slack / Webhook Broadcast
  // -------------------------------------------------------------
  console.log('\n--- Suite 9: Slack / Webhook Broadcast ---');
  await runTest('Webhook', 'POST /api/handoff/export-webhook dispatches payload cleanly', async () => {
    const res = await fetch(`${BASE_URL}/api/handoff/export-webhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        channel: '#eng-handoffs-apac',
        message: 'Test automated shift handoff summary broadcast',
      }),
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.channel, '#eng-handoffs-apac');
    assert.ok(data.dispatchedAt);
  });

  // -------------------------------------------------------------
  // Suite 10: Business Logic & Mathematical Calculations
  // -------------------------------------------------------------
  console.log('\n--- Suite 10: Business Logic & Mathematical Formulas ---');
  await runTest('Math', 'B2B Workspace ROI formula calculations', async () => {
    const seats = 48;
    const pricePerSeat = 6;
    const monthlyCost = seats * pricePerSeat;
    assert.equal(monthlyCost, 288, '48 seats * $6 = $288/mo');

    const hoursSavedPerDevPerMonth = 15;
    const totalHoursSaved = seats * hoursSavedPerDevPerMonth;
    assert.equal(totalHoursSaved, 720, '48 seats * 15h = 720h/mo saved');

    const devHourlyCost = 65;
    const dollarValue = totalHoursSaved * devHourlyCost;
    assert.equal(dollarValue, 46800, '720h * $65 = $46,800 saved/mo');

    const netSavings = dollarValue - monthlyCost;
    assert.equal(netSavings, 46512);
  });

  await runTest('Math', 'Health Index score status classification boundaries', async () => {
    const classifyHealth = (score: number, status?: string) => {
      if (status === 'critical_blocker' || score < 60) return 'critical';
      if (status === 'at_risk' || score < 85) return 'warning';
      return 'optimal';
    };

    assert.equal(classifyHealth(50), 'critical');
    assert.equal(classifyHealth(59), 'critical');
    assert.equal(classifyHealth(60), 'warning');
    assert.equal(classifyHealth(74), 'warning');
    assert.equal(classifyHealth(84), 'warning');
    assert.equal(classifyHealth(85), 'optimal');
    assert.equal(classifyHealth(100), 'optimal');
    assert.equal(classifyHealth(90, 'critical_blocker'), 'critical');
  });

  await runTest('Markdown', 'Markdown sanitization for LLM fenced code blocks', async () => {
    const rawWithFences = '```json\n{\n  "answer": "Test answer"\n}\n```';
    const cleaned = rawWithFences.replace(/```(?:json)?/gi, '').trim();
    const parsed = JSON.parse(cleaned);
    assert.equal(parsed.answer, 'Test answer');
  });

  // Summary Report
  console.log('\n============================================================');
  console.log(`  Tests Completed: ${results.length}`);
  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;
  const totalDuration = results.reduce((sum, r) => sum + r.durationMs, 0);
  console.log(`  Passed: ${passed} / ${results.length}`);
  console.log(`  Failed: ${failed} / ${results.length}`);
  console.log(`  Total Duration: ${totalDuration}ms`);
  console.log('============================================================\n');

  if (failed > 0) {
    console.error('Test failures detected:');
    for (const f of results.filter((r) => !r.passed)) {
      console.error(` - [${f.suite}] ${f.name}: ${f.error}`);
    }
    process.exit(1);
  } else {
    console.log('All AsyncPulse TDD tests passed with 100% full clearance! 🎉');
  }
}

main().catch((err) => {
  console.error('Fatal test runner error:', err);
  process.exit(1);
});
