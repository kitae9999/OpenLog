import { notFound, redirect } from "next/navigation";
import { getOwnedPost } from "@/entities/post/api/getOwnedPost";
import { getPublicUserPosts } from "@/entities/user/api/getPublicUserPosts";
import { getUserOrRedirectToOnboarding } from "@/features/auth/api/requireOnboarding";
import {
  deletePostAction,
  updatePostAction,
} from "@/features/post/api/postActions";
import {
  buildPublicPostPath,
  buildViewerProfileHref,
} from "@/shared/lib/publicRoutes";
import { loadAppChromeWorkspace } from "@/widgets/app-shell/api/loadAppChromeWorkspace";
import { WriteView } from "@/widgets/write/ui";

export default async function OwnedPostEditPage({
  params,
  searchParams,
}: {
  params: Promise<{ postId: string }>;
  searchParams: Promise<{ publishError?: string }>;
}) {
  const { postId } = await params;
  if (!/^\d+$/.test(postId)) {
    notFound();
  }

  const viewer = await getUserOrRedirectToOnboarding();
  if (!viewer?.username) {
    redirect("/");
  }
  const [detail, resolvedSearchParams] = await Promise.all([
    getOwnedPost(postId),
    searchParams,
  ]);
  if (!detail) {
    notFound();
  }

  const [authoredPosts, chrome] = await Promise.all([
    getPublicUserPosts(viewer.username),
    loadAppChromeWorkspace(true),
  ]);
  const isPublished = detail.status === "PUBLISHED";

  return (
    <WriteView
      isLoggedIn={true}
      profileImageUrl={viewer.profileImageUrl}
      profileHref={buildViewerProfileHref(viewer.username)}
      mode="edit"
      postStatus={detail.status}
      initialFormError={
        resolvedSearchParams.publishError === "1"
          ? "초안은 저장했지만 발행하지 못했습니다. 내용을 확인한 뒤 다시 발행해주세요."
          : undefined
      }
      action={updatePostAction.bind(null, detail.id, detail.status)}
      initialValues={{
        title: detail.title,
        description: detail.description,
        topics: detail.topics,
        content: detail.content,
      }}
      authoredPosts={authoredPosts ?? []}
      initialWikiLinks={detail.wikiLinks}
      draftStorageKey={`openlog.write.edit.${detail.id}.${detail.version}`}
      backHref={
        isPublished
          ? buildPublicPostPath(detail.authorUsername, detail.slug)
          : "/?tab=home&status=drafts"
      }
      backLabel={isPublished ? "Back to story" : "Back to drafts"}
      sourceOutputHref={
        detail.sourceOutput ? `/outputs/${detail.sourceOutput.id}` : undefined
      }
      deleteAction={deletePostAction.bind(null, detail.id)}
      submitLabel={isPublished ? "Save Changes" : "Publish"}
      pendingSubmitLabel={isPublished ? "Saving..." : "Publishing..."}
      workspaces={chrome.workspaces}
      workspaceData={chrome.workspaceData}
    />
  );
}
