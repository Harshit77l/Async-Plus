import type { WorkspaceConfig } from '../types.ts';

const VALID_PRIVACY: WorkspaceConfig['privacySetting'][] = [
  'metadata_and_diffs_only',
  'full_text_redacted',
];

export interface WorkspacePatch {
  activeSeats?: unknown;
  privacySetting?: unknown;
  connectedRepositories?: unknown;
  monitoredChannels?: unknown;
}

export function applyWorkspacePatch(
  current: WorkspaceConfig,
  patch: WorkspacePatch = {},
): WorkspaceConfig {
  const next: WorkspaceConfig = { ...current };

  if (typeof patch.activeSeats === 'number' && !Number.isNaN(patch.activeSeats) && Number.isFinite(patch.activeSeats)) {
    next.activeSeats = Math.max(1, Math.floor(patch.activeSeats));
  }

  if (patch.privacySetting === 'metadata_and_diffs_only' || patch.privacySetting === 'full_text_redacted') {
    next.privacySetting = patch.privacySetting;
  } else if (typeof patch.privacySetting === 'string' && !VALID_PRIVACY.includes(patch.privacySetting as WorkspaceConfig['privacySetting'])) {
    next.privacySetting = current.privacySetting;
  }

  if (Array.isArray(patch.connectedRepositories)) {
    next.connectedRepositories = patch.connectedRepositories.filter((item): item is string => typeof item === 'string');
  }
  if (Array.isArray(patch.monitoredChannels)) {
    next.monitoredChannels = patch.monitoredChannels.filter((item): item is string => typeof item === 'string');
  }

  return next;
}

export function monthlyWorkspaceCost(seats: number, pricePerSeat: number): number {
  return seats * pricePerSeat;
}

export function hoursSavedPerMonth(seats: number, hoursPerSeat = 15): number {
  return seats * hoursPerSeat;
}

export function classifyHealth(score: number, status?: string): 'critical' | 'warning' | 'optimal' {
  if (status === 'critical_blocker' || score < 60) return 'critical';
  if (status === 'at_risk' || score < 85) return 'warning';
  return 'optimal';
}
