import type { ActionChecklistItem, HandoffBrief } from '../types.ts';

export interface ChecklistPatch {
  completed?: unknown;
  claimedBy?: unknown;
}

export function updateChecklistItem(
  brief: HandoffBrief,
  id: string,
  patch: ChecklistPatch = {},
): { ok: true; item: ActionChecklistItem } | { ok: false; error: 'not_found' } {
  const item = brief.oncomingActionChecklist.find((entry) => entry.id === id);
  if (!item) return { ok: false, error: 'not_found' };

  if (typeof patch.completed === 'boolean') {
    item.completed = patch.completed;
  }
  if (patch.claimedBy !== undefined && typeof patch.claimedBy === 'string') {
    item.claimedBy = patch.claimedBy.trim();
  }
  return { ok: true, item };
}
