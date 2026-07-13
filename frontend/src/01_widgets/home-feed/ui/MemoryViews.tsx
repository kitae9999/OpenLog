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
import { getLogHref, getMemoryHref, getTaskHref, getTabHref } from "./data";
import {
  DocumentBulkBar,
  SelectionCheckbox,
  useDocumentSelection,
} from "./DocumentBulkSelection";
import {
  createWorkspaceMemory,
  deleteWorkspaceDocuments,
  deleteWorkspaceMemory,
  updateWorkspaceMemory,
} from "./workspaceActions";
import type { WorkspaceMemoryItem, WorkspaceUiData } from "./workspaceTypes";

export function MemoryListView({ workspaceData }: { workspaceData?: WorkspaceUiData | null }) {
  const router = useRouter();
  const memories = workspaceData?.memories ?? [];
  const selection = useDocumentSelection(memories.map((memory) => memory.id));
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  async function deleteSelectedMemories() {
    if (!workspaceData || isDeleting || selection.selectedIdList.length === 0) {
      return false;
    }
    setIsDeleting(true);
    setDeleteError(null);
    const result = await deleteWorkspaceDocuments({
      workspaceId: workspaceData.workspaceId,
      documentType: "memories",
      ids: selection.selectedIdList,
    });
    setIsDeleting(false);
    if (!result.ok) {
      setDeleteError(result.message ?? "Failed to delete selected memories.");
      return false;
    }
    selection.clear();
    router.refresh();
    return true;
  }

  return (
    <div className="mx-auto w-full max-w-[920px]">
      <MemoryBreadcrumb current="Memory" />
      <header className="flex flex-wrap items-end justify-between gap-3 pb-6">
        <div className="min-w-0">
          <h1 className="text-[22px] font-semibold tracking-tight text-zinc-950">
            Memory
          </h1>
          <p className="mt-1.5 text-[13px] text-zinc-500">
            {memories.length} total · durable decisions and conventions
          </p>
        </div>
        {workspaceData ? (
          <Link
            href="/memory/new"
            className="inline-flex text-[13px] font-medium text-zinc-500 transition hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20"
          >
            + New memory
          </Link>
        ) : null}
      </header>

      {!workspaceData ? (
        <EmptyMemory
          title="No workspace selected"
          body="Create or select a workspace to start collecting memory."
        />
      ) : memories.length === 0 ? (
        <EmptyMemory
          title="No memory yet"
          body="Create a memory or send a useful log here when a decision should outlive the session."
        />
      ) : (
        <>
          <DocumentBulkBar
            visibleCount={memories.length}
            selectedCount={selection.selectedIds.size}
            allVisibleSelected={selection.allVisibleSelected}
            someVisibleSelected={selection.someVisibleSelected}
            documentLabel="memories"
            isDeleting={isDeleting}
            error={deleteError}
            onToggleAll={selection.toggleAllVisible}
            onClear={selection.clear}
            onDelete={deleteSelectedMemories}
          />
          <ul className="mt-2">
            {memories.map((memory) => {
              const selected = selection.selectedIds.has(memory.id);
              return (
                <li
                  key={memory.id}
                  className="border-t border-zinc-200/80 first:border-t-0"
                >
                  <div
                    className={cn(
                      "group rounded-lg px-2.5 py-2.5 transition",
                      selected ? "bg-zinc-50" : "hover:bg-zinc-50",
                    )}
                  >
                    <div className="grid grid-cols-[17px_minmax(0,1fr)_auto] items-center gap-x-2.5">
                      <SelectionCheckbox
                        checked={selected}
                        label={`${selected ? "Deselect" : "Select"} ${memory.title}`}
                        onChange={() => selection.toggle(memory.id)}
                      />
                      <Link
                        href={getMemoryHref(memory.id)}
                        className="min-w-0 truncate text-[14.5px] font-medium leading-5 text-zinc-950 transition hover:text-zinc-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20"
                      >
                        {memory.title}
                      </Link>
                      <time className="shrink-0 font-mono text-[11px] text-zinc-400">
                        {formatMemoryDate(memory.updatedAt)}
                      </time>
                    </div>
                    {memory.excerpt ? (
                      <p className="mt-1 line-clamp-2 pl-[calc(17px+0.625rem)] text-[12.5px] leading-5 text-zinc-500">
                        {memory.excerpt}
                      </p>
                    ) : null}
                    <div className="mt-1.5 pl-[calc(17px+0.625rem)]">
                      <MemoryMeta memory={memory} />
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}

export function MemoryDetailView({ memory, workspaceData }: { memory: WorkspaceMemoryItem; workspaceData: WorkspaceUiData }) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function removeMemory() {
    if (isDeleting || !window.confirm("Delete this memory? This cannot be undone.")) return;
    setIsDeleting(true);
    setError(null);
    const result = await deleteWorkspaceMemory({ workspaceId: workspaceData.workspaceId, memoryId: memory.id });
    if (!result.ok) {
      setError(result.message ?? "Failed to delete memory.");
      setIsDeleting(false);
      return;
    }
    router.push("/memory");
    router.refresh();
  }

  return (
    <div className="mx-auto w-full max-w-[920px] pb-4">
      <MemoryBreadcrumb current={memory.title} />
      <header className="pb-8">
        <div className="min-w-0">
          <h1 className="text-[22px] font-semibold tracking-tight text-zinc-950">
            {memory.title}
          </h1>
          <div className="mt-2.5">
            <MemoryMeta memory={memory} linked />
          </div>
        </div>
      </header>

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_200px] lg:gap-12">
        <div className="min-w-0">
          <section>
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="text-[13.5px] font-semibold tracking-tight text-zinc-600">
                Content
              </h2>
              <Link
                href={`/memory/${memory.id}/edit`}
                className="text-[13px] font-medium text-zinc-500 transition hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20"
              >
                Edit
              </Link>
            </div>
            <div className="mt-4 max-w-[68ch] text-[15px] leading-7 text-zinc-800">
              <MarkdownContent markdown={memory.content} variant="dense" />
            </div>
          </section>

          <div
            className="my-8 h-px w-full bg-zinc-200"
            aria-hidden="true"
          />

          <div>
            {error ? (
              <p className="mb-3 text-[12.5px] font-medium text-rose-600">
                {error}
              </p>
            ) : null}
            <button
              type="button"
              disabled={isDeleting}
              onClick={removeMemory}
              className="text-[13px] font-medium text-rose-600 transition hover:text-rose-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-600/20 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </button>
          </div>
        </div>

        <aside className="space-y-6 border-t border-zinc-200/80 pt-6 lg:sticky lg:top-6 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-10">
          <SidebarField label="Task">
            {memory.task ? (
              <Link
                href={getTaskHref(memory.task.id)}
                className="text-[13.5px] font-medium leading-5 text-zinc-800 transition hover:text-zinc-950"
              >
                {memory.task.title}
              </Link>
            ) : (
              <p className="text-[13.5px] font-medium text-zinc-950">Unassigned</p>
            )}
          </SidebarField>

          <SidebarField label="Source">
            {memory.originLog ? (
              <Link
                href={getLogHref(memory.originLog.id)}
                className="text-[13.5px] font-medium leading-5 text-zinc-800 transition hover:text-zinc-950"
              >
                {memory.originLog.title}
              </Link>
            ) : (
              <p className="text-[13.5px] font-medium text-zinc-950">Manual</p>
            )}
          </SidebarField>
        </aside>
      </div>
    </div>
  );
}

export function MemoryEditorView({ workspaceData, memory }: { workspaceData: WorkspaceUiData; memory?: WorkspaceMemoryItem }) {
  const router = useRouter();
  const [title, setTitle] = useState(memory?.title ?? "");
  const [body, setBody] = useState(memory?.content ?? "");
  const [taskId, setTaskId] = useState(memory?.task?.id ?? "");
  const [mode, setMode] = useState<"write" | "preview">("write");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const canSave = title.trim().length > 0 && body.trim().length > 0;

  function insertFormatting(action: ToolbarAction, payload?: ToolbarActionPayload) {
    const textarea = editorRef.current;
    if (!textarea) return;
    const result = formatSelection(action, body, body.slice(textarea.selectionStart, textarea.selectionEnd), textarea.selectionStart, textarea.selectionEnd, { fallbackText: getImageFallbackText(payload) });
    setBody(result.nextValue);
    window.requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(result.nextSelectionStart, result.nextSelectionEnd);
    });
  }

  async function saveMemory() {
    if (!canSave || isSaving) return;
    setIsSaving(true);
    setError(null);
    const input = { workspaceId: workspaceData.workspaceId, title: title.trim(), content: body.trim(), taskId: taskId || null };
    const result = memory
      ? await updateWorkspaceMemory({ ...input, memoryId: memory.id })
      : await createWorkspaceMemory(input);
    if (!result.ok || !result.href) {
      setError(result.message ?? "Failed to save memory.");
      setIsSaving(false);
      return;
    }
    router.push(result.href);
    router.refresh();
  }

  return (
    <div className="mx-auto w-full max-w-[920px] pb-4">
      <MemoryBreadcrumb current={memory ? "Edit" : "New"} />
      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_200px] lg:gap-12">
        <div className="min-w-0">
          <header className="pb-4">
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="What should the project remember?"
              className="w-full border-0 bg-transparent p-0 text-[22px] font-semibold tracking-tight text-zinc-950 outline-none placeholder:text-zinc-300"
            />
          </header>
          <section>
            <div
              role="tablist"
              aria-label="Memory editor"
              className="flex items-end gap-1 border-b border-zinc-200"
            >
              <TabButton active={mode === "write"} onClick={() => setMode("write")}>
                Write
              </TabButton>
              <TabButton active={mode === "preview"} onClick={() => setMode("preview")}>
                Preview
              </TabButton>
            </div>
            <div className="mt-3">
              <MarkdownToolbar disabled={mode === "preview"} onAction={insertFormatting} />
            </div>
            {mode === "write" ? (
              <label className="mt-3 block">
                <span className="sr-only">Memory content</span>
                <textarea
                  ref={editorRef}
                  value={body}
                  onChange={(event) => setBody(event.target.value)}
                  placeholder="Capture the decision, convention, and why it matters."
                  className="openlog-scroll min-h-[440px] w-full resize-none overflow-y-auto border-0 bg-transparent py-2 font-mono text-[13.5px] leading-7 text-zinc-800 outline-none placeholder:text-zinc-400"
                />
              </label>
            ) : (
              <div className="mt-3 min-h-[440px] py-2 text-[15px] leading-7 text-zinc-800">
                <MarkdownContent
                  markdown={body}
                  variant="dense"
                  emptyFallback={<p className="text-zinc-400">Nothing to preview yet.</p>}
                />
              </div>
            )}
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 pt-1">
              <span className={cn("text-[12.5px]", error ? "text-rose-600" : "text-zinc-500")}>
                {error ?? "Markdown supported"}
              </span>
              <div className="flex items-center gap-3">
                <Link
                  href={memory ? getMemoryHref(memory.id) : getMemoryHref()}
                  className="text-[13px] font-medium text-zinc-500 transition hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20"
                >
                  Cancel
                </Link>
                <button
                  type="button"
                  onClick={saveMemory}
                  disabled={!canSave || isSaving}
                  className={cn(
                    "text-[13px] font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20",
                    canSave && !isSaving
                      ? "text-zinc-950 hover:text-zinc-700"
                      : "cursor-not-allowed text-zinc-400",
                  )}
                >
                  {isSaving ? "Saving..." : memory ? "Update" : "Create"}
                </button>
              </div>
            </div>
          </section>
        </div>
        <aside className="space-y-6 border-t border-zinc-200/80 pt-6 lg:sticky lg:top-6 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-10">
          <SidebarField label="Task">
            <select
              value={taskId}
              onChange={(event) => setTaskId(event.target.value)}
              className="h-9 w-full border-0 border-b border-zinc-200 bg-transparent py-1 text-[13.5px] font-medium text-zinc-950 outline-none focus:border-zinc-400"
            >
              <option value="">Unassigned</option>
              {workspaceData.tasks.map((task) => (
                <option key={task.id} value={task.id}>
                  {task.title}
                </option>
              ))}
            </select>
          </SidebarField>
          {memory?.originLog ? (
            <SidebarField label="Source">
              <Link
                className="text-[13.5px] font-medium leading-5 text-zinc-800 transition hover:text-zinc-950"
                href={getLogHref(memory.originLog.id)}
              >
                {memory.originLog.title}
              </Link>
            </SidebarField>
          ) : null}
        </aside>
      </div>
    </div>
  );
}

function MemoryBreadcrumb({ current }: { current: string }) {
  return (
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
      {current === "Memory" ? (
        <span className="font-semibold text-zinc-950">Memory</span>
      ) : (
        <>
          <Link
            href={getMemoryHref()}
            className="font-medium text-zinc-500 transition hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20"
          >
            Memory
          </Link>
          <span className="text-zinc-300">/</span>
          <span className="max-w-[45vw] truncate font-semibold text-zinc-950">
            {current}
          </span>
        </>
      )}
    </nav>
  );
}

function MemoryMeta({ memory, linked = false }: { memory: WorkspaceMemoryItem; linked?: boolean }) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-zinc-400">
      {memory.task ? (
        linked ? (
          <Link
            href={getTaskHref(memory.task.id)}
            className="transition hover:text-zinc-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20"
          >
            task · {memory.task.title}
          </Link>
        ) : (
          <span>task · {memory.task.title}</span>
        )
      ) : (
        <span>unassigned</span>
      )}
      {memory.originLog ? (
        linked ? (
          <Link
            href={getLogHref(memory.originLog.id)}
            className="transition hover:text-zinc-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20"
          >
            log · {memory.originLog.title}
          </Link>
        ) : (
          <span>from log</span>
        )
      ) : (
        <span>manual</span>
      )}
    </div>
  );
}

function EmptyMemory({ title, body }: { title: string; body: string }) {
  return (
    <div className="mt-10 pl-5">
      <p className="text-sm font-medium text-zinc-600">{title}</p>
      <p className="mt-1 max-w-md text-sm leading-6 text-zinc-500">{body}</p>
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

function formatMemoryDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric", timeZone: "Asia/Seoul" }).format(date);
}
