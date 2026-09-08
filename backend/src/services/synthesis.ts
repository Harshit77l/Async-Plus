import type {
  ActionChecklistItem,
  BlockerItem,
  HandoffBrief,
  PassiveEvent,
  ShiftWindow,
} from '../types.ts';

export function generateHeuristicBrief(
  events: PassiveEvent[],
  shiftWindow: ShiftWindow,
  previous?: HandoffBrief,
  now = Date.now(),
): HandoffBrief {
  const criticalEvents = events.filter((event) => event.urgency === 'critical');
  const warningEvents = events.filter((event) => event.urgency === 'warning');

  const healthScore = Math.max(30, 100 - criticalEvents.length * 20 - warningEvents.length * 8);
  const healthStatus =
    criticalEvents.length > 0 ? 'critical_blocker' : warningEvents.length > 1 ? 'at_risk' : 'healthy';

  const blockers: BlockerItem[] = criticalEvents.map((event, idx) => ({
    id: `blk-${now}-${idx}`,
    title: event.summary,
    severity: 'P0',
    category: event.source === 'ci_cd' ? 'broken_build' : 'production_incident',
    repoOrChannel: event.channelOrRepo,
    culpritOrLead: event.author.name,
    description: event.details || event.summary,
    impact: 'Halts current deployment pipelines and code merges for oncoming shift.',
    recommendedAction: `Inspect ${event.channelOrRepo} logs and verify dependencies before restarting.`,
    status: 'open',
    ticketLink: event.metadata?.commitHash ? `Commit #${event.metadata.commitHash}` : undefined,
    timestamp: event.timestamp,
  }));

  warningEvents.slice(0, 2).forEach((event, idx) => {
    blockers.push({
      id: `blk-warn-${now}-${idx}`,
      title: event.summary,
      severity: 'P1',
      category: event.source === 'github_pr' ? 'blocked_pr' : 'unresolved_thread',
      repoOrChannel: event.channelOrRepo,
      culpritOrLead: event.author.name,
      description: event.details || event.summary,
      impact: 'Requires oncoming shift validation or approval to unblock staging deploy.',
      recommendedAction: 'Review PR code diff or check connection pool metrics.',
      status: 'investigating',
      timestamp: event.timestamp,
    });
  });

  const checklist: ActionChecklistItem[] = [
    {
      id: `act-${now}-1`,
      priority: 1,
      title: blockers[0]?.title ? `Resolve blocker: ${blockers[0].title}` : 'Verify CI Pipeline and test suite',
      estimatedMinutes: 20,
      assignedTo: shiftWindow.oncomingShift.lead.name,
      completed: false,
      contextNotes: blockers[0]?.recommendedAction || 'All main branches should be green.',
    },
    {
      id: `act-${now}-2`,
      priority: 2,
      title: 'Review open hotfix PRs and verify staging flag deployments',
      estimatedMinutes: 25,
      assignedTo: shiftWindow.oncomingShift.lead.name,
      completed: false,
      contextNotes: 'Ensure no unreviewed critical hotfixes are held up.',
    },
    {
      id: `act-${now}-3`,
      priority: 3,
      title: 'Acknowledge overnight Slack architecture decisions',
      estimatedMinutes: 10,
      assignedTo: 'Team Engineers',
      completed: false,
      contextNotes: 'Review #eng-architecture decisions before starting new feature branches.',
    },
  ];

  return {
    id: 'brief-' + now,
    shiftWindowId: shiftWindow.id,
    shiftTitle: `${shiftWindow.name} Daily Handoff`,
    generatedAt: new Date(now).toISOString(),
    totalSignalsAnalyzed: events.length,
    healthScore,
    healthStatus,
    executiveSummary: `${shiftWindow.offcomingShift.name} completed today's cycle with ${events.length} passive telemetry signals captured across Git and Slack. ${
      criticalEvents.length > 0
        ? `${criticalEvents.length} critical blocker(s) detected requiring immediate attention.`
        : 'Systems are operating with stable code velocity.'
    } Key tasks queued for ${shiftWindow.oncomingShift.lead.name}'s oncoming shift.`,
    immediateBlockers: blockers,
    codeVelocity: {
      commitsCount: events.length === 0 ? 0 : events.filter((event) => event.source === 'github_commit').length + 18,
      prsMerged: previous?.codeVelocity.prsMerged ?? [],
      prsNeedsReview: previous?.codeVelocity.prsNeedsReview ?? [],
      stalledBranches: previous?.codeVelocity.stalledBranches ?? [],
    },
    keyDecisionsAndDiscussions: previous?.keyDecisionsAndDiscussions ?? [],
    oncomingActionChecklist: checklist,
    sleepSafeGuards: {
      offcomingEmergencyLead: `${shiftWindow.offcomingShift.lead.name} (${shiftWindow.offcomingShift.lead.role})`,
      emergencyContact: '+1 (415) 555-0198 (PagerDuty Priority Override)',
      wakingTime: '08:00 AM PT / 20:30 IST (7 hours sleep window)',
      escalationCriteria: 'Only trigger phone call for Sev-0 total checkout stoppage or credential leak.',
    },
  };
}

export function resolveShiftWindow(windows: ShiftWindow[], shiftWindowId: unknown): ShiftWindow {
  if (typeof shiftWindowId === 'string') {
    return windows.find((shift) => shift.id === shiftWindowId) || windows[0];
  }
  return windows[0];
}
