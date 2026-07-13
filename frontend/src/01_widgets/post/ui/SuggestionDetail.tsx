import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import type { Post, Suggestion } from "@/entities/post/model";
import { cn } from "@/shared/lib/cn";
import { GitPullRequestIcon } from "@/shared/ui/icons";
import { MarkdownContent } from "@/shared/ui/markdown";
import { SuggestionDiscussionSection } from "./SuggestionDiscussionSection";

type SuggestionManageAction = (formData: FormData) => void | Promise<void>;

export function SuggestionDetail({
  post,
  suggestion,
  postId,
  suggestionId,
  articleHref,
  suggestsHref,
  currentUserAvatarSrc,
  editHref,
  closeAction,
  mergeAction,
  rejectAction,
}: {
  post: Post;
  suggestion: Suggestion;
  postId: number;
  suggestionId: number;
  articleHref: string;
  suggestsHref: string;
  currentUserAvatarSrc?: string | null;
  editHref?: string;
  closeAction?: SuggestionManageAction;
  mergeAction?: SuggestionManageAction;
  rejectAction?: SuggestionManageAction;
}) {
  const isOpen = suggestion.status === "open";
  const isOutdated = suggestion.status === "outdated";
  const isMerged = suggestion.status === "merged";
  const isRejected = suggestion.status === "rejected";
  const statusLabel = isOpen
    ? "Open"
    : isOutdated
      ? "Outdated"
      : isMerged
        ? "Merged"
        : isRejected
          ? "Rejected"
          : "Closed";
  const hasActions = isOpen && (closeAction || mergeAction || rejectAction);

  return (
    <div className="mx-auto w-full max-w-[1024px] pb-12">
      <Link
        href={suggestsHref}
        className="inline-flex items-center gap-2 text-[13px] font-medium text-zinc-500 transition hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20"
      >
        <IconArrowLeft className="size-4" />
        Back to Suggestions
      </Link>

      <header className="mt-7 border-b border-zinc-200 pb-6">
        <div className="flex flex-wrap items-baseline gap-2">
          <h1 className="text-[30px] font-semibold leading-[1.2] tracking-tight text-zinc-950">
            {suggestion.title}
          </h1>
          <span className="font-mono text-[20px] text-zinc-400">
            {suggestion.numberLabel}
          </span>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[13px] text-zinc-500">
          <span className="inline-flex items-center gap-1.5 font-medium text-zinc-600">
            <SuggestionStatusDot status={suggestion.status} />
            <GitPullRequestIcon className="size-3.5" />
            {statusLabel}
          </span>
          <span className="text-zinc-300">·</span>
          <span className="font-semibold text-zinc-950">
            {suggestion.authorName}
          </span>
          <span>
            suggested an edit
            {suggestion.baseVersionLabel ? " based on " : ""}
            {suggestion.baseVersionLabel ? (
              <span className="font-mono text-xs text-zinc-600">
                {suggestion.baseVersionLabel}
              </span>
            ) : null}
          </span>
        </div>
      </header>

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,736px)_224px]">
        <div className="space-y-8">
          <SuggestionLeadComment suggestion={suggestion} editHref={editHref} />

          <SuggestionDiff suggestion={suggestion} />

          {suggestion.resolutionNote ? (
            <MergedNotice
              title={suggestion.resolutionNote.title}
              description={suggestion.resolutionNote.description}
            />
          ) : null}

          {hasActions ? (
            <div className="flex flex-wrap items-center justify-end gap-4 border-t border-zinc-200 pt-6">
              {closeAction ? (
                <form action={closeAction}>
                  <button
                    type="submit"
                    className="cursor-pointer text-[13px] font-medium text-zinc-500 transition hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20"
                  >
                    Close suggestion
                  </button>
                </form>
              ) : null}
              {rejectAction ? (
                <form action={rejectAction}>
                  <button
                    type="submit"
                    className="cursor-pointer text-[13px] font-medium text-rose-600 transition hover:text-rose-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-600/20"
                  >
                    Reject
                  </button>
                </form>
              ) : null}
              {mergeAction ? (
                <form action={mergeAction}>
                  <button
                    type="submit"
                    className="inline-flex cursor-pointer items-center gap-1.5 text-[13px] font-medium text-zinc-950 transition hover:text-zinc-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20"
                  >
                    <GitPullRequestIcon className="size-3.5" />
                    Accept Suggestion
                  </button>
                </form>
              ) : null}
            </div>
          ) : null}

          <SuggestionDiscussionSection
            postId={postId}
            suggestionId={suggestionId}
            initialComments={suggestion.discussionComments}
            currentUserAvatarSrc={currentUserAvatarSrc}
          />
        </div>

        <aside className="space-y-6 border-t border-zinc-200/80 pt-6 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-10">
          <InfoCard title="Target Article">
            <Link
              href={articleHref}
              className="text-[13.5px] font-medium leading-6 text-zinc-700 transition hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20"
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
  editHref,
}: {
  suggestion: Suggestion;
  editHref?: string;
}) {
  return (
    <div className="flex items-start gap-4">
      <Image
        src={suggestion.comment.authorAvatarSrc}
        alt={`${suggestion.comment.authorName} avatar`}
        width={40}
        height={40}
        className="mt-0.5 size-10 rounded-full border border-zinc-200 object-cover"
      />

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 text-sm">
            <span className="font-semibold text-zinc-950">
              {suggestion.comment.authorName}
            </span>
            <span className="text-zinc-400">
              commented on {suggestion.comment.commentedAtLabel}
            </span>
          </div>
          {editHref ? (
            <Link
              href={editHref}
              className="text-[13px] font-medium text-zinc-500 transition hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20"
            >
              Edit
            </Link>
          ) : null}
        </div>

        <div className="mt-2">
          <MarkdownContent
            markdown={suggestion.comment.message}
            variant="compact"
          />
        </div>
      </div>
    </div>
  );
}

function SuggestionDiff({ suggestion }: { suggestion: Suggestion }) {
  return (
    <section>
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="inline-flex items-center gap-2 text-[13.5px] font-semibold tracking-tight text-zinc-600">
          <IconFileDiff className="size-4" />
          Changes
        </h2>
        <span className="font-mono text-[12px] text-zinc-400">Unified view</span>
      </div>

      <div className="mt-3 overflow-x-auto border-t border-zinc-200">
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

      <p className="mt-2 flex items-center gap-1.5 text-[12px] text-zinc-400">
        <IconArrowRight className="size-3" />
        Green lines indicate additions, red lines indicate deletions.
      </p>
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
    <section className="border-t border-zinc-200 pt-6">
      <div className="flex items-start gap-2.5">
        <GitPullRequestIcon className="mt-0.5 size-4 shrink-0 text-violet-600" />
        <div>
          <h2 className="text-[13.5px] font-semibold tracking-tight text-violet-900">
            {title}
          </h2>
          <p className="mt-1 text-[13px] leading-5 text-violet-700/80">
            {description}
          </p>
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
    <div>
      <p className="text-[12px] font-medium text-zinc-400">{title}</p>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}

function SuggestionStatusDot({
  status,
}: {
  status: Suggestion["status"];
}) {
  return (
    <span
      className={cn(
        "size-[7px] shrink-0 rounded-full",
        status === "open" && "bg-emerald-600",
        status === "outdated" && "bg-amber-500",
        status === "merged" && "bg-violet-600",
        status === "rejected" && "bg-rose-600",
        status !== "open" &&
          status !== "outdated" &&
          status !== "merged" &&
          status !== "rejected" &&
          "bg-zinc-400",
      )}
      aria-hidden="true"
    />
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
