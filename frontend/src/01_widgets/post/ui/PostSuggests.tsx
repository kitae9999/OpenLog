import Link from "next/link";
import type { Post } from "@/entities/post/model";
import { cn } from "@/shared/lib/cn";
import { GitPullRequestIcon } from "@/shared/ui/icons";
import { PostTabs } from "./PostTabs";

export type SuggestionListItem = {
  id: string;
  numberLabel: string;
  title: string;
  openedAtLabel: string;
  authorName: string;
  commentCount: number;
  status: "open" | "closed" | "merged";
};

export function PostSuggests({
  post,
  suggestions,
  backHref = "/",
  articleHref,
  suggestsHref,
  suggestCount = 0,
}: {
  post: Post;
  suggestions: SuggestionListItem[];
  backHref?: string;
  articleHref: string;
  suggestsHref: string;
  suggestCount?: number;
}) {
  const openCount = suggestions.filter((item) => item.status === "open").length;
  const closedCount = suggestions.length - openCount;

  return (
    <div className="mx-auto w-full max-w-[950px] pb-12">
      <div className="flex items-start gap-15">
        <div className="hidden w-[60px] shrink-0 lg:block" aria-hidden="true" />

        <div className="w-full max-w-[768px]">
          <Link
            href={backHref}
            className="inline-flex items-center gap-2 text-sm text-zinc-500 transition hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20"
          >
            <IconArrowLeft className="size-4" />
            Back to feed
          </Link>

          <PostTabs
            activeTab="suggests"
            articleHref={articleHref}
            suggestsHref={suggestsHref}
            suggestCount={suggestCount}
          />

          <header className="mt-8">
            <h1 className="font-serif text-[24px] font-bold leading-[1.25] tracking-tight text-zinc-950">
              Suggests for &quot;{post.title}&quot;
            </h1>
            <p className="mt-3 text-sm text-zinc-500">
              Review community contributions to this article.
            </p>
          </header>

          <section className="mt-6 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
            <div className="flex items-center gap-6 border-b border-zinc-200 bg-zinc-50/80 px-4 py-3">
              <StatusSummary count={openCount} label="Open" active />
              <StatusSummary count={closedCount} label="Closed" />
            </div>

            <div>
              {suggestions.length === 0 ? (
                <div className="px-4 py-10 text-center text-sm font-medium text-zinc-500">
                  No suggestions yet.
                </div>
              ) : (
                suggestions.map((suggestion, index) => (
                  <Link
                    key={suggestion.id}
                    href={`${suggestsHref}/${suggestion.id}`}
                    className={cn(
                      "flex items-start justify-between gap-4 px-4 py-5 transition hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-zinc-900/10",
                      index < suggestions.length - 1 &&
                        "border-b border-zinc-200",
                    )}
                  >
                    <div className="flex min-w-0 flex-1 gap-3">
                      <span
                        className={cn(
                          "mt-0.5 shrink-0",
                          suggestion.status === "open"
                            ? "text-emerald-500"
                            : "text-violet-500",
                        )}
                      >
                        <GitPullRequestIcon className="size-5" />
                      </span>

                      <div className="min-w-0">
                        <p className="truncate text-[16px] font-semibold tracking-tight text-zinc-950">
                          {suggestion.title}
                        </p>

                        <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-zinc-500">
                          <span className="rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-[10px] leading-none text-zinc-500">
                            {suggestion.numberLabel}
                          </span>
                          <span>opened {suggestion.openedAtLabel} by</span>
                          <span className="font-medium text-zinc-700">
                            {suggestion.authorName}
                          </span>
                        </div>
                      </div>
                    </div>

                    <span className="mt-0.5 inline-flex shrink-0 items-center gap-1.5 text-xs text-zinc-400">
                      <IconComment className="size-4" />
                      {suggestion.commentCount}
                    </span>
                  </Link>
                ))
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function StatusSummary({
  count,
  label,
  active = false,
}: {
  count: number;
  label: string;
  active?: boolean;
}) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 text-[16px] leading-6",
        active ? "font-semibold text-zinc-950" : "font-medium text-zinc-500",
      )}
    >
      <GitPullRequestIcon className="size-4" />
      <span>
        {count} {label}
      </span>
    </div>
  );
}

function IconArrowLeft({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M19 12H5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M12 19l-7-7 7-7"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}


function IconComment({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M13 10a2.5 2.5 0 01-2.5 2.5H5.25L2 14.5v-9A2.5 2.5 0 014.5 3h6A2.5 2.5 0 0113 5.5V10z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
