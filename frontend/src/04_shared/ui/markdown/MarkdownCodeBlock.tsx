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
  variant: "default" | "compact" | "dense";
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
  const shortLabel = shortenLanguageLabel(languageLabel);

  return (
    <div className="markdown-code group relative overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50 text-zinc-900">
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-center justify-between gap-2 px-3 pt-2.5">
        <span className="truncate font-mono text-[10px] font-medium lowercase leading-none tracking-normal text-zinc-400">
          {shortLabel}
        </span>
        <button
          type="button"
          onClick={handleCopy}
          className={cn(
            "pointer-events-auto inline-flex h-7 cursor-pointer items-center gap-1.5 rounded-md px-2 text-[11px] font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20",
            isCopied
              ? "text-zinc-700"
              : copyState === "error"
                ? "text-rose-600"
                : "text-zinc-400 opacity-70 hover:text-zinc-700 hover:opacity-100 group-hover:opacity-100",
          )}
          aria-label={getCopyAriaLabel(copyState, shortLabel)}
          title={getCopyTooltip(copyState)}
        >
          <CopyIcon copied={isCopied} />
          <span aria-live="polite">{getCopyLabel(copyState)}</span>
        </button>
      </div>

      <pre
        className={cn(
          "overflow-x-auto px-4 pb-3.5 pt-10 font-mono",
          variant === "default"
            ? "text-[12.5px] leading-[1.65]"
            : "text-xs leading-5",
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

function shortenLanguageLabel(label: string) {
  const normalized = label.trim().toLowerCase();
  if (!normalized || normalized === "text" || normalized === "plain") {
    return "text";
  }
  return normalized;
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
