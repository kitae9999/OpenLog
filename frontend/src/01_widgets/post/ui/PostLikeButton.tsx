"use client";

import { useState, useTransition } from "react";
import { togglePostLike } from "@/features/post-like/api/postLikeActions";

type PostLikeButtonVariant = "rail" | "mobile";

export function PostLikeButton({
  postId,
  initialLikes,
  initialLiked = false,
  variant,
}: {
  postId?: number;
  initialLikes: number;
  initialLiked?: boolean;
  variant: PostLikeButtonVariant;
}) {
  const [likeState, setLikeState] = useState({
    likes: initialLikes,
    liked: initialLiked,
  });
  const [actionError, setActionError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const isDisabled = !postId || isPending;

  function handleClick() {
    if (!postId || isPending) {
      return;
    }

    setActionError(null);

    startTransition(async () => {
      try {
        const result = await togglePostLike(postId);
        if (!result.ok) {
          setActionError(result.message);
          return;
        }

        setLikeState((current) => {
          if (current.liked === result.liked) {
            return current;
          }

          return {
            liked: result.liked,
            likes: Math.max(0, current.likes + (result.liked ? 1 : -1)),
          };
        });
      } catch {
        setActionError("좋아요를 처리하는 중 문제가 발생했습니다.");
      }
    });
  }

  if (variant === "mobile") {
    return (
      <button
        type="button"
        aria-label={`Like (${likeState.likes})`}
        aria-pressed={likeState.liked}
        disabled={isDisabled}
        onClick={handleClick}
        className={[
          "inline-flex items-center gap-2 text-[16px] font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20 disabled:cursor-not-allowed disabled:opacity-60",
          likeState.liked
            ? "text-rose-600"
            : "text-zinc-500 hover:text-zinc-950",
        ].join(" ")}
      >
        <IconHeart className="size-6" filled={likeState.liked} />
        <span>{likeState.likes}</span>
        {actionError ? <span className="sr-only">{actionError}</span> : null}
      </button>
    );
  }

  return (
    <button
      type="button"
      aria-label={`Like (${likeState.likes})`}
      aria-pressed={likeState.liked}
      disabled={isDisabled}
      onClick={handleClick}
      className={[
        "group flex w-full flex-col items-center gap-1 rounded-xl px-1 py-2 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20 disabled:cursor-not-allowed disabled:opacity-60",
        likeState.liked
          ? "text-rose-600 hover:bg-rose-50"
          : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-950",
      ].join(" ")}
    >
      <IconHeart
        className="size-5 transition-transform group-hover:scale-[1.03]"
        filled={likeState.liked}
      />
      <span className="text-[12px] font-medium leading-none">
        {likeState.likes}
      </span>
      {actionError ? <span className="sr-only">{actionError}</span> : null}
    </button>
  );
}

function IconHeart({
  className,
  filled,
}: {
  className?: string;
  filled: boolean;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 000-7.78z"
        fill={filled ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
