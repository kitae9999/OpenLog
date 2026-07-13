"use client";

import { useRef, useState, useTransition, type ReactNode } from "react";
import { cn } from "@/shared/lib/cn";
import { MarkdownContent, MarkdownToolbar } from "@/shared/ui/markdown";
import {
  formatSelection,
  getImageFallbackText,
  type ToolbarAction,
  type ToolbarActionPayload,
} from "@/shared/lib/markdown";

type SubmitResult =
  | {
      ok: true;
    }
  | {
      ok: false;
      message: string;
    };

export function DiscussionComposer({
  initialValue = "",
  submitLabel = "Comment",
  pendingLabel = "Posting...",
  errorFallback = "댓글을 작성하는 중 문제가 발생했습니다.",
  onCancel,
  onSubmit,
}: {
  initialValue?: string;
  submitLabel?: string;
  pendingLabel?: string;
  errorFallback?: string;
  onCancel?: () => void;
  onSubmit?: (content: string) => Promise<SubmitResult>;
}) {
  const [mode, setMode] = useState<"write" | "preview">("write");
  const [value, setValue] = useState(initialValue);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const editorRef = useRef<HTMLTextAreaElement>(null);

  const isEmpty = value.trim().length === 0;
  const canSubmit = Boolean(onSubmit) && !isEmpty && !isPending;

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
    const selectedText = value.slice(selectionStart, selectionEnd);
    const { nextValue, nextSelectionStart, nextSelectionEnd } = formatSelection(
      action,
      value,
      selectedText,
      selectionStart,
      selectionEnd,
      { fallbackText: getImageFallbackText(payload) },
    );

    setValue(nextValue);

    window.requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(nextSelectionStart, nextSelectionEnd);
    });
  }

  function submitComment() {
    if (!onSubmit || isEmpty || isPending) {
      return;
    }

    const nextContent = value.trim();
    setError(null);

    startTransition(async () => {
      try {
        const result = await onSubmit(nextContent);
        if (result.ok) {
          setValue("");
          setMode("write");
          return;
        }

        setError(result.message);
      } catch {
        setError(errorFallback);
      }
    });
  }

  return (
    <div>
      <div
        role="tablist"
        aria-label="Comment editor"
        className="flex items-end gap-1 border-b border-zinc-200"
      >
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

      <div className="mt-3">
        <MarkdownToolbar
          disabled={mode === "preview"}
          onAction={insertFormatting}
        />
      </div>

      {mode === "write" ? (
        <label className="mt-3 block">
          <span className="sr-only">Leave a comment</span>
          <textarea
            ref={editorRef}
            value={value}
            onChange={(event) => setValue(event.target.value)}
            placeholder="Leave a comment"
            className="openlog-scroll min-h-[140px] w-full resize-none overflow-y-auto border-0 bg-transparent py-2 text-[14px] leading-6 text-zinc-800 outline-none placeholder:text-zinc-400"
          />
        </label>
      ) : (
        <div className="mt-3 min-h-[140px] py-2 text-[14px] leading-6 text-zinc-800">
          <MarkdownContent
            markdown={value}
            variant="compact"
            emptyFallback={
              <p className="text-zinc-400">Nothing to preview yet.</p>
            }
          />
        </div>
      )}

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        {error ? (
          <span className="text-[12.5px] font-medium text-rose-600">{error}</span>
        ) : (
          <span className="text-[12.5px] text-zinc-500">Markdown supported</span>
        )}
        <div className="flex items-center gap-3">
          {onCancel ? (
            <button
              type="button"
              onClick={onCancel}
              disabled={isPending}
              className="cursor-pointer text-[13px] font-medium text-zinc-500 transition hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20 disabled:cursor-not-allowed disabled:text-zinc-300"
            >
              Cancel
            </button>
          ) : null}
          <button
            type="button"
            onClick={submitComment}
            disabled={!canSubmit}
            className={cn(
              "cursor-pointer text-[13px] font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20",
              canSubmit
                ? "text-zinc-950 hover:text-zinc-700"
                : "cursor-not-allowed text-zinc-400",
            )}
          >
            {isPending ? pendingLabel : submitLabel}
          </button>
        </div>
      </div>
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
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        "relative h-9 cursor-pointer px-2.5 text-[13px] font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20",
        active ? "text-zinc-950" : "text-zinc-500 hover:text-zinc-950",
      )}
    >
      {children}
      {active ? (
        <span className="absolute inset-x-2 -bottom-px h-0.5 bg-zinc-950" />
      ) : null}
    </button>
  );
}
