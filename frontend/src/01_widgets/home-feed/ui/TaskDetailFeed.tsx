import { notFound } from "next/navigation";
import { Footer } from "@/widgets/chrome/ui";
import { getUserOrRedirectToOnboarding } from "@/features/auth/api/requireOnboarding";
import type { User } from "@/entities/user/model/User";
import { buildViewerProfileHref } from "@/shared/lib/publicRoutes";
import { getTaskById } from "./data";
import { TaskDetailShell } from "./TaskDetailShell";

export async function TaskDetailFeed({
  taskId,
  viewer,
}: {
  taskId: string;
  viewer?: User | null;
}) {
  const user =
    viewer === undefined ? await getUserOrRedirectToOnboarding() : viewer;
  const task = getTaskById(taskId);

  if (!task) {
    notFound();
  }

  return (
    <TaskDetailShell
      taskId={taskId}
      isLoggedIn={!!user}
      profileImageUrl={user?.profileImageUrl}
      profileHref={user ? buildViewerProfileHref(user.username) : undefined}
      footer={<Footer />}
    />
  );
}
