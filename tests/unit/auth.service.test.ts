import { describe, expect, it } from "vitest";
import {
  displayNameFromMetadata,
  identityFromClaims,
  normalizeEmail,
  toUserUpsertArgs,
} from "@/features/auth/auth.service";
import { isPublicAuthPath, loginPathWithNext, safeNextPath } from "@/features/auth/auth.paths";

describe("auth paths", () => {
  it("treats only login and auth callback/error routes as public", () => {
    expect(isPublicAuthPath("/login")).toBe(true);
    expect(isPublicAuthPath("/auth/callback")).toBe(true);
    expect(isPublicAuthPath("/auth/error")).toBe(true);
    expect(isPublicAuthPath("/dashboard")).toBe(false);
    expect(isPublicAuthPath("/applications/new")).toBe(false);
  });

  it("rejects open redirects and auth loops in next paths", () => {
    expect(safeNextPath("/settings")).toBe("/settings");
    expect(safeNextPath("https://evil.example")).toBe("/dashboard");
    expect(safeNextPath("//evil.example")).toBe("/dashboard");
    expect(safeNextPath("/login")).toBe("/dashboard");
    expect(safeNextPath("/auth/callback")).toBe("/dashboard");
    expect(loginPathWithNext("/settings")).toBe("/login?next=%2Fsettings");
    expect(loginPathWithNext("/dashboard")).toBe("/login");
  });
});

describe("auth identity", () => {
  it("normalizes email and reads a Google display name", () => {
    expect(normalizeEmail("  Alex@Example.COM ")).toBe("alex@example.com");
    expect(displayNameFromMetadata({ full_name: "Alex Example" })).toBe("Alex Example");
    expect(displayNameFromMetadata({ name: "  " })).toBe(null);
  });

  it("requires a verified subject and email before creating an app user", () => {
    expect(identityFromClaims({ sub: "user-1" })).toBe(null);
    expect(
      identityFromClaims({
        sub: "user-1",
        email: "Alex@Example.COM",
        user_metadata: { full_name: "Alex Example" },
      }),
    ).toEqual({
      authUserId: "user-1",
      email: "alex@example.com",
      displayName: "Alex Example",
    });
  });

  it("builds a Prisma upsert keyed by Supabase auth user id", () => {
    expect(
      toUserUpsertArgs({
        authUserId: "user-1",
        email: "Alex@Example.COM",
        displayName: "Alex Example",
      }),
    ).toEqual({
      where: { authUserId: "user-1" },
      update: { email: "alex@example.com", displayName: "Alex Example" },
      create: { authUserId: "user-1", email: "alex@example.com", displayName: "Alex Example" },
    });
  });
});
