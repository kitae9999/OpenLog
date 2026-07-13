"use client";

import { useEffect, useState } from "react";
import { cn } from "@/shared/lib/cn";

type PostShareButtonVariant = "rail" | "mobile";

export function PostShareButton({
  variant,
}: {
  variant: PostShareButtonVariant;
}) {
  const [copyState, setCopyState] = useState<"idle" | "copied" | "error">(
    "idle",
  );

  useEffect(() => {
    if (copyState === "idle") {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setCopyState("idle");
    }, 1800);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [copyState]);

  async function handleCopy() {
    const url =
      typeof window !== "undefined" ? window.location.href : "";

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
      } else {
        copyWithSelectionFallback(url);
      }
      setCopyState("copied");
    } catch {
      setCopyState("error");
    }
  }

  const isCopied = copyState === "copied";
  const label =
    copyState === "copied"
      ? "Copied!"
      : copyState === "error"
        ? "Failed"
        : "Share";

  if (variant === "mobile") {
    return (
      <button
        type="button"
        aria-label={label}
        onClick={handleCopy}
        className={cn(
          "inline-flex items-center gap-2 text-[16px] font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20",
          isCopied
            ? "text-emerald-600"
            : "text-zinc-500 hover:text-zinc-950",
        )}
      >
        <span
          className={cn(
            "inline-flex transition-transform duration-200",
            isCopied && "scale-110",
          )}
        >
          {isCopied ? (
            <IconCheck className="size-6" />
          ) : (
            <IconShare className="size-6" />
          )}
        </span>
        {isCopied ? (
          <span className="transition-opacity duration-200" aria-live="polite">
            Copied!
          </span>
        ) : null}
      </button>
    );
  }

  return (
    <button
      type="button"
      aria-label={label}
      onClick={handleCopy}
      className={cn(
        "group relative flex w-full flex-col items-center gap-1 rounded-xl px-1 py-2 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20",
        isCopied
          ? "text-emerald-600"
          : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-950",
      )}
    >
      <span
        className={cn(
          "inline-flex transition-transform duration-200 group-hover:scale-[1.03]",
          isCopied && "scale-110",
        )}
      >
        {isCopied ? (
          <IconCheck className="size-5" />
        ) : (
          <IconShare className="size-5" />
        )}
      </span>
      <span
        className="text-[11px] font-medium leading-none tabular-nums"
        aria-live="polite"
      >
        {isCopied ? "Copied!" : "Share"}
      </span>
    </button>
  );
}

function copyWithSelectionFallback(value: string) {
  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  document.body.removeChild(textarea);
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

function IconCheck({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M20 6L9 17l-5-5"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
