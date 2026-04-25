import { notFound, redirect } from "next/navigation";
import { Footer, Header } from "@/widgets/chrome/ui";
import { NewSuggestionView } from "@/widgets/post/ui";
import { getPostSuggestionDetail } from "@/entities/post/api/getPostSuggestionDetail";
import { getPostSuggestions } from "@/entities/post/api/getPostSuggestions";
import { getPostDetail } from "@/entities/post/api/getPostDetail";
import { getUserOrRedirectToOnboarding } from "@/features/auth/api/requireOnboarding";
import { updatePostSuggestionAction } from "@/features/suggest/api/suggestionActions";
import {
  buildPublicSuggestDetailPath,
  buildViewerProfileHref,
  parsePublicPostSlugParam,
  parsePublicUsernameParam,
} from "@/shared/lib/publicRoutes";

export default async function EditSuggestionPage({
  params,
}: {
  params?: Promise<{
    username?: string;
    postSlug?: string;
    suggestionNumber?: string;
  }>;
}) {
  const resolvedParams = await params;
  const usernameParam = resolvedParams?.username;
  const postSlug = resolvedParams?.postSlug;
  const suggestionNumberParam = resolvedParams?.suggestionNumber;

  if (!usernameParam || !postSlug || !suggestionNumberParam) {
    notFound();
  }

  const authorUsername = parsePublicUsernameParam(usernameParam);
  const canonicalPostSlug = parsePublicPostSlugParam(postSlug);
  const suggestionNumber = parseSuggestionNumber(suggestionNumberParam);
  if (!authorUsername || !canonicalPostSlug || !suggestionNumber) {
    notFound();
  }

  const [viewer, detail] = await Promise.all([
    getUserOrRedirectToOnboarding(),
    getPostDetail(authorUsername, canonicalPostSlug),
  ]);

  if (!viewer) {
    redirect("/");
  }

  if (!detail) {
    notFound();
  }

  const suggestions = await getPostSuggestions(detail.id);
  const summary = suggestions[suggestions.length - suggestionNumber];
  if (!summary) {
    notFound();
  }

  const suggestionDetail = await getPostSuggestionDetail(detail.id, summary.id);
  if (!suggestionDetail) {
    notFound();
  }

  const suggestionHref = buildPublicSuggestDetailPath(
    authorUsername,
    canonicalPostSlug,
    String(suggestionNumber),
  );

  if (viewer.id !== suggestionDetail.authorId || suggestionDetail.status !== "OPEN") {
    redirect(suggestionHref);
  }

  const action = updatePostSuggestionAction.bind(
    null,
    detail.id,
    suggestionDetail.id,
    suggestionHref,
  );

  return (
    <div className="min-h-dvh bg-zinc-50 text-zinc-950">
      <Header
        isLoggedIn={true}
        profileImageUrl={viewer.profileImageUrl}
        profileHref={buildViewerProfileHref(viewer.username)}
      />

      <main className="mx-auto w-full max-w-[1083px] px-4 pb-16 pt-6 sm:px-8">
        <NewSuggestionView
          mode="edit"
          initialValues={{
            postTitle: detail.title,
            baseContent: suggestionDetail.baseContent,
            title: suggestionDetail.title,
            description: suggestionDetail.description,
            content: suggestionDetail.content,
          }}
          backHref={suggestionHref}
          articleHref={suggestionHref}
          action={action}
          eyebrow="Edit Suggestion"
          heading={`Edit suggestion for "${detail.title}"`}
          submitLabel="Save suggestion"
          pendingSubmitLabel="Saving..."
          cancelLabel="Cancel"
        />
      </main>

      <Footer />
    </div>
  );
}

function parseSuggestionNumber(value: string) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) {
    return null;
  }

  return parsed;
}
