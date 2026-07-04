import Image from "next/image";
import Link from "next/link";
import { cn } from "@/shared/lib/cn";
import type { FeedPost } from "./data";

export function FeedArticleCard({ post }: { post: FeedPost }) {
  const thumbnailSrc = post.thumbnailSrc;

  return (
    <article className="px-5 py-[22px]">
      <Link
        href={post.href}
        className="group block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20"
      >
        <div className="flex items-center gap-2 text-[13px] text-zinc-600">
          <Image
            src={post.profileImageSrc}
            alt=""
            width={24}
            height={24}
            className="size-6 rounded-full border border-zinc-200 object-cover"
          />
          <span className="font-medium text-zinc-700">{post.nickname}</span>
        </div>

        <div
          className={cn(
            "grid gap-5",
            thumbnailSrc
              ? "sm:grid-cols-[minmax(0,1fr)_156px] sm:items-center"
              : "",
          )}
        >
          <div className="min-w-0">
            <h2 className="mt-[13px] max-w-[680px] text-[21px] font-bold leading-[1.2] tracking-[-0.015em] text-zinc-950 transition-colors group-hover:text-zinc-700 [font-family:Georgia,serif]">
              {post.title}
            </h2>

            <p className="mt-[9px] max-w-[650px] text-[14px] leading-[1.65] text-zinc-600">
              {post.description}
            </p>
          </div>

          {thumbnailSrc ? (
            <div className="relative hidden h-[96px] w-full overflow-hidden rounded-md border border-zinc-200 bg-zinc-100 sm:block">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={thumbnailSrc}
                alt=""
                loading="lazy"
                className="size-full object-cover transition duration-300 group-hover:scale-[1.03]"
              />
            </div>
          ) : null}
        </div>
      </Link>

      <div className="mt-4 flex flex-wrap items-center gap-[13px] text-[13px] tabular-nums text-zinc-500">
        <span>{post.dateLabel}</span>
        <span className="inline-flex items-center gap-1.5">
          <IconComment className="size-[15px]" />
          {post.commentCount}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <IconHeart className="size-[15px]" />
          {post.likeCount}
        </span>
      </div>
    </article>
  );
}

function IconHeart({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M20.3 5.7a5.1 5.1 0 0 0-7.2 0L12 6.8l-1.1-1.1a5.1 5.1 0 1 0-7.2 7.2L12 21l8.3-8.1a5.1 5.1 0 0 0 0-7.2Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function IconComment({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M6.5 18.5 3 21V5.5A2.5 2.5 0 0 1 5.5 3h13A2.5 2.5 0 0 1 21 5.5V16a2.5 2.5 0 0 1-2.5 2.5h-12Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
    </svg>
  );
}
