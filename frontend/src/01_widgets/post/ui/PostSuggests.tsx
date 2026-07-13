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
  status: "open" | "outdated" | "closed" | "merged" | "rejected";
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

          <header className="mt-8 flex flex-wrap items-end justify-between gap-3">
            <div className="min-w-0">
              <h1 className="text-[24px] font-semibold tracking-tight text-zinc-950">
                Suggests for &quot;{post.title}&quot;
              </h1>
              <p className="mt-1.5 text-[13px] text-zinc-500">
                Review community contributions to this article.
              </p>
            </div>
            <Link
              href={suggestEditHref}
              className="inline-flex cursor-pointer text-[13px] font-medium text-zinc-500 transition hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20"
            >
              + New suggest
            </Link>
          </header>

          <div
            role="tablist"
            aria-label="Suggestion status filters"
            className="mt-6 flex flex-wrap items-end gap-1 border-b border-zinc-200"
          >
            <StatusTab
              count={openCount}
              href={`${suggestsHref}?status=open`}
              label="Open"
              active={activeStatus === "open"}
            />
            <StatusTab
              count={closedCount}
              href={`${suggestsHref}?status=closed`}
              label="Closed"
              active={activeStatus === "closed"}
            />
          </div>

          {visibleSuggestions.length === 0 ? (
            <p className="mt-10 pl-2.5 text-sm text-zinc-500">{emptyMessage}</p>
          ) : (
            <ul className="mt-2">
              {visibleSuggestions.map((suggestion) => (
                <li
                  key={suggestion.id}
                  className="border-t border-zinc-200/80 first:border-t-0"
                >
                  <Link
                    href={
                      suggestion.detailHref ??
                      `${suggestsHref}/${suggestion.id}`
                    }
                    className="group flex items-start justify-between gap-4 rounded-lg px-2.5 py-3.5 transition hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-zinc-900/20"
                  >
                    <div className="flex min-w-0 flex-1 gap-3">
                      <span
                        className={cn(
                          "mt-1 shrink-0",
                          suggestion.status === "open"
                            ? "text-emerald-500"
                            : suggestion.status === "outdated"
                              ? "text-amber-500"
                              : suggestion.status === "rejected"
                                ? "text-rose-500"
                                : "text-violet-500",
                        )}
                      >
                        <GitPullRequestIcon className="size-[18px]" />
                      </span>

                      <div className="min-w-0">
                        <p className="truncate text-[14.5px] font-medium leading-5 text-zinc-950 transition group-hover:text-zinc-700">
                          {suggestion.title}
                        </p>
                        <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] text-zinc-400">
                          <span className="font-mono text-[11px] text-zinc-400">
                            {suggestion.numberLabel}
                          </span>
                          <span>{suggestion.activityLabel} by</span>
                          <span className="font-medium text-zinc-500">
                            {suggestion.authorName}
                          </span>
                        </div>
                      </div>
                    </div>

                    <span className="mt-0.5 inline-flex shrink-0 items-center gap-1.5 text-[12px] text-zinc-400">
                      <IconComment className="size-3.5" />
                      <span className="tabular-nums">
                        {suggestion.commentCount}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function StatusTab({
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
      role="tab"
      aria-selected={active}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group relative inline-flex h-9 cursor-pointer items-center gap-1.5 px-2.5 text-[13px] font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20",
        active ? "text-zinc-950" : "text-zinc-500 hover:text-zinc-950",
      )}
    >
      <span className="inline-flex items-center gap-1.5">
        {label}
        <span
          className={cn(
            "tabular-nums transition",
            active
              ? "text-zinc-500"
              : "text-zinc-400 group-hover:text-zinc-500",
          )}
        >
          {count}
        </span>
      </span>
      {active ? (
        <span className="absolute inset-x-2 -bottom-px h-0.5 bg-zinc-950" />
      ) : (
        <span className="absolute inset-x-2 -bottom-px h-0.5 bg-zinc-300 opacity-0 transition group-hover:opacity-100" />
      )}
    </Link>
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
