export type UrgencyLevel = 'critical' | 'warning' | 'normal' | 'low';
export type BlockerSeverity = 'P0' | 'P1' | 'P2';

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  avatar: string;
  timezone: string;
  location: string;
  status: 'working' | 'overlap' | 'asleep' | 'offline';
  localTime: string;
}

export interface ShiftWindow {
  id: string;
  name: string;
  fromRegion: string;
  toRegion: string;
  offcomingShift: {
    name: string;
    timezone: string;
    location: string;
    lead: TeamMember;
    activeHours: string;
  };
  oncomingShift: {
    name: string;
    timezone: string;
    location: string;
    lead: TeamMember;
    activeHours: string;
  };
  overlapWindow: string; // e.g., "08:00 - 09:00 PT / 20:30 - 21:30 IST"
  overlapMinutesRemaining: number;
  status: 'in_overlap' | 'handoff_due' | 'active_shift' | 'off_hours';
}

export interface PassiveEvent {
  id: string;
  source: 'github_commit' | 'github_pr' | 'slack' | 'discord' | 'ci_cd' | 'jira';
  sourceName: string;
  channelOrRepo: string;
  author: {
    name: string;
    role: string;
    avatar: string;
    timezone: string;
  };
  timestamp: string; // ISO string
  summary: string;
  details?: string;
  urgency: UrgencyLevel;
  tags: string[];
  metadata?: {
    prNumber?: number;
    commitHash?: string;
    ciStatus?: 'passed' | 'failed' | 'running';
    threadReplies?: number;
    channel?: string;
    diffStats?: string;
  };
}

export interface BlockerItem {
  id: string;
  title: string;
  severity: BlockerSeverity;
  category: 'broken_build' | 'blocked_pr' | 'production_incident' | 'unresolved_thread' | 'auth_failure';
  repoOrChannel: string;
  culpritOrLead: string;
  description: string;
  impact: string;
  recommendedAction: string;
  status: 'open' | 'investigating' | 'resolved';
  ticketLink?: string;
  timestamp: string;
}

export interface PRVelocityItem {
  number: number;
  title: string;
  author: string;
  impact: string;
  status: 'merged' | 'needs_review' | 'stalled';
  waitingOn?: string;
  urgency?: UrgencyLevel;
}

export interface KeyDecisionItem {
  topic: string;
  channel: string;
  consensusReached: boolean;
  decisionSummary: string;
  unresolvedQuestions: string[];
  participants: string[];
}

export interface ActionChecklistItem {
  id: string;
  priority: 1 | 2 | 3 | 4;
  title: string;
  estimatedMinutes: number;
  assignedTo?: string;
  claimedBy?: string;
  completed: boolean;
  contextNotes: string;
}

export interface HandoffBrief {
  id: string;
  shiftWindowId: string;
  shiftTitle: string;
  generatedAt: string;
  totalSignalsAnalyzed: number;
  healthScore: number; // 0 - 100
  healthStatus: 'healthy' | 'at_risk' | 'critical_blocker';
  executiveSummary: string;
  immediateBlockers: BlockerItem[];
  codeVelocity: {
    commitsCount: number;
    prsMerged: PRVelocityItem[];
    prsNeedsReview: PRVelocityItem[];
    stalledBranches: Array<{ branch: string; issue: string; owner: string }>;
  };
  keyDecisionsAndDiscussions: KeyDecisionItem[];
  oncomingActionChecklist: ActionChecklistItem[];
  sleepSafeGuards: {
    offcomingEmergencyLead: string;
    emergencyContact: string;
    wakingTime: string;
    escalationCriteria: string;
  };
}

export interface ShiftQueryResponse {
  answer: string;
  citations: Array<{ source: string; snippet: string; timestamp: string }>;
  suggestedNextStep: string;
}

export interface WorkspaceConfig {
  workspaceName: string;
  activeSeats: number;
  pricePerSeat: number;
  connectedRepositories: string[];
  monitoredChannels: string[];
  autoDigestCron: string;
  slackWebhookUrl?: string;
  privacySetting: 'metadata_and_diffs_only' | 'full_text_redacted';
}
