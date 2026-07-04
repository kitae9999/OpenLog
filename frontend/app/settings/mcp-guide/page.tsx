import type { Metadata } from "next";
import { McpGuideFeed } from "@/widgets/home-feed/ui/McpGuideFeed";

export const metadata: Metadata = {
  title: "MCP Guide | OpenLog",
  description:
    "Connect Claude Code, Codex, or any MCP client to OpenLog via the official CLI.",
};

export default function McpGuidePage() {
  return <McpGuideFeed />;
}
