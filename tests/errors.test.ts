import { describe, expect, it } from "vitest";
import z from "zod";
import {
  SymphonyError,
  SymphonyProviderError,
  SymphonyValidationError,
} from "../src/errors.js";

describe("Symphony Errors", () => {
  it("creates the base SymphonyError", () => {
    const err = new SymphonyError(
      "Test base",
      "Symphony Error Message",
      { id: 1 },
      { cause: {} },
    );

    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(SymphonyError);
    expect(err.name).toBe("SymphonyError");
    expect(err.code).toBe("Test base");
    expect(err.message).toBe("Symphony Error Message");
    expect(err.details).toEqual({ id: 1 });
  });
});
