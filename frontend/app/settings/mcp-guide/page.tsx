import type { Metadata } from "next";
import { McpGuideFeed } from "@/pages/mcp-guide/ui/McpGuideFeed";

export const metadata: Metadata = {
  title: "MCP Guide | OpenLog",
  description:
    "Connect Claude Code, Codex, or any MCP client to OpenLog via the official CLI.",
};

export default function McpGuidePage() {
  return <McpGuideFeed />;
}
