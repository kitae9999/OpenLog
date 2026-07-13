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
    <div>
      <MemoryBreadcrumb current="Memory" />
      <header className="flex flex-wrap items-end justify-between gap-4 border-b border-zinc-200/80 pb-5">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-400">Project knowledge</p>
          <h1 className="mt-2 text-[20px] font-bold tracking-[-0.01em]">Memory</h1>
          <p className="mt-2 max-w-2xl text-[13.5px] leading-6 text-zinc-500">
            Durable decisions, conventions, and implementation context for this workspace.
          </p>
        </div>
        {workspaceData ? (
          <Link href="/memory/new" className="inline-flex h-9 items-center rounded-xl bg-zinc-950 px-4 text-[13px] font-semibold text-white transition hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20">
            New memory
          </Link>
        ) : null}
      </header>

      {!workspaceData ? (
        <EmptyMemory title="No workspace selected" body="Create or select a workspace to start collecting memory." />
      ) : memories.length === 0 ? (
        <EmptyMemory title="No memory yet" body="Create a memory or send a useful log here when a decision should outlive the session." />
      ) : (
        <div className="mt-5 overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-[0_1px_2px_rgba(24,24,27,0.04)]">
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
          {memories.map((memory) => (
            <article key={memory.id} className="flex items-start gap-3 border-t border-zinc-100 px-5 py-4">
              <SelectionCheckbox
                checked={selection.selectedIds.has(memory.id)}
                label={`${selection.selectedIds.has(memory.id) ? "Deselect" : "Select"} ${memory.title}`}
                onChange={() => selection.toggle(memory.id)}
                className="mt-0.5"
              />
              <Link href={getMemoryHref(memory.id)} className="group min-w-0 flex-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <h2 className="text-[14px] font-semibold text-zinc-950 group-hover:underline group-hover:underline-offset-4">{memory.title}</h2>
                    <p className="mt-1 line-clamp-2 max-w-3xl text-[12.5px] leading-5 text-zinc-500">{memory.excerpt}</p>
                  </div>
                  <time className="shrink-0 font-mono text-[10.5px] text-zinc-400">{formatMemoryDate(memory.updatedAt)}</time>
                </div>
                <MemoryMeta memory={memory} />
              </Link>
            </article>
          ))}
        </div>
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
    <div>
      <MemoryBreadcrumb current={memory.title} />
      <article className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-[0_1px_2px_rgba(24,24,27,0.04)]">
        <header className="border-b border-zinc-100 px-6 py-6 sm:px-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-400">Project memory</p>
              <h1 className="mt-2 text-[20px] font-bold tracking-[-0.01em] text-zinc-950">{memory.title}</h1>
              <MemoryMeta memory={memory} linked />
            </div>
            <div className="flex items-center gap-2">
              <Link href={`/memory/${memory.id}/edit`} className="inline-flex h-9 items-center rounded-xl border border-zinc-300 bg-white px-4 text-[13px] font-semibold text-zinc-700 hover:bg-zinc-50">Edit</Link>
              <button type="button" disabled={isDeleting} onClick={removeMemory} className="inline-flex h-9 items-center rounded-xl px-3 text-[13px] font-semibold text-zinc-400 hover:text-red-600 disabled:opacity-50">{isDeleting ? "Deleting..." : "Delete"}</button>
            </div>
          </div>
          {error ? <p className="mt-3 text-[12px] text-red-600">{error}</p> : null}
        </header>
        <div className="px-6 py-7 text-[15px] leading-7 text-zinc-800 sm:px-8">
          <MarkdownContent markdown={memory.content} variant="compact" />
        </div>
      </article>
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
    <div>
      <MemoryBreadcrumb current={memory ? "Edit" : "New"} />
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_260px] lg:items-start">
        <div className="min-w-0">
          <header className="px-1 pb-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-400">{memory ? "Edit memory" : "New memory"}</p>
            <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="What should the project remember?" className="mt-3 w-full border-0 bg-transparent p-0 text-[20px] font-bold text-zinc-950 outline-none placeholder:text-zinc-300" />
          </header>
          <section className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-white">
            <div className="flex items-center gap-4 border-b border-zinc-100 bg-zinc-50/80 px-4">
              <EditorTab active={mode === "write"} onClick={() => setMode("write")}>Write</EditorTab>
              <EditorTab active={mode === "preview"} onClick={() => setMode("preview")}>Preview</EditorTab>
            </div>
            <div className="border-b border-zinc-100 bg-zinc-50/80 px-4 py-2"><MarkdownToolbar disabled={mode === "preview"} onAction={insertFormatting} /></div>
            {mode === "write" ? (
              <textarea ref={editorRef} value={body} onChange={(event) => setBody(event.target.value)} placeholder="Capture the decision, convention, and why it matters." className="min-h-[440px] w-full resize-y border-0 px-6 py-5 font-mono text-[13.5px] leading-7 text-zinc-800 outline-none placeholder:text-zinc-400" />
            ) : (
              <div className="min-h-[440px] px-6 py-5 text-[15px] leading-7"><MarkdownContent markdown={body} variant="compact" emptyFallback={<p className="text-zinc-400">Nothing to preview yet.</p>} /></div>
            )}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-zinc-100 bg-zinc-50/80 px-6 py-4">
              <span className={cn("text-[12px]", error ? "text-red-600" : "text-zinc-500")}>{error ?? "Title and Markdown body are required"}</span>
              <div className="flex items-center gap-2">
                <Link href={memory ? getMemoryHref(memory.id) : getMemoryHref()} className="px-3 text-[13px] font-semibold text-zinc-500 hover:text-zinc-950">Cancel</Link>
                <button type="button" onClick={saveMemory} disabled={!canSave || isSaving} className={cn("inline-flex h-9 items-center rounded-xl px-4 text-[13px] font-semibold text-white", canSave && !isSaving ? "bg-zinc-950 hover:bg-zinc-800" : "cursor-not-allowed bg-zinc-400")}>{isSaving ? "Saving..." : memory ? "Save changes" : "Create memory"}</button>
              </div>
            </div>
          </section>
        </div>
        <aside className="space-y-5 px-1 pt-1 lg:pt-[22px]">
          <label className="block">
            <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-zinc-400">Task</span>
            <select value={taskId} onChange={(event) => setTaskId(event.target.value)} className="mt-2 h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-[13px] text-zinc-700 outline-none focus:ring-2 focus:ring-zinc-900/15">
              <option value="">Unassigned</option>
              {workspaceData.tasks.map((task) => <option key={task.id} value={task.id}>{task.title}</option>)}
            </select>
          </label>
          {memory?.originLog ? <p className="text-[12px] leading-5 text-zinc-500">Source remains linked to <Link className="font-semibold text-zinc-700 hover:text-zinc-950" href={getLogHref(memory.originLog.id)}>{memory.originLog.title}</Link>.</p> : null}
        </aside>
      </div>
    </div>
  );
}

function MemoryBreadcrumb({ current }: { current: string }) {
  return <nav aria-label="Breadcrumb" className="mb-4 flex items-center gap-1.5 text-[13px] text-zinc-500"><Link href={getTabHref("workspace", true)} className="font-semibold text-zinc-700 hover:text-zinc-950">openlog</Link><span className="text-zinc-300">/</span>{current === "Memory" ? <span className="font-semibold text-zinc-950">Memory</span> : <><Link href={getMemoryHref()} className="font-medium text-zinc-700 hover:text-zinc-950">Memory</Link><span className="text-zinc-300">/</span><span className="max-w-[45vw] truncate font-semibold text-zinc-950">{current}</span></>}</nav>;
}

function MemoryMeta({ memory, linked = false }: { memory: WorkspaceMemoryItem; linked?: boolean }) {
  return <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[10.5px] text-zinc-400">{memory.task ? linked ? <Link href={getTaskHref(memory.task.id)} className="hover:text-zinc-700">task · {memory.task.title}</Link> : <span>task · {memory.task.title}</span> : <span>unassigned</span>}{memory.originLog ? linked ? <Link href={getLogHref(memory.originLog.id)} className="hover:text-zinc-700">log · {memory.originLog.title}</Link> : <span>from log</span> : <span>manual</span>}</div>;
}

function EmptyMemory({ title, body }: { title: string; body: string }) {
  return <div className="mt-5 rounded-2xl border border-dashed border-zinc-200 bg-white/60 px-6 py-14 text-center"><h2 className="text-[14px] font-semibold text-zinc-800">{title}</h2><p className="mx-auto mt-1.5 max-w-md text-[13px] leading-5 text-zinc-500">{body}</p></div>;
}

function EditorTab({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return <button type="button" onClick={onClick} className={cn("relative h-12 text-[14px]", active ? "font-semibold text-zinc-950 after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:bg-zinc-950" : "font-medium text-zinc-500 hover:text-zinc-950")}>{children}</button>;
}

function formatMemoryDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric", timeZone: "Asia/Seoul" }).format(date);
}
