import express from 'express';
import { createStore, type PulseStore } from './store.ts';
import { filterEvents, parsePositiveLimit, buildSimulatedEvent } from './services/stream.ts';
import { generateHeuristicBrief, resolveShiftWindow } from './services/synthesis.ts';
import { answerShiftQuestion, isValidQuestion } from './services/query.ts';
import { updateChecklistItem } from './services/checklist.ts';
import { applyWorkspacePatch } from './services/workspace.ts';

export function createApp(store: PulseStore = createStore()) {
  const app = express();
  app.use(express.json());

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, service: 'asyncpulse-backend' });
  });

  app.get('/api/shifts', (_req, res) => {
    res.json({
      shiftWindows: store.shiftWindows,
      serverTimeUtc: new Date().toISOString(),
      workspaces: store.workspace,
    });
  });

  app.get('/api/stream', (req, res) => {
    const filtered = filterEvents(store.events, req.query);
    const max = parsePositiveLimit(req.query.limit);
    res.json({
      events: filtered.slice(0, max),
      total: store.events.length,
      lastIngestedAt: store.events[0]?.timestamp || new Date().toISOString(),
    });
  });

  app.post('/api/stream/simulate-event', (req, res) => {
    const event = buildSimulatedEvent(req.body || {});
    store.events.unshift(event);
    if (event.urgency === 'critical') {
      store.brief = generateHeuristicBrief(store.events, store.shiftWindows[0], store.brief);
    }
    res.json({ success: true, event, totalEvents: store.events.length });
  });

  app.get('/api/handoff/latest', (_req, res) => {
    res.json(store.brief);
  });

  app.post('/api/handoff/synthesize', (req, res) => {
    const targetShift = resolveShiftWindow(store.shiftWindows, req.body?.shiftWindowId);
    const freshBrief = generateHeuristicBrief(store.events, targetShift, store.brief);
    store.brief = freshBrief;
    res.json({ success: true, brief: freshBrief });
  });

  app.post('/api/handoff/query', (req, res) => {
    const question = req.body?.question;
    if (!isValidQuestion(question)) {
      res.status(400).json({ error: 'Missing or empty question string' });
      return;
    }
    res.json(answerShiftQuestion(question, store.brief, store.events));
  });

  app.patch('/api/handoff/checklist/:id', (req, res) => {
    const result = updateChecklistItem(store.brief, req.params.id, req.body || {});
    if (!result.ok) {
      res.status(404).json({ error: 'Checklist item not found' });
      return;
    }
    res.json({ success: true, item: result.item });
  });

  app.patch('/api/workspaces', (req, res) => {
    store.workspace = applyWorkspacePatch(store.workspace, req.body || {});
    res.json({ success: true, workspace: store.workspace });
  });

  app.post('/api/handoff/export-webhook', (req, res) => {
    const { channel, message } = req.body || {};
    res.json({
      success: true,
      channel: channel || '#eng-handoffs-apac',
      dispatchedAt: new Date().toISOString(),
      previewSnippet: message || store.brief.executiveSummary,
    });
  });

  return app;
}
