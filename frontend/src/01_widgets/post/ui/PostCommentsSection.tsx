"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { Comment } from "@/entities/comment/api/getPostComments";
import {
  deletePostComment,
  submitPostComment,
  updatePostComment,
} from "@/features/comment/api/commentActions";
import { DiscussionComposer } from "@/features/discussion-composer/ui";
import { assets } from "@/shared/config/assets";
import { MarkdownContent } from "@/shared/ui/markdown";

const COMMENTS_SECTION_ID = "post-comments";
const COMMENT_DATE_FORMATTER = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

export function PostCommentsSection({
  comments,
  initialComments,
  currentUserAvatarSrc,
  postId,
}: {
  comments: number;
  initialComments?: Comment[];
  currentUserAvatarSrc?: string | null;
  postId?: number;
}) {
  const router = useRouter();
  const resolvedAvatarSrc = currentUserAvatarSrc ?? assets.defaultAvatar;
  const hasFetchedComments = initialComments !== undefined;
  const [commentItems, setCommentItems] = useState(initialComments ?? []);
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [deletingCommentId, setDeletingCommentId] = useState<number | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [, startDeleteTransition] = useTransition();
  const displayCommentCount = hasFetchedComments
    ? commentItems.length
    : comments;

  async function submitComment(content: string) {
    if (!postId) {
      return {
        ok: false as const,
        message: "댓글 작성 기능을 사용할 수 없습니다.",
      };
    }

    const result = await submitPostComment(postId, content);
    if (!result.ok) {
      return result;
    }

    setCommentItems((current) =>
      current.some((comment) => comment.id === result.comment.id)
        ? current
        : [...current, result.comment],
    );
    router.refresh();

    return { ok: true as const };
  }

  async function updateComment(commentId: number, content: string) {
    if (!postId) {
      return {
        ok: false as const,
        message: "댓글 수정 기능을 사용할 수 없습니다.",
      };
    }

    const result = await updatePostComment(postId, commentId, content);
    if (!result.ok) {
      return result;
    }

    setCommentItems((current) =>
      current.map((comment) =>
        comment.id === result.comment.id ? result.comment : comment,
      ),
    );
    setEditingCommentId(null);
    router.refresh();

    return { ok: true as const };
  }

  function deleteComment(commentId: number) {
    if (!postId || deletingCommentId !== null) {
      return;
    }

    if (!window.confirm("댓글을 삭제할까요?")) {
      return;
    }

    setActionError(null);
    setDeletingCommentId(commentId);

    startDeleteTransition(async () => {
      try {
        const result = await deletePostComment(postId, commentId);
        if (!result.ok) {
          setActionError(result.message);
          return;
        }

        setCommentItems((current) =>
          current.filter((comment) => comment.id !== commentId),
        );
        setEditingCommentId((current) =>
          current === commentId ? null : current,
        );
        router.refresh();
      } catch {
        setActionError("댓글을 삭제하는 중 문제가 발생했습니다.");
      } finally {
        setDeletingCommentId(null);
      }
    });
  }

  return (
    <section
      id={COMMENTS_SECTION_ID}
      className="mt-14 scroll-mt-24 rounded-[28px] border border-zinc-200 bg-[linear-gradient(180deg,#ffffff_0%,#fbfbfa_100%)] p-6 shadow-[0_22px_50px_rgba(24,24,27,0.06)] sm:p-7"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200 pb-5">
        <div>
          <div className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.10em] text-zinc-400">
            <IconMessageSquare className="size-3.5" />
            Comments
          </div>
          <h2 className="mt-3 font-serif text-[28px] font-semibold tracking-tight text-zinc-950">
            Join the thread
          </h2>
          <p className="mt-2 max-w-[58ch] text-sm leading-6 text-zinc-600">
            Leave feedback, ask for clarification, or keep a focused discussion
            attached to this article.
          </p>
        </div>
        <span className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-medium text-zinc-500 shadow-sm">
          {displayCommentCount} comments
        </span>
      </div>

      {commentItems.length > 0 ? (
        <div className="mt-5 space-y-4">
          {commentItems.map((comment) => (
            <CommentCard
              key={comment.id}
              comment={comment}
              canManage={comment.canManage}
              isEditing={editingCommentId === comment.id}
              isDeleting={deletingCommentId === comment.id}
              onEdit={() => {
                setActionError(null);
                setEditingCommentId(comment.id);
              }}
              onCancelEdit={() => setEditingCommentId(null)}
              onSubmitEdit={(content) => updateComment(comment.id, content)}
              onDelete={() => deleteComment(comment.id)}
            />
          ))}
        </div>
      ) : !hasFetchedComments && comments > 0 ? (
        <div className="mt-5 rounded-2xl border border-dashed border-zinc-200 bg-zinc-50/80 px-4 py-4 text-sm leading-6 text-zinc-500">
          Existing comment entries are not wired into this detail view yet. The
          section is ready for comment-thread data and new replies.
        </div>
      ) : (
        <div className="mt-5 rounded-2xl border border-dashed border-zinc-200 bg-zinc-50/80 px-4 py-4 text-sm leading-6 text-zinc-500">
          No comments yet. Start the first thread for this article.
        </div>
      )}

      {actionError ? (
        <p className="mt-4 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
          {actionError}
        </p>
      ) : null}

      <div className="mt-6 flex items-start gap-4">
        <Image
          src={resolvedAvatarSrc}
          alt="Current user avatar"
          width={40}
          height={40}
          className="mt-1 size-10 rounded-full border border-zinc-200 object-cover"
        />
        <div className="min-w-0 flex-1">
          <DiscussionComposer
            onSubmit={postId ? submitComment : undefined}
          />
        </div>
      </div>
    </section>
  );
}

function CommentCard({
  comment,
  canManage,
  isEditing,
  isDeleting,
  onEdit,
  onCancelEdit,
  onSubmitEdit,
  onDelete,
}: {
  comment: Comment;
  canManage: boolean;
  isEditing: boolean;
  isDeleting: boolean;
  onEdit: () => void;
  onCancelEdit: () => void;
  onSubmitEdit: (content: string) => Promise<
    | {
        ok: true;
      }
    | {
        ok: false;
        message: string;
      }
  >;
  onDelete: () => void;
}) {
  const authorAvatarSrc = comment.authorProfileImageUrl || assets.defaultAvatar;

  return (
    <div className="flex items-start gap-4">
      <Image
        src={authorAvatarSrc}
        alt={`${comment.authorName} avatar`}
        width={40}
        height={40}
        className="mt-1 size-10 rounded-full border border-zinc-200 object-cover"
      />
      <section className="min-w-0 flex-1 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200 bg-zinc-50/80 px-4 py-3 text-sm text-zinc-500">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-zinc-950">
              {comment.authorName}
            </span>
            <span>
              commented on {formatCommentedAtLabel(comment.createdAt)}.
            </span>
          </div>
          {canManage ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onEdit}
                disabled={isEditing || isDeleting}
                aria-label="Edit your comment"
                className="text-xs font-semibold text-zinc-500 transition hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20 disabled:cursor-not-allowed disabled:text-zinc-300"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={onDelete}
                disabled={isDeleting}
                aria-label="Delete your comment"
                className="text-xs font-semibold text-rose-500 transition hover:text-rose-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-600/20 disabled:cursor-not-allowed disabled:text-rose-300"
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          ) : null}
        </div>
        {isEditing ? (
          <div className="p-4">
            <DiscussionComposer
              key={comment.id}
              initialValue={comment.content}
              submitLabel="Save"
              pendingLabel="Saving..."
              errorFallback="댓글을 수정하는 중 문제가 발생했습니다."
              onCancel={onCancelEdit}
              onSubmit={onSubmitEdit}
            />
          </div>
        ) : (
          <div className="px-4 py-5">
            <MarkdownContent markdown={comment.content} variant="compact" />
          </div>
        )}
      </section>
    </div>
  );
}

function formatCommentedAtLabel(createdAt: string) {
  const parsed = new Date(createdAt);
  if (Number.isNaN(parsed.getTime())) {
    return createdAt || "recently";
  }

  return COMMENT_DATE_FORMATTER.format(parsed);
}

function IconMessageSquare({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M21 15a4 4 0 01-4 4H8l-5 3V7a4 4 0 014-4h10a4 4 0 014 4v8z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
