import { describe, expect, it } from "vitest";
import { applicationListQuerySchema, applicationStatusPatchSchema } from "@/features/applications/application.schemas";

describe("application schemas", () => {
  it("defaults list query limit", () => {
    expect(applicationListQuerySchema.parse({}).limit).toBe(20);
    expect(applicationListQuerySchema.parse({ limit: "5" }).limit).toBe(5);
  });

  it("accepts post-send status updates only", () => {
    expect(applicationStatusPatchSchema.parse({ status: "INTERVIEW" }).status).toBe("INTERVIEW");
    expect(() => applicationStatusPatchSchema.parse({ status: "READY" })).toThrow();
  });
});
