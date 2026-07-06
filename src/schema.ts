import { z } from "zod";
import { SymphonyProviderError } from "./errors.js";
// types
type AnySchema = z.ZodTypeAny;

function validateInput<TSchema extends AnySchema>(
  schema: TSchema,
  value: unknown,
  label: string,
): z.infer<TSchema> {
  const parsed = schema.safeParse(value);
  if (parsed.success) {
    return parsed.data;
  }
  throw new SymphonyProviderError(`${label} input is invalid`, parsed.error);
}
function validateOutput<TSchema extends AnySchema>(
  schema: TSchema,
  value: unknown,
  label: string,
): z.infer<TSchema> {
  const parsed = schema.safeParse(value);
  if (parsed.success) {
    return parsed.data;
  }
  throw new SymphonyProviderError(`${label} output is invalid`, parsed.error);
}

function toJsonSchema(schema: AnySchema): unknown {
  return z.toJSONSchema(schema);
}

// export
export { validateInput, validateOutput, toJsonSchema };
export type { AnySchema };
