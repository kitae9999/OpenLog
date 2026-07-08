"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useSyncExternalStore, type ReactNode } from "react";
import { cn } from "@/shared/lib/cn";
import { MarkdownContent } from "@/shared/ui/markdown";
import {
  getLogHref,
  getLogsForOutput,
  getOutputStatusLabel,
  getOutputsHref,
  getTabHref,
  getTaskHref,
  getTasksForOutput,
  workspaceTaskOutputs,
} from "./data";
import {
  getOutputOverridesSnapshot,
  getOutputWithOverrideSnapshot,
  saveOutputOverride,
  subscribeOutputOverrides,
} from "./outputOverrides";

export function OutputDetailView({
  isLoggedIn,
  outputId,
}: {
  isLoggedIn: boolean;
  outputId: string;
}) {
  const router = useRouter();
  const outputOverridesSnapshot = useSyncExternalStore(
    subscribeOutputOverrides,
    getOutputOverridesSnapshot,
    () => "{}",
  );
  const output = useMemo(
    () =>
      getOutputWithOverrideSnapshot(
        outputId,
        workspaceTaskOutputs,
        outputOverridesSnapshot,
      ) ?? null,
    [outputId, outputOverridesSnapshot],
  );
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(output?.title ?? "");
  const [content, setContent] = useState(output?.content ?? "");
  const [mode, setMode] = useState<"write" | "preview">("preview");

  if (!output) {
    return (
      <div className="rounded-2xl border border-zinc-200/70 bg-white px-6 py-12 text-center">
        <p className="text-[14px] font-medium text-zinc-600">
          Output not found.
        </p>
        <div className="mt-4">
          <LinkButton href={getOutputsHref()} tone="outline">
            Back to outputs
          </LinkButton>
        </div>
      </div>
    );
  }

  const tasks = getTasksForOutput(output);
  const logs = getLogsForOutput(output);
  const canMutate = output.status === "draft";
  const canSave = title.trim().length > 0 && content.trim().length > 0;

  function saveChanges() {
    if (!canSave || !output) {
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
    setMode("preview");
    router.refresh();
  }

  function publishOutput() {
    if (!output || !canMutate) {
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
    setMode("preview");
  }

  function archiveOutput() {
    if (!output || !canMutate) {
      return;
    }

    const nextOutput = {
      ...output,
      status: "archived" as const,
      updatedLabel: "Just now",
    };
    saveOutputOverride(nextOutput);
    setIsEditing(false);
    setMode("preview");
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
        <span className="truncate font-mono text-[12px] text-zinc-950">
          {output.id}
        </span>
      </nav>

      <article className="overflow-hidden rounded-2xl border border-zinc-200/70 bg-white">
        <header className="border-b border-zinc-100 px-6 pb-5 pt-[22px]">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <p className="inline-flex items-center gap-2 text-[11.5px] font-semibold uppercase tracking-[0.1em] text-zinc-400">
                <span className="size-2 rounded-full bg-zinc-950" />
                {getOutputStatusLabel(output.status)}
              </p>
              {isEditing ? (
                <label className="mt-3 block">
                  <span className="sr-only">Output title</span>
                  <input
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    className="w-full border-0 bg-transparent p-0 font-[family-name:var(--font-georgia,Georgia,serif)] text-2xl font-bold tracking-[-0.01em] text-zinc-950 outline-none placeholder:text-zinc-300"
                  />
                </label>
              ) : (
                <h1 className="mt-2.5 max-w-[52ch] font-[family-name:var(--font-georgia,Georgia,serif)] text-2xl font-bold tracking-[-0.01em] text-zinc-950">
                  {output.title}
                </h1>
              )}
              <p className="mt-2 text-[12.5px] text-zinc-500">
                {output.description} · Updated {output.updatedLabel}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {canMutate && !isEditing ? (
                <button
                  type="button"
                  onClick={() => {
                    setTitle(output.title);
                    setContent(output.content);
                    setIsEditing(true);
                    setMode("write");
                  }}
                  className="inline-flex h-[30px] items-center rounded-[10px] border border-zinc-200 bg-white px-[13px] text-[12.5px] font-semibold text-zinc-950 transition hover:bg-zinc-50"
                >
                  Edit
                </button>
              ) : null}
              {canMutate ? (
                <>
                  <button
                    type="button"
                    onClick={publishOutput}
                    className="inline-flex h-[30px] items-center rounded-[10px] bg-zinc-950 px-[13px] text-[12.5px] font-semibold text-white transition hover:bg-zinc-800"
                  >
                    Publish
                  </button>
                  <button
                    type="button"
                    onClick={archiveOutput}
                    className="inline-flex h-[30px] items-center rounded-[10px] px-[13px] text-[12.5px] font-semibold text-zinc-500 transition hover:text-zinc-950"
                  >
                    Archive
                  </button>
                </>
              ) : null}
              {output.publishedHref ? (
                <LinkButton href={output.publishedHref} tone="solid">
                  Open post
                </LinkButton>
              ) : null}
            </div>
          </div>
        </header>

        <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(300px,340px)]">
          <section className="min-w-0">
            {isEditing ? (
              <>
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
                  <textarea
                    value={content}
                    onChange={(event) => setContent(event.target.value)}
                    className="min-h-[520px] w-full resize-y border-0 bg-white px-6 py-5 font-mono text-[13.5px] leading-7 text-zinc-800 outline-none placeholder:text-zinc-400"
                  />
                ) : (
                  <Preview content={content} />
                )}
              </>
            ) : (
              <Preview content={output.content} />
            )}
          </section>

          <aside className="border-t border-zinc-100 bg-zinc-50 px-[18px] py-5 lg:border-l lg:border-t-0">
            <SourceBlock label="TASKS">
              {tasks.length === 0 ? (
                <p className="text-[12.5px] text-zinc-500">No task source.</p>
              ) : (
                <div className="space-y-2">
                  {tasks.map((task) => (
                    <Link
                      key={task.id}
                      href={getTaskHref(task.id)}
                      className="block rounded-xl border border-zinc-200 bg-white p-3 transition hover:border-zinc-300"
                    >
                      <span className="block text-[12.5px] font-semibold text-zinc-900">
                        {task.title}
                      </span>
                      <span className="mt-0.5 block text-[11.5px] text-zinc-500">
                        {task.status}
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </SourceBlock>

            <SourceBlock label="LOGS">
              {logs.length === 0 ? (
                <p className="text-[12.5px] text-zinc-500">No log source.</p>
              ) : (
                <div className="space-y-2">
                  {logs.map((log) => (
                    <Link
                      key={log.id}
                      href={getLogHref(log.id)}
                      className="block rounded-xl border border-zinc-200 bg-white p-3 transition hover:border-zinc-300"
                    >
                      <span className="block text-[12.5px] font-semibold text-zinc-900">
                        {log.title}
                      </span>
                      <span className="mt-0.5 block text-[11.5px] text-zinc-500">
                        {log.label} · {log.meta.split(" · ")[0]}
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </SourceBlock>
          </aside>
        </div>

        {isEditing ? (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-zinc-100 bg-zinc-50/80 px-6 py-4">
            <span className="text-[12px] text-zinc-500">
              Draft outputs can be edited before publish.
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setTitle(output.title);
                  setContent(output.content);
                  setIsEditing(false);
                  setMode("preview");
                }}
                className="inline-flex h-9 items-center rounded-xl px-4 text-[13.5px] font-semibold text-zinc-500 transition hover:text-zinc-950"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveChanges}
                disabled={!canSave}
                className={cn(
                  "inline-flex h-9 items-center rounded-xl px-4 text-[13.5px] font-semibold text-white transition",
                  canSave
                    ? "bg-zinc-950 hover:bg-zinc-800"
                    : "cursor-not-allowed bg-zinc-400",
                )}
              >
                Save changes
              </button>
            </div>
          </div>
        ) : null}
      </article>
    </div>
  );
}

function Preview({ content }: { content: string }) {
  return (
    <div className="min-h-[520px] px-6 py-5 text-[15px] leading-7 text-zinc-800">
      <MarkdownContent
        markdown={content}
        variant="compact"
        emptyFallback={<p className="text-zinc-400">Nothing to preview yet.</p>}
      />
    </div>
  );
}

function SourceBlock({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="mb-6 last:mb-0">
      <h2 className="text-[11px] font-semibold uppercase tracking-[0.1em] text-zinc-400">
        {label}
      </h2>
      <div className="mt-2">{children}</div>
    </div>
  );
}

function LinkButton({
  href,
  tone,
  children,
}: {
  href: string;
  tone: "solid" | "outline";
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex h-[30px] items-center justify-center rounded-[10px] px-[13px] text-[12.5px] font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20",
        tone === "solid" && "bg-zinc-950 text-white hover:bg-zinc-800",
        tone === "outline" &&
          "border border-zinc-200 bg-white text-zinc-950 hover:bg-zinc-50",
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
