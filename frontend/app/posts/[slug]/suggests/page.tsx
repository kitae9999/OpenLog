import { notFound } from "next/navigation";
import { Footer, Header } from "@/widgets/chrome/ui";
import { getOpenLogPostEntry } from "@/entities/post/model";
import { PostSuggests } from "@/widgets/post/ui";

export default async function PostSuggestsPage({
  params,
}: {
  params?: Promise<{ slug?: string | string[] }>;
}) {
  const p = await params;
  const slugParam = p?.slug;
  const slug = Array.isArray(slugParam) ? slugParam[0] : slugParam;
  if (!slug) notFound();

  const entry = getOpenLogPostEntry(slug);
  if (!entry) notFound();

  const articleHref = `/posts/${slug}`;
  const suggestsHref = `${articleHref}/suggests`;

  return (
    <div className="min-h-dvh bg-white text-zinc-950">
      <Header />

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
