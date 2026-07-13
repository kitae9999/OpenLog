import { ImageResponse } from "next/og";

export const alt = "OpenLog — Keep the context behind the code";
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
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#fafafa",
          color: "#18181b",
          padding: "76px 84px",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "18px",
            fontSize: 30,
            fontWeight: 700,
            letterSpacing: "-0.03em",
          }}
        >
          <div
            style={{
              width: 48,
              height: 48,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 14,
              background: "#18181b",
              color: "#fafafa",
              fontSize: 27,
            }}
          >
            O
          </div>
          OpenLog
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          <div
            style={{
              display: "flex",
              maxWidth: 940,
              fontSize: 74,
              lineHeight: 1.04,
              fontWeight: 700,
              letterSpacing: "-0.055em",
            }}
          >
            Keep the context behind the code.
          </div>
          <div
            style={{
              display: "flex",
              maxWidth: 900,
              color: "#52525b",
              fontSize: 28,
              lineHeight: 1.35,
            }}
          >
            Turn tasks, logs, decisions, and memories into durable developer
            knowledge.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            color: "#71717a",
            fontSize: 22,
            letterSpacing: "0.01em",
          }}
        >
          openlog.kr
        </div>
      </div>
    ),
    size,
  );
}
