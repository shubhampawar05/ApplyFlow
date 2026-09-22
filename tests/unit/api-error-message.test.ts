import { describe, expect, it } from "vitest";
import { getApiErrorMessage } from "@/lib/api/error-message";

describe("getApiErrorMessage", () => {
  it("returns the API error message when present", () => {
    expect(getApiErrorMessage({ error: { message: "OpenAI request failed." } }, "Fallback")).toBe(
      "OpenAI request failed.",
    );
  });

  it("falls back to a readable code when message is missing", () => {
    expect(getApiErrorMessage({ error: { code: "UNAUTHORIZED" } }, "Fallback")).toBe("unauthorized");
  });

  it("falls back when no error payload exists", () => {
    expect(getApiErrorMessage({}, "Fallback")).toBe("Fallback");
  });

  it("returns the fallback for unknown payloads", () => {
    expect(getApiErrorMessage(null, "Fallback")).toBe("Fallback");
  });
});
