import { describe, expect, it } from "vitest";
import {
  applicationListQuerySchema,
  applicationStatusPatchSchema,
  isSentOrLater,
} from "@/features/applications/application.schemas";

describe("application schemas", () => {
  it("defaults list query limit", () => {
    expect(applicationListQuerySchema.parse({}).limit).toBe(50);
    expect(applicationListQuerySchema.parse({ limit: "5" }).limit).toBe(5);
    expect(applicationListQuerySchema.parse({ status: "SENT" }).status).toBe("SENT");
  });

  it("accepts post-send status updates only", () => {
    expect(applicationStatusPatchSchema.parse({ status: "INTERVIEW" }).status).toBe("INTERVIEW");
    expect(() => applicationStatusPatchSchema.parse({ status: "READY" })).toThrow();
  });

  it("treats SENDING and earlier statuses as not sent", () => {
    for (const status of ["DRAFT", "ANALYZED", "READY", "SENDING"]) {
      expect(isSentOrLater(status)).toBe(false);
    }
  });

  it("treats every post-send status as sent", () => {
    for (const status of ["SENT", "FOLLOW_UP", "INTERVIEW", "REJECTED", "OFFER", "CLOSED"]) {
      expect(isSentOrLater(status)).toBe(true);
    }
  });

  it("defaults sort to updated and ignores unknown sort, status and view values", () => {
    const query = applicationListQuerySchema.parse({ sort: "price", status: "NOPE", view: "everything" });

    expect(query.sort).toBe("updated");
    expect(query.status).toBeUndefined();
    expect(query.view).toBeUndefined();
    expect(applicationListQuerySchema.parse({ sort: "match" }).sort).toBe("match");
    expect(applicationListQuerySchema.parse({ view: "needs-action" }).view).toBe("needs-action");
  });

  it("trims search text, caps it at 100 characters, and ignores blank searches", () => {
    expect(applicationListQuerySchema.parse({ q: "  acme  " }).q).toBe("acme");
    expect(applicationListQuerySchema.parse({ q: "   " }).q).toBeUndefined();
    expect(applicationListQuerySchema.parse({ q: "a".repeat(150) }).q).toHaveLength(100);
    expect(applicationListQuerySchema.parse({ q: ["acme"] }).q).toBeUndefined();
  });
});
