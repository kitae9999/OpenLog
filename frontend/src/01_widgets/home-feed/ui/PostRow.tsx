import Image from "next/image";
import Link from "next/link";
import { assets } from "@/shared/config/assets";

export function PostRow() {
  return (
    <article className="border-b border-zinc-200/70 pb-8">
      <div className="flex flex-col gap-6 md:flex-row md:items-start">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-3 text-sm text-zinc-500">
            <Image
              src={assets.avatarA}
              alt="Kent C. Dodds avatar"
              width={28}
              height={28}
              className="size-7 rounded-full border border-zinc-200 object-cover"
            />
            <span className="font-medium text-zinc-950">Kent C. Dodds</span>
            <span className="text-zinc-300">·</span>
            <span>2026. 2. 25.</span>
          </div>

          <h3 className="mt-3 text-[20px] font-semibold leading-snug tracking-tight text-zinc-950 sm:text-[22px]">
            The Future of CSS: Tailwind v4
          </h3>
          <p className="mt-2 text-[15px] leading-7 text-zinc-600">
            Exploring the new engine and features coming in Tailwind CSS v4.
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-600">
              CSS
            </span>
            <span className="ml-2 text-xs text-zinc-400">5 min read</span>
          </div>

          <div className="mt-5 flex items-center justify-between gap-6">
            <div className="flex items-center gap-5 text-sm text-zinc-500">
              <span className="inline-flex items-center gap-2">
                <Image
                  src="/ThumbsUp.svg"
                  alt=""
                  width={16}
                  height={16}
                  aria-hidden="true"
                  className="size-4"
                />
                890
              </span>
            </div>

            <Link
              href="/posts/tailwind-v4"
              className="inline-flex items-center gap-2 text-sm font-medium text-zinc-500 transition-colors hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20"
            >
              Read more <IconArrowRight className="size-4" />
            </Link>
          </div>
        </div>

        <div className="relative h-[132px] w-full shrink-0 overflow-hidden rounded-2xl border border-zinc-200/70 bg-zinc-50 md:w-[260px]">
          <Image
            src={assets.postCover}
            alt="Post cover"
            fill
            sizes="(min-width: 768px) 260px, 100vw"
            className="object-cover"
          />
        </div>
      </div>
    </article>
  );
}

function IconArrowRight({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M5 12h14"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M13 6l6 6-6 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
