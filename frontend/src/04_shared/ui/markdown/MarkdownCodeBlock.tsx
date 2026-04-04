"use client";

import { useEffect, useState } from "react";
import { cn } from "@/shared/lib/cn";

type CopyState = "idle" | "copied" | "error";

export function MarkdownCodeBlock({
  code,
  highlightedHtml,
  languageLabel,
  variant,
}: {
  code: string;
  highlightedHtml: string;
  languageLabel: string;
  variant: "default" | "compact";
}) {
  const [copyState, setCopyState] = useState<CopyState>("idle");

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
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(code);
      } else {
        copyWithSelectionFallback(code);
      }

      setCopyState("copied");
    } catch {
      setCopyState("error");
    }
  }

  const isCopied = copyState === "copied";

  return (
    <div className="markdown-code overflow-hidden rounded-xl border border-zinc-200 bg-[linear-gradient(180deg,#fdfdfc_0%,#fafaf8_100%)] text-zinc-900 shadow-[0_20px_50px_rgba(113,113,122,0.14)]">
      <div className="flex items-center justify-between gap-2 border-b border-zinc-200/90 bg-[rgba(244,244,245,0.75)] px-4 py-1.5 backdrop-blur-sm">
        <span className="truncate text-[10px] uppercase tracking-[0.18em] text-zinc-500">
          {languageLabel}
        </span>
        <button
          type="button"
          onClick={handleCopy}
          className={cn(
            "inline-flex size-7 shrink-0 items-center justify-center rounded-md border transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/40",
            isCopied
              ? "border-emerald-300 bg-emerald-50 text-emerald-700"
              : copyState === "error"
                ? "border-rose-300 bg-rose-50 text-rose-700 hover:border-rose-400 hover:bg-rose-100"
                : "border-zinc-200 bg-white/90 text-zinc-500 hover:border-sky-300 hover:bg-sky-50 hover:text-sky-700",
          )}
          aria-label={getCopyAriaLabel(copyState, languageLabel)}
          title={getCopyTooltip(copyState)}
        >
          <CopyIcon copied={isCopied} />
        </button>
      </div>
      <pre
        className={cn(
          "overflow-x-auto p-4 font-mono",
          variant === "default" ? "text-[13px] leading-6" : "text-xs leading-5",
        )}
      >
        <code
          className="hljs block bg-transparent p-0"
          dangerouslySetInnerHTML={{ __html: highlightedHtml }}
        />
      </pre>
    </div>
  );
}

function getCopyLabel(copyState: CopyState) {
  switch (copyState) {
    case "copied":
      return "Copied";
    case "error":
      return "Retry";
    default:
      return "Copy";
  }
}

function getCopyAriaLabel(copyState: CopyState, languageLabel: string) {
  return `${languageLabel} code ${getCopyLabel(copyState).toLowerCase()}`;
}

function getCopyTooltip(copyState: CopyState) {
  return getCopyLabel(copyState);
}

function copyWithSelectionFallback(code: string) {
  const textarea = document.createElement("textarea");
  textarea.value = code;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "absolute";
  textarea.style.opacity = "0";
  textarea.style.pointerEvents = "none";
  document.body.appendChild(textarea);
  textarea.select();
  textarea.setSelectionRange(0, textarea.value.length);

  const didCopy = document.execCommand("copy");
  document.body.removeChild(textarea);

  if (!didCopy) {
    throw new Error("copy failed");
  }
}

function CopyIcon({ copied }: { copied: boolean }) {
  if (copied) {
    return (
      <svg
        aria-hidden="true"
        viewBox="0 0 16 16"
        className="size-3"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
      >
        <path
          d="M3.75 8.25 6.5 11l5.75-6.25"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 16 16"
      className="size-3"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
    >
      <rect x="5.25" y="2.75" width="7" height="9" rx="1.5" />
      <path
        d="M3.75 5.25V12a1.5 1.5 0 0 0 1.5 1.5H10.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
