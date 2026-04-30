"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { ApiDiscussion } from "@/entities/post/api/getPostSuggestionDetail";
import type { DiscussionComment } from "@/entities/post/model";
import {
  deleteSuggestionDiscussion,
  submitSuggestionDiscussion,
  updateSuggestionDiscussion,
} from "@/features/discussion/api/discussionActions";
import { DiscussionComposer } from "@/features/discussion-composer/ui";
import { assets } from "@/shared/config/assets";
import { MarkdownContent } from "@/shared/ui/markdown";

const DISCUSSION_DATE_FORMATTER = new Intl.DateTimeFormat("ko-KR", {
  year: "numeric",
  month: "numeric",
  day: "numeric",
});

export function SuggestionDiscussionSection({
  postId,
  suggestionId,
  initialComments,
  currentUserAvatarSrc,
}: {
  postId: number;
  suggestionId: number;
  initialComments: DiscussionComment[];
  currentUserAvatarSrc?: string | null;
}) {
  const router = useRouter();
  const [discussionItems, setDiscussionItems] = useState(initialComments);
  const [editingDiscussionId, setEditingDiscussionId] = useState<string | null>(
    null,
  );
  const [deletingDiscussionId, setDeletingDiscussionId] = useState<string | null>(
    null,
  );
  const [actionError, setActionError] = useState<string | null>(null);
  const [, startDeleteTransition] = useTransition();
  const resolvedAvatarSrc = currentUserAvatarSrc ?? assets.defaultAvatar;

  async function submitDiscussion(content: string) {
    const result = await submitSuggestionDiscussion(postId, suggestionId, content);
    if (!result.ok) {
      return result;
    }

    const discussion = toDiscussionComment(result.discussion);
    setDiscussionItems((current) =>
      current.some((item) => item.id === discussion.id)
        ? current
        : [...current, discussion],
    );
    router.refresh();

    return { ok: true as const };
  }

  async function updateDiscussion(discussionId: string, content: string) {
    const parsedDiscussionId = Number(discussionId);
    if (!Number.isInteger(parsedDiscussionId)) {
      return {
        ok: false as const,
        message: "댓글 수정 기능을 사용할 수 없습니다.",
      };
    }

    const result = await updateSuggestionDiscussion(
      postId,
      suggestionId,
      parsedDiscussionId,
      content,
    );
    if (!result.ok) {
      return result;
    }

    const discussion = toDiscussionComment(result.discussion);
    setDiscussionItems((current) =>
      current.map((item) => (item.id === discussion.id ? discussion : item)),
    );
    setEditingDiscussionId(null);
    router.refresh();

    return { ok: true as const };
  }

  function deleteDiscussion(discussionId: string) {
    const parsedDiscussionId = Number(discussionId);
    if (!Number.isInteger(parsedDiscussionId) || deletingDiscussionId !== null) {
      return;
    }

    if (!window.confirm("댓글을 삭제할까요?")) {
      return;
    }

    setActionError(null);
    setDeletingDiscussionId(discussionId);

    startDeleteTransition(async () => {
      try {
        const result = await deleteSuggestionDiscussion(
          postId,
          suggestionId,
          parsedDiscussionId,
        );
        if (!result.ok) {
          setActionError(result.message);
          return;
        }

        setDiscussionItems((current) =>
          current.filter((item) => item.id !== discussionId),
        );
        setEditingDiscussionId((current) =>
          current === discussionId ? null : current,
        );
        router.refresh();
      } catch {
        setActionError("댓글을 삭제하는 중 문제가 발생했습니다.");
      } finally {
        setDeletingDiscussionId(null);
      }
    });
  }

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

      {discussionItems.length > 0 ? (
        <div className="mt-6 space-y-4">
          {discussionItems.map((comment) => (
            <DiscussionCard
              key={comment.id}
              comment={comment}
              canManage={comment.canManage}
              isEditing={editingDiscussionId === comment.id}
              isDeleting={deletingDiscussionId === comment.id}
              onEdit={() => {
                setActionError(null);
                setEditingDiscussionId(comment.id);
              }}
              onCancelEdit={() => setEditingDiscussionId(null)}
              onSubmitEdit={(content) => updateDiscussion(comment.id, content)}
              onDelete={() => deleteDiscussion(comment.id)}
            />
          ))}
        </div>
      ) : null}

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
          <DiscussionComposer onSubmit={submitDiscussion} />
        </div>
      </div>
    </section>
  );
}

function DiscussionCard({
  comment,
  canManage,
  isEditing,
  isDeleting,
  onEdit,
  onCancelEdit,
  onSubmitEdit,
  onDelete,
}: {
  comment: DiscussionComment;
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
  return (
    <div className="flex items-start gap-4">
      <Image
        src={comment.authorAvatarSrc}
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
            <span>commented on {comment.commentedAtLabel}</span>
          </div>
          {canManage ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onEdit}
                disabled={isEditing || isDeleting}
                aria-label="Edit your discussion"
                className="text-xs font-semibold text-zinc-500 transition hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20 disabled:cursor-not-allowed disabled:text-zinc-300"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={onDelete}
                disabled={isDeleting}
                aria-label="Delete your discussion"
                className="text-xs font-semibold text-zinc-500 transition hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-600/20 disabled:cursor-not-allowed disabled:text-rose-300"
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
              initialValue={comment.message}
              submitLabel="Save"
              pendingLabel="Saving..."
              errorFallback="댓글을 수정하는 중 문제가 발생했습니다."
              onCancel={onCancelEdit}
              onSubmit={onSubmitEdit}
            />
          </div>
        ) : (
          <div className="px-4 py-5">
            <MarkdownContent markdown={comment.message} variant="compact" />
          </div>
        )}
      </section>
    </div>
  );
}

function toDiscussionComment(discussion: ApiDiscussion): DiscussionComment {
  return {
    id: String(discussion.id),
    authorName: discussion.authorName,
    authorAvatarSrc: discussion.authorProfileImageUrl ?? assets.defaultAvatar,
    commentedAtLabel: formatDiscussionDateLabel(discussion.createdAt),
    message: discussion.content,
    canManage: discussion.canManage,
  };
}

function formatDiscussionDateLabel(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return DISCUSSION_DATE_FORMATTER.format(date).replace(/\.$/, "");
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
