import { notFound } from "next/navigation";
import { Footer, Header } from "@/widgets/chrome/ui";
import { PostSuggests } from "@/widgets/post/ui";
import { getPostEntry } from "@/entities/post/model";
import { getUser } from "@/features/auth/api/getUser";
import {
  buildPublicPostPath,
  buildPublicSuggestsPath,
  buildViewerProfileHref,
  parsePublicUsernameParam,
} from "@/shared/lib/publicRoutes";

export default async function PublicPostSuggestsPage({
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
  if (!authorUsername) {
    notFound();
  }

  const [viewer, entry] = await Promise.all([
    getUser(),
    Promise.resolve(getPostEntry(authorUsername, postSlug)),
  ]);

  if (!entry) {
    notFound();
  }

  const articleHref = buildPublicPostPath(authorUsername, postSlug);
  const suggestsHref = buildPublicSuggestsPath(authorUsername, postSlug);

  return (
    <div className="min-h-dvh bg-white text-zinc-950">
      <Header
        isLoggedIn={!!viewer}
        profileImageUrl={viewer?.profileImageUrl}
        profileHref={viewer ? buildViewerProfileHref(viewer.username) : undefined}
      />

      <main className="mx-auto w-full max-w-[1083px] px-4 pb-16 pt-6 sm:px-8">
        <PostSuggests
          post={entry.post}
          suggestions={entry.suggestions}
          backHref="/?tab=trending"
          articleHref={articleHref}
          suggestsHref={suggestsHref}
          suggestCount={entry.suggestCount}
        />
      </main>

      <Footer />
    </div>
  );
}
