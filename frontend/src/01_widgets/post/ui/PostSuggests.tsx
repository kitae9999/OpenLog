import Link from "next/link";
import type { Post } from "@/entities/post/model";
import { cn } from "@/shared/lib/cn";
import { GitPullRequestIcon } from "@/shared/ui/icons";
import { PostTabs } from "./PostTabs";

export type SuggestionListItem = {
  id: string;
  detailHref?: string;
  numberLabel: string;
  title: string;
  activityLabel: string;
  authorName: string;
  commentCount: number;
  status: "open" | "outdated" | "closed" | "merged";
};

export type SuggestionStatusFilter = "open" | "closed";

export function PostSuggests({
  post,
  suggestions,
  backHref = "/",
  articleHref,
  suggestsHref,
  suggestEditHref = "/contribute",
  suggestCount = 0,
  activeStatus = "open",
}: {
  post: Post;
  suggestions: SuggestionListItem[];
  backHref?: string;
  articleHref: string;
  suggestsHref: string;
  suggestEditHref?: string;
  suggestCount?: number;
  activeStatus?: SuggestionStatusFilter;
}) {
  const openCount = suggestions.filter((item) => item.status === "open").length;
  const closedCount = suggestions.length - openCount;
  const visibleSuggestions = suggestions.filter((item) =>
    activeStatus === "open" ? item.status === "open" : item.status !== "open",
  );
  const emptyMessage =
    activeStatus === "open"
      ? "No open suggestions yet."
      : "No closed suggestions yet.";

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
            <div className="min-w-0">
              <h1 className="font-serif text-[24px] font-bold leading-[1.25] tracking-tight text-zinc-950">
                Suggests for &quot;{post.title}&quot;
              </h1>
              <p className="mt-3 text-sm text-zinc-500">
                Review community contributions to this article.
              </p>
            </div>
          </header>

          <section className="mt-6 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200 bg-zinc-50/80 px-4 py-3">
              <div className="flex items-center gap-6">
                <StatusSummary
                  count={openCount}
                  href={`${suggestsHref}?status=open`}
                  label="Open"
                  active={activeStatus === "open"}
                />
                <StatusSummary
                  count={closedCount}
                  href={`${suggestsHref}?status=closed`}
                  label="Closed"
                  active={activeStatus === "closed"}
                />
              </div>

              <Link
                href={suggestEditHref}
                className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg bg-zinc-950 px-3 text-xs font-semibold text-white transition hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/30"
              >
                <IconWrite className="size-3.5" />
                New Suggest
              </Link>
            </div>

            <div>
              {visibleSuggestions.length === 0 ? (
                <div className="px-4 py-10 text-center text-sm font-medium text-zinc-500">
                  {emptyMessage}
                </div>
              ) : (
                visibleSuggestions.map((suggestion, index) => (
                  <Link
                    key={suggestion.id}
                    href={suggestion.detailHref ?? `${suggestsHref}/${suggestion.id}`}
                    className={cn(
                      "flex items-start justify-between gap-4 px-4 py-5 transition hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-zinc-900/10",
                      index < visibleSuggestions.length - 1 &&
                        "border-b border-zinc-200",
                    )}
                  >
                    <div className="flex min-w-0 flex-1 gap-3">
                      <span
                        className={cn(
                          "mt-0.5 shrink-0",
                          suggestion.status === "open"
                            ? "text-emerald-500"
                            : suggestion.status === "outdated"
                              ? "text-amber-500"
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
                          <span>{suggestion.activityLabel} by</span>
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
  href,
  label,
  active = false,
}: {
  count: number;
  href: string;
  label: string;
  active?: boolean;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "inline-flex items-center gap-2 rounded-lg text-[16px] leading-6 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20",
        active
          ? "font-semibold text-zinc-950"
          : "font-medium text-zinc-500 hover:text-zinc-950",
      )}
    >
      <GitPullRequestIcon className="size-4" />
      <span>
        {count} {label}
      </span>
    </Link>
  );
}

function IconWrite({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M12 20h9"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
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
