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
import { LogTypeLabel } from "@/entities/workspace/ui/LogTypeLabel";
import {
  getLogHref,
  getLogsForOutput,
  getOutputStatusLabel,
  getOutputsHref,
  getTabHref,
  getTaskHref,
  getTasksForOutput,
  workspaceTaskOutputs,
  type WorkspaceLogItem,
  type WorkspaceOutputStatus,
  type WorkspaceTaskOutput,
  type WorkspaceWorkItem,
} from "@/entities/workspace/model/data";
import {
  getOutputOverridesSnapshot,
  getOutputWithOverrideSnapshot,
  saveOutputOverride,
  subscribeOutputOverrides,
} from "@/features/document-overrides/model/outputOverrides";
import {
  deleteWorkspaceDocuments,
  publishWorkspaceOutput,
  updateWorkspaceOutput,
} from "@/features/workspace-actions/api/workspaceActions";
import type { WorkspaceUiData } from "@/entities/workspace/model/workspaceTypes";

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
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const editorRef = useRef<HTMLTextAreaElement>(null);

  if (!output) {
    return (
      <div
        data-testid="output-detail-layout"
        className="mx-auto w-full max-w-[920px] pb-4"
      >
        <nav
          aria-label="Breadcrumb"
          className="mb-6 flex flex-wrap items-center gap-1.5 text-[13px] text-zinc-500"
        >
          <Link
            href={getTabHref("workspace", isLoggedIn)}
            className="font-medium text-zinc-500 transition hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20"
          >
            openlog
          </Link>
          <span className="text-zinc-300">/</span>
          <Link
            href={getOutputsHref()}
            className="font-medium text-zinc-500 transition hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20"
          >
            Outputs
          </Link>
        </nav>
        <div className="mt-10 text-center">
          <p className="text-[14px] font-medium text-zinc-600">
            Output not found.
          </p>
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
    if (!output || !canMutate || isSaving || isDeleting) {
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

  async function deleteOutput() {
    if (
      !workspaceData ||
      !output ||
      isDeleting ||
      isSaving ||
      !window.confirm("Delete this output? Published posts will be kept.")
    ) {
      return;
    }

    setIsDeleting(true);
    setDeleteError(null);
    const result = await deleteWorkspaceDocuments({
      workspaceId: workspaceData.workspaceId,
      documentType: "outputs",
      ids: [output.id],
    });
    setIsDeleting(false);

    if (!result.ok) {
      setDeleteError(result.message ?? "Failed to delete output.");
      return;
    }

    router.push(getOutputsHref());
    router.refresh();
  }

  return (
    <div
      data-testid="output-detail-layout"
      className="mx-auto w-full max-w-[920px] pb-4"
    >
      <nav
        aria-label="Breadcrumb"
        className="mb-6 flex flex-wrap items-center gap-1.5 text-[13px] text-zinc-500"
      >
        <Link
          href={getTabHref("workspace", isLoggedIn)}
          className="font-medium text-zinc-500 transition hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20"
        >
          openlog
        </Link>
        <span className="text-zinc-300">/</span>
        <Link
          href={getOutputsHref()}
          className="font-medium text-zinc-500 transition hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20"
        >
          Outputs
        </Link>
        <span className="text-zinc-300">/</span>
        <span className="max-w-[45vw] truncate font-semibold text-zinc-950">
          {output.title}
        </span>
      </nav>

      <header data-testid="output-title-block" className="pb-8">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
              {isEditing ? (
                <label className="min-w-0 flex-1">
                  <span className="sr-only">Output title</span>
                  <input
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    className="w-full max-w-[40ch] border-0 bg-transparent p-0 text-[22px] font-semibold tracking-tight text-zinc-950 outline-none placeholder:text-zinc-300"
                    placeholder="Output title"
                  />
                </label>
              ) : (
                <h1 className="text-[22px] font-semibold tracking-tight text-zinc-950">
                  {output.title}
                </h1>
              )}
              <span className="font-mono text-[13px] text-zinc-400">
                #{output.id}
              </span>
            </div>

            <div className="mt-2.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[13px] text-zinc-500">
              <span className="inline-flex items-center gap-1.5 font-medium text-zinc-600">
                <OutputStatusDot status={output.status} />
                {statusLabel}
              </span>
              <MetaSep />
              <span>
                {tasks.length} linked task{tasks.length === 1 ? "" : "s"}
                {" · "}
                {logs.length} linked log{logs.length === 1 ? "" : "s"}
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
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-3">
            {canMutate && !isEditing ? (
              <button
                type="button"
                onClick={startEditing}
                className="cursor-pointer text-[13px] font-medium text-zinc-500 transition hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20"
              >
                Edit
              </button>
            ) : null}
            {workspaceData && !isEditing ? (
              <button
                type="button"
                onClick={deleteOutput}
                disabled={isDeleting || isSaving}
                className="cursor-pointer text-[13px] font-medium text-rose-600 transition hover:text-rose-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-600/20 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
            ) : null}
            {canMutate ? (
              <button
                type="button"
                onClick={publishOutput}
                disabled={isSaving || isDeleting}
                className="cursor-pointer text-[13px] font-medium text-zinc-500 transition hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20 disabled:cursor-not-allowed disabled:text-zinc-300"
              >
                {isSaving ? "Publishing..." : "Publish"}
              </button>
            ) : null}
            {output.publishedHref ? (
              <Link
                href={output.publishedHref}
                className="text-[13px] font-medium text-zinc-500 transition hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20"
              >
                Open post
              </Link>
            ) : null}
          </div>
        </div>

        {(deleteError || error) && !isEditing ? (
          <p className="mt-3 text-[12.5px] font-medium text-rose-600">
            {deleteError ?? error}
          </p>
        ) : null}
      </header>

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_200px] lg:gap-12">
        <div className="min-w-0">
          <section data-testid="output-content-block">
            {isEditing ? (
              <div>
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
                      className="openlog-scroll min-h-[320px] w-full resize-none overflow-y-auto border-0 bg-transparent py-2 font-mono text-[13.5px] leading-7 text-zinc-800 outline-none placeholder:text-zinc-400"
                    />
                  </label>
                ) : (
                  <div className="mt-3 min-h-[320px] py-2 text-[15px] leading-7 text-zinc-800">
                    <MarkdownContent
                      markdown={content}
                      variant="dense"
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
                    {error ?? "Markdown supported"}
                  </span>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={cancelEditing}
                      className="text-[13px] font-medium text-zinc-500 transition hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={saveChanges}
                      disabled={!canSave || isSaving}
                      className={cn(
                        "text-[13px] font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20",
                        canSave && !isSaving
                          ? "text-zinc-950 hover:text-zinc-700"
                          : "cursor-not-allowed text-zinc-400",
                      )}
                    >
                      {isSaving ? "Saving..." : "Update"}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-baseline justify-between gap-3">
                  <h2 className="text-[13.5px] font-semibold tracking-tight text-zinc-600">
                    Content
                  </h2>
                  {canMutate ? (
                    <button
                      type="button"
                      onClick={startEditing}
                      className="cursor-pointer text-[13px] font-medium text-zinc-500 transition hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20"
                    >
                      Edit
                    </button>
                  ) : null}
                </div>
                <div className="mt-4">
                  {hasContent ? (
                    <div className="max-w-[68ch]">
                      <MarkdownContent
                        markdown={output.content}
                        variant="dense"
                      />
                    </div>
                  ) : (
                    <div>
                      <p className="text-sm text-zinc-500">
                        No content yet. Summarize source tasks and logs into a
                        durable write-up.
                      </p>
                      {canMutate ? (
                        <button
                          type="button"
                          onClick={startEditing}
                          className="mt-3 text-[13px] font-medium text-zinc-500 transition hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20"
                        >
                          + Write content
                        </button>
                      ) : null}
                    </div>
                  )}
                </div>
              </div>
            )}
          </section>

          {logs.length > 0 ? (
            <>
              <div
                className="my-8 h-px w-full bg-zinc-200"
                aria-hidden="true"
              />
              <section data-testid="output-logs-block">
                <h2 className="text-[13.5px] font-semibold tracking-tight text-zinc-600">
                  Source logs
                  <span className="ml-2 tabular-nums text-zinc-400">
                    {logs.length}
                  </span>
                </h2>
                <ul className="mt-3 divide-y divide-zinc-200/80">
                  {logs.map((log) => (
                    <li key={log.id}>
                      <OutputLogRow log={log} />
                    </li>
                  ))}
                </ul>
              </section>
            </>
          ) : null}
        </div>

        <aside className="space-y-6 border-t border-zinc-200/80 pt-6 lg:sticky lg:top-6 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-10">
          <SidebarField label="Status">
            <p className="inline-flex items-center gap-1.5 text-[13.5px] font-medium text-zinc-950">
              <OutputStatusDot status={output.status} />
              {statusLabel}
            </p>
          </SidebarField>

          <SidebarField label="Updated">
            <p className="text-[13.5px] font-medium text-zinc-950">
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
                      className="text-[13px] font-medium leading-5 text-zinc-800 underline-offset-2 transition hover:text-zinc-950 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20"
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
                      className="text-[13px] font-medium leading-5 text-zinc-800 underline-offset-2 transition hover:text-zinc-950 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20"
                    >
                      {log.title}
                    </Link>
                    <p className="mt-0.5 text-[11px] text-zinc-400">
                      {log.label} · {formatLogMeta(log.meta)}
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
      className="group block rounded-lg px-2.5 py-2.5 transition hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20"
    >
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
        <LogTypeLabel>{log.label}</LogTypeLabel>
        <span className="min-w-0 truncate text-[14.5px] font-medium text-zinc-950 group-hover:text-zinc-700">
          {log.title}
        </span>
      </div>
      {log.description ? (
        <p className="mt-1 line-clamp-1 text-[12.5px] leading-5 text-zinc-500">
          {log.description}
        </p>
      ) : null}
      <p className="mt-1.5 text-[12px] text-zinc-400">
        {formatLogMeta(log.meta)}
        {log.branch ? (
          <>
            {" · "}
            <span className="font-mono">{log.branch}</span>
          </>
        ) : null}
        {log.commit ? (
          <>
            {" · "}
            <span className="font-mono">{log.commit}</span>
          </>
        ) : null}
      </p>
    </Link>
  );
}

function formatLogMeta(meta: string) {
  return meta.split(" · ")[0] ?? meta;
}

function MetaSep() {
  return (
    <span className="hidden text-zinc-300 sm:inline" aria-hidden="true">
      ·
    </span>
  );
}

function OutputStatusDot({ status }: { status: WorkspaceOutputStatus }) {
  return (
    <span
      className={cn(
        "size-[7px] shrink-0 rounded-full",
        status === "draft" ? "border-2 border-zinc-400" : "bg-emerald-600",
      )}
      aria-hidden="true"
    />
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
      <p className="text-[12px] font-medium text-zinc-400">{label}</p>
      <div className="mt-1.5">{children}</div>
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
        "relative h-9 px-2.5 text-[13px] font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20",
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
