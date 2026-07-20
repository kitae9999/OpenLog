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
import {
  getLogBody,
  getLogHref,
  getLogsHref,
  getTabHref,
  type WorkspaceLogItem,
} from "@/entities/workspace/model/data";
import { saveLogOverride } from "@/features/document-overrides/model/logOverrides";
import { updateWorkspaceLog } from "@/features/workspace-actions/api/workspaceActions";
import { useInvalidateWorkspaceQueries } from "@/features/workspace-query/model/useInvalidateWorkspaceQueries";

export function LogEditView({
  log,
  workspaceId,
}: {
  log: WorkspaceLogItem;
  workspaceId?: string;
}) {
  const router = useRouter();
  const invalidateWorkspace = useInvalidateWorkspaceQueries();
  const [title, setTitle] = useState(log.title);
  const [body, setBody] = useState(() => getLogBody(log));
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
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

  async function saveLog() {
    if (!canSave || isSaving) {
      return;
    }

    setIsSaving(true);
    setError(null);

    if (workspaceId) {
      const result = await updateWorkspaceLog({
        workspaceId,
        logId: log.id,
        title: trimmedTitle,
        content: body,
        summary: log.summary ?? log.description,
        taskId: log.taskId ?? null,
        status: log.status ?? "NONE",
      });

      setIsSaving(false);

      if (!result.ok) {
        setError(result.message ?? "Failed to save log.");
        return;
      }

      router.push(getLogHref(log.id));
      await invalidateWorkspace("logs");
      return;
    }

    saveLogOverride(log.id, {
      title: trimmedTitle,
      body,
    });
    setIsSaving(false);
    router.push(getLogHref(log.id));
    await invalidateWorkspace("logs");
  }

  return (
    <div className="mx-auto w-full max-w-[920px] pb-4">
      <nav
        aria-label="Breadcrumb"
        className="mb-6 flex flex-wrap items-center gap-1.5 text-[13px] text-zinc-500"
      >
        <Link
          href={getTabHref("workspace", true)}
          className="font-medium text-zinc-500 transition hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20"
        >
          openlog
        </Link>
        <span className="text-zinc-300">/</span>
        <Link
          href={getLogsHref()}
          className="font-medium text-zinc-500 transition hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20"
        >
          Logs
        </Link>
        <span className="text-zinc-300">/</span>
        <Link
          href={getLogHref(log.id)}
          className="max-w-[45vw] truncate font-medium text-zinc-500 transition hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20"
        >
          {log.title}
        </Link>
        <span className="text-zinc-300">/</span>
        <span className="font-semibold text-zinc-950">Edit</span>
      </nav>

      <header className="pb-8">
        <p className="text-[11.5px] font-semibold uppercase tracking-[0.1em] text-zinc-400">
          Edit log
        </p>
        <label className="mt-3 block">
          <span className="sr-only">Log title</span>
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Log title"
            className="w-full border-0 border-b border-zinc-200 bg-transparent px-0 pb-2 text-[22px] font-semibold tracking-tight text-zinc-950 outline-none transition placeholder:text-zinc-300 focus:border-zinc-900"
          />
        </label>
      </header>

      <section>
        <div
          role="tablist"
          aria-label="Log body editor"
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
            <span className="sr-only">Log body</span>
            <textarea
              ref={editorRef}
              value={body}
              onChange={(event) => setBody(event.target.value)}
              placeholder={`## Problem\nWhat went wrong\n\n## Cause\nWhy it happened\n\n## Fix\nWhat changed\n\n## Verification\nHow you confirmed`}
              className="openlog-scroll min-h-[420px] w-full resize-none overflow-y-auto border-0 bg-transparent py-2 font-mono text-[13.5px] leading-7 text-zinc-800 outline-none placeholder:text-zinc-400"
            />
          </label>
        ) : (
          <div className="mt-3 min-h-[420px] py-2 text-[15px] leading-7 text-zinc-800">
            <MarkdownContent
              markdown={body}
              variant="compact"
              emptyFallback={
                <p className="text-zinc-400">Nothing to preview yet.</p>
              }
            />
          </div>
        )}

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 pt-1">
          <span
            className={cn(
              "text-[12.5px]",
              error ? "font-medium text-rose-600" : "text-zinc-500",
            )}
          >
            {error ?? "Markdown supported · title and body save together"}
          </span>
          <div className="flex items-center gap-3">
            <Link
              href={getLogHref(log.id)}
              className="cursor-pointer text-[13px] font-medium text-zinc-500 transition hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20"
            >
              Cancel
            </Link>
            <button
              type="button"
              onClick={saveLog}
              disabled={!canSave || isSaving}
              className={cn(
                "cursor-pointer text-[13px] font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20",
                canSave && !isSaving
                  ? "text-zinc-950 hover:text-zinc-700"
                  : "cursor-not-allowed text-zinc-400",
              )}
            >
              {isSaving ? "Saving..." : "Save changes"}
            </button>
          </div>
        </div>
      </section>
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
        active ? "text-zinc-950" : "text-zinc-500 hover:text-zinc-800",
      )}
    >
      {children}
      {active ? (
        <span className="absolute inset-x-2 -bottom-px h-0.5 bg-zinc-950" />
      ) : null}
    </button>
  );
}
