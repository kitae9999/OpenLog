import Image from "next/image";
import Link from "next/link";
import { cn } from "@/shared/lib/cn";
import type { FeedPost } from "@/entities/workspace/model/data";
import { OfficialBadge } from "@/shared/ui/OfficialBadge";

export function FeedArticleCard({ post }: { post: FeedPost }) {
  const thumbnailSrc = post.thumbnailSrc;

  return (
    <article className="border-t border-zinc-200/80 first:border-t-0">
      <div className="rounded-lg px-2.5 py-4 transition hover:bg-zinc-50">
        <Link
          href={post.href}
          className="group block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20"
        >
          <div className="flex items-center gap-2 text-[12.5px] text-zinc-500">
            <Image
              src={post.profileImageSrc}
              alt=""
              width={22}
              height={22}
              className="size-[22px] rounded-full border border-zinc-200 object-cover"
            />
            <span className="inline-flex min-w-0 items-center gap-1">
              <span className="truncate font-medium text-zinc-700">
                {post.nickname}
              </span>
              {post.authorIsOpenLogOfficial ? (
                <OfficialBadge size="sm" />
              ) : null}
            </span>
          </div>

          <div
            className={cn(
              "mt-2.5 grid gap-4",
              thumbnailSrc
                ? "sm:grid-cols-[minmax(0,1fr)_140px] sm:items-start"
                : "",
            )}
          >
            <div className="min-w-0">
              <h2 className="max-w-[680px] text-[18px] font-semibold leading-snug tracking-tight text-zinc-950 transition-colors group-hover:text-zinc-700 sm:text-[20px]">
                {post.title}
              </h2>
              <p className="mt-1.5 line-clamp-2 max-w-[650px] text-[13.5px] leading-6 text-zinc-500">
                {post.description}
              </p>
            </div>

            {thumbnailSrc ? (
              <div className="relative hidden h-[84px] w-full overflow-hidden rounded-md border border-zinc-200 bg-zinc-100 sm:block">
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

        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] tabular-nums text-zinc-400">
          <span>{post.dateLabel}</span>
          <span className="inline-flex items-center gap-1">
            <IconComment className="size-3.5" />
            {post.commentCount}
          </span>
          <span className="inline-flex items-center gap-1">
            <IconHeart className="size-3.5" />
            {post.likeCount}
          </span>
        </div>
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
