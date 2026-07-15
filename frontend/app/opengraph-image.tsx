import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { OPENLOG_WORDMARK_ASSET } from "@/shared/config/brand";

export const alt = "OpenLog — Workspace for AI agents";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function OpenGraphImage() {
  const logoPath = join(
    process.cwd(),
    "public",
    OPENLOG_WORDMARK_ASSET.replace(/^\//, ""),
  );
  const logoFile = await readFile(logoPath);
  const logoSrc = `data:image/png;base64,${logoFile.toString("base64")}`;

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
        {/* Crop matches OpenLogLogo wordmark framing (PNG has large padding). */}
        <div
          style={{
            display: "flex",
            width: 360,
            height: 90,
            overflow: "hidden",
            position: "relative",
          }}
        >
          <img
            src={logoSrc}
            width={560}
            height={280}
            style={{
              position: "absolute",
              left: "-29.19%",
              top: "-102.09%",
              width: "155.48%",
              height: "309.06%",
            }}
          />
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
            Workspace for AI agents.
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
            Capture tasks, logs, and memories — then connect them to your agents
            over MCP.
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
