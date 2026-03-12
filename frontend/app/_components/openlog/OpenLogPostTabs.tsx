import Link from "next/link";
import { cn } from "./OpenLogChrome";
import { OpenLogGitPullRequestIcon } from "./OpenLogGitPullRequestIcon";

export type OpenLogPostTabKey = "article" | "suggests";

export function OpenLogPostTabs({
  activeTab,
  articleHref,
  suggestsHref,
  suggestCount = 0,
}: {
  activeTab: OpenLogPostTabKey;
  articleHref: string;
  suggestsHref: string;
  suggestCount?: number;
}) {
  return (
    <nav aria-label="Post sections" className="mt-6 border-b border-zinc-200">
      <div className="flex items-center gap-6">
        <Link
          href={articleHref}
          aria-current={activeTab === "article" ? "page" : undefined}
          className={cn(
            "relative -mb-px inline-flex h-[34px] items-center gap-2 border-b-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20",
            activeTab === "article"
              ? "border-zinc-950 text-zinc-950"
              : "border-transparent text-zinc-500 hover:text-zinc-950",
          )}
        >
          <IconArticle className="size-4" />
          <span>Article</span>
        </Link>

        <Link
          href={suggestsHref}
          aria-current={activeTab === "suggests" ? "page" : undefined}
          className={cn(
            "relative -mb-px inline-flex h-[34px] items-center gap-2 border-b-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20",
            activeTab === "suggests"
              ? "border-zinc-950 text-zinc-950"
              : "border-transparent text-zinc-500 hover:text-zinc-950",
          )}
        >
          <OpenLogGitPullRequestIcon className="size-4" />
          <span>Suggests</span>
          {suggestCount > 0 ? (
            <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-zinc-100 px-1.5 text-[11px] font-bold leading-none text-zinc-950">
              {suggestCount}
            </span>
          ) : null}
        </Link>
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
