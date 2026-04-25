import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import type { Post, Suggestion } from "@/entities/post/model";
import { assets } from "@/shared/config/assets";
import { cn } from "@/shared/lib/cn";
import { GitPullRequestIcon } from "@/shared/ui/icons";
import { MarkdownContent } from "@/shared/ui/markdown";
import { DiscussionComposer } from "@/features/discussion-composer/ui";

export function SuggestionDetail({
  post,
  suggestion,
  articleHref,
  suggestsHref,
}: {
  post: Post;
  suggestion: Suggestion;
  articleHref: string;
  suggestsHref: string;
}) {
  const isOpen = suggestion.status === "open";
  const isMerged = suggestion.status === "merged";
  const statusClassName = isOpen
    ? "bg-emerald-600"
    : isMerged
      ? "bg-violet-600"
      : "bg-zinc-500";
  const statusLabel = isOpen ? "Open" : isMerged ? "Merged" : "Closed";

  return (
    <div className="mx-auto w-full max-w-[1024px] pb-12">
      <Link
        href={suggestsHref}
        className="inline-flex items-center gap-2 text-sm text-zinc-500 transition hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20"
      >
        <IconArrowLeft className="size-4" />
        Back to Suggestions
      </Link>

      <header className="mt-7 border-b border-zinc-200 pb-6">
        <div className="flex flex-wrap items-baseline gap-2">
          <h1 className="font-serif text-[30px] font-bold leading-[1.2] tracking-tight text-zinc-950">
            {suggestion.title}
          </h1>
          <span className="font-mono text-[20px] text-zinc-400">
            {suggestion.numberLabel}
          </span>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-zinc-600">
          <span
            className={cn(
              "inline-flex h-6 items-center gap-1.5 rounded-full px-3 text-xs font-medium text-white shadow-sm",
              statusClassName,
            )}
          >
            <GitPullRequestIcon className="size-3.5" />
            {statusLabel}
          </span>
          <span className="font-semibold text-zinc-950">
            {suggestion.authorName}
          </span>
          <span>suggested an edit</span>
          {suggestion.baseVersionLabel ? (
            <>
              <span>based on</span>
              <span className="rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-xs text-zinc-800">
                {suggestion.baseVersionLabel}
              </span>
            </>
          ) : null}
        </div>
      </header>

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,736px)_224px]">
        <div className="space-y-8">
          <SuggestionLeadComment suggestion={suggestion} />

          <SuggestionDiff suggestion={suggestion} />

          {suggestion.resolutionNote ? (
            <MergedNotice
              title={suggestion.resolutionNote.title}
              description={suggestion.resolutionNote.description}
            />
          ) : null}

          {isOpen ? (
            <div className="flex flex-wrap justify-end gap-3">
              <button
                type="button"
                className="inline-flex h-10 items-center justify-center rounded-xl border border-zinc-300 px-5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20"
              >
                Close without merging
              </button>
              <button
                type="button"
                className="inline-flex h-10 items-center gap-2 rounded-xl bg-emerald-600 px-5 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600/30"
              >
                <GitPullRequestIcon className="size-4" />
                Accept Suggests
              </button>
            </div>
          ) : null}

          <DiscussionSection suggestion={suggestion} />
        </div>

        <aside className="space-y-6">
          <InfoCard title="Target Article">
            <Link
              href={articleHref}
              className="text-sm leading-6 text-blue-600 transition hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600/20"
            >
              {post.title}
            </Link>
          </InfoCard>
        </aside>
      </div>
    </div>
  );
}

function SuggestionLeadComment({
  suggestion,
}: {
  suggestion: Suggestion;
}) {
  return (
    <div className="flex items-start gap-4">
      <Image
        src={suggestion.comment.authorAvatarSrc}
        alt={`${suggestion.comment.authorName} avatar`}
        width={40}
        height={40}
        className="mt-1 size-10 rounded-full border border-zinc-200 object-cover"
      />

      <section className="min-w-0 flex-1 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
        <div className="flex items-center gap-2 border-b border-zinc-200 bg-zinc-50/80 px-4 py-3 text-sm text-zinc-500">
          <span className="font-semibold text-zinc-950">
            {suggestion.comment.authorName}
          </span>
          <span>commented on {suggestion.comment.commentedAtLabel}.</span>
        </div>

        <div className="px-4 py-5">
          <MarkdownContent
            markdown={suggestion.comment.message}
            variant="compact"
          />
        </div>
      </section>
    </div>
  );
}

function SuggestionDiff({ suggestion }: { suggestion: Suggestion }) {
  return (
    <section className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-zinc-200 bg-zinc-50/80 px-4 py-4">
        <div className="flex items-center gap-3 text-sm text-zinc-600">
          <span className="inline-flex items-center gap-2 font-semibold text-zinc-700">
            <IconFileDiff className="size-4" />
            <span className="font-mono text-sm">Changes</span>
          </span>
          <span className="font-mono text-xs text-zinc-500">Unified view</span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[664px]">
          {suggestion.diffRows.map((row, index) => (
            <DiffRow
              key={`${suggestion.id}-${index}`}
              oldLine={row.oldLine}
              newLine={row.newLine}
              kind={row.kind}
              content={row.content}
            />
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2 border-t border-zinc-200 bg-zinc-50/80 px-4 py-2 text-xs text-zinc-500">
        <IconArrowRight className="size-3" />
        Green lines indicate additions, red lines indicate deletions.
      </div>
    </section>
  );
}

function MergedNotice({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <section className="flex items-start gap-3 rounded-xl border border-violet-100 bg-violet-50 px-4 py-4">
      <span className="mt-0.5 inline-flex size-7 items-center justify-center rounded-full bg-violet-600 text-white">
        <GitPullRequestIcon className="size-4" />
      </span>
      <div>
        <h2 className="text-sm font-bold text-violet-900">{title}</h2>
        <p className="mt-1 text-xs text-violet-700">{description}</p>
      </div>
    </section>
  );
}

function DiscussionSection({
  suggestion,
}: {
  suggestion: Suggestion;
}) {
  return (
    <section>
      <div className="flex items-center gap-4">
        <div className="h-px flex-1 bg-zinc-200" />
        <div className="inline-flex items-center gap-2 text-sm text-zinc-500">
          <IconComment className="size-4" />
          Discussion
        </div>
        <div className="h-px flex-1 bg-zinc-200" />
      </div>

      {suggestion.discussionComments.length > 0 ? (
        <div className="mt-6 space-y-4">
          {suggestion.discussionComments.map((comment) => (
            <div key={comment.id} className="flex items-start gap-4">
              <Image
                src={comment.authorAvatarSrc}
                alt={`${comment.authorName} avatar`}
                width={40}
                height={40}
                className="mt-1 size-10 rounded-full border border-zinc-200 object-cover"
              />
              <section className="min-w-0 flex-1 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
                <div className="flex items-center gap-2 border-b border-zinc-200 bg-zinc-50/80 px-4 py-3 text-sm text-zinc-500">
                  <span className="font-semibold text-zinc-950">
                    {comment.authorName}
                  </span>
                  <span>commented on {comment.commentedAtLabel}.</span>
                </div>
                <div className="px-4 py-5 text-sm leading-6 text-zinc-800">
                  {comment.message}
                </div>
              </section>
            </div>
          ))}
        </div>
      ) : null}

      <div className="mt-6 flex items-start gap-4">
        <Image
          src={assets.defaultAvatar}
          alt="Current user avatar"
          width={40}
          height={40}
          className="mt-1 size-10 rounded-full border border-zinc-200 object-cover"
        />
        <div className="min-w-0 flex-1">
          <DiscussionComposer />
        </div>
      </div>
    </section>
  );
}

function InfoCard({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-zinc-200 bg-white px-4 py-4 shadow-sm">
      <h2 className="border-b border-zinc-100 pb-3 text-sm font-bold text-zinc-950">
        {title}
      </h2>
      <div className="pt-3">{children}</div>
    </section>
  );
}

function DiffRow({
  oldLine,
  newLine,
  kind,
  content,
}: {
  oldLine?: number;
  newLine?: number;
  kind: "context" | "remove" | "add";
  content: string;
}) {
  const rowClassName =
    kind === "remove"
      ? "bg-rose-50"
      : kind === "add"
        ? "bg-emerald-50"
        : "bg-white";
  const gutterClassName =
    kind === "remove"
      ? "bg-rose-100/80"
      : kind === "add"
        ? "bg-emerald-100/80"
        : "bg-white";
  const marker = kind === "remove" ? "-" : kind === "add" ? "+" : "";
  const markerColor =
    kind === "remove"
      ? "text-rose-700"
      : kind === "add"
        ? "text-emerald-700"
        : "text-transparent";

  return (
    <div
      className={cn(
        "grid grid-cols-[48px_48px_24px_minmax(0,1fr)]",
        rowClassName,
      )}
    >
      <div
        className={cn(
          "border-r border-zinc-200 px-2 text-right font-mono text-[11px] leading-7 text-zinc-400",
          gutterClassName,
        )}
      >
        {oldLine ?? ""}
      </div>
      <div
        className={cn(
          "border-r border-zinc-200 px-2 text-right font-mono text-[11px] leading-7 text-zinc-400",
          gutterClassName,
        )}
      >
        {newLine ?? ""}
      </div>
      <div
        className={cn("px-1 text-center font-mono text-sm leading-7", markerColor)}
      >
        {marker}
      </div>
      <div className="min-w-0 px-2 py-0.5 font-mono text-[13px] leading-7 whitespace-pre-wrap text-zinc-800">
        {content}
      </div>
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

function IconArrowRight({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M3 8h10"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M9 4l4 4-4 4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}


function IconFileDiff({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn("inline-block shrink-0 bg-current align-middle", className)}
      style={{
        WebkitMask: "url('/filediff.svg') center / contain no-repeat",
        mask: "url('/filediff.svg') center / contain no-repeat",
      }}
    />
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
