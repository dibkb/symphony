export interface IdFactory {
  runId(): string;
  interactionId(): string;
  eventId(): string;
  spanId(): string;
  commandId(): string;
}

export interface Clock {
  now(): string;
}

export interface TraceContext {
  traceId: string;
  runId: string;
  chatId: string;
  attemptId: string;
  currentSpanId?: string;
}

export const systemClock: Clock = {
  now: () => new Date().toDateString(),
};
