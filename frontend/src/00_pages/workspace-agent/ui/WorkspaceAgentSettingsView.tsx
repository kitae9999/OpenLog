"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { cn } from "@/shared/lib/cn";
import {
  formatSelection,
  getImageFallbackText,
  type ToolbarAction,
  type ToolbarActionPayload,
} from "@/shared/lib/markdown/markdownFormatting";
import { MarkdownContent } from "@/shared/ui/markdown/MarkdownContent";
import { MarkdownToolbar } from "@/shared/ui/markdown/MarkdownToolbar";
import type { WorkspaceAgentSettingsData } from "@/entities/workspace/api/workspaceAgentApi";
import type {
  WorkspaceCaptureMode,
  WorkspaceProjectItem,
} from "@/entities/workspace/model/workspaceTypes";
import {
  disconnectWorkspaceProject,
  updateWorkspaceAgentGuide,
  updateWorkspaceProjectCaptureMode,
} from "@/features/workspace-agent/api/workspaceAgentActions";
import {
  AGENT_GUIDE_PAGE_LOCALES,
  agentGuidePageCopy,
  buildAgentGuidePageHref,
  type AgentGuidePageLocale,
} from "@/pages/workspace-agent/model/agentGuidePageContent";

const CAPTURE_MODE_COPY: Record<
  WorkspaceCaptureMode,
  { label: string; detail: string }
> = {
  AUTO: {
    label: "Auto",
    detail: "The agent may create or update drafts when the Guide says the work matters.",
  },
  ASK: {
    label: "Ask first",
    detail: "The agent asks before creating or updating Tasks, Logs, or Outputs.",
  },
  EXPLICIT: {
    label: "Explicit only",
    detail: "The agent acts only after a direct OpenLog request.",
  },
};

const CAPTURE_MODES = ["ASK", "AUTO", "EXPLICIT"] as const;

export function WorkspaceAgentSettingsView({
  data,
  locale,
}: {
  data: WorkspaceAgentSettingsData;
  locale: AgentGuidePageLocale;
}) {
  const copy = agentGuidePageCopy[locale];
  const [content, setContent] = useState(data.guide.content);
  const [savedContent, setSavedContent] = useState(data.guide.content);
  const [revision, setRevision] = useState(data.guide.revision);
  const [updatedAt, setUpdatedAt] = useState(data.guide.updatedAt);
  const [editorMode, setEditorMode] = useState<"write" | "preview">("write");
  const [saveState, setSaveState] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [projects, setProjects] = useState(data.workspace.projects);
  const [busyProjectId, setBusyProjectId] = useState<string | null>(null);
  const [confirmProjectId, setConfirmProjectId] = useState<string | null>(null);
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const hasGuideChanges = content !== savedContent;
  const guideMutation = useMutation({ mutationFn: updateWorkspaceAgentGuide });
  const captureModeMutation = useMutation({
    mutationFn: updateWorkspaceProjectCaptureMode,
  });
  const disconnectMutation = useMutation({ mutationFn: disconnectWorkspaceProject });

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
    const next = formatSelection(
      action,
      content,
      selectedText,
      selectionStart,
      selectionEnd,
      { fallbackText: getImageFallbackText(payload) },
    );
    setContent(next.nextValue);
    setSaveState("idle");
    window.requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(next.nextSelectionStart, next.nextSelectionEnd);
    });
  }

  async function saveGuide() {
    if (!content.trim() || !hasGuideChanges || saveState === "saving") {
      return;
    }
    setSaveState("saving");
    setMessage(null);
    const result = await guideMutation.mutateAsync({
      workspaceId: data.workspace.id,
      content,
    });
    if (!result.ok || !result.guide) {
      setSaveState("error");
      setMessage(result.message ?? "Failed to save the Agent Guide.");
      return;
    }
    setContent(result.guide.content);
    setSavedContent(result.guide.content);
    setRevision(result.guide.revision);
    setUpdatedAt(result.guide.updatedAt);
    setSaveState("saved");
  }

  async function changeCaptureMode(
    project: WorkspaceProjectItem,
    captureMode: WorkspaceCaptureMode,
  ) {
    if (project.captureMode === captureMode || busyProjectId) {
      return;
    }
    setBusyProjectId(project.id);
    setMessage(null);
    const result = await captureModeMutation.mutateAsync({
      project,
      captureMode,
    });
    setBusyProjectId(null);
    if (!result.ok) {
      setMessage(result.message ?? "Failed to update Capture Mode.");
      return;
    }
    setProjects((current) =>
      current.map((item) =>
        item.id === project.id ? { ...item, captureMode } : item,
      ),
    );
  }

  async function disconnectProject(projectId: string) {
    if (busyProjectId) {
      return;
    }
    setBusyProjectId(projectId);
    setMessage(null);
    const result = await disconnectMutation.mutateAsync({
      workspaceId: data.workspace.id,
      projectId,
    });
    setBusyProjectId(null);
    if (!result.ok) {
      setMessage(result.message ?? "Failed to disconnect the project.");
      return;
    }
    setProjects((current) => current.filter((project) => project.id !== projectId));
    setConfirmProjectId(null);
  }

  return (
    <div className="mx-auto w-full max-w-[1040px]">
      <nav
        aria-label="Breadcrumb"
        className="mb-6 flex flex-wrap items-center gap-1.5 text-[13px] text-zinc-500"
      >
        <Link href="/" className="font-medium transition hover:text-zinc-950">
          openlog
        </Link>
        <span className="text-zinc-300">/</span>
        <Link href="/settings/manage" className="transition hover:text-zinc-950">
          {copy.breadcrumbSettings}
        </Link>
        <span className="text-zinc-300">/</span>
        <span className="font-semibold text-zinc-950">
          {copy.breadcrumbCurrent}
        </span>
      </nav>

      <header className="flex flex-wrap items-end justify-between gap-4 pb-7">
        <div className="min-w-0">
          <h1 className="text-[26px] font-semibold tracking-[-0.025em] text-zinc-950">
            {data.workspace.name}
          </h1>
          <p className="mt-2 max-w-[68ch] text-[13.5px] leading-6 text-zinc-500">
            {copy.headerSubtitle}
          </p>
        </div>
        <div className="flex flex-col items-end gap-3">
          <LocaleToggle workspaceId={data.workspace.id} locale={locale} />
          <div className="text-right font-mono text-[11px] leading-5 text-zinc-400">
            <p>revision {revision}</p>
            <p>updated {formatTimestamp(updatedAt)}</p>
          </div>
        </div>
      </header>

      <section
        className="border-t border-zinc-200 py-8"
        aria-labelledby="what-is-heading"
      >
        <div className="border-b border-zinc-200 pb-3">
          <h2
            id="what-is-heading"
            className="text-[13.5px] font-semibold tracking-tight text-zinc-600"
          >
            {copy.whatIs.title}
          </h2>
        </div>
        <p className="mt-4 max-w-[68ch] text-[13px] leading-6 text-zinc-500">
          {copy.whatIs.lead}
        </p>
        <ul className="mt-4">
          {copy.whatIs.points.map((point) => (
            <li
              key={point.title}
              className="border-t border-zinc-200/80 first:border-t-0"
            >
              <div className="grid gap-1 px-2.5 py-3.5 sm:grid-cols-[180px_minmax(0,1fr)] sm:gap-4">
                <p className="text-[13px] font-medium text-zinc-950">
                  {point.title}
                </p>
                <p className="text-[12.5px] leading-5 text-zinc-500">
                  {point.body}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {message ? (
        <div
          role="status"
          className="mt-5 border-l-2 border-rose-500 bg-rose-50/70 px-3 py-2 text-[12.5px] font-medium text-rose-700"
        >
          {message}
        </div>
      ) : null}

      <section
        className="border-t border-zinc-200 py-8"
        aria-labelledby="guide-heading"
      >
        <div>
          <h2
            id="guide-heading"
            className="text-[16px] font-semibold text-zinc-950"
          >
            Workspace Guide
          </h2>
          <p className="mt-1 text-[12.5px] leading-5 text-zinc-500">
            English Markdown · loaded fresh whenever an agent starts an OpenLog
            session
          </p>
        </div>

        <div className="mt-5">
          <div className="flex items-end justify-between gap-3 border-b border-zinc-200">
            <div
              role="tablist"
              aria-label="Agent Guide editor"
              className="flex items-end gap-1"
            >
              <EditorTab
                active={editorMode === "write"}
                onClick={() => setEditorMode("write")}
              >
                Write
              </EditorTab>
              <EditorTab
                active={editorMode === "preview"}
                onClick={() => setEditorMode("preview")}
              >
                Preview
              </EditorTab>
            </div>
            <span className="pb-2.5 font-mono text-[10.5px] tabular-nums text-zinc-400">
              {content.length.toLocaleString()} / 20,000
            </span>
          </div>

          <div className="mt-3">
            <MarkdownToolbar
              disabled={editorMode === "preview"}
              onAction={insertFormatting}
            />
          </div>

          {editorMode === "write" ? (
            <label className="mt-3 block">
              <span className="sr-only">Workspace Agent Guide Markdown</span>
              <textarea
                ref={editorRef}
                value={content}
                maxLength={20_000}
                onChange={(event) => {
                  setContent(event.target.value);
                  setSaveState("idle");
                }}
                placeholder={`# What agents should know\n\n## Worth recording\n- Decisions and rationale\n- Verified fixes\n\n## Prefer\n- Task for ongoing work\n- Log for durable notes`}
                className="openlog-scroll min-h-[480px] w-full resize-none overflow-y-auto border-0 bg-transparent py-2 font-mono text-[13.5px] leading-7 text-zinc-800 outline-none placeholder:text-zinc-400"
              />
            </label>
          ) : (
            <div className="mt-3 min-h-[480px] py-2 text-[15px] leading-7 text-zinc-800">
              <MarkdownContent
                markdown={content}
                variant="compact"
                emptyFallback={
                  <p className="text-zinc-400">Nothing to preview yet.</p>
                }
              />
            </div>
          )}

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 pt-1">
            <span
              aria-live="polite"
              className={cn(
                "text-[12.5px]",
                saveState === "error"
                  ? "font-medium text-rose-600"
                  : "text-zinc-500",
              )}
            >
              {saveState === "error"
                ? guideSaveLabel(saveState, hasGuideChanges)
                : `${guideSaveLabel(saveState, hasGuideChanges)} · Markdown supported`}
            </span>
            <button
              type="button"
              onClick={saveGuide}
              disabled={
                !content.trim() || !hasGuideChanges || saveState === "saving"
              }
              className={cn(
                "cursor-pointer text-[13px] font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20",
                content.trim() && hasGuideChanges && saveState !== "saving"
                  ? "text-zinc-950 hover:text-zinc-700"
                  : "cursor-not-allowed text-zinc-400",
              )}
            >
              {saveState === "saving" ? "Saving..." : "Save Guide"}
            </button>
          </div>
        </div>
      </section>

      <section className="border-t border-zinc-200 py-8" aria-labelledby="projects-heading">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 id="projects-heading" className="text-[16px] font-semibold text-zinc-950">
              Connected projects
            </h2>
            <p className="mt-1 text-[12.5px] leading-5 text-zinc-500">
              Repository and local Git projects share this Guide but keep their own Capture Mode.
            </p>
          </div>
          <code className="rounded-md bg-zinc-100 px-2.5 py-1.5 text-[11px] text-zinc-600">
            npx @openloghq/cli@latest init
          </code>
        </div>

        {projects.length === 0 ? (
          <div className="mt-6 border-l-2 border-zinc-300 py-2 pl-4">
            <p className="text-[13px] font-medium text-zinc-700">No projects connected.</p>
            <p className="mt-1 text-[12.5px] text-zinc-500">
              Run the init command from a Git project to create the first connection.
            </p>
          </div>
        ) : (
          <ul className="mt-5 divide-y divide-zinc-200 border-y border-zinc-200">
            {projects.map((project) => (
              <ProjectRow
                key={project.id}
                project={project}
                busy={busyProjectId === project.id}
                confirming={confirmProjectId === project.id}
                onCaptureModeChange={(mode) => changeCaptureMode(project, mode)}
                onConfirm={() => setConfirmProjectId(project.id)}
                onCancel={() => setConfirmProjectId(null)}
                onDisconnect={() => disconnectProject(project.id)}
              />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function ProjectRow({
  project,
  busy,
  confirming,
  onCaptureModeChange,
  onConfirm,
  onCancel,
  onDisconnect,
}: {
  project: WorkspaceProjectItem;
  busy: boolean;
  confirming: boolean;
  onCaptureModeChange: (mode: WorkspaceCaptureMode) => void;
  onConfirm: () => void;
  onCancel: () => void;
  onDisconnect: () => void;
}) {
  return (
    <li className="grid gap-4 py-4 sm:grid-cols-[minmax(0,1fr)_220px_auto] sm:items-center">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="rounded border border-zinc-200 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.12em] text-zinc-500">
            {project.repositoryFullName ? "Remote" : "Local"}
          </span>
          <p className="truncate text-[13.5px] font-semibold text-zinc-900">
            {project.displayName}
          </p>
        </div>
        {project.repositoryFullName ? (
          <a
            href={`https://github.com/${project.repositoryFullName}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1.5 block truncate font-mono text-[11.5px] text-zinc-500 underline-offset-2 hover:text-zinc-950 hover:underline"
          >
            {project.repositoryFullName}
          </a>
        ) : (
          <p className="mt-1.5 text-[11.5px] text-zinc-500">
            Bound by project ID in local .git/config
          </p>
        )}
      </div>

      <label className="grid gap-1.5 text-[10.5px] font-semibold uppercase tracking-[0.12em] text-zinc-400">
        Capture mode
        <select
          value={project.captureMode}
          disabled={busy || confirming}
          onChange={(event) =>
            onCaptureModeChange(event.target.value as WorkspaceCaptureMode)
          }
          className="h-9 rounded-lg border border-zinc-200 bg-white px-2.5 text-[12.5px] font-medium normal-case tracking-normal text-zinc-800 outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-900/10 disabled:bg-zinc-50"
        >
          {CAPTURE_MODES.map((mode) => (
            <option key={mode} value={mode}>
              {CAPTURE_MODE_COPY[mode].label}
            </option>
          ))}
        </select>
        <span className="normal-case tracking-normal text-zinc-400">
          {CAPTURE_MODE_COPY[project.captureMode].detail}
        </span>
      </label>

      <div className="flex min-w-[126px] items-center justify-end gap-2">
        {confirming ? (
          <>
            <button
              type="button"
              onClick={onCancel}
              disabled={busy}
              className="text-[12px] font-medium text-zinc-500 hover:text-zinc-950 disabled:opacity-40"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onDisconnect}
              disabled={busy}
              className="text-[12px] font-semibold text-rose-600 hover:text-rose-800 disabled:opacity-40"
            >
              {busy ? "Disconnecting…" : "Confirm"}
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className="text-[12px] font-medium text-zinc-400 transition hover:text-rose-700 disabled:opacity-40"
          >
            Disconnect
          </button>
        )}
      </div>
    </li>
  );
}

function LocaleToggle({
  workspaceId,
  locale,
}: {
  workspaceId: string | number;
  locale: AgentGuidePageLocale;
}) {
  return (
    <div
      role="group"
      aria-label="Language"
      className="flex items-center gap-1.5 text-[12px] font-medium"
    >
      {AGENT_GUIDE_PAGE_LOCALES.map((item, index) => (
        <span key={item.key} className="flex items-center gap-1.5">
          {index > 0 ? (
            <span className="text-zinc-300" aria-hidden="true">
              /
            </span>
          ) : null}
          <Link
            href={buildAgentGuidePageHref(workspaceId, item.key)}
            aria-current={locale === item.key ? "page" : undefined}
            className={cn(
              "transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20",
              locale === item.key
                ? "font-semibold text-zinc-950"
                : "text-zinc-400 hover:text-zinc-700",
            )}
          >
            {item.label}
          </Link>
        </span>
      ))}
    </div>
  );
}

function EditorTab({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: string;
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

function guideSaveLabel(
  state: "idle" | "saving" | "saved" | "error",
  changed: boolean,
) {
  if (state === "saving") return "Saving revision…";
  if (state === "saved" && !changed) return "Saved";
  if (state === "error") return "Save failed";
  return changed ? "Unsaved changes" : "Up to date";
}

function formatTimestamp(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}
