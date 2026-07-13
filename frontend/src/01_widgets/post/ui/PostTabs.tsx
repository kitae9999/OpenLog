import Link from "next/link";
import { cn } from "@/shared/lib/cn";
import { GitPullRequestIcon } from "@/shared/ui/icons";

export type PostTabKey = "article" | "suggests";

export function PostTabs({
  activeTab,
  articleHref,
  suggestsHref,
  suggestCount = 0,
  showSuggestsTab = true,
}: {
  activeTab: PostTabKey;
  articleHref: string;
  suggestsHref: string;
  suggestCount?: number;
  showSuggestsTab?: boolean;
}) {
  return (
    <nav aria-label="Post sections" className="mt-6 border-b border-zinc-200">
      <div className="flex items-center gap-6">
        <Link
          href={articleHref}
          aria-current={activeTab === "article" ? "page" : undefined}
          className={cn(
            "group relative -mb-px inline-flex h-9 cursor-pointer items-center gap-2 text-[13px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20",
            activeTab === "article"
              ? "text-zinc-950"
              : "text-zinc-500 hover:text-zinc-950",
          )}
        >
          <IconArticle className="size-4" />
          <span>Article</span>
          {activeTab === "article" ? (
            <span className="absolute inset-x-0 -bottom-px h-0.5 bg-zinc-950" />
          ) : (
            <span className="absolute inset-x-0 -bottom-px h-0.5 bg-zinc-300 opacity-0 transition group-hover:opacity-100" />
          )}
        </Link>

        {showSuggestsTab ? (
          <Link
            href={suggestsHref}
            aria-current={activeTab === "suggests" ? "page" : undefined}
            className={cn(
              "group relative -mb-px inline-flex h-9 cursor-pointer items-center gap-2 text-[13px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20",
              activeTab === "suggests"
                ? "text-zinc-950"
                : "text-zinc-500 hover:text-zinc-950",
            )}
          >
            <GitPullRequestIcon className="size-4" />
            <span>Suggests</span>
            {suggestCount > 0 ? (
              <span
                className={cn(
                  "tabular-nums transition",
                  activeTab === "suggests"
                    ? "text-zinc-500"
                    : "text-zinc-400 group-hover:text-zinc-500",
                )}
              >
                {suggestCount}
              </span>
            ) : null}
            {activeTab === "suggests" ? (
              <span className="absolute inset-x-0 -bottom-px h-0.5 bg-zinc-950" />
            ) : (
              <span className="absolute inset-x-0 -bottom-px h-0.5 bg-zinc-300 opacity-0 transition group-hover:opacity-100" />
            )}
          </Link>
        ) : null}
      </div>
    </nav>
  );
}

function IconArticle({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M10 1.5H4.5A1.5 1.5 0 003 3v10a1.5 1.5 0 001.5 1.5h7A1.5 1.5 0 0013 13V4.5L10 1.5z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M10 1.5V4a.5.5 0 00.5.5H13"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M5.5 7h1.5"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <path
        d="M5.5 9.5h5"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <path
        d="M5.5 12h5"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}
