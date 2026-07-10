import type { RunState, RunStatus } from "./types.js";

const allowedTransitions: Record<RunStatus, readonly RunStatus[]> = {
  created: ["running", "cancelled"],
  running: [
    "waiting_for_approval",
    "waiting_for_input",
    "completed",
    "failed",
    "cancelled",
  ],
  waiting_for_input: ["running", "failed", "cancelled"],
  waiting_for_approval: ["running", "failed", "cancelled"],
  completed: [],
  failed: [],
  cancelled: [],
};

export function transitionRun(
  state: RunState,
  next: RunStatus,
  now = new Date().toISOString(),
): RunState {
  if (allowedTransitions[state.status].includes(next)) {
    return {
      ...state,
      status: next,
      revision: state.revision + 1,
      updatedAt: now,
    };
  }
  throw new Error(`Invalid Transition ${state.status} -> ${next} not allowed`);
}
