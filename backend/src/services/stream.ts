import type { PassiveEvent, UrgencyLevel } from '../types.ts';

const VALID_URGENCIES: UrgencyLevel[] = ['critical', 'warning', 'normal', 'low'];

export interface StreamQuery {
  source?: unknown;
  urgency?: unknown;
  limit?: unknown;
}

export interface SimulateEventInput {
  source?: unknown;
  sourceName?: unknown;
  channelOrRepo?: unknown;
  authorName?: unknown;
  authorRole?: unknown;
  summary?: unknown;
  details?: unknown;
  urgency?: unknown;
  tags?: unknown;
}

export function parsePositiveLimit(limit: unknown, fallback = 50): number {
  if (typeof limit === 'string') {
    const parsed = parseInt(limit, 10);
    if (!Number.isNaN(parsed) && parsed > 0) return parsed;
    return fallback;
  }
  if (typeof limit === 'number' && Number.isFinite(limit) && limit > 0) {
    return Math.floor(limit);
  }
  return fallback;
}

export function filterEvents(events: PassiveEvent[], query: StreamQuery): PassiveEvent[] {
  let filtered = [...events];
  const source = typeof query.source === 'string' ? query.source : undefined;
  const urgency = typeof query.urgency === 'string' ? query.urgency : undefined;

  if (source && source !== 'all') {
    filtered = filtered.filter((event) => event.source === source);
  }
  if (urgency && urgency !== 'all') {
    filtered = filtered.filter((event) => event.urgency === urgency);
  }
  return filtered;
}

export function resolveUrgency(value: unknown): UrgencyLevel {
  return VALID_URGENCIES.includes(value as UrgencyLevel) ? (value as UrgencyLevel) : 'normal';
}

export function buildSimulatedEvent(input: SimulateEventInput = {}, now = Date.now()): PassiveEvent {
  const tags = Array.isArray(input.tags)
    ? input.tags.filter((tag): tag is string => typeof tag === 'string')
    : ['auto-ingested'];

  return {
    id: 'evt-' + now,
    source: (typeof input.source === 'string' && input.source ? input.source : 'github_commit') as PassiveEvent['source'],
    sourceName: typeof input.sourceName === 'string' && input.sourceName ? input.sourceName : 'GitHub',
    channelOrRepo:
      typeof input.channelOrRepo === 'string' && input.channelOrRepo
        ? input.channelOrRepo
        : 'acme-corp/payment-orchestrator',
    author: {
      name: typeof input.authorName === 'string' && input.authorName ? input.authorName : 'Elena Rostova',
      role: typeof input.authorRole === 'string' && input.authorRole ? input.authorRole : 'Staff Platform Engineer',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
      timezone: 'America/Los_Angeles',
    },
    timestamp: new Date(now).toISOString(),
    summary: typeof input.summary === 'string' && input.summary ? input.summary : 'Passive event ingested',
    details: typeof input.details === 'string' ? input.details : '',
    urgency: resolveUrgency(input.urgency),
    tags,
    metadata: {
      commitHash: Math.random().toString(36).substring(2, 9),
    },
  };
}
