import { z } from "zod";
import { emit, EventTypes, now } from "./events.js";
import { validateInput, validateOutput } from "./schema.js";
import type { AnySchema } from "./schema.js";
import type { EventHandler } from "./events.js";

type ToolExecutionContext = {
  events?: EventHandler[];
  signal?: AbortSignal;
};
type SymphonyTool<
  TInputSchema extends AnySchema,
  TOutputSchema extends AnySchema,
> = {
  kind: "tool";
  name: string;
  description: string;
  inputSchema: TInputSchema;
  outputSchema: TOutputSchema;
  execute: (
    input: z.infer<TInputSchema>,
    ctx: ToolExecutionContext,
  ) => Promise<z.infer<TOutputSchema>> | z.infer<TOutputSchema>;
  call: (
    input: unknown,
    ctx?: ToolExecutionContext,
  ) => Promise<z.infer<TOutputSchema>>;
};

function createTool<
  TInputSchema extends AnySchema,
  TOutputSchema extends AnySchema,
>(config: {
  name: string;
  description: string;
  inputSchema: TInputSchema;
  outputSchema: TOutputSchema;
  execute: (
    input: z.infer<TInputSchema>,
    ctx: ToolExecutionContext,
  ) => Promise<z.infer<TOutputSchema>> | z.infer<TOutputSchema>;
}): SymphonyTool<TInputSchema, TOutputSchema> {
  return {
    kind: "tool",
    name: config.name,
    description: config.description,
    inputSchema: config.inputSchema,
    outputSchema: config.outputSchema,
    execute: config.execute,
    async call(rawInput: unknown, ctx = {}) {
      const input = validateInput(
        config.inputSchema,
        rawInput,
        `Tool ${config.name}`,
      );
      // emit started
      await emit(ctx.events, {
        type: EventTypes.toolStarted,
        toolName: config.name,
        input,
        at: now(),
      });
      try {
        const rawOutput = await config.execute(input, ctx);
        const output = validateOutput(
          config.outputSchema,
          rawOutput,
          `Tool "${config.name}"`,
        );
        // emit completed event
        await emit(ctx.events, {
          type: EventTypes.toolCompleted,
          toolName: config.name,
          output,
          at: now(),
        });
        return output;
      } catch (error) {
        await emit(ctx.events, {
          type: EventTypes.toolFailed,
          toolName: config.name,
          error,
          at: now(),
        });
        throw error;
      }
    },
  };
}

export { createTool };
