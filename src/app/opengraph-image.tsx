// Purpose: default Open Graph preview image for shared ApplyFlow links.
// Constraints: static branding only; no user or job data.
import { ImageResponse } from "next/og";
import { siteDescription, siteName, siteTagline } from "@/lib/seo/site";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          alignItems: "flex-start",
          background: "linear-gradient(135deg, #f7f5f0 0%, #e8efe9 55%, #d8e8df 100%)",
          color: "#1f2a24",
          display: "flex",
          flexDirection: "column",
          height: "100%",
          justifyContent: "space-between",
          padding: "72px",
          width: "100%",
        }}
      >
        <div
          style={{
            alignItems: "center",
            background: "#2f6c52",
            borderRadius: 20,
            color: "#ffffff",
            display: "flex",
            fontSize: 28,
            fontWeight: 700,
            height: 72,
            justifyContent: "center",
            width: 72,
          }}
        >
          AF
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 900 }}>
          <p style={{ fontSize: 28, letterSpacing: "0.08em", margin: 0, textTransform: "uppercase" }}>
            {siteName}
          </p>
          <p style={{ fontSize: 72, fontWeight: 700, lineHeight: 1.05, margin: 0 }}>{siteTagline}</p>
          <p style={{ fontSize: 30, lineHeight: 1.4, margin: 0, opacity: 0.82 }}>{siteDescription}</p>
        </div>
      </div>
    ),
    {
      ...size,
    },
  );
}
