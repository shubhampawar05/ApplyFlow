import { describe, expect, it } from "vitest";
import { gmailAdapter } from "@/features/integrations/gmail/gmail.adapter";

describe("gmail adapter", () => {
  it("encodes a MIME message for Gmail raw send", () => {
    const encoded = gmailAdapter.encodeMimeMessage({
      to: "hiring@acme.com",
      subject: "Application for Engineer",
      body: "Hello,\n\nI would like to apply.",
    });

    expect(encoded).toBeTruthy();
    expect(encoded).not.toContain("+");
    expect(encoded).not.toContain("/");
  });
});
