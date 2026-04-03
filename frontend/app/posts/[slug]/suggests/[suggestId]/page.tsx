import { notFound } from "next/navigation";
import { getUserOrRedirectToOnboarding } from "@/features/auth/api/requireOnboarding";
import { Footer, Header } from "@/widgets/chrome/ui";
import {
  getPostEntry,
  getSuggestion,
} from "@/entities/post/model";
import { SuggestionDetail } from "@/widgets/post/ui";

export default async function PostSuggestionDetailPage({
  params,
}: {
  params?: Promise<{ slug?: string | string[]; suggestId?: string | string[] }>;
}) {
  const p = await params;
  const slugParam = p?.slug;
  const suggestIdParam = p?.suggestId;
  const slug = Array.isArray(slugParam) ? slugParam[0] : slugParam;
  const suggestId = Array.isArray(suggestIdParam)
    ? suggestIdParam[0]
    : suggestIdParam;

  if (!slug || !suggestId) notFound();

  const entry = getPostEntry(slug);
  const suggestion = getSuggestion(slug, suggestId);

  if (!entry || !suggestion) notFound();
  const viewer = await getUserOrRedirectToOnboarding();

  const articleHref = `/posts/${slug}`;
  const suggestsHref = `${articleHref}/suggests`;

  return (
    <div className="min-h-dvh bg-white text-zinc-950">
      <Header
        isLoggedIn={!!viewer}
        profileImageUrl={viewer?.profileImageUrl}
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
