import { describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { EventTypes, type SymphonyEvent } from "../src/events.js";
import { SymphonyProviderError } from "../src/errors.js";
import { createTool } from "../src/tool.js";

describe("createTool", () => {
  it("creates a tool with its public metadata", () => {
    const tool = createTool({
      name: "sum",
      description: "Add two numbers",
      inputSchema: z.object({ a: z.number(), b: z.number() }),
      outputSchema: z.object({ total: z.number() }),
      execute: ({ a, b }) => ({ total: a + b }),
    });

    expect(tool).toMatchObject({
      kind: "tool",
      name: "sum",
      description: "Add two numbers",
    });
    expect(tool.inputSchema).toBeInstanceOf(z.ZodObject);
    expect(tool.outputSchema).toBeInstanceOf(z.ZodObject);
    expect(tool.execute).toBeTypeOf("function");
    expect(tool.call).toBeTypeOf("function");
  });

  it("validates input, executes the tool, validates output, and emits events", async () => {
    const events: SymphonyEvent[] = [];
    const execute = vi.fn(({ text }: { text: string }) => ({
      upper: text.toUpperCase(),
    }));
    const tool = createTool({
      name: "uppercase",
      description: "Uppercase text",
      inputSchema: z.object({ text: z.string().trim() }),
      outputSchema: z.object({ upper: z.string() }),
      execute,
    });

    const output = await tool.call(
      { text: "  hello  " },
      {
        events: [
          (event) => {
            events.push(event);
          },
        ],
      },
    );

    expect(output).toEqual({ upper: "HELLO" });
    expect(execute).toHaveBeenCalledOnce();
    expect(execute).toHaveBeenCalledWith({ text: "hello" }, expect.any(Object));
    expect(events).toMatchObject([
      {
        type: EventTypes.toolStarted,
        toolName: "uppercase",
        input: { text: "hello" },
      },
      {
        type: EventTypes.toolCompleted,
        toolName: "uppercase",
        output: { upper: "HELLO" },
      },
    ]);
    expect(events[0]?.at).toEqual(expect.any(String));
    expect(events[1]?.at).toEqual(expect.any(String));
  });

  it("passes the execution context to execute", async () => {
    const controller = new AbortController();
    const events: SymphonyEvent[] = [];
    const execute = vi.fn((_input: { id: string }, ctx) => ({
      aborted: ctx.signal?.aborted ?? false,
      hasEvents: Array.isArray(ctx.events),
    }));
    const tool = createTool({
      name: "inspectContext",
      description: "Inspect runtime context",
      inputSchema: z.object({ id: z.string() }),
      outputSchema: z.object({
        aborted: z.boolean(),
        hasEvents: z.boolean(),
      }),
      execute,
    });

    const output = await tool.call(
      { id: "run_1" },
      {
        signal: controller.signal,
        events: [
          (event) => {
            events.push(event);
          },
        ],
      },
    );

    expect(output).toEqual({ aborted: false, hasEvents: true });
    expect(execute.mock.calls[0]?.[1].signal).toBe(controller.signal);
    expect(events.map((event) => event.type)).toEqual([
      EventTypes.toolStarted,
      EventTypes.toolCompleted,
    ]);
  });

  it("rejects invalid input before execute runs", async () => {
    const events: SymphonyEvent[] = [];
    const execute = vi.fn(() => ({ ok: true }));
    const tool = createTool({
      name: "needsNumber",
      description: "Requires a number",
      inputSchema: z.object({ value: z.number() }),
      outputSchema: z.object({ ok: z.boolean() }),
      execute,
    });

    await expect(
      tool.call(
        { value: "not-a-number" },
        {
          events: [
            (event) => {
              events.push(event);
            },
          ],
        },
      ),
    ).rejects.toBeInstanceOf(SymphonyProviderError);

    expect(execute).not.toHaveBeenCalled();
    expect(events).toEqual([]);
  });

  it("emits failed and rejects when output validation fails", async () => {
    const events: SymphonyEvent[] = [];
    const tool = createTool({
      name: "badOutput",
      description: "Returns invalid output",
      inputSchema: z.object({ id: z.string() }),
      outputSchema: z.object({ ok: z.boolean() }),
      execute: () => ({ ok: "yes" }) as unknown as { ok: boolean },
    });

    await expect(
      tool.call(
        { id: "1" },
        {
          events: [
            (event) => {
              events.push(event);
            },
          ],
        },
      ),
    ).rejects.toBeInstanceOf(SymphonyProviderError);

    expect(events).toHaveLength(2);
    expect(events[0]).toMatchObject({
      type: EventTypes.toolStarted,
      toolName: "badOutput",
    });
    expect(events[1]).toMatchObject({
      type: EventTypes.toolFailed,
      toolName: "badOutput",
      error: expect.any(SymphonyProviderError),
    });
  });

  it("emits failed and rethrows when execute throws", async () => {
    const events: SymphonyEvent[] = [];
    const error = new Error("boom");
    const tool = createTool({
      name: "throws",
      description: "Throws an error",
      inputSchema: z.object({ ok: z.boolean() }),
      outputSchema: z.object({ ok: z.boolean() }),
      execute: () => {
        throw error;
      },
    });

    await expect(
      tool.call(
        { ok: true },
        {
          events: [
            (event) => {
              events.push(event);
            },
          ],
        },
      ),
    ).rejects.toThrow(error);

    expect(events).toHaveLength(2);
    expect(events[0]).toMatchObject({
      type: EventTypes.toolStarted,
      toolName: "throws",
    });
    expect(events[1]).toMatchObject({
      type: EventTypes.toolFailed,
      toolName: "throws",
      error,
    });
  });
});
