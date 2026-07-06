import { describe, expect, it } from "vitest";
import { z } from "zod";
import { SymphonyProviderError } from "../src/errors.js";
import { toJsonSchema, validateInput, validateOutput } from "../src/schema.js";

describe("schema helpers", () => {
  it("returns parsed input when validation succeeds", () => {
    const schema = z.object({
      name: z.string(),
      count: z.number().int().default(1),
    });

    const result = validateInput(schema, { name: "compose" }, "tool");

    expect(result).toEqual({ name: "compose", count: 1 });
  });

  it("throws a provider error when input validation fails", () => {
    const schema = z.object({
      email: z.string().email(),
    });

    expect(() => validateInput(schema, { email: "bad" }, "agent")).toThrow(
      SymphonyProviderError,
    );

    try {
      validateInput(schema, { email: "bad" }, "agent");
    } catch (error) {
      expect(error).toBeInstanceOf(SymphonyProviderError);
      expect(error).toMatchObject({
        code: "PROVIDER_ERROR",
        message: "agent input is invalid",
        name: "SymphonyProviderError",
      });
      expect((error as SymphonyProviderError).details).toBeInstanceOf(
        z.ZodError,
      );
    }
  });

  it("returns parsed output when validation succeeds", () => {
    const schema = z.object({
      ok: z.boolean(),
      summary: z.string().trim(),
    });

    const result = validateOutput(
      schema,
      { ok: true, summary: "  done  " },
      "tool",
    );

    expect(result).toEqual({ ok: true, summary: "done" });
  });

  it("throws a provider error when output validation fails", () => {
    const schema = z.object({
      ok: z.boolean(),
    });

    expect(() => validateOutput(schema, { ok: "yes" }, "model")).toThrow(
      "model output is invalid",
    );
  });

  it("converts a Zod schema to JSON Schema", () => {
    const schema = z.object({
      name: z.string(),
      count: z.number().int(),
    });

    expect(toJsonSchema(schema)).toMatchObject({
      type: "object",
      properties: {
        name: { type: "string" },
        count: { type: "integer" },
      },
      required: ["name", "count"],
    });
  });
});
