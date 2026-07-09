import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/shared/lib/cn";
import { MarkdownContent } from "@/shared/ui/markdown";
import {
  activeWorkspaceTaskId,
  getLogBody,
  getLogEditHref,
  getLogRecipe,
  getTabHref,
  getTaskById,
  getTaskHref,
  type WorkspaceLogItem,
} from "./data";
import { LogTypeLabel } from "./LogTypeLabel";
import type { WorkspaceUiData } from "./workspaceTypes";

export function LogDetailView({
  log,
  workspaceData,
}: {
  log: WorkspaceLogItem;
  workspaceData?: WorkspaceUiData | null;
}) {
  const recipe = getLogRecipe(log.id);
  const body = getLogBody(log);
  const task = log.taskId
    ? workspaceData?.tasks.find((item) => item.id === log.taskId) ??
      getTaskById(log.taskId)
    : undefined;
  const activeTask =
    workspaceData?.tasks[0] ?? getTaskById(activeWorkspaceTaskId);
  const hasBody = body.trim().length > 0;

  return (
    <div>
      <nav
        aria-label="Breadcrumb"
        className="mb-4 flex flex-wrap items-center gap-1.5 text-[13px] text-zinc-500"
      >
        <Link
          href={getTabHref("workspace", true)}
          className="font-semibold text-zinc-700 transition hover:text-zinc-950"
        >
          openlog
        </Link>
        <span className="text-zinc-300">/</span>
        <span>Logs</span>
        <span className="text-zinc-300">/</span>
        <span className="truncate font-mono text-[12px] text-zinc-950">
          {log.id}
        </span>
      </nav>

      <article className="overflow-hidden rounded-2xl border border-zinc-200/70 bg-white">
        <header className="border-b border-zinc-100 px-6 pb-[18px] pt-[22px]">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <LogTypeLabel>{log.label}</LogTypeLabel>
            {log.branch ? <CodePill>{log.branch}</CodePill> : null}
            {recipe?.visibility ? (
              <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-zinc-400">
                {recipe.visibility}
              </span>
            ) : null}
          </div>
          <h1 className="mt-3 max-w-[48ch] text-balance font-[family-name:var(--font-georgia,Georgia,serif)] text-2xl font-bold tracking-[-0.01em] text-zinc-950">
            {log.title}
          </h1>
          <dl className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[12px] text-zinc-400">
            <div>{log.meta}</div>
            {recipe?.source ? <div>Source: {recipe.source}</div> : null}
            {log.commit ? <div>1 related commit</div> : null}
            <div className="flex flex-wrap items-center gap-1.5">
              <span>Task</span>
              {task ? (
                <TaskLink label={task.title} href={getTaskHref(task.id)} />
              ) : activeTask ? (
                <Link
                  href="/write"
                  className="font-semibold text-zinc-600 underline-offset-2 transition hover:text-zinc-950 hover:underline"
                >
                  Assign to {activeTask.title}
                </Link>
              ) : (
                <span className="font-semibold text-zinc-500">Unassigned</span>
              )}
            </div>
          </dl>

          <div className="mt-3.5 flex flex-wrap gap-2">
            <LinkButton href="/write" tone="outline" size="sm">
              Save to memory
            </LinkButton>
            <LinkButton href={getLogEditHref(log.id)} tone="ghost" size="sm">
              Edit
            </LinkButton>
          </div>
        </header>

        <section className="min-w-0 px-6 pb-6 py-5">
          {hasBody ? (
            <div className="max-w-none text-[15px] leading-7 text-zinc-800">
              <MarkdownContent markdown={body} variant="compact" />
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50/80 px-5 py-8 text-center">
              <p className="text-[14px] font-medium text-zinc-600">
                No log content yet.
              </p>
              <p className="mt-1 text-[13px] text-zinc-500">
                Write the recipe in markdown — problem, cause, fix, verification.
              </p>
              <div className="mt-4">
                <LinkButton href={getLogEditHref(log.id)} tone="outline" size="sm">
                  Write log content
                </LinkButton>
              </div>
            </div>
          )}
        </section>
      </article>
    </div>
  );
}

function TaskLink({ label, href }: { label: string; href: string }) {
  return (
    <Link
      href={href}
      title={label}
      className="inline-flex max-w-[min(100%,220px)] items-center truncate rounded-md bg-zinc-100 px-[7px] py-0.5 text-[10.5px] font-semibold text-zinc-600 transition hover:bg-zinc-200 hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20"
    >
      {label}
    </Link>
  );
}

function CodePill({ children }: { children: ReactNode }) {
  return (
    <code className="rounded-md bg-zinc-100 px-[7px] py-0.5 font-mono text-[10.5px] text-zinc-500">
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
          ? "h-[30px] rounded-[10px] px-[13px] text-[12.5px]"
          : "h-9 rounded-xl px-4 text-[13.5px]",
        tone === "solid" && "bg-zinc-950 text-white hover:bg-zinc-800",
        tone === "outline" &&
          "border border-zinc-200 bg-white text-zinc-950 hover:bg-zinc-50",
        tone === "ghost" && "text-zinc-500 hover:text-zinc-950",
      )}
    >
      {children}
    </Link>
  );
}
