"use client";

import Image from "next/image";
import { handleOAuth } from "@/features/auth/api/handleOAuth";

const buttonClassName =
  "flex h-12 w-full max-w-[382px] items-center justify-center gap-3 rounded-[14px] text-[16px] font-medium tracking-[-0.02em] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20";

export function WorkspaceGuestPrompt() {
  return (
    <div className="flex flex-col items-center px-4 py-16 text-center sm:py-20">
      <div className="grid size-12 place-items-center rounded-[14px] bg-black text-[24px] font-bold leading-none text-white [font-family:Georgia,serif]">
        O
      </div>

      <h2 className="mt-6 max-w-[480px] text-[24px] font-bold leading-[1.2] tracking-tight text-zinc-950 sm:text-[30px] [font-family:Georgia,serif]">
        Your writing workspace
      </h2>

      <p className="mt-3 max-w-[420px] text-[16px] leading-7 text-zinc-600">
        Sign in to see drafts from AI sessions, open review suggestions, and
        freshness alerts on your posts.
      </p>

      <div className="mt-8 flex w-full flex-col items-center gap-3">
        <button
          type="button"
          onClick={() => handleOAuth("GOOGLE")}
          className={`${buttonClassName} border border-[#e5e7eb] bg-white text-[#364153] hover:bg-zinc-50`}
        >
          <Image
            src="/google.svg"
            alt=""
            width={20}
            height={20}
            aria-hidden="true"
            className="size-5"
          />
          Continue with Google
        </button>

        <button
          type="button"
          onClick={() => handleOAuth("GITHUB")}
          className={`${buttonClassName} bg-[#24292f] text-white hover:bg-[#1b2027]`}
        >
          <IconGitHub className="size-5" />
          Continue with GitHub
        </button>
      </div>
    </div>
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
