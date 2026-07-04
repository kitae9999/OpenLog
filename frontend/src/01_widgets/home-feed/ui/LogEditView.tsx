"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, type ReactNode } from "react";
import { cn } from "@/shared/lib/cn";
import {
  formatSelection,
  getImageFallbackText,
  type ToolbarAction,
  type ToolbarActionPayload,
} from "@/shared/lib/markdown";
import { MarkdownContent, MarkdownToolbar } from "@/shared/ui/markdown";
import { getLogBody, getLogHref, getTabHref, type WorkspaceLogItem } from "./data";
import { saveLogOverride } from "./logOverrides";

export function LogEditView({ log }: { log: WorkspaceLogItem }) {
  const router = useRouter();
  const [title, setTitle] = useState(log.title);
  const [body, setBody] = useState(() => getLogBody(log));
  const [mode, setMode] = useState<"write" | "preview">("write");
  const editorRef = useRef<HTMLTextAreaElement>(null);

  const trimmedTitle = title.trim();
  const canSave = trimmedTitle.length > 0;

  function insertFormatting(
    action: ToolbarAction,
    payload?: ToolbarActionPayload,
  ) {
    const textarea = editorRef.current;
    if (!textarea) {
      return;
    }

    const selectionStart = textarea.selectionStart;
    const selectionEnd = textarea.selectionEnd;
    const selectedText = body.slice(selectionStart, selectionEnd);
    const { nextValue, nextSelectionStart, nextSelectionEnd } = formatSelection(
      action,
      body,
      selectedText,
      selectionStart,
      selectionEnd,
      { fallbackText: getImageFallbackText(payload) },
    );

    setBody(nextValue);

    window.requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(nextSelectionStart, nextSelectionEnd);
    });
  }

  function saveLog() {
    if (!canSave) {
      return;
    }

    saveLogOverride(log.id, {
      title: trimmedTitle,
      body,
    });
    router.push(getLogHref(log.id));
    router.refresh();
  }

  return (
    <div>
      <nav
        aria-label="Breadcrumb"
        className="mb-4 flex flex-wrap items-center gap-1.5 text-[13px] text-zinc-500"
      >
        <Link
          href={getTabHref("workspace", true)}
          className="font-semibold text-zinc-700 transition hover:text-zinc-950"
        >
          openlog
        </Link>
        <span className="text-zinc-300">/</span>
        <span>Logs</span>
        <span className="text-zinc-300">/</span>
        <Link
          href={getLogHref(log.id)}
          className="truncate font-mono text-[12px] text-zinc-700 transition hover:text-zinc-950"
        >
          {log.id}
        </Link>
        <span className="text-zinc-300">/</span>
        <span className="font-semibold text-zinc-950">Edit</span>
      </nav>

      <article className="overflow-hidden rounded-2xl border border-zinc-200/70 bg-white">
        <header className="border-b border-zinc-100 px-6 pb-5 pt-[22px]">
          <p className="text-[11.5px] font-semibold uppercase tracking-[0.1em] text-zinc-400">
            Edit log
          </p>
          <label className="mt-3 block">
            <span className="sr-only">Log title</span>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Log title"
              className="w-full border-0 bg-transparent p-0 font-[family-name:var(--font-georgia,Georgia,serif)] text-2xl font-bold tracking-[-0.01em] text-zinc-950 outline-none placeholder:text-zinc-300"
            />
          </label>
        </header>

        <div className="border-b border-zinc-100 bg-zinc-50/80 px-4">
          <div className="flex items-center gap-4">
            <TabButton active={mode === "write"} onClick={() => setMode("write")}>
              Write
            </TabButton>
            <TabButton
              active={mode === "preview"}
              onClick={() => setMode("preview")}
            >
              Preview
            </TabButton>
          </div>
        </div>

        <div className="border-b border-zinc-100 bg-zinc-50/80 px-4 py-2">
          <MarkdownToolbar
            disabled={mode === "preview"}
            onAction={insertFormatting}
          />
        </div>

        {mode === "write" ? (
          <label className="block">
            <span className="sr-only">Log body</span>
            <textarea
              ref={editorRef}
              value={body}
              onChange={(event) => setBody(event.target.value)}
              placeholder={`## Problem\nWhat went wrong\n\n## Cause\nWhy it happened\n\n## Fix\nWhat changed\n\n## Verification\nHow you confirmed`}
              className="min-h-[420px] w-full resize-y border-0 bg-white px-6 py-5 font-mono text-[13.5px] leading-7 text-zinc-800 outline-none placeholder:text-zinc-400"
            />
          </label>
        ) : (
          <div className="min-h-[420px] px-6 py-5 text-[15px] leading-7 text-zinc-800">
            <MarkdownContent
              markdown={body}
              variant="compact"
              emptyFallback={
                <p className="text-zinc-400">Nothing to preview yet.</p>
              }
            />
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-zinc-100 bg-zinc-50/80 px-6 py-4">
          <span className="text-[12px] text-zinc-500">
            Markdown supported · title and body save together
          </span>
          <div className="flex items-center gap-2">
            <Link
              href={getLogHref(log.id)}
              className="inline-flex h-9 items-center rounded-xl px-4 text-[13.5px] font-semibold text-zinc-500 transition hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20"
            >
              Cancel
            </Link>
            <button
              type="button"
              onClick={saveLog}
              disabled={!canSave}
              className={cn(
                "inline-flex h-9 items-center rounded-xl px-4 text-[13.5px] font-semibold text-white transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20",
                canSave
                  ? "bg-zinc-950 hover:bg-zinc-800"
                  : "cursor-not-allowed bg-zinc-400",
              )}
            >
              Save changes
            </button>
          </div>
        </div>
      </article>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative h-12 text-[15px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20",
        active
          ? "font-semibold text-zinc-950"
          : "font-medium text-zinc-500 hover:text-zinc-950",
      )}
    >
      {children}
      {active ? (
        <span className="absolute inset-x-0 bottom-0 h-0.5 bg-zinc-950" />
      ) : null}
    </button>
  );
}
