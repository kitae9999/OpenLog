import { notFound } from "next/navigation";
import { Footer } from "@/widgets/chrome/ui";
import { getUserOrRedirectToOnboarding } from "@/features/auth/api/requireOnboarding";
import type { User } from "@/entities/user/model/User";
import { buildViewerProfileHref } from "@/shared/lib/publicRoutes";
import { getTaskById } from "./data";
import { requireWorkspaceData } from "./requireWorkspacePageData";
import { TaskDetailShell } from "./TaskDetailShell";
import { loadWorkspacePageData } from "./workspaceApi";

export async function TaskDetailFeed({
  taskId,
  viewer,
}: {
  taskId: string;
  viewer?: User | null;
}) {
  const user =
    viewer === undefined ? await getUserOrRedirectToOnboarding() : viewer;
  const pageData = user
    ? await loadWorkspacePageData()
    : { workspaces: [], workspaceData: null, status: "empty" as const };
  const workspaces = pageData.workspaces;
  const workspaceData = user ? requireWorkspaceData(pageData) : null;
  const task =
    workspaceData?.tasks.find((item) => item.id === taskId) ??
    (user ? undefined : getTaskById(taskId));

  if (!task) {
    notFound();
  }

  return (
    <TaskDetailShell
      taskId={taskId}
      task={task}
      workspaces={workspaces}
      workspaceData={workspaceData}
      isLoggedIn={!!user}
      profileImageUrl={user?.profileImageUrl}
      profileHref={user ? buildViewerProfileHref(user.username) : undefined}
      footer={<Footer />}
    />
  );
}
