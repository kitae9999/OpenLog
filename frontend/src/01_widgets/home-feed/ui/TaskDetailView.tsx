import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/shared/lib/cn";
import {
  countUnassignedLogs,
  getLogsForTask,
  getSpawnedTodosForTask,
  getTabHref,
  getTaskBranches,
  getTaskMeta,
  type WorkspaceLogItem,
  type WorkspaceWorkItem,
  type WorkspaceWorkStatus,
  type WorkspaceTone,
} from "./data";

export function TaskDetailView({ task }: { task: WorkspaceWorkItem }) {
  const logs = getLogsForTask(task.id);
  const branches = getTaskBranches(task.id);
  const meta = getTaskMeta(task.id);
  const spawnedTodos = getSpawnedTodosForTask(task.id);
  const unassignedCount = countUnassignedLogs();
  const statusLabel =
    task.status === "doing"
      ? "doing"
      : task.status === "done"
        ? "done"
        : "todo";

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
        <span>Tasks</span>
        <span className="text-zinc-300">/</span>
        <span className="truncate font-mono text-[12px] text-zinc-950">
          {task.id}
        </span>
      </nav>

      <article className="overflow-hidden rounded-2xl border border-zinc-200/70 bg-white">
        <header className="border-b border-zinc-100 px-6 pb-[18px] pt-[22px]">
          <div className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-zinc-600">
            <TaskStatusDot status={task.status} />
            {statusLabel}
          </div>
          <h1 className="mt-2.5 max-w-[48ch] text-balance font-[family-name:var(--font-georgia,Georgia,serif)] text-2xl font-bold tracking-[-0.01em] text-zinc-950">
            {task.title}
          </h1>
          <dl className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-zinc-400">
            <div>
              Started{" "}
              <dd className="inline font-semibold text-zinc-700">
                {meta.startedLabel}
              </dd>
            </div>
            <div>
              <dd className="inline font-semibold text-zinc-700">{logs.length}</dd>{" "}
              logs linked
            </div>
            {branches.length > 0 ? (
              <div>
                <dd className="inline font-semibold text-zinc-700">
                  {branches.length}
                </dd>{" "}
                branches (from logs)
              </div>
            ) : null}
            <div>
              Last activity{" "}
              <dd className="inline font-semibold text-zinc-700">
                {meta.lastActivityLabel}
              </dd>
            </div>
          </dl>
          <div className="mt-3.5 flex flex-wrap gap-2">
            <LinkButton href="/write" tone="solid" size="sm">
              Log to this task
            </LinkButton>
            {task.status !== "done" ? (
              <LinkButton href="/write" tone="outline" size="sm">
                Mark done
              </LinkButton>
            ) : null}
            <LinkButton href="/write" tone="ghost" size="sm">
              Edit title
            </LinkButton>
          </div>
        </header>

        <div className="grid lg:grid-cols-[minmax(0,1fr)_256px]">
          <section className="min-w-0 px-6 pb-6 pt-1">
            <div className="flex items-center justify-between gap-3 pt-3.5">
              <h2 className="text-[11.5px] font-semibold uppercase tracking-[0.1em] text-zinc-400">
                LOGS
              </h2>
              {unassignedCount > 0 ? (
                <Link
                  href="/write"
                  className="text-[12px] font-medium text-zinc-500 transition hover:text-zinc-950"
                >
                  Unassigned ({unassignedCount})
                </Link>
              ) : null}
            </div>
            <div className="pb-1.5 pt-1.5">
              {logs.length === 0 ? (
                <p className="py-6 text-[13px] text-zinc-500">
                  No logs linked yet.
                </p>
              ) : (
                logs.map((log) => <TaskLogRow key={log.id} log={log} />)
              )}
            </div>
            <Link
              href="/write"
              className="inline-flex text-[12.5px] font-medium text-zinc-400 transition hover:text-zinc-950"
            >
              + Link existing log
            </Link>
          </section>

          <aside className="flex flex-col gap-2 border-t border-zinc-100 bg-zinc-50 px-[18px] py-5 lg:border-l lg:border-t-0">
            <SidebarBlock label="OUTPUTS">
              {task.status === "done" ? (
                <>
                  <p className="text-[12px] text-zinc-500">
                    PR doc draft · {logs.length} logs
                  </p>
                  <LinkButton href="/write" tone="outline" size="sm">
                    Generate PR doc
                  </LinkButton>
                </>
              ) : (
                <p className="text-[12px] text-zinc-400">
                  No drafts yet. Mark done to generate.
                </p>
              )}
            </SidebarBlock>

            {branches.length > 0 ? (
              <SidebarBlock label="BRANCHES">
                <p className="text-[11.5px] text-zinc-400">
                  Captured across logs — not a task property.
                </p>
                <ul className="space-y-1.5">
                  {branches.map(({ branch, count }) => (
                    <li
                      key={branch}
                      className="flex flex-wrap items-center gap-2"
                    >
                      <CodePill>{branch}</CodePill>
                      <span className="text-[11px] text-zinc-400">
                        {count} log{count === 1 ? "" : "s"}
                      </span>
                    </li>
                  ))}
                </ul>
              </SidebarBlock>
            ) : null}

            {spawnedTodos.length > 0 ? (
              <SidebarBlock label="SPAWNED TODOS">
                <ul className="space-y-2">
                  {spawnedTodos.map(({ todo, link }) => (
                    <li key={todo.id}>
                      <p className="text-[12px] text-zinc-600">{todo.title}</p>
                      <p className="mt-0.5 text-[11px] text-zinc-400">
                        from log
                        {link.dueLabel ? ` · ${link.dueLabel}` : ""}
                      </p>
                    </li>
                  ))}
                </ul>
              </SidebarBlock>
            ) : null}

            <SidebarBlock label="ACTIONS">
              <div className="flex flex-col gap-2">
                {task.status !== "done" ? (
                  <LinkButton href="/write" tone="outline" size="sm">
                    Mark done
                  </LinkButton>
                ) : (
                  <LinkButton href="/write" tone="outline" size="sm">
                    Generate PR doc
                  </LinkButton>
                )}
                <LinkButton href="/write" tone="ghost" size="sm">
                  Delete task
                </LinkButton>
              </div>
            </SidebarBlock>
          </aside>
        </div>
      </article>
    </div>
  );
}

function TaskLogRow({ log }: { log: WorkspaceLogItem }) {
  return (
    <article className="flex items-start gap-3 border-t border-zinc-100 py-3 first:border-t-0">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <ToneBadge tone={log.tone}>{log.label}</ToneBadge>
          <h3 className="text-[14px] font-semibold text-zinc-950">{log.title}</h3>
        </div>
        <p className="mt-0.5 text-[12.5px] leading-5 text-zinc-500">
          {log.description}
        </p>
        <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[11.5px] text-zinc-400">
          <span>{formatLogMeta(log.meta)}</span>
          {log.branch ? <CodePill>{log.branch}</CodePill> : null}
          {log.commit ? <CodePill>{log.commit}</CodePill> : null}
        </div>
      </div>
      <Link
        href={log.href}
        className="shrink-0 self-center text-[12.5px] font-medium text-zinc-400 transition hover:text-zinc-950"
      >
        Open
      </Link>
    </article>
  );
}

function formatLogMeta(meta: string) {
  return meta.split(" · ")[0] ?? meta;
}

function SidebarBlock({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="pt-2 first:pt-0">
      <h3 className="text-[11px] font-semibold uppercase tracking-[0.1em] text-zinc-400">
        {label}
      </h3>
      <div className="mt-2 space-y-2">{children}</div>
    </div>
  );
}

function TaskStatusDot({ status }: { status: WorkspaceWorkStatus }) {
  return (
    <span
      className={cn(
        "size-[9px] shrink-0 rounded-full",
        status === "doing" && "border-2 border-blue-600",
        status === "done" && "bg-green-600",
        status === "todo" && "border-2 border-zinc-300",
      )}
    />
  );
}

function ToneBadge({
  tone,
  children,
}: {
  tone: WorkspaceTone;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-full border px-2.5 py-0.5 text-[11.5px] font-semibold",
        tone === "blue" && "border-blue-200 bg-blue-50 text-blue-700",
        tone === "green" && "border-green-200 bg-green-50 text-green-700",
        tone === "amber" && "border-amber-200 bg-amber-50 text-amber-700",
        tone === "zinc" && "border-zinc-200 bg-zinc-50 text-zinc-600",
      )}
    >
      {children}
    </span>
  );
}

function CodePill({ children }: { children: React.ReactNode }) {
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
