import type { ZodType } from "zod";

export type RunStatus =
  | "created"
  | "running"
  | "waiting_for_input"
  | "waiting_for_approval"
  | "completed"
  | "failed"
  | "cancelled";

export type StepStatus =
  "pending" | "running" | "suspended" | "completed" | "failed";

export interface StepState {
  id: string;
  status: StepStatus;
  attempts: number;
  output?: unknown;
  error?: FrameworkError;
}
export interface RunState {
  runId: string;
  workflowId: string;
  workflowVersion: string;
  status: RunStatus;
  input: unknown;
  context: Record<string, unknown>;
  outputs: Record<string, unknown>;
  steps: Record<string, StepState>;
  pendingInteraction?: Interaction;
  revision: number;
  eventSequence: number;
  createdAt: string;
  updatedAt: string;
}

export interface Interaction {
  id: string;
  runId: string;
  stepId: string;
  kind: "question" | "plan_approval" | "tool_approval" | "artifact_review";
  payload: unknown;
  responseSchema: ZodType<unknown>;
  status: "pending" | "answered" | "rejected" | "expired";
}

export interface FrameworkError {
  code: string;
  message: string;
  retryable: boolean;
  details?: unknown;
}

export type StepResult<T = unknown> =
  | { type: "completed"; output: T }
  | { type: "suspended"; interaction: Interaction }
  | { type: "failed"; error: FrameworkError };
