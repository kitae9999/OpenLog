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
  getOutputHref,
  getOutputsHref,
  getTabHref,
} from "@/entities/workspace/model/data";
import { createOutputOverride } from "@/features/document-overrides/model/outputOverrides";
import { createWorkspaceOutput } from "@/features/workspace-actions/api/workspaceActions";
import type { WorkspaceUiData } from "@/entities/workspace/model/workspaceTypes";

export function OutputCreateView({
  isLoggedIn,
  initialTaskId,
  workspaceData,
}: {
  isLoggedIn: boolean;
  initialTaskId?: string;
  workspaceData?: WorkspaceUiData | null;
}) {
  const router = useRouter();
  const tasks = workspaceData?.tasks ?? [];
  const logs = workspaceData?.logs ?? [];
  const initialTask = tasks.find((task) => task.id === initialTaskId);
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>(() =>
    initialTask ? [initialTask.id] : [],
  );
  const [selectedLogIds, setSelectedLogIds] = useState<string[]>([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [mode, setMode] = useState<"write" | "preview">("write");
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const trimmedTitle = title.trim();
  const canSave = trimmedTitle.length > 0 && content.trim().length > 0;

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
    const selectedText = content.slice(selectionStart, selectionEnd);
    const { nextValue, nextSelectionStart, nextSelectionEnd } = formatSelection(
      action,
      content,
      selectedText,
      selectionStart,
      selectionEnd,
      { fallbackText: getImageFallbackText(payload) },
    );

    setContent(nextValue);

    window.requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(nextSelectionStart, nextSelectionEnd);
    });
  }

  function toggleTask(taskId: string) {
    setSelectedTaskIds((current) =>
      current.includes(taskId)
        ? current.filter((id) => id !== taskId)
        : [...current, taskId],
    );
  }

  function toggleLog(logId: string) {
    setSelectedLogIds((current) =>
      current.includes(logId)
        ? current.filter((id) => id !== logId)
        : [...current, logId],
    );
  }

  async function saveOutput() {
    if (!canSave || isSaving) {
      return;
    }

    setIsSaving(true);
    setError(null);

    if (workspaceData) {
      const result = await createWorkspaceOutput({
        workspaceId: workspaceData.workspaceId,
        title: trimmedTitle,
        content,
        taskIds: selectedTaskIds,
        logIds: selectedLogIds,
      });

      setIsSaving(false);

      if (!result.ok || !result.href) {
        setError(result.message ?? "Failed to save output.");
        return;
      }

      router.push(result.href);
      router.refresh();
      return;
    }

    const output = createOutputOverride({
      title: trimmedTitle,
      description:
        selectedLogIds.length > 0
          ? `from ${selectedLogIds.length} log${selectedLogIds.length === 1 ? "" : "s"}`
          : "manual draft",
      content,
      taskIds: selectedTaskIds,
      logIds: selectedLogIds,
    });

    setIsSaving(false);
    router.push(getOutputHref(output.id));
    router.refresh();
  }

  return (
    <div>
      <nav
        aria-label="Breadcrumb"
        className="mb-4 flex flex-wrap items-center gap-1.5 text-[13px] text-zinc-500"
      >
        <Link
          href={getTabHref("workspace", isLoggedIn)}
          className="font-semibold text-zinc-700 transition hover:text-zinc-950"
        >
          openlog
        </Link>
        <span className="text-zinc-300">/</span>
        <Link
          href={getOutputsHref()}
          className="font-medium text-zinc-700 transition hover:text-zinc-950"
        >
          Outputs
        </Link>
        <span className="text-zinc-300">/</span>
        <span className="font-semibold text-zinc-950">New</span>
      </nav>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(240px,280px)] lg:items-start">
        <div className="min-w-0 space-y-4">
          <header className="px-1 pt-1">
            <p className="text-[13.5px] font-semibold tracking-tight text-zinc-600">
              New output
            </p>
            <label className="mt-3 block">
              <span className="sr-only">Output title</span>
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Output title"
                className="w-full border-0 bg-transparent p-0 text-[22px] font-semibold tracking-tight text-zinc-950 outline-none placeholder:text-zinc-300"
              />
            </label>
          </header>

          <section>
            <div
              role="tablist"
              aria-label="Output content editor"
              className="flex items-end gap-1 border-b border-zinc-200"
            >
              <TabButton
                active={mode === "write"}
                onClick={() => setMode("write")}
              >
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
                <span className="sr-only">Output content</span>
                <textarea
                  ref={editorRef}
                  value={content}
                  onChange={(event) => setContent(event.target.value)}
                  placeholder="## Summary&#10;&#10;Write the refined document here."
                  className="openlog-scroll min-h-[420px] w-full resize-none overflow-y-auto border-0 bg-transparent py-2 font-mono text-[13.5px] leading-7 text-zinc-800 outline-none placeholder:text-zinc-400"
                />
              </label>
            ) : (
              <div className="mt-3 min-h-[420px] py-2 text-[15px] leading-7 text-zinc-800">
                <MarkdownContent
                  markdown={content}
                  variant="compact"
                  emptyFallback={
                    <p className="text-zinc-400">Nothing to preview yet.</p>
                  }
                />
              </div>
            )}
          </section>

          <div className="flex flex-wrap items-center justify-between gap-3 px-1 pt-1">
            <span
              className={cn(
                "text-[12.5px] text-zinc-500",
                error && "font-medium text-rose-600",
              )}
            >
              {error ??
                `${selectedTaskIds.length} task${selectedTaskIds.length === 1 ? "" : "s"} · ${selectedLogIds.length} log${selectedLogIds.length === 1 ? "" : "s"} selected`}
            </span>
            <div className="flex items-center gap-3">
              <Link
                href={getOutputsHref()}
                className="cursor-pointer text-[13px] font-medium text-zinc-500 transition hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20"
              >
                Cancel
              </Link>
              <button
                type="button"
                onClick={saveOutput}
                disabled={!canSave || isSaving}
                className={cn(
                  "cursor-pointer text-[13px] font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20",
                  canSave && !isSaving
                    ? "text-zinc-950 hover:text-zinc-700"
                    : "cursor-not-allowed text-zinc-400",
                )}
              >
                {isSaving ? "Saving..." : "Save output"}
              </button>
            </div>
          </div>
        </div>

        <aside className="space-y-5 px-1 pt-[22px] lg:px-0">
          <SourceChecklist
            label="Source tasks"
            emptyLabel="No tasks available."
            items={tasks.map((task) => ({ id: task.id, title: task.title }))}
            selectedIds={selectedTaskIds}
            onToggle={toggleTask}
          />

          <div>
            <p className="text-[13.5px] font-semibold tracking-tight text-zinc-600">
              Source logs
            </p>
            <div className="mt-3 space-y-1">
              {logs.length === 0 ? (
                <p className="py-2 text-[12.5px] text-zinc-500">
                  No logs available.
                </p>
              ) : (
                logs.map((log) => {
                  const checked = selectedLogIds.includes(log.id);
                  return (
                    <label
                      key={log.id}
                      className="flex cursor-pointer items-start gap-2.5 py-2"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleLog(log.id)}
                        className="mt-0.5 size-3.5 rounded border-zinc-300 text-zinc-950 focus:ring-zinc-900/20"
                      />
                      <span className="min-w-0">
                        <span className="block text-[13px] font-medium leading-5 text-zinc-900">
                          {log.title}
                        </span>
                        <span className="mt-0.5 line-clamp-2 block text-[11.5px] leading-4 text-zinc-500">
                          {getLogBody(log)
                            .replace(/^#+\s+/gm, "")
                            .slice(0, 100)}
                        </span>
                      </span>
                    </label>
                  );
                })
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function SourceChecklist({
  label,
  emptyLabel,
  items,
  selectedIds,
  onToggle,
}: {
  label: string;
  emptyLabel: string;
  items: Array<{ id: string; title: string }>;
  selectedIds: string[];
  onToggle: (id: string) => void;
}) {
  return (
    <div>
      <p className="text-[13.5px] font-semibold tracking-tight text-zinc-600">
        {label}
      </p>
      <div className="mt-3 space-y-1">
        {items.length === 0 ? (
          <p className="py-2 text-[12.5px] text-zinc-500">{emptyLabel}</p>
        ) : (
          items.map((item) => (
            <label
              key={item.id}
              className="flex cursor-pointer items-start gap-2.5 py-2"
            >
              <input
                type="checkbox"
                checked={selectedIds.includes(item.id)}
                onChange={() => onToggle(item.id)}
                className="mt-0.5 size-3.5 rounded border-zinc-300 text-zinc-950 focus:ring-zinc-900/20"
              />
              <span className="text-[13px] font-medium leading-5 text-zinc-900">
                {item.title}
              </span>
            </label>
          ))
        )}
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
