"use client";

import { useRef, useState } from "react";
import { cn } from "@/shared/lib/cn";
import {
  MarkdownContent,
} from "@/shared/ui/markdown/MarkdownContent";
import {
  MarkdownToolbar,
} from "@/shared/ui/markdown/MarkdownToolbar";
import {
  formatSelection,
  type ToolbarAction,
} from "@/shared/lib/markdown/openLogMarkdownFormatting";

export function DiscussionComposer() {
  const [mode, setMode] = useState<"write" | "preview">("write");
  const [value, setValue] = useState("");
  const editorRef = useRef<HTMLTextAreaElement>(null);

  const isEmpty = value.trim().length === 0;

  function insertFormatting(action: ToolbarAction) {
    const textarea = editorRef.current;
    if (!textarea) {
      return;
    }

    const selectionStart = textarea.selectionStart;
    const selectionEnd = textarea.selectionEnd;
    const selectedText = value.slice(selectionStart, selectionEnd);
    const { nextValue, nextSelectionStart, nextSelectionEnd } = formatSelection(
      action,
      value,
      selectedText,
      selectionStart,
      selectionEnd,
    );

    setValue(nextValue);

    window.requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(nextSelectionStart, nextSelectionEnd);
    });
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
      <div className="border-b border-zinc-200 bg-zinc-50/80 px-4">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => setMode("write")}
            className={cn(
              "relative h-12 text-[16px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20",
              mode === "write"
                ? "font-semibold text-zinc-950"
                : "font-medium text-zinc-500 hover:text-zinc-950",
            )}
          >
            Write
            {mode === "write" ? (
              <span className="absolute inset-x-0 bottom-0 h-0.5 bg-zinc-950" />
            ) : null}
          </button>
          <button
            type="button"
            onClick={() => setMode("preview")}
            className={cn(
              "relative h-12 text-[16px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20",
              mode === "preview"
                ? "font-semibold text-zinc-950"
                : "font-medium text-zinc-500 hover:text-zinc-950",
            )}
          >
            Preview
            {mode === "preview" ? (
              <span className="absolute inset-x-0 bottom-0 h-0.5 bg-zinc-950" />
            ) : null}
          </button>
        </div>
      </div>

      <div className="border-b border-zinc-200 bg-zinc-50/80 px-4 py-2">
        <MarkdownToolbar
          disabled={mode === "preview"}
          onAction={insertFormatting}
        />
      </div>

      {mode === "write" ? (
        <label className="block">
          <span className="sr-only">Leave a comment</span>
          <textarea
            ref={editorRef}
            value={value}
            onChange={(event) => setValue(event.target.value)}
            placeholder="Leave a comment"
            className="min-h-[160px] w-full resize-none border-0 bg-white px-4 py-4 text-sm leading-6 text-zinc-800 outline-none placeholder:text-zinc-400"
          />
        </label>
      ) : (
        <div className="min-h-[160px] px-4 py-4 text-sm leading-6 text-zinc-800">
          <MarkdownContent
            markdown={value}
            variant="compact"
            emptyFallback={
              <p className="text-zinc-400">Nothing to preview yet.</p>
            }
          />
        </div>
      )}

      <div className="flex items-center justify-between border-t border-zinc-200 bg-zinc-50/80 px-4 py-3">
        <span className="text-xs text-zinc-500">
          Styling with Markdown is supported
        </span>
        <button
          type="button"
          disabled={isEmpty}
          className={cn(
            "inline-flex h-8 items-center rounded-xl px-4 text-sm font-bold text-white shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600/30",
            isEmpty
              ? "cursor-not-allowed bg-emerald-600/50"
              : "bg-emerald-600 hover:bg-emerald-700",
          )}
        >
          Comment
        </button>
      </div>
    </div>
  );
}
