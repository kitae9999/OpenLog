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
  getLogHref,
  getLogsHref,
  getTabHref,
} from "./data";
import { createLogOverride } from "./logOverrides";
import { createWorkspaceLog } from "./workspaceActions";
import type { WorkspaceUiData } from "./workspaceTypes";

type LogKind = "ISSUE" | "FIX" | "DECISION" | "NOTE";

const kindOptions: Array<{ value: LogKind; label: string }> = [
  { value: "NOTE", label: "Note" },
  { value: "ISSUE", label: "Issue" },
  { value: "FIX", label: "Fix" },
  { value: "DECISION", label: "Decision" },
];

export function LogCreateView({
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
  const [kind, setKind] = useState<LogKind>("NOTE");
  const [taskId, setTaskId] = useState(initialTaskId ?? "");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [mode, setMode] = useState<"write" | "preview">("write");
  const editorRef = useRef<HTMLTextAreaElement>(null);

  const trimmedTitle = title.trim();
  const trimmedBody = body.trim();
  const canSave = trimmedTitle.length > 0 && trimmedBody.length > 0;

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

    if (workspaceData) {
      const result = await createWorkspaceLog({
        workspaceId: workspaceData.workspaceId,
        kind,
        title: trimmedTitle,
        content: body,
        taskId: taskId || null,
        status: kind === "ISSUE" ? "OPEN" : "NONE",
      });

      setIsSaving(false);

      if (!result.ok || !result.href) {
        setError(result.message ?? "Failed to create log.");
        return;
      }

      router.push(result.href);
      router.refresh();
      return;
    }

    const log = createLogOverride({
      kind,
      title: trimmedTitle,
      body,
      taskId: taskId || undefined,
    });

    setIsSaving(false);
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
          href={getTabHref("workspace", isLoggedIn)}
          className="font-semibold text-zinc-700 transition hover:text-zinc-950"
        >
          openlog
        </Link>
        <span className="text-zinc-300">/</span>
        <Link
          href={getLogsHref()}
          className="font-medium text-zinc-700 transition hover:text-zinc-950"
        >
          Logs
        </Link>
        <span className="text-zinc-300">/</span>
        <span className="font-semibold text-zinc-950">New</span>
      </nav>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(240px,280px)] lg:items-start">
        <div className="min-w-0 space-y-4">
          <header className="px-1 pt-1">
            <p className="text-[11.5px] font-semibold uppercase tracking-[0.1em] text-zinc-400">
              New log
            </p>
            <label className="mt-3 block">
              <span className="sr-only">Log title</span>
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Log title"
                className="w-full border-0 bg-transparent p-0 text-[20px] font-bold tracking-[-0.01em] text-zinc-950 outline-none placeholder:text-zinc-300"
              />
            </label>
          </header>

          <section className="overflow-hidden rounded-2xl border border-zinc-200/70 bg-white">
            <div className="border-b border-zinc-100 bg-zinc-50/80 px-4">
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
          </section>

          <div className="flex flex-wrap items-center justify-between gap-3 px-1 pt-1">
            <span className="text-[12px] text-zinc-500">
              {error ?? "Title and body are required"}
            </span>
            <div className="flex items-center gap-2">
              <Link
                href={getLogsHref()}
                className="inline-flex h-9 items-center rounded-xl px-4 text-[13.5px] font-semibold text-zinc-500 transition hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20"
              >
                Cancel
              </Link>
              <button
                type="button"
                onClick={saveLog}
                disabled={!canSave || isSaving}
                className={cn(
                  "inline-flex h-9 items-center rounded-xl px-4 text-[13.5px] font-semibold text-white transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20",
                  canSave && !isSaving
                    ? "bg-zinc-950 hover:bg-zinc-800"
                    : "cursor-not-allowed bg-zinc-400",
                )}
              >
                {isSaving ? "Creating..." : "Create log"}
              </button>
            </div>
          </div>
        </div>

        <aside className="space-y-5 px-1 pt-[22px] lg:px-0">
          <FieldSelect
            label="Kind"
            value={kind}
            onChange={(value) => setKind(value as LogKind)}
          >
            {kindOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </FieldSelect>

          <FieldSelect label="Task" value={taskId} onChange={setTaskId}>
            <option value="">Unassigned</option>
            {tasks.map((task) => (
              <option key={task.id} value={task.id}>
                {task.title}
              </option>
            ))}
          </FieldSelect>
        </aside>
      </div>
    </div>
  );
}

function FieldSelect({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-[11px] font-medium tracking-wide text-zinc-400">
        {label}
      </span>
      <div className="relative mt-1.5">
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-9 w-full appearance-none border-0 border-b border-zinc-200 bg-transparent py-1.5 pr-7 text-[13.5px] font-medium text-zinc-900 outline-none transition hover:border-zinc-300 focus:border-zinc-900"
        >
          {children}
        </select>
        <IconChevronDown className="pointer-events-none absolute right-0 top-1/2 size-3.5 -translate-y-1/2 text-zinc-400" />
      </div>
    </label>
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

function IconChevronDown({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M6 9l6 6 6-6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
