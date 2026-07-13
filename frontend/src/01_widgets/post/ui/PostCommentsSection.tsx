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
  const [deletingCommentId, setDeletingCommentId] = useState<number | null>(
    null,
  );
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
    <section id={COMMENTS_SECTION_ID} className="mt-20 scroll-mt-24 sm:mt-28">
      <div
        className="mx-auto mb-12 h-px w-56 bg-zinc-200 sm:mb-14 sm:w-72"
        aria-hidden="true"
      />
      <div className="flex items-baseline gap-2">
        <h2 className="text-[20px] font-semibold tracking-tight text-zinc-950">
          Comments
        </h2>
        <span className="text-sm text-zinc-400">{displayCommentCount}</span>
      </div>

      {commentItems.length > 0 ? (
        <div className="mt-8 space-y-8">
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
        <p className="mt-6 text-sm leading-6 text-zinc-500">
          Existing comment entries are not wired into this detail view yet.
        </p>
      ) : null}

      {actionError ? (
        <p className="mt-4 text-sm font-medium text-rose-700">{actionError}</p>
      ) : null}

      <div className="mt-8 flex items-start gap-4">
        <Image
          src={resolvedAvatarSrc}
          alt="Current user avatar"
          width={40}
          height={40}
          className="mt-1 size-10 rounded-full border border-zinc-200 object-cover"
        />
        <div className="min-w-0 flex-1">
          <DiscussionComposer onSubmit={postId ? submitComment : undefined} />
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
        className="mt-0.5 size-10 rounded-full border border-zinc-200 object-cover"
      />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 text-sm">
            <span className="font-semibold text-zinc-950">
              {comment.authorName}
            </span>
            <span className="text-zinc-400">
              {formatCommentedAtLabel(comment.createdAt)}
            </span>
          </div>
          {canManage ? (
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onEdit}
                disabled={isEditing || isDeleting}
                aria-label="Edit your comment"
                className="cursor-pointer text-[13px] font-medium text-zinc-500 transition hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20 disabled:cursor-not-allowed disabled:text-zinc-300"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={onDelete}
                disabled={isDeleting}
                aria-label="Delete your comment"
                className="cursor-pointer text-[13px] font-medium text-rose-600 transition hover:text-rose-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-600/20 disabled:cursor-not-allowed disabled:text-rose-300"
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          ) : null}
        </div>
        {isEditing ? (
          <div className="mt-3">
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
          <div className="mt-2">
            <MarkdownContent markdown={comment.content} variant="compact" />
          </div>
        )}
      </div>
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
