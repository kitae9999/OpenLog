"use client";

import { handleOAuth } from "@/features/auth/api/handleOAuth";
import { LockIcon } from "@/shared/ui/icons";

export type PostSourceTeaserData = {
  locked: true;
};

export function PostSourceTeaser() {
  function handleOpenSource() {
    const returnTo = `${window.location.pathname}${window.location.search}`;
    handleOAuth("GITHUB", returnTo);
  }

  return (
    <section className="mt-10 overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-50/80">
      <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white text-zinc-950 shadow-sm ring-1 ring-zinc-200">
            <IconSource className="size-[18px]" />
          </span>
          <div className="min-w-0">
            <p className="text-[15px] font-semibold leading-6 text-zinc-950">
              이 글 뒤의 작업 기록과 결정 과정은 Workspace에서 이어집니다
            </p>
            <p className="mt-1 text-[13px] leading-5 text-zinc-500">
              커밋, 코딩 세션, TODO를 비공개로 모아두고 필요할 때 공개 글로 바꿀
              수 있어요.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleOpenSource}
          className="inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-xl bg-zinc-950 px-4 text-[13px] font-semibold text-white transition hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20"
        >
          <LockIcon className="size-4" />
          작업 과정 보기
        </button>
      </div>
    </section>
  );
}

function IconSource({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M7 8.5h10M7 12h7M7 15.5h5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.8"
      />
      <rect
        x="4"
        y="3.5"
        width="16"
        height="17"
        rx="2.5"
        stroke="currentColor"
        strokeWidth="1.8"
      />
    </svg>
  );
}
