import type { ErrorAction, ErrorKind, FrameworkError } from "./types.js";
import { RuntimeError } from "./types.js";
import { assignIfDefined } from "../utils/undefineChecks.js";

export interface ErrorDefinition {
  code: string;
  kind: ErrorKind;
  action: ErrorAction;
  userMessage: string;
  retryable?: boolean;
  safeToExpose?: boolean;
  httpStatus?: number;
}

export interface DefineErrorInput {
  message?: string;
  userMessage?: string;
  action?: ErrorAction;
  retryable?: boolean;
  details?: Record<string, unknown>;
  cause?: unknown;
  runId?: string;
  stepId?: string;
  agentId?: string;
  toolId?: string;
}

export function defineError(definition: ErrorDefinition) {
  return (input: DefineErrorInput = {}): RuntimeError => {
    const errorInput: FrameworkError = {
      code: definition.code,
      kind: definition.kind,
      action: input.action ?? definition.action,
      message: input.message ?? definition.userMessage,
      userMessage: input.userMessage ?? definition.userMessage,
      retryable: input.retryable ?? definition.retryable ?? false,
      safeToExpose: definition.safeToExpose ?? false,
    };

    assignIfDefined(errorInput, "httpStatus", definition.httpStatus);
    assignIfDefined(errorInput, "details", input.details);
    assignIfDefined(errorInput, "cause", input.cause);
    assignIfDefined(errorInput, "runId", input.runId);
    assignIfDefined(errorInput, "stepId", input.stepId);
    assignIfDefined(errorInput, "agentId", input.agentId);
    assignIfDefined(errorInput, "toolId", input.toolId);

    return new RuntimeError(errorInput);
  };
}

export const runtimeErrors = {
  invalidInput: defineError({
    code: "RUNTIME_INVALID_INPUT",
    kind: "validation",
    action: "fail_command",
    userMessage: "The request is missing required information.",
    httpStatus: 400,
    safeToExpose: true,
  }),

  insufficientCredits: defineError({
    code: "RUNTIME_INSUFFICIENT_CREDITS",
    kind: "credits",
    action: "fail_command",
    userMessage: "There are not enough credits to continue this request.",
    httpStatus: 402,
    safeToExpose: true,
  }),

  promptNotFound: defineError({
    code: "RUNTIME_PROMPT_NOT_FOUND",
    kind: "prompt",
    action: "fail_step",
    userMessage: "This agent is not configured correctly yet.",
  }),

  providerUnavailable: defineError({
    code: "RUNTIME_PROVIDER_UNAVAILABLE",
    kind: "provider",
    action: "retry",
    userMessage: "The AI service is temporarily unavailable. Please try again.",
    retryable: true,
  }),

  toolInputInvalid: defineError({
    code: "RUNTIME_TOOL_INPUT_INVALID",
    kind: "tool",
    action: "fail_step",
    userMessage: "The requested operation could not be prepared safely.",
  }),

  toolFailed: defineError({
    code: "RUNTIME_TOOL_FAILED",
    kind: "tool",
    action: "fail_step",
    userMessage: "A required operation could not be completed.",
  }),

  persistenceUnavailable: defineError({
    code: "RUNTIME_PERSISTENCE_UNAVAILABLE",
    kind: "persistence",
    action: "retry",
    userMessage: "The request could not be saved safely. Please try again.",
    retryable: true,
  }),

  cancelled: defineError({
    code: "RUNTIME_CANCELLED",
    kind: "cancellation",
    action: "cancel",
    userMessage: "The request was cancelled.",
    safeToExpose: true,
  }),

  internal: defineError({
    code: "RUNTIME_INTERNAL",
    kind: "internal",
    action: "fail_run",
    userMessage: "Something went wrong while processing the request.",
  }),
};

export function normalizeError(
  error: unknown,
  context: {
    runId: string;
    stepId?: string;
    agentId?: string;
    toolId?: string;
  },
): RuntimeError {
  if (error instanceof RuntimeError) {
    return new RuntimeError({
      ...error.data,
      ...context,
    });
  }

  if (
    (error instanceof Error || error instanceof DOMException) &&
    error.name === "AbortError"
  ) {
    return runtimeErrors.cancelled({
      ...context,
      cause: error,
    });
  }

  return runtimeErrors.internal({
    ...context,
    message: error instanceof Error ? error.message : String(error),
    cause: error,
  });
}
