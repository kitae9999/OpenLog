import { notFound, redirect } from "next/navigation";
import { Footer } from "@/widgets/chrome/ui";
import { getUserOrRedirectToOnboarding } from "@/features/auth/api/requireOnboarding";
import { buildViewerProfileHref } from "@/shared/lib/publicRoutes";
import { MemoryDetailView, MemoryEditorView, MemoryListView } from "./MemoryViews";
import { WorkspaceSectionShell } from "./WorkspaceSectionShell";
import { loadWorkspacePageData } from "./workspaceApi";

export async function MemoryFeed({ mode, memoryId }: { mode: "list" | "new" | "detail" | "edit"; memoryId?: string }) {
  const user = await getUserOrRedirectToOnboarding();
  if (!user) redirect("/");
  const pageData = await loadWorkspacePageData();
  const workspaceData = pageData.workspaceData;
  const memory = memoryId ? workspaceData?.memories.find((item) => item.id === memoryId) : undefined;

  if ((mode === "detail" || mode === "edit") && (!workspaceData || !memory)) notFound();
  if ((mode === "new" || mode === "edit") && !workspaceData && pageData.status === "empty") {
    redirect("/workspaces/new");
  }

  return (
    <WorkspaceSectionShell
      label="Memory"
      workspaceNav="memory"
      isLoggedIn
      profileImageUrl={user.profileImageUrl}
      profileHref={buildViewerProfileHref(user.username)}
      workspaces={pageData.workspaces}
      workspaceData={workspaceData}
      footer={<Footer />}
    >
      {mode === "list" ? <MemoryListView workspaceData={workspaceData} /> : null}
      {mode === "new" && workspaceData ? <MemoryEditorView workspaceData={workspaceData} /> : null}
      {mode === "detail" && workspaceData && memory ? <MemoryDetailView memory={memory} workspaceData={workspaceData} /> : null}
      {mode === "edit" && workspaceData && memory ? <MemoryEditorView memory={memory} workspaceData={workspaceData} /> : null}
    </WorkspaceSectionShell>
  );
}
