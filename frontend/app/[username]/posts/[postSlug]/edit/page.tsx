import { notFound, redirect } from "next/navigation";
import { getPostDetail } from "@/entities/post/api/getPostDetail";
import { getPublicUserPosts } from "@/entities/user/api/getPublicUserPosts";
import { getUserOrRedirectToOnboarding } from "@/features/auth/api/requireOnboarding";
import { updatePostAction } from "@/features/post/api/postActions";
import {
  buildPublicPostPath,
  buildViewerProfileHref,
  parsePublicPostSlugParam,
  parsePublicUsernameParam,
} from "@/shared/lib/publicRoutes";
import { WriteView } from "@/widgets/write/ui";

export default async function EditPostPage({
  params,
}: {
  params?: Promise<{ username?: string; postSlug?: string }>;
}) {
  const resolvedParams = await params;
  const usernameParam = resolvedParams?.username;
  const postSlug = resolvedParams?.postSlug;

  if (!usernameParam || !postSlug) {
    notFound();
  }

  const authorUsername = parsePublicUsernameParam(usernameParam);
  const canonicalPostSlug = parsePublicPostSlugParam(postSlug);
  if (!authorUsername || !canonicalPostSlug) {
    notFound();
  }

  const [viewer, detail] = await Promise.all([
    getUserOrRedirectToOnboarding(),
    getPostDetail(authorUsername, canonicalPostSlug),
  ]);

  if (!detail) {
    notFound();
  }

  const articleHref = buildPublicPostPath(detail.authorUsername, detail.slug);

  if (!viewer?.username) {
    redirect("/");
  }

  if (viewer.username !== detail.authorUsername) {
    redirect(articleHref);
  }

  const authoredPosts = await getPublicUserPosts(viewer.username);

  return (
    <WriteView
      isLoggedIn={true}
      profileImageUrl={viewer.profileImageUrl}
      profileHref={buildViewerProfileHref(viewer.username)}
      mode="edit"
      action={updatePostAction.bind(null, detail.id)}
      initialValues={{
        title: detail.title,
        description: detail.description,
        topics: detail.topics,
        content: detail.content,
      }}
      authoredPosts={authoredPosts ?? []}
      initialWikiLinks={detail.wikiLinks}
      draftStorageKey={`openlog.write.edit.${detail.id}.${detail.version}`}
      backHref={articleHref}
      backLabel="Back to story"
      submitLabel="Save Changes"
      pendingSubmitLabel="Saving..."
    />
  );
}
