import { ImageResponse } from "next/og"

export const alt = "AlmostRight — Find what's wrong with your spec before engineering does"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "#0f172a",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px 96px",
        }}
      >
        <div
          style={{
            fontSize: 14,
            fontFamily: "monospace",
            color: "#64748b",
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            marginBottom: 24,
          }}
        >
          AlmostRight
        </div>
        <div
          style={{
            fontSize: 52,
            fontWeight: 600,
            color: "#f8fafc",
            lineHeight: 1.15,
            marginBottom: 28,
          }}
        >
          Find what&apos;s wrong with your spec before engineering does
        </div>
        <div
          style={{
            fontSize: 22,
            color: "#94a3b8",
            lineHeight: 1.5,
          }}
        >
          Contradictions · Scope landmines · Missing edge cases · Ambiguities
        </div>
      </div>
    ),
    { ...size }
  )
}
