import type { ZodError } from "zod";
import z from "zod";

class SymphonyError extends Error {
  readonly code: string;
  readonly details?: unknown;

  constructor(
    code: string,
    message: string,
    details?: unknown,
    options?: { cause: unknown },
  ) {
    super(message);
    this.name = "SymphonyError";
    this.code = code;
    this.details = details;
  }
}

class SymphonyValidationError extends SymphonyError {
  readonly zodError: ZodError;

  constructor(message: string, zodError: ZodError) {
    super("VALIDATION_ERROR", message, z.treeifyError(zodError), {
      cause: zodError,
    });
    this.name = "SymphonyValidationError";
    this.zodError = zodError;
  }
}

class SymphonyProviderError extends SymphonyError {
  constructor(message: string, details?: unknown) {
    super("PROVIDER_ERROR", message, details);
    this.name = "SymphonyProviderError";
  }
}

class SymphonyInterruptSignal extends Error {
  readonly interruptId: string;

  constructor(interruptId: string) {
    super("Workflow interrupted");
    this.name = "SymphonyInterruptSignal";
    this.interruptId = interruptId;
  }
}

// exports
export {
  SymphonyError,
  SymphonyValidationError,
  SymphonyProviderError,
  SymphonyInterruptSignal,
};
