import { notFound } from "next/navigation";
import { getUser } from "@/features/auth/api/getUser";
import { getPublicUserPosts } from "@/entities/user/api/getPublicUserPosts";
import { getPublicUserPostGraph } from "@/entities/user/api/getPublicUserPostGraph";
import { getPublicUserProfile } from "@/entities/user/api/getPublicUserProfile";
import { buildViewerProfileHref } from "@/shared/lib/publicRoutes";
import { Footer } from "@/widgets/chrome/ui";
import { AppChromeShell } from "@/widgets/home-feed/ui/AppChromeShell";
import { loadAppChromeWorkspace } from "@/widgets/home-feed/ui/loadAppChromeWorkspace";
import { ProfileWorkspace } from "./ProfileWorkspace";

export async function ProfileView({ username }: { username: string }) {
  const [viewer, profile, posts, graph] = await Promise.all([
    getUser(),
    getPublicUserProfile(username),
    getPublicUserPosts(username),
    getPublicUserPostGraph(username),
  ]);

  if (!profile || !posts || !graph) {
    notFound();
  }

  const isViewer = viewer?.username === profile.username;
  const joinedLabel = formatJoinedLabel(profile.joinedAt);
  const viewerProfileHref = viewer
    ? buildViewerProfileHref(viewer.username)
    : undefined;
  const chrome = await loadAppChromeWorkspace(!!viewer);

  return (
    <AppChromeShell
      isLoggedIn={!!viewer}
      profileImageUrl={viewer?.profileImageUrl}
      profileHref={viewerProfileHref}
      activeTab="home"
      workspaces={chrome.workspaces}
      workspaceData={chrome.workspaceData}
      footer={<Footer />}
    >
      <div className="mx-auto w-full max-w-[1040px] px-4 pb-20 pt-8 sm:px-8 sm:pt-10">
        <ProfileWorkspace
          profile={profile}
          isViewer={isViewer}
          canFollow={!!viewer && !isViewer}
          joinedLabel={joinedLabel}
          posts={posts}
          graph={graph}
        />
      </div>
    </AppChromeShell>
  );
}

function formatJoinedLabel(joinedAt: string) {
  const parsed = new Date(joinedAt);
  if (Number.isNaN(parsed.getTime())) {
    return "Joined recently";
  }

  return `Joined ${new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
  }).format(parsed)}`;
}
