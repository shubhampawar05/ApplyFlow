import { afterEach, describe, expect, it, vi } from "vitest";
import { gmailAdapter } from "@/features/integrations/gmail/gmail.adapter";

function decodeRawMime(encoded: string) {
  const normalized = encoded.replace(/-/g, "+").replace(/_/g, "/");
  const padding = normalized.length % 4 === 0 ? "" : "=".repeat(4 - (normalized.length % 4));
  return Buffer.from(normalized + padding, "base64").toString("utf8");
}

describe("gmail adapter", () => {
  it("encodes a plain-text MIME message for Gmail raw send", () => {
    const encoded = gmailAdapter.encodeMimeMessage({
      to: "hiring@acme.com",
      subject: "Application for Engineer",
      body: "Hello,\n\nI would like to apply.",
    });

    const mime = decodeRawMime(encoded);

    expect(encoded).toBeTruthy();
    expect(encoded).not.toContain("+");
    expect(encoded).not.toContain("/");
    expect(mime).toContain("Content-Type: text/plain; charset=UTF-8");
    expect(mime).toContain("I would like to apply.");
  });

  it("encodes a multipart MIME message with a resume attachment", () => {
    const encoded = gmailAdapter.encodeMimeMessage({
      to: "hiring@acme.com",
      subject: "Application for Engineer",
      body: "Hello,\n\nPlease find my resume attached.",
      attachment: {
        fileName: "Shubham Resume.pdf",
        mimeType: "application/pdf",
        content: new Uint8Array([0x25, 0x50, 0x44, 0x46]),
      },
    });

    const mime = decodeRawMime(encoded);

    expect(mime).toContain("Content-Type: multipart/mixed; boundary=");
    expect(mime).toContain('filename="Shubham Resume.pdf"');
    expect(mime).toContain("Content-Transfer-Encoding: base64");
    expect(mime).toContain("Please find my resume attached.");
    expect(mime).toContain("JVBERg==");
  });

  describe("sendRawMessage error classification", () => {
    afterEach(() => {
      vi.unstubAllGlobals();
    });

    function stubFetchResponse(status: number, body: unknown = {}) {
      vi.stubGlobal(
        "fetch",
        vi.fn(async () => new Response(JSON.stringify(body), { status })),
      );
    }

    it("returns the Gmail message id on success", async () => {
      stubFetchResponse(200, { id: "msg-1" });
      await expect(gmailAdapter.sendRawMessage("token", "raw")).resolves.toMatchObject({ id: "msg-1" });
    });

    it("treats a 400 as a definite rejection", async () => {
      stubFetchResponse(400);
      await expect(gmailAdapter.sendRawMessage("token", "raw")).rejects.toMatchObject({
        code: "GMAIL_SEND_REJECTED",
      });
    });

    it("treats a 429 as an unknown outcome", async () => {
      stubFetchResponse(429);
      await expect(gmailAdapter.sendRawMessage("token", "raw")).rejects.toMatchObject({
        code: "GMAIL_SEND_UNKNOWN",
      });
    });

    it("treats a 500 as an unknown outcome", async () => {
      stubFetchResponse(500);
      await expect(gmailAdapter.sendRawMessage("token", "raw")).rejects.toMatchObject({
        code: "GMAIL_SEND_UNKNOWN",
      });
    });

    it("treats a network failure as an unknown outcome", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn(async () => {
          throw new TypeError("fetch failed");
        }),
      );
      await expect(gmailAdapter.sendRawMessage("token", "raw")).rejects.toMatchObject({
        code: "GMAIL_SEND_UNKNOWN",
      });
    });

    it("treats a success response without a message id as an unknown outcome", async () => {
      stubFetchResponse(200, {});
      await expect(gmailAdapter.sendRawMessage("token", "raw")).rejects.toMatchObject({
        code: "GMAIL_SEND_UNKNOWN",
      });
    });
  });
});
