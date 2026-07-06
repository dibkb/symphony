enum EventTypes {
  // tools
  toolStarted = "tool.started",
  toolCompleted = "tool.completed",
  toolFailed = "tool.failed",
  // agent
  agentStarted = "agent.started",
  agentTextDelta = "agent.text.delta",
  agentCompleted = "agent.completed",
  agentFailed = "agent.failed",
}

enum AgentMode {
  streamText = "streamText",
  generateObject = "generateObject",
}
type SymphonyEvent =
  | {
      type: EventTypes.toolStarted;
      toolName: string;
      input: unknown;
      at: string;
    }
  | {
      type: EventTypes.toolCompleted;
      toolName: string;
      output: unknown;
      at: string;
    }
  | {
      type: EventTypes.toolFailed;
      toolName: string;
      error: unknown;
      at: string;
    }
  | {
      type: EventTypes.agentStarted;
      agentName: string;
      mode: AgentMode;
      input: unknown;
      at: string;
    }
  | {
      type: EventTypes.agentTextDelta;
      agentName: string;
      delta: string;
      at: string;
    }
  | {
      type: EventTypes.agentCompleted;
      agentName: string;
      output: unknown;
      at: string;
    }
  | {
      type: EventTypes.agentFailed;
      agentName: string;
      error: unknown;
      at: string;
    };
type EventHandler = (event: SymphonyEvent) => void | Promise<void>;

async function emit(
  handlers: EventHandler[] | undefined,
  event: SymphonyEvent,
) {
  if (handlers && Array.isArray(handlers)) {
    for (const handler of handlers) {
      await handler(event);
    }
  }
}

function now() {
  return new Date().toISOString();
}
// export types & enums
export type { SymphonyEvent, EventHandler };
export { EventTypes, AgentMode };
// export function
export { emit, now };
