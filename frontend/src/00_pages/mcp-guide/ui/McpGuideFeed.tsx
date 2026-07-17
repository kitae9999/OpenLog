import { Footer } from "@/widgets/chrome/ui";
import { getUser } from "@/features/auth/api/getUser";
import { buildViewerProfileHref } from "@/shared/lib/publicRoutes";
import { McpGuideShell } from "@/pages/mcp-guide/ui/McpGuideShell";
import {
  parseMcpGuideLocale,
  type McpGuideLocale,
} from "@/pages/mcp-guide/model/mcpGuideContent";
import { listManagedWorkspaces } from "@/entities/workspace/api/workspaceApi";
import { listMcpConnections } from "@/features/mcp/api/mcpConnections";

export async function McpGuideFeed({
  locale: localeParam,
}: {
  locale?: string | null;
}) {
  const locale: McpGuideLocale = parseMcpGuideLocale(localeParam ?? null);
  const user = await getUser();
  const [workspaces, connections] = user
    ? await Promise.all([listManagedWorkspaces(), listMcpConnections()])
    : [[], []];

  return (
    <McpGuideShell
      isLoggedIn={!!user}
      workspaces={workspaces}
      connections={connections}
      locale={locale}
      profileImageUrl={user?.profileImageUrl}
      profileHref={
        user?.username ? buildViewerProfileHref(user.username) : undefined
      }
      footer={<Footer />}
    />
  );
}
