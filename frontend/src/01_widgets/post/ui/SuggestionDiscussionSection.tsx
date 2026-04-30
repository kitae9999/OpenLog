"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { ApiDiscussion } from "@/entities/post/api/getPostSuggestionDetail";
import type { DiscussionComment } from "@/entities/post/model";
import { submitSuggestionDiscussion } from "@/features/discussion/api/discussionActions";
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
                  <span>commented on {comment.commentedAtLabel}</span>
                </div>
                <div className="px-4 py-5">
                  <MarkdownContent markdown={comment.message} variant="compact" />
                </div>
              </section>
            </div>
          ))}
        </div>
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
