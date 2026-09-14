import { describe, expect, it } from "vitest";
import { mimeTypeFromStorageKey } from "@/features/jobs/job-media";

describe("mimeTypeFromStorageKey", () => {
  it("maps common screenshot extensions to image mime types", () => {
    expect(mimeTypeFromStorageKey("users/u1/jobs/screenshots/a/shot.png")).toBe("image/png");
    expect(mimeTypeFromStorageKey("users/u1/jobs/screenshots/a/shot.webp")).toBe("image/webp");
    expect(mimeTypeFromStorageKey("users/u1/jobs/screenshots/a/shot.jpeg")).toBe("image/jpeg");
  });
});
