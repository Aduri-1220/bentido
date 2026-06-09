import { ImageResponse } from "next/og";

export const alt = "bentido — Rental agreements, sorted in minutes";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "center",
          padding: "80px",
          background:
            "linear-gradient(135deg, #0d9488 0%, #0f766e 50%, #134e4a 100%)",
          color: "white",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div
          style={{
            fontSize: 36,
            fontWeight: 600,
            opacity: 0.9,
            marginBottom: 24,
          }}
        >
          bentido
        </div>
        <div
          style={{
            fontSize: 72,
            fontWeight: 700,
            lineHeight: 1.1,
            marginBottom: 32,
            maxWidth: 1000,
          }}
        >
          Rental agreements, sorted in minutes.
        </div>
        <div
          style={{
            fontSize: 28,
            opacity: 0.85,
            maxWidth: 900,
            lineHeight: 1.4,
          }}
        >
          Verified KYC, structured drafts, e-stamp and e-sign — without
          the broker runaround.
        </div>
      </div>
    ),
    { ...size },
  );
}
