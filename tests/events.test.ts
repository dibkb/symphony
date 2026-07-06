import { describe, expect, it, vi } from "vitest";
import {
  AgentMode,
  emit,
  EventTypes,
  now,
  type EventHandler,
  type SymphonyEvent,
} from "../src/events.js";

describe("event helpers", () => {
  const event: SymphonyEvent = {
    type: EventTypes.agentStarted,
    agentName: "planner",
    mode: AgentMode.streamText,
    input: { goal: "draft" },
    at: "2026-07-06T00:00:00.000Z",
  };

  it("does nothing when handlers are undefined", async () => {
    await expect(emit(undefined, event)).resolves.toBeUndefined();
  });

  it("passes the event to each handler", async () => {
    const first = vi.fn();
    const second = vi.fn();

    await emit([first, second], event);

    expect(first).toHaveBeenCalledOnce();
    expect(first).toHaveBeenCalledWith(event);
    expect(second).toHaveBeenCalledOnce();
    expect(second).toHaveBeenCalledWith(event);
  });

  it("awaits async handlers sequentially", async () => {
    const calls: string[] = [];
    const first: EventHandler = async () => {
      calls.push("first:start");
      await Promise.resolve();
      calls.push("first:end");
    };
    const second: EventHandler = () => {
      calls.push("second");
    };

    await emit([first, second], event);

    expect(calls).toEqual(["first:start", "first:end", "second"]);
  });

  it("rejects when a handler throws and stops later handlers", async () => {
    const error = new Error("handler failed");
    const second = vi.fn();

    await expect(
      emit(
        [
          () => {
            throw error;
          },
          second,
        ],
        event,
      ),
    ).rejects.toThrow(error);

    expect(second).not.toHaveBeenCalled();
  });

  it("creates an ISO timestamp", () => {
    const timestamp = now();

    expect(() => new Date(timestamp).toISOString()).not.toThrow();
    expect(timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
  });
});
