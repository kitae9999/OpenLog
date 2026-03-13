import Image from "next/image";
import { assets } from "@/shared/config/assets";

export function FeaturedPostCard() {
  return (
    <article className="overflow-hidden rounded-2xl border border-zinc-200/70 bg-white shadow-sm">
      <div className="relative aspect-[16/9] w-full">
        <Image
          src={assets.featuredCover}
          alt="Featured cover"
          fill
          priority
          sizes="(min-width: 1024px) 663px, 100vw"
          className="object-cover"
        />
        <div className="absolute bottom-4 left-4 rounded-full bg-zinc-950/80 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-white backdrop-blur">
          Featured
        </div>
      </div>

      <div className="p-6">
        <div className="flex items-center gap-3 text-sm text-zinc-500">
          <Image
            src={assets.avatarB}
            alt="Sarah Drasner avatar"
            width={28}
            height={28}
            className="size-7 rounded-full border border-zinc-200 object-cover"
          />
          <span className="font-medium text-zinc-950">Sarah Drasner</span>
          <span className="text-zinc-300">·</span>
          <span>2026. 2. 28.</span>
          <span className="text-zinc-300">·</span>
          <span>8 min read</span>
        </div>

        <h2 className="mt-4 text-[22px] font-semibold leading-snug tracking-tight text-zinc-950 sm:text-[26px]">
          Understanding React Server Components
        </h2>
        <p className="mt-2 max-w-prose text-[15px] leading-7 text-zinc-600">
          A deep dive into the architecture of RSC and how it changes the way we
          build React applications.
        </p>

        <div className="mt-6 flex items-center justify-between gap-6">
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
              1240
            </span>
            <span className="inline-flex items-center gap-2">
              <Image
                src="/Eye.svg"
                alt=""
                width={16}
                height={16}
                aria-hidden="true"
                className="size-4"
              />
              8500
            </span>
          </div>

          <div className="flex items-center -space-x-2">
            <Image
              src={assets.avatarA}
              alt="Reader avatar"
              width={24}
              height={24}
              className="size-6 rounded-full border-2 border-white object-cover"
            />
            <Image
              src={assets.avatarB}
              alt="Reader avatar"
              width={24}
              height={24}
              className="size-6 rounded-full border-2 border-white object-cover"
            />
          </div>
        </div>
      </div>
    </article>
  );
}
