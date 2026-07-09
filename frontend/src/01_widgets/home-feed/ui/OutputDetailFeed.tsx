import { Footer } from "@/widgets/chrome/ui";
import { getUserOrRedirectToOnboarding } from "@/features/auth/api/requireOnboarding";
import type { User } from "@/entities/user/model/User";
import { buildViewerProfileHref } from "@/shared/lib/publicRoutes";
import { OutputDetailShell } from "./OutputDetailShell";
import { getWorkspaceUiData } from "./workspaceApi";

export async function OutputDetailFeed({
  viewer,
  outputId,
}: {
  viewer?: User | null;
  outputId: string;
}) {
  const user =
    viewer === undefined ? await getUserOrRedirectToOnboarding() : viewer;
  const workspaceData = user ? await getWorkspaceUiData() : null;
  const output = workspaceData?.outputs.find((item) => item.id === outputId);

  return (
    <OutputDetailShell
      isLoggedIn={!!user}
      outputId={outputId}
      output={output}
      workspaceData={workspaceData}
      profileImageUrl={user?.profileImageUrl}
      profileHref={user ? buildViewerProfileHref(user.username) : undefined}
      footer={<Footer />}
    />
  );
}
