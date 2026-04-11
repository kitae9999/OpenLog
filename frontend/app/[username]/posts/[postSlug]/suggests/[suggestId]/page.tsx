import { notFound } from "next/navigation";
import { Footer, Header } from "@/widgets/chrome/ui";
import { SuggestionDetail } from "@/widgets/post/ui";
import { getPostEntry, getSuggestion } from "@/entities/post/model";
import { getUser } from "@/features/auth/api/getUser";
import {
  buildPublicPostPath,
  buildPublicSuggestsPath,
  buildViewerProfileHref,
  parsePublicPostSlugParam,
  parsePublicUsernameParam,
} from "@/shared/lib/publicRoutes";

export default async function PublicPostSuggestionDetailPage({
  params,
}: {
  params?: Promise<{
    username?: string;
    postSlug?: string;
    suggestId?: string;
  }>;
}) {
  const resolvedParams = await params;
  const usernameParam = resolvedParams?.username;
  const postSlug = resolvedParams?.postSlug;
  const suggestId = resolvedParams?.suggestId;

  if (!usernameParam || !postSlug || !suggestId) {
    notFound();
  }

  const authorUsername = parsePublicUsernameParam(usernameParam);
  const canonicalPostSlug = parsePublicPostSlugParam(postSlug);
  if (!authorUsername || !canonicalPostSlug) {
    notFound();
  }

  const [viewer, entry, suggestion] = await Promise.all([
    getUser(),
    Promise.resolve(getPostEntry(authorUsername, canonicalPostSlug)),
    Promise.resolve(getSuggestion(authorUsername, canonicalPostSlug, suggestId)),
  ]);

  if (!entry || !suggestion) {
    notFound();
  }

  const articleHref = buildPublicPostPath(authorUsername, canonicalPostSlug);
  const suggestsHref = buildPublicSuggestsPath(authorUsername, canonicalPostSlug);

  return (
    <div className="min-h-dvh bg-white text-zinc-950">
      <Header
        isLoggedIn={!!viewer}
        profileImageUrl={viewer?.profileImageUrl}
        profileHref={viewer ? buildViewerProfileHref(viewer.username) : undefined}
      />

      <main className="mx-auto w-full max-w-[1083px] px-4 pb-16 pt-6 sm:px-8">
        <SuggestionDetail
          post={entry.post}
          suggestion={suggestion}
          articleHref={articleHref}
          suggestsHref={suggestsHref}
        />
      </main>

      <Footer />
    </div>
  );
}
