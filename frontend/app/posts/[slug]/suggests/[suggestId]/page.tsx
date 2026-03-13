import { notFound } from "next/navigation";
import { Footer, Header } from "@/widgets/chrome/ui";
import {
  getOpenLogPostEntry,
  getOpenLogSuggestion,
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

  const entry = getOpenLogPostEntry(slug);
  const suggestion = getOpenLogSuggestion(slug, suggestId);

  if (!entry || !suggestion) notFound();

  const articleHref = `/posts/${slug}`;
  const suggestsHref = `${articleHref}/suggests`;

  return (
    <div className="min-h-dvh bg-white text-zinc-950">
      <Header />

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
