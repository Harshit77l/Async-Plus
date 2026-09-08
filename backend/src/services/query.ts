import type { HandoffBrief, PassiveEvent, ShiftQueryResponse } from '../types.ts';

export function isValidQuestion(question: unknown): question is string {
  return typeof question === 'string' && question.trim().length > 0;
}

export function answerShiftQuestion(
  question: string,
  brief: HandoffBrief,
  events: PassiveEvent[],
): ShiftQueryResponse {
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
  } else if (
    qLower.includes('sleep') ||
    qLower.includes('call') ||
    qLower.includes('wake') ||
    qLower.includes('elena') ||
    qLower.includes('emergency')
  ) {
    answer = `Elena Rostova is the offcoming emergency lead. She is currently asleep and will be awake at ${brief.sleepSafeGuards.wakingTime}. PagerDuty phone override is reserved strictly for Sev-0 total checkout outages.`;
    citations = [
      {
        source: 'Sleep Safeguards Matrix',
        snippet: brief.sleepSafeGuards.escalationCriteria,
        timestamp: 'Active Policy',
      },
    ];
    suggestedNextStep = 'Attempt to resolve shard issue independently before triggering sleep override.';
  } else if (
    qLower.includes('postgres') ||
    qLower.includes('db') ||
    qLower.includes('connection') ||
    qLower.includes('kafka')
  ) {
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
  } else if (events[0]) {
    answer = `Latest signal: ${events[0].summary}`;
    citations = [
      {
        source: events[0].channelOrRepo,
        snippet: events[0].details || events[0].summary,
        timestamp: events[0].timestamp,
      },
    ];
  }

  return { answer, citations, suggestedNextStep };
}

export function stripJsonFences(raw: string): string {
  return raw.replace(/```(?:json)?/gi, '').trim();
}
