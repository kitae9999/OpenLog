"use client";

import Image from "next/image";
import { handleOAuth } from "@/features/auth/api/handleOAuth";

const buttonClassName =
  "inline-flex h-9 items-center justify-center gap-2 rounded-xl px-4 text-[13.5px] font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20";

export function WorkspaceGuestPrompt() {
  return (
    <section className="rounded-2xl border border-zinc-200/70 bg-white px-5 py-6 sm:px-7">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <div className="grid size-9 place-items-center rounded-lg bg-black text-[19px] font-bold leading-none text-white [font-family:Georgia,serif]">
              O
            </div>
            <span className="text-[20px] font-bold tracking-[-0.01em] text-zinc-950 [font-family:Georgia,serif]">
              OpenLog
            </span>
          </div>

          <h2 className="mt-5 max-w-[560px] text-[22px] font-bold leading-tight tracking-[-0.01em] text-zinc-950 [font-family:Georgia,serif]">
            작업하던 흐름이 그대로 글이 됩니다
          </h2>
          <p className="mt-2 max-w-[620px] text-[13.5px] leading-6 text-zinc-500">
            OpenLog는 git과 코딩 세션에서 작업 로그를 모으고, 필요할 때
            PR 문서와 공개 글로 바꿔주는 개발 워크플로우 로그입니다.
          </p>
          <div className="mt-3 inline-flex max-w-full items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-1 font-mono text-[11.5px] text-zinc-500">
            <span className="text-zinc-400">$</span>
            <span className="truncate">npx @kitae9999/openlog-cli login</span>
          </div>
        </div>

        <div className="flex shrink-0 flex-col gap-2 sm:flex-row lg:flex-col xl:flex-row">
          <button
            type="button"
            onClick={() => handleOAuth("GITHUB")}
            className={`${buttonClassName} bg-zinc-950 text-white hover:bg-zinc-800`}
          >
            <IconGitHub className="size-4" />
            Get started
          </button>

          <button
            type="button"
            onClick={() => handleOAuth("GOOGLE")}
            className={`${buttonClassName} border border-zinc-200 bg-white text-zinc-950 hover:bg-zinc-50`}
          >
            <Image
              src="/google.svg"
              alt=""
              width={16}
              height={16}
              aria-hidden="true"
              className="size-4"
            />
            Sign in
          </button>
        </div>
      </div>
    </section>
  );
}

function IconGitHub({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M12 .75a11.25 11.25 0 00-3.556 21.922c.563.103.769-.244.769-.544 0-.269-.01-.981-.015-1.926-3.127.68-3.787-1.506-3.787-1.506-.512-1.303-1.25-1.65-1.25-1.65-1.022-.698.078-.684.078-.684 1.13.08 1.725 1.16 1.725 1.16 1.004 1.72 2.634 1.223 3.276.935.102-.727.393-1.223.715-1.504-2.496-.284-5.122-1.248-5.122-5.555 0-1.227.438-2.23 1.157-3.016-.116-.284-.501-1.43.109-2.98 0 0 .943-.302 3.09 1.152A10.76 10.76 0 0112 6.188c.952.004 1.91.129 2.805.378 2.146-1.454 3.087-1.152 3.087-1.152.612 1.55.227 2.696.112 2.98.72.786 1.155 1.79 1.155 3.016 0 4.318-2.631 5.268-5.136 5.546.404.348.764 1.035.764 2.087 0 1.507-.013 2.723-.013 3.094 0 .302.203.652.775.542A11.251 11.251 0 0012 .75z" />
    </svg>
  );
}
