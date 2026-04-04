import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import type { Contributor, Post } from "@/entities/post/model";
import { PostTabs } from "./PostTabs";

export function PostArticle({
  post,
  contributors,
  backHref = "/",
  children,
  authorHref,
  articleHref = "#",
  suggestsHref = "/contribute",
  suggestEditsHref = "/contribute",
  suggestCount = 0,
  showSuggestsTab = true,
}: {
  post: Post;
  contributors?: Contributor[];
  backHref?: string;
  children?: ReactNode;
  authorHref?: string;
  articleHref?: string;
  suggestsHref?: string;
  suggestEditsHref?: string;
  suggestCount?: number;
  showSuggestsTab?: boolean;
}) {
  const list = contributors ?? [];

  return (
    <div className="mx-auto w-full max-w-[950px] pb-12">
      <div className="flex items-start gap-15">
        <aside
          className="sticky top-16 hidden w-[60px] shrink-0 lg:block"
          aria-label="Post actions"
        >
          <div className="flex h-[calc(100dvh-4rem)] items-center">
            <PostActionRail
              likes={post.likes}
              comments={post.comments}
              suggestEditsHref={suggestEditsHref}
            />
          </div>
        </aside>

        <article className="w-full max-w-[768px]">
          <Link
            href={backHref}
            className="inline-flex items-center gap-2 text-sm text-zinc-500 transition hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20"
          >
            <IconArrowLeft className="size-4" />
            Back to feed
          </Link>

          <PostTabs
            activeTab="article"
            articleHref={articleHref}
            suggestsHref={suggestsHref}
            suggestCount={suggestCount}
            showSuggestsTab={showSuggestsTab}
          />

          <header className="mt-8 space-y-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                {authorHref ? (
                  <Link
                    href={authorHref}
                    aria-label={`Open ${post.authorName} profile`}
                    className="relative rounded-full transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20"
                  >
                    <Image
                      src={post.authorAvatarSrc}
                      alt={`${post.authorName} avatar`}
                      width={48}
                      height={48}
                      className="size-12 rounded-full border border-zinc-100 object-cover shadow-[0_1px_3px_rgba(0,0,0,0.1),0_1px_2px_rgba(0,0,0,0.1)]"
                    />
                  </Link>
                ) : (
                  <div className="relative">
                    <Image
                      src={post.authorAvatarSrc}
                      alt={`${post.authorName} avatar`}
                      width={48}
                      height={48}
                      className="size-12 rounded-full border border-zinc-100 object-cover shadow-[0_1px_3px_rgba(0,0,0,0.1),0_1px_2px_rgba(0,0,0,0.1)]"
                    />
                  </div>
                )}

                <div className="min-w-0">
                  {authorHref ? (
                    <Link
                      href={authorHref}
                      className="truncate text-[16px] font-semibold tracking-tight text-zinc-950 transition hover:text-zinc-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20"
                    >
                      {post.authorName}
                    </Link>
                  ) : (
                    <p className="truncate text-[16px] font-semibold tracking-tight text-zinc-950">
                      {post.authorName}
                    </p>
                  )}
                  <p className="mt-0.5 flex items-center gap-2 text-sm text-zinc-500">
                    <span>{post.publishedAtLabel}</span>
                    <span className="text-zinc-300">·</span>
                    <span>{post.readTimeLabel}</span>
                  </p>
                </div>
              </div>

              <button
                type="button"
                aria-label="Share"
                className="grid size-9 place-items-center rounded-full text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20"
              >
                <IconShare className="size-5" />
              </button>
            </div>

            <h1 className="font-serif text-[42px] font-semibold leading-[1.1] tracking-tight text-zinc-950">
              {post.title}
            </h1>

            {post.description ? (
              <p className="max-w-[60ch] text-[18px] leading-8 text-zinc-600">
                {post.description}
              </p>
            ) : null}

            {post.tags.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {post.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-[11px] font-medium uppercase tracking-wide text-zinc-600"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            ) : null}
          </header>

          <div className="mt-7 overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-50 shadow-sm">
            <div className="relative aspect-[16/9] w-full">
              <Image
                src={post.coverSrc}
                alt="Post cover"
                fill
                priority
                sizes="(min-width: 1024px) 768px, 100vw"
                className="object-cover"
              />
            </div>
          </div>

          {children}

          <div className="mt-10 flex justify-center lg:hidden">
            <MobileActionBar
              likes={post.likes}
              comments={post.comments}
              suggestEditsHref={suggestEditsHref}
            />
          </div>

          {list.length > 0 ? (
            <section className="mt-12 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-semibold text-zinc-950">
                  <Image
                    src="/Users.svg"
                    alt=""
                    width={16}
                    height={16}
                    aria-hidden="true"
                    className="size-4"
                  />
                  Contributors
                </div>
                <span className="rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-[11px] font-medium text-zinc-500">
                  {list.length} people
                </span>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {list.slice(0, 2).map((c) => (
                  <ContributorCard key={c.name} contributor={c} />
                ))}
              </div>

              <div className="mt-4 text-center">
                <Link
                  href="/contribute/history"
                  className="text-xs font-medium text-zinc-500 transition hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20"
                >
                  View contribution history
                </Link>
              </div>
            </section>
          ) : null}
        </article>
      </div>
    </div>
  );
}

function PostActionRail({
  likes,
  comments,
  suggestEditsHref,
}: {
  likes: number;
  comments: number;
  suggestEditsHref: string;
}) {
  return (
    <nav className="flex flex-col items-center gap-3 rounded-2xl border border-zinc-200 bg-white/80 px-2 py-3 shadow-sm backdrop-blur">
      <button
        type="button"
        aria-label={`Like (${likes})`}
        className="group flex w-full flex-col items-center gap-1 rounded-xl px-1 py-2 text-zinc-500 transition hover:bg-zinc-50 hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20"
      >
        <IconHeart className="size-5 transition-transform group-hover:scale-[1.03]" />
        <span className="text-[12px] font-medium leading-none">{likes}</span>
      </button>

      <div className="h-px w-7 bg-zinc-200" aria-hidden="true" />

      <button
        type="button"
        aria-label={`Comments (${comments})`}
        className="group flex w-full flex-col items-center gap-1 rounded-xl px-1 py-2 text-zinc-500 transition hover:bg-zinc-50 hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20"
      >
        <IconMessageSquare className="size-5 transition-transform group-hover:scale-[1.03]" />
        <span className="text-[12px] font-medium leading-none">{comments}</span>
      </button>

      <div className="h-px w-7 bg-zinc-200" aria-hidden="true" />

      <Link
        href={suggestEditsHref}
        aria-label="Suggests"
        className="group flex w-full flex-col items-center gap-1 rounded-xl bg-black px-1 py-2 text-white transition hover:bg-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/30"
      >
        <IconEdit className="size-5 transition-transform group-hover:scale-[1.03]" />
        <span className="text-[10px] font-semibold leading-none">Suggests</span>
      </Link>
    </nav>
  );
}

function MobileActionBar({
  likes,
  comments,
  suggestEditsHref,
}: {
  likes: number;
  comments: number;
  suggestEditsHref: string;
}) {
  return (
    <div className="flex h-[62px] w-full max-w-[450px] items-center justify-between rounded-2xl border border-zinc-200 bg-white/80 px-6 shadow-[0_20px_25px_rgba(0,0,0,0.1),0_8px_10px_rgba(0,0,0,0.1)] backdrop-blur">
      <div className="flex items-center gap-6">
        <button
          type="button"
          className="inline-flex items-center gap-2 text-[16px] font-medium text-zinc-500 transition hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20"
        >
          <IconHeart className="size-6" />
          <span>{likes}</span>
        </button>

        <button
          type="button"
          className="inline-flex items-center gap-2 text-[16px] font-medium text-zinc-500 transition hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20"
        >
          <IconMessageSquare className="size-6" />
          <span>{comments}</span>
        </button>
      </div>

      <span className="h-6 w-px bg-zinc-300" aria-hidden="true" />

      <Link
        href={suggestEditsHref}
        className="inline-flex h-9 items-center gap-2 rounded-full bg-black pl-5 pr-4 text-sm font-medium text-white transition hover:bg-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/30"
      >
        <IconEdit className="size-4" />
        Suggests
      </Link>
    </div>
  );
}

function ContributorCard({ contributor }: { contributor: Contributor }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-white p-4">
      <div className="relative shrink-0">
        <Image
          src={contributor.avatarSrc}
          alt={`${contributor.name} avatar`}
          width={40}
          height={40}
          className="size-10 rounded-full border border-zinc-200 object-cover"
        />
        <span className="absolute -bottom-0.5 -right-0.5 grid size-4 place-items-center rounded-full border-2 border-white bg-emerald-500">
          <span className="text-[10px] font-bold leading-none text-white">
            ✓
          </span>
        </span>
      </div>

      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-zinc-950">
          {contributor.name}
        </p>
        <p className="truncate text-xs text-zinc-500">{contributor.role}</p>
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

function IconShare({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M18 8a3 3 0 10-2.83-4H15a3 3 0 103 4z"
        fill="currentColor"
        opacity="0"
      />
      <path
        d="M4 12v7a2 2 0 002 2h12a2 2 0 002-2v-7"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M16 6l-4-4-4 4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12 2v13"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
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
        d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 000-7.78z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
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

function IconEdit({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M12 20h9"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
