"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { cn } from "@/shared/lib/cn";
import {
  formatSelection,
  getImageFallbackText,
  type ToolbarAction,
  type ToolbarActionPayload,
} from "@/shared/lib/markdown";
import { MarkdownContent, MarkdownToolbar } from "@/shared/ui/markdown";
import { LogTypeLabel } from "./LogTypeLabel";
import {
  getLogHref,
  getLogsForOutput,
  getOutputStatusLabel,
  getOutputsHref,
  getTaskHref,
  getTasksForOutput,
  workspaceTaskOutputs,
  type WorkspaceLogItem,
  type WorkspaceOutputStatus,
  type WorkspaceTaskOutput,
  type WorkspaceWorkItem,
} from "./data";
import {
  getOutputOverridesSnapshot,
  getOutputWithOverrideSnapshot,
  saveOutputOverride,
  subscribeOutputOverrides,
} from "./outputOverrides";
import {
  publishWorkspaceOutput,
  updateWorkspaceOutput,
} from "./workspaceActions";
import type { WorkspaceUiData } from "./workspaceTypes";

export function OutputDetailView({
  isLoggedIn,
  outputId,
  output: apiOutput,
  workspaceData,
}: {
  isLoggedIn: boolean;
  outputId: string;
  output?: WorkspaceTaskOutput;
  workspaceData?: WorkspaceUiData | null;
}) {
  const router = useRouter();
  const outputOverridesSnapshot = useSyncExternalStore(
    subscribeOutputOverrides,
    getOutputOverridesSnapshot,
    () => "{}",
  );
  const output = useMemo(
    () =>
      apiOutput ??
      getOutputWithOverrideSnapshot(
        outputId,
        workspaceTaskOutputs,
        outputOverridesSnapshot,
      ) ??
      null,
    [apiOutput, outputId, outputOverridesSnapshot],
  );
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(output?.title ?? "");
  const [content, setContent] = useState(output?.content ?? "");
  const [mode, setMode] = useState<"write" | "preview">("write");
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const editorRef = useRef<HTMLTextAreaElement>(null);

  if (!output) {
    return (
      <div data-testid="output-detail-layout" className="pb-4">
        <Link
          href={getOutputsHref()}
          className="inline-flex items-center gap-2 text-[13px] text-zinc-500 transition hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20"
        >
          <IconArrowLeft className="size-3.5" />
          Back to Outputs
        </Link>
        <div className="mt-10 rounded-2xl border border-dashed border-zinc-200 bg-white px-6 py-12 text-center">
          <p className="text-[14px] font-medium text-zinc-600">
            Output not found.
          </p>
          <div className="mt-4">
            <LinkButton href={getOutputsHref()} tone="outline">
              Back to outputs
            </LinkButton>
          </div>
        </div>
      </div>
    );
  }

  const tasks = workspaceData
    ? output.taskIds
        .map((taskId) => workspaceData.tasks.find((task) => task.id === taskId))
        .filter((task): task is WorkspaceWorkItem => Boolean(task))
    : getTasksForOutput(output);
  const logs = workspaceData
    ? output.logIds
        .map((logId) => workspaceData.logs.find((log) => log.id === logId))
        .filter((log): log is WorkspaceLogItem => Boolean(log))
    : getLogsForOutput(output);
  const canMutate = output.status === "draft";
  const canSave = title.trim().length > 0 && content.trim().length > 0;
  const hasContent = (isEditing ? content : output.content).trim().length > 0;
  const statusLabel = getOutputStatusLabel(output.status);

  function startEditing() {
    setTitle(output!.title);
    setContent(output!.content);
    setIsEditing(true);
    setMode("write");
    setError(null);
  }

  function cancelEditing() {
    setTitle(output!.title);
    setContent(output!.content);
    setIsEditing(false);
    setMode("write");
    setError(null);
  }

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

  async function saveChanges() {
    if (!canSave || !output || isSaving) {
      return;
    }

    setIsSaving(true);
    setError(null);

    if (workspaceData) {
      const result = await updateWorkspaceOutput({
        workspaceId: workspaceData.workspaceId,
        outputId: output.id,
        title: title.trim(),
        content,
        taskIds: output.taskIds,
        logIds: output.logIds,
      });

      setIsSaving(false);

      if (!result.ok) {
        setError(result.message ?? "Failed to save output.");
        return;
      }

      setIsEditing(false);
      setMode("write");
      router.refresh();
      return;
    }

    const nextOutput = {
      ...output,
      title: title.trim(),
      content,
      updatedLabel: "Just now",
    };
    saveOutputOverride(nextOutput);
    setIsEditing(false);
    setMode("write");
    setIsSaving(false);
    router.refresh();
  }

  async function publishOutput() {
    if (!output || !canMutate || isSaving) {
      return;
    }

    setIsSaving(true);
    setError(null);

    if (workspaceData) {
      const result = await publishWorkspaceOutput({
        workspaceId: workspaceData.workspaceId,
        outputId: output.id,
      });

      setIsSaving(false);

      if (!result.ok) {
        setError(result.message ?? "Failed to publish output.");
        return;
      }

      setIsEditing(false);
      setMode("write");
      router.refresh();
      return;
    }

    const nextOutput = {
      ...output,
      status: "published" as const,
      updatedLabel: "Just now",
      publishedHref: "/@kitae9999/posts/output-preview",
    };
    saveOutputOverride(nextOutput);
    setIsEditing(false);
    setMode("write");
    setIsSaving(false);
  }

  return (
    <div data-testid="output-detail-layout" className="pb-4">
      <Link
        href={getOutputsHref()}
        className="inline-flex items-center gap-2 text-[13px] text-zinc-500 transition hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20"
      >
        <IconArrowLeft className="size-3.5" />
        Back to Outputs
      </Link>

      <header
        data-testid="output-title-block"
        className="mt-6 border-b border-zinc-200/80 pb-6"
      >
        <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
          {isEditing ? (
            <label className="min-w-0 flex-1">
              <span className="sr-only">Output title</span>
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                className="w-full max-w-[40ch] border-0 bg-transparent p-0 text-[28px] font-bold leading-[1.2] tracking-[-0.02em] text-zinc-950 outline-none placeholder:text-zinc-300 sm:text-[30px]"
                placeholder="Output title"
              />
            </label>
          ) : (
            <h1 className="max-w-[28ch] text-[28px] font-bold leading-[1.2] tracking-[-0.02em] text-zinc-950 sm:max-w-[40ch] sm:text-[30px]">
              {output.title}
            </h1>
          )}
          <span className="font-mono text-[18px] tracking-tight text-zinc-400 sm:text-[20px]">
            #{output.id}
          </span>
        </div>

        <div className="mt-3.5 flex flex-wrap items-center gap-x-2.5 gap-y-2 text-[13px] text-zinc-500">
          <StatusBadge status={output.status} label={statusLabel} />
          <MetaSep />
          <span>
            <span className="font-semibold text-zinc-800">{tasks.length}</span>{" "}
            task{tasks.length === 1 ? "" : "s"}
            {" · "}
            <span className="font-semibold text-zinc-800">{logs.length}</span>{" "}
            log{logs.length === 1 ? "" : "s"}
          </span>
          <MetaSep />
          <span>updated {output.updatedLabel}</span>
          {output.description ? (
            <>
              <MetaSep />
              <span>{output.description}</span>
            </>
          ) : null}
        </div>

        {error && !isEditing ? (
          <p className="mt-3 text-[12px] text-red-600">{error}</p>
        ) : null}
      </header>

      <div className="mt-7 grid gap-7 lg:grid-cols-[minmax(0,1fr)_240px]">
        <div className="min-w-0 space-y-6">
          <section
            data-testid="output-content-block"
            className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-[0_1px_2px_rgba(24,24,27,0.04)]"
          >
            {isEditing ? (
              <>
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200/80 bg-zinc-50/70 px-4">
                  <div className="flex items-center gap-4">
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
                </div>

                <div className="border-b border-zinc-100 bg-zinc-50/80 px-4 py-2">
                  <MarkdownToolbar
                    disabled={mode === "preview"}
                    onAction={insertFormatting}
                  />
                </div>

                {mode === "write" ? (
                  <label className="block">
                    <span className="sr-only">Output content</span>
                    <textarea
                      ref={editorRef}
                      value={content}
                      onChange={(event) => setContent(event.target.value)}
                      placeholder="## Summary&#10;&#10;Write the refined document here."
                      className="min-h-[320px] w-full resize-y border-0 bg-white px-5 py-5 font-mono text-[13.5px] leading-7 text-zinc-800 outline-none placeholder:text-zinc-400"
                    />
                  </label>
                ) : (
                  <div className="min-h-[320px] px-5 py-5 text-[15px] leading-7 text-zinc-800">
                    <MarkdownContent
                      markdown={content}
                      variant="dense"
                      emptyFallback={
                        <p className="text-zinc-400">Nothing to preview yet.</p>
                      }
                    />
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-zinc-100 bg-zinc-50/80 px-4 py-3">
                  <span className="text-[12px] text-zinc-500">
                    {error ?? "Markdown supported"}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={cancelEditing}
                      className="inline-flex h-8 items-center rounded-lg px-3 text-[12.5px] font-semibold text-zinc-500 transition hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={saveChanges}
                      disabled={!canSave || isSaving}
                      className={cn(
                        "inline-flex h-8 items-center rounded-lg px-3 text-[12.5px] font-semibold text-white transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20",
                        canSave && !isSaving
                          ? "bg-zinc-950 hover:bg-zinc-800"
                          : "cursor-not-allowed bg-zinc-400",
                      )}
                    >
                      {isSaving ? "Saving..." : "Update"}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200/80 bg-zinc-50/70 px-4 py-2.5">
                  <span className="text-[13px] font-semibold text-zinc-900">
                    Content
                  </span>
                  {canMutate ? (
                    <button
                      type="button"
                      onClick={startEditing}
                      className="rounded-md px-1.5 py-0.5 text-[12px] font-semibold text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20"
                    >
                      Edit
                    </button>
                  ) : null}
                </div>
                <div className="px-5 py-5">
                  {hasContent ? (
                    <div className="max-w-[68ch]">
                      <MarkdownContent
                        markdown={output.content}
                        variant="dense"
                      />
                    </div>
                  ) : (
                    <div className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50/50 px-5 py-9 text-center">
                      <p className="text-[14px] font-medium text-zinc-700">
                        No content yet.
                      </p>
                      <p className="mt-1.5 text-[13px] leading-5 text-zinc-500">
                        Summarize source tasks and logs into a durable write-up.
                      </p>
                      {canMutate ? (
                        <div className="mt-4">
                          <button
                            type="button"
                            onClick={startEditing}
                            className="inline-flex h-8 items-center justify-center rounded-[10px] border border-zinc-300 bg-white px-3 text-[12.5px] font-semibold text-zinc-700 transition hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20"
                          >
                            Write content
                          </button>
                        </div>
                      ) : null}
                    </div>
                  )}
                </div>
              </>
            )}
          </section>

          {logs.length > 0 ? (
            <section
              data-testid="output-logs-block"
              className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-[0_1px_2px_rgba(24,24,27,0.04)]"
            >
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200/80 bg-zinc-50/70 px-4 py-2.5">
                <h2 className="flex items-baseline gap-2 text-[13px] font-semibold text-zinc-900">
                  Source logs
                  <span className="rounded-full bg-zinc-100 px-1.5 py-0.5 text-[11px] font-semibold tabular-nums text-zinc-500">
                    {logs.length}
                  </span>
                </h2>
              </div>
              <div className="divide-y divide-zinc-100">
                {logs.map((log) => (
                  <OutputLogRow key={log.id} log={log} />
                ))}
              </div>
            </section>
          ) : null}

          <div className="flex flex-wrap justify-end gap-2.5 pt-1">
            {canMutate && !isEditing ? (
              <button
                type="button"
                onClick={startEditing}
                className="inline-flex h-9 items-center justify-center rounded-xl border border-zinc-300 bg-white px-4 text-[13px] font-medium text-zinc-700 transition hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20"
              >
                Edit
              </button>
            ) : null}
            {canMutate ? (
              <button
                type="button"
                onClick={publishOutput}
                disabled={isSaving}
                className="inline-flex h-9 items-center justify-center rounded-xl bg-zinc-950 px-4 text-[13px] font-semibold text-white transition hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20 disabled:cursor-not-allowed disabled:bg-zinc-400"
              >
                {isSaving ? "Publishing..." : "Publish"}
              </button>
            ) : null}
            {output.publishedHref ? (
              <LinkButton href={output.publishedHref} tone="solid">
                Open post
              </LinkButton>
            ) : null}
          </div>
        </div>

        <aside className="space-y-5 px-1 lg:sticky lg:top-6 lg:px-0">
          <SidebarField label="Status">
            <p className="text-[13.5px] font-medium text-zinc-900">{statusLabel}</p>
          </SidebarField>

          <SidebarField label="Updated">
            <p className="text-[13.5px] font-medium text-zinc-900">
              {output.updatedLabel}
            </p>
          </SidebarField>

          <SidebarField label="Tasks">
            {tasks.length === 0 ? (
              <p className="text-[12.5px] leading-5 text-zinc-500">
                No task source.
              </p>
            ) : (
              <ul className="mt-0.5 space-y-2">
                {tasks.map((task) => (
                  <li key={task.id}>
                    <Link
                      href={getTaskHref(task.id)}
                      className="text-[13px] font-medium leading-5 text-zinc-800 transition hover:text-zinc-950 hover:underline"
                    >
                      {task.title}
                    </Link>
                    <p className="mt-0.5 text-[11px] capitalize text-zinc-400">
                      {task.status}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </SidebarField>

          <SidebarField label="Logs">
            {logs.length === 0 ? (
              <p className="text-[12.5px] leading-5 text-zinc-500">
                No log source.
              </p>
            ) : (
              <ul className="mt-0.5 space-y-2">
                {logs.map((log) => (
                  <li key={log.id}>
                    <Link
                      href={getLogHref(log.id)}
                      className="text-[13px] font-medium leading-5 text-zinc-800 transition hover:text-zinc-950 hover:underline"
                    >
                      {log.title}
                    </Link>
                    <p className="mt-0.5 text-[11px] text-zinc-400">
                      {log.label} · {log.meta.split(" · ")[0]}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </SidebarField>
        </aside>
      </div>
    </div>
  );
}

function OutputLogRow({ log }: { log: WorkspaceLogItem }) {
  return (
    <Link
      href={getLogHref(log.id)}
      className="group flex items-start gap-3 px-4 py-3.5 transition hover:bg-zinc-50/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-zinc-900/20"
    >
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <LogTypeLabel>{log.label}</LogTypeLabel>
          <h3 className="text-[13.5px] font-semibold leading-snug text-zinc-950 group-hover:text-zinc-800">
            {log.title}
          </h3>
        </div>
        <p className="mt-1 line-clamp-1 text-[12.5px] leading-5 text-zinc-500">
          {log.description}
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-zinc-400">
          <span>{log.meta.split(" · ")[0] ?? log.meta}</span>
          {log.branch ? <CodePill>{log.branch}</CodePill> : null}
          {log.commit ? <CodePill>{log.commit}</CodePill> : null}
        </div>
      </div>
      <IconArrowRight className="mt-0.5 size-3.5 shrink-0 text-zinc-300 transition group-hover:translate-x-0.5 group-hover:text-zinc-500" />
    </Link>
  );
}

function MetaSep() {
  return (
    <span className="hidden text-zinc-300 sm:inline" aria-hidden="true">
      ·
    </span>
  );
}

function StatusBadge({
  status,
  label,
}: {
  status: WorkspaceOutputStatus;
  label: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center gap-1.5 rounded-full px-2.5 text-[11px] font-semibold tracking-wide text-white shadow-sm",
        status === "draft" ? "bg-zinc-500" : "bg-emerald-600",
      )}
    >
      <span className="size-1.5 rounded-full bg-white/90" />
      {label}
    </span>
  );
}

function SidebarField({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div>
      <p className="text-[11px] font-medium tracking-wide text-zinc-400">
        {label}
      </p>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}

function CodePill({ children }: { children: ReactNode }) {
  return (
    <code className="rounded-md border border-zinc-200/80 bg-zinc-50 px-1.5 py-0.5 font-mono text-[10.5px] text-zinc-500">
      {children}
    </code>
  );
}

function LinkButton({
  href,
  tone,
  size = "md",
  children,
}: {
  href: string;
  tone: "solid" | "outline" | "ghost";
  size?: "md" | "sm";
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center justify-center gap-1.5 font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20",
        size === "sm"
          ? "h-8 rounded-[10px] px-3 text-[12.5px]"
          : "h-9 rounded-xl px-4 text-[13px]",
        tone === "solid" && "bg-zinc-950 text-white hover:bg-zinc-800",
        tone === "outline" &&
          "border border-zinc-300 bg-white font-medium text-zinc-700 hover:bg-zinc-50",
        tone === "ghost" && "text-zinc-500 hover:text-zinc-950",
      )}
    >
      {children}
    </Link>
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
        "relative h-11 text-[13.5px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20",
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

function IconArrowLeft({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M19 12H5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M12 19l-7-7 7-7"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconArrowRight({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M5 12h14M13 6l6 6-6 6"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}
