import { notFound } from "next/navigation";
import { Footer } from "@/widgets/chrome/ui";
import { getUserOrRedirectToOnboarding } from "@/features/auth/api/requireOnboarding";
import type { User } from "@/entities/user/model/User";
import { buildViewerProfileHref } from "@/shared/lib/publicRoutes";
import { getLogById } from "./data";
import { LogEditShell } from "./LogEditShell";
import { getWorkspaceUiData } from "./workspaceApi";

export async function LogEditFeed({
  logId,
  viewer,
}: {
  logId: string;
  viewer?: User | null;
}) {
  const user =
    viewer === undefined ? await getUserOrRedirectToOnboarding() : viewer;
  const workspaceData = user ? await getWorkspaceUiData() : null;
  const log = workspaceData?.logs.find((item) => item.id === logId) ?? getLogById(logId);

  if (!log) {
    notFound();
  }

  return (
    <LogEditShell
      logId={logId}
      log={log}
      workspaceData={workspaceData}
      isLoggedIn={!!user}
      profileImageUrl={user?.profileImageUrl}
      profileHref={user ? buildViewerProfileHref(user.username) : undefined}
      footer={<Footer />}
    />
  );
}
