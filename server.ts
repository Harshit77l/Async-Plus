import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import {
  PassiveEvent,
  HandoffBrief,
  ShiftWindow,
  ShiftQueryResponse,
  WorkspaceConfig,
  BlockerItem,
  ActionChecklistItem
} from './src/types.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini Client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Seed Data
const initialShiftWindows: ShiftWindow[] = [
  {
    id: 'usw-to-ist',
    name: 'US Pacific (SF) → South Asia (Bengaluru)',
    fromRegion: 'US West Coast (PT)',
    toRegion: 'India / South Asia (IST)',
    offcomingShift: {
      name: 'Shift Pacific (Day Shift)',
      timezone: 'America/Los_Angeles',
      location: 'San Francisco, CA',
      lead: {
        id: 'user-1',
        name: 'Elena Rostova',
        role: 'Staff Platform Engineer',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
        timezone: 'America/Los_Angeles',
        location: 'San Francisco (PT)',
        status: 'working',
        localTime: '',
      },
      activeHours: '09:00 - 18:00 PT',
    },
    oncomingShift: {
      name: 'Shift Indian Subcontinent (Morning Shift)',
      timezone: 'Asia/Kolkata',
      location: 'Bengaluru, India',
      lead: {
        id: 'user-2',
        name: 'Arjun Venkatesh',
        role: 'Lead Distributed Systems Engineer',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
        timezone: 'Asia/Kolkata',
        location: 'Bengaluru (IST)',
        status: 'working',
        localTime: '',
      },
      activeHours: '08:30 - 17:30 IST',
    },
    overlapWindow: '17:30 - 18:30 PT (06:00 - 07:00 IST)',
    overlapMinutesRemaining: 42,
    status: 'in_overlap',
  },
  {
    id: 'ist-to-emea',
    name: 'South Asia (Bengaluru) → EMEA (London / Berlin)',
    fromRegion: 'India / South Asia (IST)',
    toRegion: 'Europe (GMT/CET)',
    offcomingShift: {
      name: 'Shift Indian Subcontinent',
      timezone: 'Asia/Kolkata',
      location: 'Bengaluru, India',
      lead: {
        id: 'user-2',
        name: 'Arjun Venkatesh',
        role: 'Lead Distributed Systems Engineer',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
        timezone: 'Asia/Kolkata',
        location: 'Bengaluru (IST)',
        status: 'working',
        localTime: '',
      },
      activeHours: '08:30 - 17:30 IST',
    },
    oncomingShift: {
      name: 'Shift London & Berlin',
      timezone: 'Europe/London',
      location: 'London, UK',
      lead: {
        id: 'user-3',
        name: 'Marcus Thorne',
        role: 'Senior SRE / DevOps Lead',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80',
        timezone: 'Europe/London',
        location: 'London (GMT)',
        status: 'asleep',
        localTime: '',
      },
      activeHours: '08:30 - 17:30 GMT',
    },
    overlapWindow: '14:30 - 17:30 IST (09:00 - 12:00 GMT)',
    overlapMinutesRemaining: 0,
    status: 'off_hours',
  },
];

let passiveEvents: PassiveEvent[] = [
  {
    id: 'evt-101',
    source: 'ci_cd',
    sourceName: 'GitHub Actions',
    channelOrRepo: 'acme-corp/payment-orchestrator',
    author: {
      name: 'github-actions[bot]',
      role: 'CI Pipeline',
      avatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&auto=format&fit=crop&q=80',
      timezone: 'UTC',
    },
    timestamp: new Date(Date.now() - 28 * 60000).toISOString(),
    summary: '🚨 Main branch build failure in workflow: "Payment Gateway Integration Tests"',
    details: 'Job failed on step [Redis Idempotency Check]: ConnectionTimeoutError: Redis connection dropped after 3 retries in cluster shard ap-south-1b. 14 downstream tests halted.',
    urgency: 'critical',
    tags: ['build-broken', 'p0-blocker', 'redis', 'payment-orchestrator'],
    metadata: {
      ciStatus: 'failed',
      commitHash: '8b4d9a2',
    },
  },
  {
    id: 'evt-102',
    source: 'github_pr',
    sourceName: 'GitHub Pull Requests',
    channelOrRepo: 'acme-corp/payment-orchestrator',
    author: {
      name: 'Elena Rostova',
      role: 'Staff Platform Engineer (SF)',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
      timezone: 'America/Los_Angeles',
    },
    timestamp: new Date(Date.now() - 45 * 60000).toISOString(),
    summary: 'PR #418 [HOTFIX] Exponential backoff on Stripe webhook retry worker',
    details: 'Pushed commit 4f9e11a addressing memory leak when Stripe events burst > 5k req/sec. Tests pass locally. Blocked on Security review approval from @sec-team or APAC lead override.',
    urgency: 'warning',
    tags: ['pr-needs-review', 'hotfix', 'stripe-webhook'],
    metadata: {
      prNumber: 418,
      commitHash: '4f9e11a',
      diffStats: '+142 / -38 lines (4 files)',
    },
  },
  {
    id: 'evt-103',
    source: 'slack',
    sourceName: 'Slack #eng-incidents',
    channelOrRepo: '#eng-incidents',
    author: {
      name: 'David Chen',
      role: 'Core Backend Engineer (SF)',
      avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=100&auto=format&fit=crop&q=80',
      timezone: 'America/Los_Angeles',
    },
    timestamp: new Date(Date.now() - 65 * 60000).toISOString(),
    summary: 'Slack thread: PostgreSQL shard connection pool saturation alert at 16:40 PT',
    details: 'Connection spikes correlated with new Kafka consumer group `checkout-fraud-analyzer`. We temporarily raised PgBouncer pool to 180 max connections, but need Bengaluru team to inspect whether the batch consumer is omitting commit offsets.',
    urgency: 'warning',
    tags: ['database', 'kafka', 'postgres', 'pool-saturation'],
    metadata: {
      channel: '#eng-incidents',
      threadReplies: 14,
    },
  },
  {
    id: 'evt-104',
    source: 'github_commit',
    sourceName: 'Git Commits',
    channelOrRepo: 'acme-corp/frontend-app',
    author: {
      name: 'Sarah Jenkins',
      role: 'Frontend Tech Lead (SF)',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&auto=format&fit=crop&q=80',
      timezone: 'America/Los_Angeles',
    },
    timestamp: new Date(Date.now() - 110 * 60000).toISOString(),
    summary: 'feat(checkout): roll out 3D Secure v2 challenge dialog modal [merged to main]',
    details: 'Merged PR #392 into main. Feature flag `enable_3ds_v2` is set to 10% in staging environment. Verified zero visual regressions on iOS Safari and Chrome desktop.',
    urgency: 'normal',
    tags: ['feature-merged', 'frontend', 'checkout-v2'],
    metadata: {
      commitHash: 'c73a810',
      diffStats: '+620 / -110 lines',
    },
  },
  {
    id: 'evt-105',
    source: 'slack',
    sourceName: 'Slack #eng-architecture',
    channelOrRepo: '#eng-architecture',
    author: {
      name: 'Elena Rostova',
      role: 'Staff Platform Engineer (SF)',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
      timezone: 'America/Los_Angeles',
    },
    timestamp: new Date(Date.now() - 130 * 60000).toISOString(),
    summary: 'Architecture Decision: GraphQL vs REST for customer billing portal export API',
    details: 'Consensus reached between Elena (SF) and Priya (Bengaluru, async). We are moving forward with REST endpoint streaming ndjson for large invoices to avoid GraphQL nested query timeout limits.',
    urgency: 'low',
    tags: ['architecture-decision', 'api-contract', 'billing'],
    metadata: {
      channel: '#eng-architecture',
      threadReplies: 22,
    },
  },
  {
    id: 'evt-106',
    source: 'github_pr',
    sourceName: 'GitHub Pull Requests',
    channelOrRepo: 'acme-corp/infra-terraform',
    author: {
      name: 'Marcus Thorne',
      role: 'DevOps Lead',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80',
      timezone: 'Europe/London',
    },
    timestamp: new Date(Date.now() - 170 * 60000).toISOString(),
    summary: 'PR #128: Upgrade EKS cluster node pools to m6i.xlarge instances',
    details: 'Ready to apply in APAC staging cluster during low traffic morning window. Needs verification from Arjun before rolling to production.',
    urgency: 'normal',
    tags: ['terraform', 'eks', 'infra'],
    metadata: {
      prNumber: 128,
      commitHash: 'e105bd9',
    },
  }
];

let workspaceConfig: WorkspaceConfig = {
  workspaceName: 'Acme Global Distributed Engineering',
  activeSeats: 48,
  pricePerSeat: 6,
  connectedRepositories: [
    'acme-corp/payment-orchestrator',
    'acme-corp/frontend-app',
    'acme-corp/infra-terraform',
    'acme-corp/identity-service',
  ],
  monitoredChannels: [
    '#eng-incidents',
    '#eng-architecture',
    '#deploy-alerts',
    '#backend-standup',
  ],
  autoDigestCron: 'Every day at 18:00 PT / 06:30 IST',
  slackWebhookUrl: 'https://hooks.slack.com/services/T00/B00/AsyncPulseHandoffBot',
  privacySetting: 'metadata_and_diffs_only',
};

// Cached or Current Handoff Brief
let currentBrief: HandoffBrief = {
  id: 'brief-' + Date.now(),
  shiftWindowId: 'usw-to-ist',
  shiftTitle: 'US Pacific (SF) → South Asia (Bengaluru) Daily Handoff',
  generatedAt: new Date().toISOString(),
  totalSignalsAnalyzed: passiveEvents.length,
  healthScore: 74,
  healthStatus: 'at_risk',
  executiveSummary:
    'US Pacific shift wrapped up high-velocity work on the 3D Secure v2 checkout checkout modal (merged) and drafted a critical Stripe retry hotfix (PR #418). However, the main branch CI test suite broke 28 minutes ago due to an ap-south-1b Redis cluster shard timeout, and PgBouncer connection pool saturation was mitigated with temporary pool bump. Immediate action required on Redis shard and PR #418 validation.',
  immediateBlockers: [
    {
      id: 'blk-1',
      title: 'Main Branch Broken: Redis Idempotency Test Timeout in CI',
      severity: 'P0',
      category: 'broken_build',
      repoOrChannel: 'acme-corp/payment-orchestrator',
      culpritOrLead: 'github-actions / Redis cluster ap-south-1b',
      description: 'Payment Gateway Integration test suite failing on Redis connection dropped after 3 retries. Blocks all subsequent PR merges to main.',
      impact: 'PR merge queue locked. Downstream deployments to staging blocked.',
      recommendedAction: 'Restart Redis shard proxy or failover to ap-south-1a replica; verify if VPC peering route table changed.',
      status: 'open',
      ticketLink: 'https://github.com/acme-corp/payment-orchestrator/actions/runs/892110',
      timestamp: new Date(Date.now() - 28 * 60000).toISOString(),
    },
    {
      id: 'blk-2',
      title: 'Kafka Checkout Consumer Shard Connection Saturation',
      severity: 'P1',
      category: 'production_incident',
      repoOrChannel: '#eng-incidents',
      culpritOrLead: 'David Chen / checkout-fraud-analyzer',
      description: 'PgBouncer pool reached 98% threshold at 16:40 PT. Raised to 180 connections as quick patch, but consumer appears to leak idle connections.',
      impact: 'Potential 504 Gateway Timeouts on auth queries if traffic spikes.',
      recommendedAction: 'Arjun/Bengaluru team to check consumer commit offsets and ensure connection pooling is configured with max-lifetime.',
      status: 'investigating',
      ticketLink: 'https://linear.app/acme/issue/ENG-4912',
      timestamp: new Date(Date.now() - 65 * 60000).toISOString(),
    },
  ],
  codeVelocity: {
    commitsCount: 24,
    prsMerged: [
      {
        number: 392,
        title: 'feat(checkout): 3D Secure v2 challenge dialog modal rollout',
        author: 'Sarah Jenkins',
        impact: 'Live on staging behind flag `enable_3ds_v2`. Tested across mobile and desktop.',
        status: 'merged',
      },
    ],
    prsNeedsReview: [
      {
        number: 418,
        title: '[HOTFIX] Exponential backoff on Stripe webhook retry worker',
        author: 'Elena Rostova',
        impact: 'Addresses memory leak during webhook bursts. Clean tests.',
        status: 'needs_review',
        waitingOn: 'Security approval or APAC Lead review',
        urgency: 'warning',
      },
      {
        number: 128,
        title: 'Upgrade EKS cluster node pools to m6i.xlarge instances',
        author: 'Marcus Thorne',
        impact: 'Infra capacity upgrade ready for morning testing.',
        status: 'needs_review',
        waitingOn: 'APAC staging cluster verification',
        urgency: 'normal',
      },
    ],
    stalledBranches: [
      {
        branch: 'feature/crypto-settlement-adapter',
        issue: 'Awaiting third-party sandbox credentials renewal from compliance',
        owner: 'David Chen',
      },
    ],
  },
  keyDecisionsAndDiscussions: [
    {
      topic: 'Customer Invoice Export API Protocol: REST vs GraphQL',
      channel: '#eng-architecture',
      consensusReached: true,
      decisionSummary: 'Selected HTTP/2 REST with ndjson streaming over GraphQL to prevent gateway proxy timeouts on 50k+ row invoice exports.',
      unresolvedQuestions: ['Rate-limiting tier for enterprise customers with custom webhooks'],
      participants: ['Elena Rostova', 'Priya Sharma (async)', 'David Chen'],
    },
    {
      topic: 'Database Shard Connection Limits for Microservices',
      channel: '#eng-incidents',
      consensusReached: false,
      decisionSummary: 'PgBouncer max connections temporarily elevated to 180. Long-term fix requires auditing Kafka worker connection lifecycles.',
      unresolvedQuestions: ['Is the fraud analyzer consumer holding transactions open across Kafka commit cycles?'],
      participants: ['David Chen', 'Marcus Thorne'],
    },
  ],
  oncomingActionChecklist: [
    {
      id: 'act-1',
      priority: 1,
      title: 'Triage Redis cluster ap-south-1b connectivity for Payment CI',
      estimatedMinutes: 20,
      assignedTo: 'Arjun Venkatesh',
      completed: false,
      contextNotes: 'Check AWS ElastiCache health in ap-south-1. If shard is stuck in reboot, promote replica to unlock main PR builds.',
    },
    {
      id: 'act-2',
      priority: 1,
      title: 'Review and approve PR #418 (Stripe Webhook Hotfix)',
      estimatedMinutes: 15,
      assignedTo: 'Arjun Venkatesh',
      completed: false,
      contextNotes: 'Elena verified logic locally. Check exponential backoff ceiling and merge once CI is green.',
    },
    {
      id: 'act-3',
      priority: 2,
      title: 'Investigate PgBouncer connection leaks in Kafka fraud analyzer',
      estimatedMinutes: 35,
      assignedTo: 'Bengaluru Backend Team',
      completed: false,
      contextNotes: 'Check Datadog dashboard "Postgres Connection Pool by Client App" for rogue connection leaks.',
    },
    {
      id: 'act-4',
      priority: 3,
      title: 'Run 3D Secure v2 staging sanity check on APAC currency flows',
      estimatedMinutes: 20,
      assignedTo: 'QA Lead (Bengaluru)',
      completed: true,
      contextNotes: 'Verified INR, SGD, and JPY test card transactions. Zero 3DS dropoffs observed.',
    },
  ],
  sleepSafeGuards: {
    offcomingEmergencyLead: 'Elena Rostova (Staff Platform Eng, San Francisco)',
    emergencyContact: '+1 (415) 555-0198 (PagerDuty Priority Override)',
    wakingTime: '08:00 AM PT / 20:30 IST (7 hours sleep window)',
    escalationCriteria: 'Only trigger phone call for Sev-0 total checkout stoppage or credential leak.',
  },
};

// Synthesis Engine using Gemini API
async function synthesizeBriefWithAI(
  events: PassiveEvent[],
  shiftWindow: ShiftWindow
): Promise<HandoffBrief> {
  const prompt = `You are AsyncPulse, an elite autonomous Cross-Timezone Handoff Orchestrator for globally distributed engineering organizations.
Your mission is to digest raw, unstructured passive signals (Git commits, Pull Request discussions, Slack incident messages, CI/CD pipeline runs) collected during an offcoming shift and generate a high-precision, executive "Handoff Brief" for the oncoming shift without requiring manual developer standup updates.

Offcoming Region: ${shiftWindow.fromRegion} (${shiftWindow.offcomingShift.name})
Oncoming Region: ${shiftWindow.toRegion} (${shiftWindow.oncomingShift.name})
Overlap Window: ${shiftWindow.overlapWindow}
Offcoming Lead: ${shiftWindow.offcomingShift.lead.name}
Oncoming Lead: ${shiftWindow.oncomingShift.lead.name}

Raw Passive Signals Received (${events.length} items):
${JSON.stringify(
  events.map((e) => ({
    source: e.source,
    channelOrRepo: e.channelOrRepo,
    author: `${e.author.name} (${e.author.role})`,
    timestamp: e.timestamp,
    summary: e.summary,
    details: e.details,
    urgency: e.urgency,
    metadata: e.metadata,
  })),
  null,
  2
)}

Generate a comprehensive, structured JSON response with this exact schema:
{
  "executiveSummary": "2-3 concise, punchy sentences summarizing today's velocity, state of main branch, and critical alerts for oncoming lead.",
  "healthScore": 0-100 number (e.g. 70 if broken build, 95 if everything green),
  "healthStatus": "healthy" | "at_risk" | "critical_blocker",
  "immediateBlockers": [
    {
      "id": "blk-uuid",
      "title": "Clear blocker title",
      "severity": "P0" | "P1" | "P2",
      "category": "broken_build" | "blocked_pr" | "production_incident" | "unresolved_thread" | "auth_failure",
      "repoOrChannel": "repo or slack channel name",
      "culpritOrLead": "who or what triggered it",
      "description": "Specific technical root cause or behavior observed",
      "impact": "What is halted right now",
      "recommendedAction": "Actionable step oncoming engineer should take first thing in their morning",
      "status": "open" | "investigating" | "resolved",
      "ticketLink": "link or identifier if applicable",
      "timestamp": "ISO timestamp"
    }
  ],
  "codeVelocity": {
    "commitsCount": number,
    "prsMerged": [
      {
        "number": 123,
        "title": "PR title",
        "author": "Author Name",
        "impact": "What shipped to staging/production",
        "status": "merged"
      }
    ],
    "prsNeedsReview": [
      {
        "number": 124,
        "title": "PR title",
        "author": "Author Name",
        "impact": "Why it matters",
        "status": "needs_review",
        "waitingOn": "Who needs to approve it",
        "urgency": "critical" | "warning" | "normal" | "low"
      }
    ],
    "stalledBranches": [
      {
        "branch": "branch-name",
        "issue": "why it stalled",
        "owner": "dev name"
      }
    ]
  },
  "keyDecisionsAndDiscussions": [
    {
      "topic": "Decision Topic",
      "channel": "Slack channel",
      "consensusReached": boolean,
      "decisionSummary": "Clear takeaway so oncoming team does not re-litigate decisions made while asleep",
      "unresolvedQuestions": ["Any open items left for tomorrow"],
      "participants": ["Name 1", "Name 2"]
    }
  ],
  "oncomingActionChecklist": [
    {
      "id": "act-uuid",
      "priority": 1,
      "title": "Concrete task title for oncoming shift morning checklist",
      "estimatedMinutes": 15-45,
      "assignedTo": "Name or role",
      "completed": false,
      "contextNotes": "Crucial context so they do not waste 40 minutes finding logs"
    }
  ],
  "sleepSafeGuards": {
    "offcomingEmergencyLead": "${shiftWindow.offcomingShift.lead.name} (${shiftWindow.offcomingShift.lead.role})",
    "emergencyContact": "Phone/PagerDuty details",
    "wakingTime": "Local waking time for offcoming lead",
    "escalationCriteria": "Criteria required before waking offcoming engineer during sleep cycle"
  }
}
Return ONLY valid JSON. No markdown formatting, no code fencing.`;

  try {
    if (process.env.GEMINI_API_KEY) {
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          systemInstruction:
            'You are AsyncPulse, an AI engine for cross-timezone software engineering handoffs. Generate clean, high-density, professional technical digests.',
        },
      });

      if (response.text) {
        const cleaned = response.text.replace(/```(?:json)?/gi, '').trim();
        const parsed = JSON.parse(cleaned);
        return {
          id: 'brief-' + Date.now(),
          shiftWindowId: shiftWindow.id,
          shiftTitle: `${shiftWindow.name} Daily Handoff`,
          generatedAt: new Date().toISOString(),
          totalSignalsAnalyzed: events.length,
          healthScore: parsed.healthScore ?? 75,
          healthStatus: parsed.healthStatus ?? 'at_risk',
          executiveSummary: parsed.executiveSummary || 'Shift handoff brief generated.',
          immediateBlockers: parsed.immediateBlockers || [],
          codeVelocity: parsed.codeVelocity || {
            commitsCount: events.filter((e) => e.source === 'github_commit').length,
            prsMerged: [],
            prsNeedsReview: [],
            stalledBranches: [],
          },
          keyDecisionsAndDiscussions: parsed.keyDecisionsAndDiscussions || [],
          oncomingActionChecklist: parsed.oncomingActionChecklist || [],
          sleepSafeGuards: parsed.sleepSafeGuards || currentBrief.sleepSafeGuards,
        };
      }
    }
  } catch (err) {
    console.error('Gemini synthesis failed, falling back to heuristic synthesizer:', err);
  }

  // Fallback heuristic synthesis if Gemini API key missing or network fails
  return generateHeuristicBrief(events, shiftWindow);
}

function generateHeuristicBrief(events: PassiveEvent[], shiftWindow: ShiftWindow): HandoffBrief {
  const criticalEvents = events.filter((e) => e.urgency === 'critical');
  const warningEvents = events.filter((e) => e.urgency === 'warning');

  const healthScore = Math.max(30, 100 - criticalEvents.length * 20 - warningEvents.length * 8);
  const healthStatus =
    criticalEvents.length > 0 ? 'critical_blocker' : warningEvents.length > 1 ? 'at_risk' : 'healthy';

  const blockers: BlockerItem[] = criticalEvents.map((e, idx) => ({
    id: `blk-${Date.now()}-${idx}`,
    title: e.summary,
    severity: 'P0',
    category: e.source === 'ci_cd' ? 'broken_build' : 'production_incident',
    repoOrChannel: e.channelOrRepo,
    culpritOrLead: e.author.name,
    description: e.details || e.summary,
    impact: 'Halts current deployment pipelines and code merges for oncoming shift.',
    recommendedAction: `Inspect ${e.channelOrRepo} logs and verify dependencies before restarting.`,
    status: 'open',
    ticketLink: e.metadata?.commitHash ? `Commit #${e.metadata.commitHash}` : undefined,
    timestamp: e.timestamp,
  }));

  // Add warning blockers
  warningEvents.slice(0, 2).forEach((e, idx) => {
    blockers.push({
      id: `blk-warn-${Date.now()}-${idx}`,
      title: e.summary,
      severity: 'P1',
      category: e.source === 'github_pr' ? 'blocked_pr' : 'unresolved_thread',
      repoOrChannel: e.channelOrRepo,
      culpritOrLead: e.author.name,
      description: e.details || e.summary,
      impact: 'Requires oncoming shift validation or approval to unblock staging deploy.',
      recommendedAction: 'Review PR code diff or check connection pool metrics.',
      status: 'investigating',
      timestamp: e.timestamp,
    });
  });

  const checklist: ActionChecklistItem[] = [
    {
      id: `act-${Date.now()}-1`,
      priority: 1,
      title: blockers[0]?.title ? `Resolve blocker: ${blockers[0].title}` : 'Verify CI Pipeline and test suite',
      estimatedMinutes: 20,
      assignedTo: shiftWindow.oncomingShift.lead.name,
      completed: false,
      contextNotes: blockers[0]?.recommendedAction || 'All main branches should be green.',
    },
    {
      id: `act-${Date.now()}-2`,
      priority: 2,
      title: 'Review open hotfix PRs and verify staging flag deployments',
      estimatedMinutes: 25,
      assignedTo: shiftWindow.oncomingShift.lead.name,
      completed: false,
      contextNotes: 'Ensure no unreviewed critical hotfixes are held up.',
    },
    {
      id: `act-${Date.now()}-3`,
      priority: 3,
      title: 'Acknowledge overnight Slack architecture decisions',
      estimatedMinutes: 10,
      assignedTo: 'Team Engineers',
      completed: false,
      contextNotes: 'Review #eng-architecture decisions before starting new feature branches.',
    },
  ];

  return {
    id: 'brief-' + Date.now(),
    shiftWindowId: shiftWindow.id,
    shiftTitle: `${shiftWindow.name} Daily Handoff`,
    generatedAt: new Date().toISOString(),
    totalSignalsAnalyzed: events.length,
    healthScore,
    healthStatus,
    executiveSummary: `${shiftWindow.offcomingShift.name} completed today's cycle with ${events.length} passive telemetry signals captured across Git and Slack. ${
      criticalEvents.length > 0
        ? `🚨 ${criticalEvents.length} critical blocker(s) detected requiring immediate attention.`
        : 'Systems are operating with stable code velocity.'
    } Key tasks queued for ${shiftWindow.oncomingShift.lead.name}'s oncoming shift.`,
    immediateBlockers: blockers,
    codeVelocity: {
      commitsCount: events.length === 0 ? 0 : events.filter((e) => e.source === 'github_commit').length + 18,
      prsMerged: currentBrief.codeVelocity.prsMerged,
      prsNeedsReview: currentBrief.codeVelocity.prsNeedsReview,
      stalledBranches: currentBrief.codeVelocity.stalledBranches,
    },
    keyDecisionsAndDiscussions: currentBrief.keyDecisionsAndDiscussions,
    oncomingActionChecklist: checklist,
    sleepSafeGuards: {
      offcomingEmergencyLead: `${shiftWindow.offcomingShift.lead.name} (${shiftWindow.offcomingShift.lead.role})`,
      emergencyContact: '+1 (415) 555-0198 (PagerDuty Priority Override)',
      wakingTime: '08:00 AM PT / 20:30 IST (7 hours sleep window)',
      escalationCriteria: 'Only trigger phone call for Sev-0 total checkout stoppage or credential leak.',
    },
  };
}

// ----------------------------------------------------
// API ROUTES
// ----------------------------------------------------

// 1. Shifts & Timezone Radar
app.get('/api/shifts', (req, res) => {
  res.json({
    shiftWindows: initialShiftWindows,
    serverTimeUtc: new Date().toISOString(),
    workspaces: workspaceConfig,
  });
});

// 2. Passive Signals Stream
app.get('/api/stream', (req, res) => {
  const { source, urgency, limit } = req.query;
  let filtered = [...passiveEvents];

  if (source && source !== 'all') {
    filtered = filtered.filter((e) => e.source === source);
  }
  if (urgency && urgency !== 'all') {
    filtered = filtered.filter((e) => e.urgency === urgency);
  }

  let max = 50;
  if (typeof limit === 'string') {
    const parsed = parseInt(limit, 10);
    if (!isNaN(parsed) && parsed > 0) {
      max = parsed;
    }
  }

  res.json({
    events: filtered.slice(0, max),
    total: passiveEvents.length,
    lastIngestedAt: passiveEvents[0]?.timestamp || new Date().toISOString(),
  });
});

// 3. Ingest / Simulate a new passive event (e.g. Broken commit, Slack escalation)
app.post('/api/stream/simulate-event', async (req, res) => {
  const { source, sourceName, channelOrRepo, authorName, authorRole, summary, details, urgency, tags } = req.body || {};

  const validUrgencies: Array<'critical' | 'warning' | 'normal' | 'low'> = ['critical', 'warning', 'normal', 'low'];
  const resolvedUrgency = validUrgencies.includes(urgency) ? urgency : 'normal';

  const newEvent: PassiveEvent = {
    id: 'evt-' + Date.now(),
    source: source || 'github_commit',
    sourceName: sourceName || 'GitHub',
    channelOrRepo: channelOrRepo || 'acme-corp/payment-orchestrator',
    author: {
      name: authorName || 'Elena Rostova',
      role: authorRole || 'Staff Platform Engineer',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
      timezone: 'America/Los_Angeles',
    },
    timestamp: new Date().toISOString(),
    summary: summary || 'Passive event ingested',
    details: details || '',
    urgency: resolvedUrgency,
    tags: tags && Array.isArray(tags) ? tags : ['auto-ingested'],
    metadata: {
      commitHash: Math.random().toString(36).substring(2, 9),
    },
  };

  passiveEvents.unshift(newEvent);

  // If critical, auto re-synthesize or flag in current brief
  if (resolvedUrgency === 'critical') {
    const shift = initialShiftWindows[0];
    currentBrief = await synthesizeBriefWithAI(passiveEvents, shift);
  }

  res.json({ success: true, event: newEvent, totalEvents: passiveEvents.length });
});

// 4. Get Current Active Handoff Brief
app.get('/api/handoff/latest', (req, res) => {
  res.json(currentBrief);
});

// 5. Trigger Real-time AI Synthesis of Handoff Brief
app.post('/api/handoff/synthesize', async (req, res) => {
  try {
    const { shiftWindowId } = req.body || {};
    const targetShift =
      initialShiftWindows.find((s) => s.id === shiftWindowId) || initialShiftWindows[0];

    const freshBrief = await synthesizeBriefWithAI(passiveEvents, targetShift);
    currentBrief = freshBrief;

    res.json({
      success: true,
      brief: freshBrief,
    });
  } catch (error: any) {
    console.error('Synthesis error:', error);
    res.status(500).json({ error: error.message || 'Failed to synthesize handoff brief' });
  }
});

// 6. "Ask Shift Intelligence" - Interactive Q&A for Oncoming Engineer
app.post('/api/handoff/query', async (req, res) => {
  const { question } = req.body || {};
  if (!question || typeof question !== 'string' || !question.trim()) {
    res.status(400).json({ error: 'Missing or empty question string' });
    return;
  }

  const prompt = `You are the AsyncPulse Shift Brain. An oncoming engineer (in India/Asia or Europe) just logged on for their shift and is asking you a question about what occurred during the offcoming shift (US West / California).
Ground your answer STRICTLY in the following passive events and current handoff brief context. Do NOT fabricate events. If an event or topic is not mentioned, clearly state so and advise where to check.

CURRENT HANDOFF BRIEF:
Executive Summary: ${currentBrief.executiveSummary}
Immediate Blockers: ${JSON.stringify(currentBrief.immediateBlockers)}
Code Velocity: ${JSON.stringify(currentBrief.codeVelocity)}
Key Decisions: ${JSON.stringify(currentBrief.keyDecisionsAndDiscussions)}
Offcoming Lead: ${currentBrief.sleepSafeGuards.offcomingEmergencyLead}
Offcoming Sleep Window: ${currentBrief.sleepSafeGuards.wakingTime}
Escalation Policy: ${currentBrief.sleepSafeGuards.escalationCriteria}

RECENT PASSIVE TELEMETRY EVENTS:
${JSON.stringify(
  passiveEvents.map((e) => ({
    source: e.source,
    channelOrRepo: e.channelOrRepo,
    author: `${e.author.name} (${e.author.role})`,
    time: e.timestamp,
    summary: e.summary,
    details: e.details,
    urgency: e.urgency,
  })),
  null,
  2
)}

QUESTION FROM ONCOMING ENGINEER:
"${question.trim()}"

Provide a structured JSON response with:
{
  "answer": "Clear, concise direct answer highlighting exact culprits, PR numbers, or channels.",
  "citations": [
    {
      "source": "e.g. GitHub PR #418 or Slack #eng-incidents",
      "snippet": "short relevant quote or fact",
      "timestamp": "approximate time"
    }
  ],
  "suggestedNextStep": "Immediate concrete action recommended for the oncoming engineer right now."
}
Return JSON only.`;

  try {
    if (process.env.GEMINI_API_KEY) {
      const result = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          systemInstruction: 'You are the AsyncPulse shift AI intelligence assistant. Give direct, high-value engineering answers.',
        },
      });

      if (result.text) {
        const cleanedJson = result.text.replace(/```(?:json)?/gi, '').trim();
        const parsed = JSON.parse(cleanedJson) as ShiftQueryResponse;
        res.json(parsed);
        return;
      }
    }
  } catch (err) {
    console.error('Gemini query error, falling back to local extractor:', err);
  }

  // Fallback intelligent responder
  const qLower = question.toLowerCase();
  let answer = 'During the offcoming shift, teams pushed 24 commits and resolved several Slack threads.';
  let citations = [
    {
      source: 'GitHub Actions',
      snippet: 'Main branch build failure in Payment Gateway Integration Tests',
      timestamp: '28 minutes ago',
    },
  ];
  let suggestedNextStep = 'Review the P0 blocker on Redis idempotency shard connection.';

  if (qLower.includes('redis') || qLower.includes('build') || qLower.includes('broken') || qLower.includes('ci')) {
    answer =
      'The main branch CI broke 28 minutes ago on the Payment Gateway integration test suite. Redis cluster shard ap-south-1b timed out after 3 retries, halting 14 tests. Elena Rostova investigated before logging off.';
    citations = [
      {
        source: 'acme-corp/payment-orchestrator (CI/CD)',
        snippet: 'ConnectionTimeoutError: Redis connection dropped after 3 retries in cluster shard ap-south-1b',
        timestamp: '28 min ago',
      },
    ];
    suggestedNextStep = 'Check if AWS ElastiCache ap-south-1b shard is rebooting or promote replica ap-south-1a.';
  } else if (qLower.includes('stripe') || qLower.includes('webhook') || qLower.includes('418')) {
    answer =
      'Elena Rostova authored PR #418 to address a memory leak during Stripe webhook bursts (>5k req/sec) using exponential backoff. Tests passed locally; it awaits security approval or APAC lead override.';
    citations = [
      {
        source: 'GitHub PR #418',
        snippet: '[HOTFIX] Exponential backoff on Stripe webhook retry worker (+142 / -38 lines)',
        timestamp: '45 min ago',
      },
    ];
    suggestedNextStep = 'Review PR #418 diff and approve once main build is restored.';
  } else if (qLower.includes('sleep') || qLower.includes('call') || qLower.includes('wake') || qLower.includes('elena') || qLower.includes('emergency')) {
    answer = `Elena Rostova is the offcoming emergency lead. She is currently asleep and will be awake at ${currentBrief.sleepSafeGuards.wakingTime}. PagerDuty phone override is reserved strictly for Sev-0 total checkout outages.`;
    citations = [
      {
        source: 'Sleep Safeguards Matrix',
        snippet: currentBrief.sleepSafeGuards.escalationCriteria,
        timestamp: 'Active Policy',
      },
    ];
    suggestedNextStep = 'Attempt to resolve shard issue independently before triggering sleep override.';
  } else if (qLower.includes('postgres') || qLower.includes('db') || qLower.includes('connection') || qLower.includes('kafka')) {
    answer =
      'PgBouncer connection pool spiked to 98% saturation at 16:40 PT due to a new Kafka consumer group `checkout-fraud-analyzer`. David Chen raised pool to 180 connections as a temporary patch, but suspect uncommitted batch offsets.';
    citations = [
      {
        source: 'Slack #eng-incidents',
        snippet: 'Connection spikes correlated with new Kafka consumer group checkout-fraud-analyzer',
        timestamp: '65 min ago',
      },
    ];
    suggestedNextStep = 'Inspect Datadog Postgres connection pool metrics and verify Kafka consumer offset commit loops.';
  }

  res.json({ answer, citations, suggestedNextStep });
});

// 7. Toggle or claim oncoming action checklist item
app.patch('/api/handoff/checklist/:id', (req, res) => {
  const { id } = req.params;
  const { completed, claimedBy } = req.body || {};

  const item = currentBrief.oncomingActionChecklist.find((a) => a.id === id);
  if (!item) {
    res.status(404).json({ error: 'Checklist item not found' });
    return;
  }

  if (typeof completed === 'boolean') {
    item.completed = completed;
  }
  if (claimedBy !== undefined && typeof claimedBy === 'string') {
    item.claimedBy = claimedBy.trim();
  }

  res.json({ success: true, item });
});

// 8. Update Workspace Config (Seats & B2B Pricing Calculator)
app.patch('/api/workspaces', (req, res) => {
  const { activeSeats, privacySetting, connectedRepositories, monitoredChannels } = req.body || {};
  if (typeof activeSeats === 'number' && !isNaN(activeSeats) && Number.isFinite(activeSeats)) {
    workspaceConfig.activeSeats = Math.max(1, Math.floor(activeSeats));
  }
  if (privacySetting === 'metadata_and_diffs_only' || privacySetting === 'full_text_redacted') {
    workspaceConfig.privacySetting = privacySetting;
  }
  if (Array.isArray(connectedRepositories)) {
    workspaceConfig.connectedRepositories = connectedRepositories;
  }
  if (Array.isArray(monitoredChannels)) {
    workspaceConfig.monitoredChannels = monitoredChannels;
  }

  res.json({ success: true, workspace: workspaceConfig });
});

// 9. Dispatch to Slack/Discord Webhook Simulation
app.post('/api/handoff/export-webhook', (req, res) => {
  const { channel, message } = req.body || {};
  res.json({
    success: true,
    channel: channel || '#eng-handoffs-apac',
    dispatchedAt: new Date().toISOString(),
    previewSnippet: message || currentBrief.executiveSummary,
  });
});

// ----------------------------------------------------
// VITE MIDDLEWARE SETUP
// ----------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`AsyncPulse Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
