"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, type ReactNode } from "react";
import { cn } from "@/shared/lib/cn";
import { MarkdownContent } from "@/shared/ui/markdown";
import {
  getLogBody,
  getLogsForTask,
  getOutputHref,
  getOutputsHref,
  getTabHref,
  workspaceWorkItems,
} from "./data";
import { createOutputOverride } from "./outputOverrides";

export function OutputCreateView({
  isLoggedIn,
  initialTaskId,
}: {
  isLoggedIn: boolean;
  initialTaskId?: string;
}) {
  const router = useRouter();
  const initialTask =
    workspaceWorkItems.find((task) => task.id === initialTaskId) ??
    workspaceWorkItems[0];
  const [taskId, setTaskId] = useState(initialTask?.id ?? "");
  const candidateLogs = useMemo(() => getLogsForTask(taskId), [taskId]);
  const [selectedLogIds, setSelectedLogIds] = useState<string[]>(() =>
    candidateLogs.map((log) => log.id),
  );
  const [title, setTitle] = useState(initialTask ? `${initialTask.title} 정리` : "");
  const [content, setContent] = useState(() => {
    const source = candidateLogs.slice(0, 2);
    if (source.length === 0) {
      return "## Summary\n\n";
    }

    return `## Summary\n\n${source.map((log) => log.description).join("\n\n")}\n\n## Source logs\n\n${source.map((log) => `- ${log.title}`).join("\n")}`;
  });
  const [mode, setMode] = useState<"write" | "preview">("write");
  const trimmedTitle = title.trim();
  const canSave = trimmedTitle.length > 0 && content.trim().length > 0;

  function changeTask(nextTaskId: string) {
    setTaskId(nextTaskId);
    setSelectedLogIds(getLogsForTask(nextTaskId).map((log) => log.id));
  }

  function toggleLog(logId: string) {
    setSelectedLogIds((current) =>
      current.includes(logId)
        ? current.filter((id) => id !== logId)
        : [...current, logId],
    );
  }

  function saveOutput() {
    if (!canSave) {
      return;
    }

    const output = createOutputOverride({
      title: trimmedTitle,
      description:
        selectedLogIds.length > 0
          ? `from ${selectedLogIds.length} log${selectedLogIds.length === 1 ? "" : "s"}`
          : "manual draft",
      content,
      taskIds: taskId ? [taskId] : [],
      logIds: selectedLogIds,
    });

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

      <article className="overflow-hidden rounded-2xl border border-zinc-200/70 bg-white">
        <header className="border-b border-zinc-100 px-6 pb-5 pt-[22px]">
          <p className="text-[11.5px] font-semibold uppercase tracking-[0.1em] text-zinc-400">
            New output
          </p>
          <label className="mt-3 block">
            <span className="sr-only">Output title</span>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Output title"
              className="w-full border-0 bg-transparent p-0 font-[family-name:var(--font-georgia,Georgia,serif)] text-2xl font-bold tracking-[-0.01em] text-zinc-950 outline-none placeholder:text-zinc-300"
            />
          </label>
        </header>

        <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(300px,340px)]">
          <section className="min-w-0">
            <div className="border-b border-zinc-100 bg-zinc-50/80 px-4">
              <div className="flex items-center gap-4">
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
            </div>

            {mode === "write" ? (
              <label className="block">
                <span className="sr-only">Output content</span>
                <textarea
                  value={content}
                  onChange={(event) => setContent(event.target.value)}
                  placeholder="## Summary&#10;&#10;Write the refined document here."
                  className="min-h-[520px] w-full resize-y border-0 bg-white px-6 py-5 font-mono text-[13.5px] leading-7 text-zinc-800 outline-none placeholder:text-zinc-400"
                />
              </label>
            ) : (
              <div className="min-h-[520px] px-6 py-5 text-[15px] leading-7 text-zinc-800">
                <MarkdownContent
                  markdown={content}
                  variant="compact"
                  emptyFallback={<p className="text-zinc-400">Nothing to preview yet.</p>}
                />
              </div>
            )}
          </section>

          <aside className="border-t border-zinc-100 bg-zinc-50 px-[18px] py-5 lg:border-l lg:border-t-0">
            <label className="block">
              <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-zinc-400">
                Task
              </span>
              <select
                value={taskId}
                onChange={(event) => changeTask(event.target.value)}
                className="mt-2 h-9 w-full rounded-[10px] border border-zinc-200 bg-white px-3 text-[13px] font-medium text-zinc-800 outline-none focus:ring-2 focus:ring-zinc-900/10"
              >
                {workspaceWorkItems.map((task) => (
                  <option key={task.id} value={task.id}>
                    {task.title}
                  </option>
                ))}
              </select>
            </label>

            <div className="mt-5">
              <h2 className="text-[11px] font-semibold uppercase tracking-[0.1em] text-zinc-400">
                Source logs
              </h2>
              <div className="mt-2 space-y-2">
                {candidateLogs.length === 0 ? (
                  <p className="text-[12.5px] text-zinc-500">
                    No logs for this task.
                  </p>
                ) : (
                  candidateLogs.map((log) => (
                    <label
                      key={log.id}
                      className="flex cursor-pointer items-start gap-2 rounded-xl border border-zinc-200 bg-white p-3 transition hover:border-zinc-300"
                    >
                      <input
                        type="checkbox"
                        checked={selectedLogIds.includes(log.id)}
                        onChange={() => toggleLog(log.id)}
                        className="mt-1 size-3.5 rounded border-zinc-300 text-zinc-950 focus:ring-zinc-900/20"
                      />
                      <span className="min-w-0">
                        <span className="block text-[12.5px] font-semibold text-zinc-900">
                          {log.title}
                        </span>
                        <span className="mt-0.5 line-clamp-2 block text-[11.5px] leading-4 text-zinc-500">
                          {getLogBody(log).replace(/^#+\s+/gm, "").slice(0, 120)}
                        </span>
                      </span>
                    </label>
                  ))
                )}
              </div>
            </div>
          </aside>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-zinc-100 bg-zinc-50/80 px-6 py-4">
          <span className="text-[12px] text-zinc-500">
            {selectedLogIds.length} source log{selectedLogIds.length === 1 ? "" : "s"} selected
          </span>
          <div className="flex items-center gap-2">
            <Link
              href={getOutputsHref()}
              className="inline-flex h-9 items-center rounded-xl px-4 text-[13.5px] font-semibold text-zinc-500 transition hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20"
            >
              Cancel
            </Link>
            <button
              type="button"
              onClick={saveOutput}
              disabled={!canSave}
              className={cn(
                "inline-flex h-9 items-center rounded-xl px-4 text-[13.5px] font-semibold text-white transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20",
                canSave
                  ? "bg-zinc-950 hover:bg-zinc-800"
                  : "cursor-not-allowed bg-zinc-400",
              )}
            >
              Save output
            </button>
          </div>
        </div>
      </article>
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
      onClick={onClick}
      className={cn(
        "relative h-12 text-[15px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20",
        active
          ? "font-semibold text-zinc-950"
          : "font-medium text-zinc-500 hover:text-zinc-950",
      )}
    >
      {children}
      {active ? <span className="absolute inset-x-0 bottom-0 h-0.5 bg-zinc-950" /> : null}
    </button>
  );
}
