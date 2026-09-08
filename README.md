# AsyncPulse

**Autonomous Cross-Timezone Engineering Handoff Orchestrator**

AsyncPulse passively synthesizes Git commits, pull requests, Slack threads, and CI/CD activity into an actionable shift brief. Oncoming engineers log in, read one digest, and start work without a standup.

---

## Problem

Distributed engineering teams spanning US Pacific, India, and EMEA lose hours every day at shift boundaries.

| Pain | What happens in practice |
|------|--------------------------|
| Context loss | Offcoming engineers dump unstructured notes, or nothing at all |
| Standup tax | Oncoming leads spend 30-60 minutes reconstructing what broke overnight |
| Sleep interruption | Offcoming staff get paged for issues that did not need a wake-up |
| Hidden blockers | Broken CI, stalled PRs, and unresolved Slack threads stay buried until someone asks |
| Decision re-litigation | Architecture choices made at 17:00 PT get reopened at 09:00 IST |
| No shared health signal | There is no single score for whether the handoff is safe |

The cost compounds across seats. A 48-person distributed org burning 15 hours per engineer per month on handoff reconstruction wastes hundreds of hours and tens of thousands of dollars.

---

## Solution

AsyncPulse is a single-port web application that sits on top of existing engineering telemetry.

1. **Passive ingestion** — Git, PRs, Slack, Discord, Jira, and CI/CD events stream in without requiring developers to write standup updates.
2. **Shift radar** — Live clocks and corridor status for US Pacific, India (IST), and EMEA, including overlap windows.
3. **Handoff brief** — One executive digest per corridor: health score, P0/P1 blockers, code velocity, key decisions, and a morning checklist.
4. **Shift Brain** — Grounded Q&A over the latest brief and event stream so oncoming engineers can ask "why is CI red?" instead of hunting logs.
5. **Sleep safeguards** — Explicit escalation policy so offcoming leads are only woken for true Sev-0 events.
6. **Workspace & export** — Seat/privacy configuration, Slack webhook dispatch, and markdown export of the brief.

Gemini is used when `GEMINI_API_KEY` is present. If the key is missing or the model call fails, a heuristic synthesizer still produces a valid brief so the product never blocks on AI availability.

---

## Benefits

- **Faster start of shift** — Oncoming leads get blockers, PRs, and decisions in one view.
- **Fewer sleep pages** — Escalation criteria and waking windows are part of every brief.
- **No extra process** — Signals are collected from tools teams already use.
- **Measurable ROI** — Seat pricing and hours-saved math are visible in workspace settings (48 seats x $6 = $288/mo vs. ~720 recovered engineering hours).
- **Privacy-aware** — Default mode is metadata and diffs only; full-text redaction is available.
- **Resilient** — API contracts, input sanitization, and AI fallback keep the app usable without Gemini.

---

## Architecture

```mermaid
flowchart TB
  subgraph Clients["Clients"]
    Browser["React SPA on port 3000"]
  end

  subgraph Frontend["Vite Dev Server"]
    UI["React UI"]
    Proxy["Reverse proxy /api"]
  end

  subgraph Backend["Express API on port 3001"]
    Routes["REST routes"]
    Services["Domain services"]
    Store["In-memory store"]
  end

  Browser --> UI
  UI -->|"fetch /api"| Proxy
  Proxy -->|"http://127.0.0.1:3001"| Routes
  Routes --> Services
  Services --> Store
```

### Request path

| Layer | Role |
|-------|------|
| `src/App.tsx` | React shell: loads shifts, stream, and latest brief |
| `vite.config.ts` | Frontend on port 3000; proxies `/api` to backend 3001 |
| `backend/src/app.ts` | Express REST API |
| `backend/src/services/` | Stream, synthesis, Shift Brain, checklist, workspace |
| `src/types.ts` | Shared TypeScript contracts |

The SPA still calls `/api/*` on the same origin. Vite forwards those requests to the Node backend.

---

## User Flow

```mermaid
flowchart TD
  Start["Engineer opens AsyncPulse"] --> Load["App loads /api/shifts, /api/stream, /api/handoff/latest"]
  Load --> Radar["Timezone Radar shows corridors and live clocks"]
  Radar --> Choose{"Need a different corridor?"}
  Choose -->|"Yes"| Switch["Select corridor and re-synthesize brief"]
  Choose -->|"No"| Tab{"Primary task?"}
  Switch --> Tab

  Tab -->|"Read handoff"| Brief["Shift Handoff Brief"]
  Tab -->|"Inspect raw signals"| Stream["Signal Stream with filters"]
  Tab -->|"Ask a question"| Brain["Open Shift Brain"]
  Tab -->|"Inject telemetry"| Sim["Simulate Event modal"]
  Tab -->|"Configure org"| Work["Workspace settings"]
  Tab -->|"Share digest"| Export["Export to Slack or markdown"]

  Brief --> Actions["Claim or complete checklist items"]
  Brief --> Blockers["Triage P0 and P1 blockers"]
  Stream --> Sim
  Sim --> Ingest["POST /api/stream/simulate-event"]
  Ingest --> Resynth["Optional auto re-synthesize if critical"]
  Brain --> Query["POST /api/handoff/query"]
  Query --> Answer["Cited answer plus next step"]
  Work --> Save["PATCH /api/workspaces"]
  Export --> Hook["POST /api/handoff/export-webhook"]
  Actions --> Patch["PATCH /api/handoff/checklist/:id"]
```

### Typical oncoming shift

1. Open the app and confirm the active corridor (for example SF to Bengaluru).
2. Read the executive summary and health score.
3. Work P0 blockers first, then the action checklist.
4. Ask Shift Brain about Redis, Stripe PR #418, or sleep policy if context is unclear.
5. Claim checklist items so the rest of the shift does not duplicate work.
6. Export the brief to `#eng-handoffs-apac` when the overlap window closes.

---

## SDLC

```mermaid
flowchart LR
  subgraph Plan["1. Plan"]
    Req["Distributed handoff problem"]
    Scope["Corridors, briefs, stream, Q and A"]
  end

  subgraph Design["2. Design"]
    Types["Shared types in src/types.ts"]
    API["REST contracts under /api"]
    UX["Radar, brief, stream, modals"]
  end

  subgraph Build["3. Build"]
    FE["React 19 + Tailwind UI"]
    BE["Express synthesis and Q and A"]
    AI["Gemini with heuristic fallback"]
  end

  subgraph Test["4. Test"]
    TDD["tests/app.test.ts 29 cases"]
    Lint["tsc --noEmit"]
    Edge["Empty body, NaN seats, invalid enums"]
  end

  subgraph Release["5. Release"]
    Dev["npm run dev on port 3000"]
    Prod["vite build plus esbuild server"]
  end

  subgraph Operate["6. Operate"]
    Ingest["Passive event ingest"]
    SynthRun["Scheduled or on-demand synthesis"]
    Sleep["Sleep-safe escalation"]
  end

  Plan --> Design --> Build --> Test --> Release --> Operate
  Operate -->|"new signals and corridors"| Plan
```

| Phase | What this repo implements |
|-------|---------------------------|
| Plan | Problem framed as lost overlap time and unstructured handoffs |
| Design | Domain model: `ShiftWindow`, `PassiveEvent`, `HandoffBrief`, `WorkspaceConfig` |
| Build | SPA + Express on one process; Gemini optional |
| Test | 29 TDD cases covering APIs, sanitization, ROI math, and health bands |
| Release | `npm run dev` for local/preview; `npm run build` / `npm start` for production |
| Operate | Simulate events, re-synthesize, export webhooks, update seats/privacy |

---

## Features

- Timezone radar with live PT / IST / GMT clocks and overlap remaining
- Handoff brief: health score, blockers, PRs, decisions, checklist, sleep safeguards
- Passive signal stream with source, urgency, and text filters
- Event simulation for CI crashes, PRs, commits, and Slack escalations
- Shift Brain Q&A grounded in the current brief and event log
- Checklist claim / complete with optimistic UI
- Workspace seat calculator and privacy mode
- Slack/Discord webhook export and markdown copy

---

## Tech Stack

| Area | Choice |
|------|--------|
| UI | React 19, Tailwind CSS 4, Lucide icons, Motion |
| Bundler | Vite 6 |
| Server | Express 4 + tsx |
| Language | TypeScript 5.8 |
| AI | `@google/genai` (Gemini), heuristic fallback |
| Tests | Node assert + fetch against live `/api` |

---

## API

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/shifts` | Shift windows, server time, workspace config |
| GET | `/api/stream` | Passive events; query `source`, `urgency`, `limit` |
| POST | `/api/stream/simulate-event` | Ingest a simulated telemetry event |
| GET | `/api/handoff/latest` | Current `HandoffBrief` |
| POST | `/api/handoff/synthesize` | Rebuild brief for a `shiftWindowId` |
| POST | `/api/handoff/query` | Shift Brain Q&A |
| PATCH | `/api/handoff/checklist/:id` | Complete or claim a checklist item |
| PATCH | `/api/workspaces` | Seats, privacy, repos, channels |
| POST | `/api/handoff/export-webhook` | Dispatch brief snippet to a channel |

---

## Project Structure

```text
.
├── src/                         React frontend
├── backend/
│   ├── src/
│   │   ├── app.ts               Express app and routes
│   │   ├── server.ts            Listen on port 3001
│   │   ├── store.ts             In-memory domain store
│   │   ├── seed.ts              Demo shift, events, brief
│   │   └── services/            Stream, synthesis, Q and A, workspace
│   └── tests/
│       ├── services.test.ts     Unit TDD
│       └── api.test.ts          HTTP contract TDD
├── tests/app.test.ts            End-to-end API tests via frontend proxy
├── start.sh                     Start backend + frontend together
├── vite.config.ts
└── package.json
```

---

## Run Locally

Prerequisites: Node.js 18+.

```bash
# Install dependencies
npm install

# Start backend (3001) and frontend (3000) together
bash start.sh
```

The preview port is `http://localhost:3000`. API calls to `/api` are proxied to the backend on port 3001.

### Scripts

```bash
# Frontend only
npm run dev

# Backend only
npm run dev:backend

# Backend unit + HTTP tests
npm test

# End-to-end API tests against the running frontend proxy
npm run test:e2e

# Typecheck
npm run lint
```

---

## Verification

Verified on this workspace:

- Typecheck: `npm run lint` passed
- Backend unit tests: 9 / 9 passed
- Backend HTTP tests: 8 / 8 passed
- Frontend proxy e2e: 29 / 29 passed in `tests/app.test.ts`
- Frontend: port 3000
- Backend: port 3001
