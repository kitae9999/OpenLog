import type { Metadata } from "next";
import { McpGuideFeed } from "@/pages/mcp-guide/ui/McpGuideFeed";

export const metadata: Metadata = {
  title: "MCP Guide | OpenLog",
  description:
    "Connect Claude Code, Codex, or Cursor to OpenLog Remote MCP with OAuth.",
};

export default async function McpGuidePage({
  searchParams,
}: {
  searchParams?: Promise<{ lang?: string | string[] }>;
}) {
  const resolved = await searchParams;
  const langParam = resolved?.lang;
  const lang = Array.isArray(langParam) ? langParam[0] : langParam;

  return <McpGuideFeed locale={lang ?? null} />;
}
