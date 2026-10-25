import { describe, expect, it } from "vitest";
import { dashboardHref, hasActiveFilters, parseDashboardQuery } from "@/app/dashboard/dashboard-query";
import { daysOverdue } from "@/app/dashboard/follow-ups-due";

describe("dashboard query", () => {
  it("round-trips search, sort and status through the URL", () => {
    const query = parseDashboardQuery({ q: "acme", sort: "match", status: "SENT" });

    expect(query).toEqual({ q: "acme", sort: "match", status: "SENT", view: undefined });
    expect(dashboardHref(query)).toBe("/dashboard?q=acme&sort=match&status=SENT");
  });

  it("ignores tampered values instead of failing", () => {
    expect(parseDashboardQuery({ status: "HACKED", sort: "nope", view: "all" })).toEqual({
      q: undefined,
      sort: "updated",
      status: undefined,
      view: undefined,
    });
  });

  it("lets the needs-action view replace a status filter", () => {
    expect(parseDashboardQuery({ status: "SENT", view: "needs-action" })).toMatchObject({
      status: undefined,
      view: "needs-action",
    });
  });

  it("uses the first value when a parameter repeats", () => {
    expect(parseDashboardQuery({ q: ["acme", "globex"] }).q).toBe("acme");
  });

  it("omits defaults from links", () => {
    expect(dashboardHref({ sort: "updated" })).toBe("/dashboard");
  });

  it("knows when filters are active", () => {
    expect(hasActiveFilters(parseDashboardQuery({ sort: "match" }))).toBe(false);
    expect(hasActiveFilters(parseDashboardQuery({ q: "acme" }))).toBe(true);
    expect(hasActiveFilters(parseDashboardQuery({ view: "needs-action" }))).toBe(true);
  });
});

describe("daysOverdue", () => {
  const now = new Date("2026-10-25T12:00:00.000Z");

  it("counts whole days past the follow-up date", () => {
    expect(daysOverdue(new Date("2026-10-22T00:00:00.000Z"), now)).toBe(3);
    expect(daysOverdue(new Date("2026-10-25T00:00:00.000Z"), now)).toBe(0);
  });
});
