import type {
  ActionChecklistItem,
  HandoffBrief,
  PassiveEvent,
  ShiftWindow,
  WorkspaceConfig,
} from './types.ts';

export const initialShiftWindows: ShiftWindow[] = [
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

export function createInitialEvents(now = Date.now()): PassiveEvent[] {
  return [
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
      timestamp: new Date(now - 28 * 60000).toISOString(),
      summary: '🚨 Main branch build failure in workflow: "Payment Gateway Integration Tests"',
      details:
        'Job failed on step [Redis Idempotency Check]: ConnectionTimeoutError: Redis connection dropped after 3 retries in cluster shard ap-south-1b. 14 downstream tests halted.',
      urgency: 'critical',
      tags: ['build-broken', 'p0-blocker', 'redis', 'payment-orchestrator'],
      metadata: { ciStatus: 'failed', commitHash: '8b4d9a2' },
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
      timestamp: new Date(now - 45 * 60000).toISOString(),
      summary: 'PR #418 [HOTFIX] Exponential backoff on Stripe webhook retry worker',
      details:
        'Pushed commit 4f9e11a addressing memory leak when Stripe events burst > 5k req/sec. Tests pass locally. Blocked on Security review approval from @sec-team or APAC lead override.',
      urgency: 'warning',
      tags: ['pr-needs-review', 'hotfix', 'stripe-webhook'],
      metadata: { prNumber: 418, commitHash: '4f9e11a', diffStats: '+142 / -38 lines (4 files)' },
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
      timestamp: new Date(now - 65 * 60000).toISOString(),
      summary: 'Slack thread: PostgreSQL shard connection pool saturation alert at 16:40 PT',
      details:
        'Connection spikes correlated with new Kafka consumer group `checkout-fraud-analyzer`. We temporarily raised PgBouncer pool to 180 max connections, but need Bengaluru team to inspect whether the batch consumer is omitting commit offsets.',
      urgency: 'warning',
      tags: ['database', 'kafka', 'postgres', 'pool-saturation'],
      metadata: { channel: '#eng-incidents', threadReplies: 14 },
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
      timestamp: new Date(now - 110 * 60000).toISOString(),
      summary: 'feat(checkout): roll out 3D Secure v2 challenge dialog modal [merged to main]',
      details:
        'Merged PR #392 into main. Feature flag `enable_3ds_v2` is set to 10% in staging environment. Verified zero visual regressions on iOS Safari and Chrome desktop.',
      urgency: 'normal',
      tags: ['feature-merged', 'frontend', 'checkout-v2'],
      metadata: { commitHash: 'c73a810', diffStats: '+620 / -110 lines' },
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
      timestamp: new Date(now - 130 * 60000).toISOString(),
      summary: 'Architecture Decision: GraphQL vs REST for customer billing portal export API',
      details:
        'Consensus reached between Elena (SF) and Priya (Bengaluru, async). We are moving forward with REST endpoint streaming ndjson for large invoices to avoid GraphQL nested query timeout limits.',
      urgency: 'low',
      tags: ['architecture-decision', 'api-contract', 'billing'],
      metadata: { channel: '#eng-architecture', threadReplies: 22 },
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
      timestamp: new Date(now - 170 * 60000).toISOString(),
      summary: 'PR #128: Upgrade EKS cluster node pools to m6i.xlarge instances',
      details:
        'Ready to apply in APAC staging cluster during low traffic morning window. Needs verification from Arjun before rolling to production.',
      urgency: 'normal',
      tags: ['terraform', 'eks', 'infra'],
      metadata: { prNumber: 128, commitHash: 'e105bd9' },
    },
  ];
}

export const initialWorkspace: WorkspaceConfig = {
  workspaceName: 'Acme Global Distributed Engineering',
  activeSeats: 48,
  pricePerSeat: 6,
  connectedRepositories: [
    'acme-corp/payment-orchestrator',
    'acme-corp/frontend-app',
    'acme-corp/infra-terraform',
    'acme-corp/identity-service',
  ],
  monitoredChannels: ['#eng-incidents', '#eng-architecture', '#deploy-alerts', '#backend-standup'],
  autoDigestCron: 'Every day at 18:00 PT / 06:30 IST',
  slackWebhookUrl: 'https://hooks.slack.com/services/T00/B00/AsyncPulseHandoffBot',
  privacySetting: 'metadata_and_diffs_only',
};

export function createInitialBrief(events: PassiveEvent[], now = Date.now()): HandoffBrief {
  const checklist: ActionChecklistItem[] = [
    {
      id: 'act-1',
      priority: 1,
      title: 'Triage Redis cluster ap-south-1b connectivity for Payment CI',
      estimatedMinutes: 20,
      assignedTo: 'Arjun Venkatesh',
      completed: false,
      contextNotes:
        'Check AWS ElastiCache health in ap-south-1. If shard is stuck in reboot, promote replica to unlock main PR builds.',
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
  ];

  return {
    id: 'brief-' + now,
    shiftWindowId: 'usw-to-ist',
    shiftTitle: 'US Pacific (SF) → South Asia (Bengaluru) Daily Handoff',
    generatedAt: new Date(now).toISOString(),
    totalSignalsAnalyzed: events.length,
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
        description:
          'Payment Gateway Integration test suite failing on Redis connection dropped after 3 retries. Blocks all subsequent PR merges to main.',
        impact: 'PR merge queue locked. Downstream deployments to staging blocked.',
        recommendedAction:
          'Restart Redis shard proxy or failover to ap-south-1a replica; verify if VPC peering route table changed.',
        status: 'open',
        ticketLink: 'https://github.com/acme-corp/payment-orchestrator/actions/runs/892110',
        timestamp: new Date(now - 28 * 60000).toISOString(),
      },
      {
        id: 'blk-2',
        title: 'Kafka Checkout Consumer Shard Connection Saturation',
        severity: 'P1',
        category: 'production_incident',
        repoOrChannel: '#eng-incidents',
        culpritOrLead: 'David Chen / checkout-fraud-analyzer',
        description:
          'PgBouncer pool reached 98% threshold at 16:40 PT. Raised to 180 connections as quick patch, but consumer appears to leak idle connections.',
        impact: 'Potential 504 Gateway Timeouts on auth queries if traffic spikes.',
        recommendedAction:
          'Arjun/Bengaluru team to check consumer commit offsets and ensure connection pooling is configured with max-lifetime.',
        status: 'investigating',
        ticketLink: 'https://linear.app/acme/issue/ENG-4912',
        timestamp: new Date(now - 65 * 60000).toISOString(),
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
        decisionSummary:
          'Selected HTTP/2 REST with ndjson streaming over GraphQL to prevent gateway proxy timeouts on 50k+ row invoice exports.',
        unresolvedQuestions: ['Rate-limiting tier for enterprise customers with custom webhooks'],
        participants: ['Elena Rostova', 'Priya Sharma (async)', 'David Chen'],
      },
      {
        topic: 'Database Shard Connection Limits for Microservices',
        channel: '#eng-incidents',
        consensusReached: false,
        decisionSummary:
          'PgBouncer max connections temporarily elevated to 180. Long-term fix requires auditing Kafka worker connection lifecycles.',
        unresolvedQuestions: ['Is the fraud analyzer consumer holding transactions open across Kafka commit cycles?'],
        participants: ['David Chen', 'Marcus Thorne'],
      },
    ],
    oncomingActionChecklist: checklist,
    sleepSafeGuards: {
      offcomingEmergencyLead: 'Elena Rostova (Staff Platform Eng, San Francisco)',
      emergencyContact: '+1 (415) 555-0198 (PagerDuty Priority Override)',
      wakingTime: '08:00 AM PT / 20:30 IST (7 hours sleep window)',
      escalationCriteria: 'Only trigger phone call for Sev-0 total checkout stoppage or credential leak.',
    },
  };
}
