import { notFound, redirect } from "next/navigation";
import { getPostDetail } from "@/entities/post/api/getPostDetail";
import { getUserOrRedirectToOnboarding } from "@/features/auth/api/requireOnboarding";
import {
  buildPublicPostPath,
  parsePublicPostSlugParam,
  parsePublicUsernameParam,
} from "@/shared/lib/publicRoutes";

export default async function LegacyEditPostPage({
  params,
}: {
  params?: Promise<{ username?: string; postSlug?: string }>;
}) {
  const resolvedParams = await params;
  const username = resolvedParams?.username
    ? parsePublicUsernameParam(resolvedParams.username)
    : null;
  const slug = resolvedParams?.postSlug
    ? parsePublicPostSlugParam(resolvedParams.postSlug)
    : null;
  if (!username || !slug) {
    notFound();
  }

  const [viewer, detail] = await Promise.all([
    getUserOrRedirectToOnboarding(),
    getPostDetail(username, slug),
  ]);
  if (!detail) {
    notFound();
  }
  if (viewer?.username !== detail.authorUsername) {
    redirect(buildPublicPostPath(detail.authorUsername, detail.slug));
  }

  redirect(`/posts/${detail.id}/edit`);
}
