import {
  createInitialBrief,
  createInitialEvents,
  initialShiftWindows,
  initialWorkspace,
} from './seed.ts';
import type { HandoffBrief, PassiveEvent, ShiftWindow, WorkspaceConfig } from './types.ts';

export interface PulseStore {
  shiftWindows: ShiftWindow[];
  events: PassiveEvent[];
  workspace: WorkspaceConfig;
  brief: HandoffBrief;
}

export function createStore(): PulseStore {
  const events = createInitialEvents();
  return {
    shiftWindows: structuredClone(initialShiftWindows),
    events,
    workspace: structuredClone(initialWorkspace),
    brief: createInitialBrief(events),
  };
}
