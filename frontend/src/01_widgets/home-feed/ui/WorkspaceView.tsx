import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  forwardRef,
  useEffect,
  useRef,
  useState,
  useTransition,
  type ReactNode,
} from "react";
import { handleOAuth } from "@/features/auth/api/handleOAuth";
import { cn } from "@/shared/lib/cn";
import { todayIso } from "@/shared/lib/todayIso";
import { GitHubIcon } from "@/shared/ui/icons";
import {
  getLogHref,
  getLogsHref,
  getNewOutputHref,
  getTaskExcerpt,
  getTaskHref,
  getTasksHref,
  getWorkspaceGraphHref,
  workspaceLogs,
  workspaceMemories,
  workspaceTodos,
  workspaceMonthGrass,
  workspaceMonthLabel,
  workspaceWorkItems,
  type WorkspaceLogItem,
  type WorkspaceTodoItem,
  type WorkspaceWorkItem,
  type WorkspaceWorkStatus,
} from "./data";
import { LogTypeLabel } from "./LogTypeLabel";
import { WorkspaceRepositoryLink } from "./WorkspaceRepositoryLink";
import {
  createWorkspaceTodo,
  deleteWorkspaceTodo,
  updateWorkspaceTodoDone,
} from "./workspaceActions";
import type { WorkspaceActionResult } from "./workspaceActions";
import type { WorkspaceUiData } from "./workspaceTypes";

export function WorkspaceView({
  isLoggedIn,
  workspaceData,
  createTodoOverride,
}: {
  isLoggedIn: boolean;
  workspaceData?: WorkspaceUiData | null;
  createTodoOverride?: (title: string) => Promise<WorkspaceActionResult>;
}) {
  const isPreview = !isLoggedIn;
  const dashboard = (
    <WorkspaceDashboard
      isPreview={isPreview}
      workspaceData={workspaceData}
      createTodoOverride={createTodoOverride}
    />
  );

  if (isLoggedIn) {
    return dashboard;
  }

  return <GuestWorkspacePreview>{dashboard}</GuestWorkspacePreview>;
}

function WorkspaceDashboard({
  isPreview = false,
  workspaceData,
  createTodoOverride,
}: {
  isPreview?: boolean;
  workspaceData?: WorkspaceUiData | null;
  createTodoOverride?: (title: string) => Promise<WorkspaceActionResult>;
}) {
  const tasks = workspaceData?.tasks ?? workspaceWorkItems;
  const logs = workspaceData?.logs ?? workspaceLogs;
  const todos = workspaceData?.todos ?? workspaceTodos;

  return (
    <div className="space-y-3.5">
      {isPreview ? <DemoRepositoryBanner /> : <WorkspaceRepositoryLink />}
      <div className="grid items-start gap-3.5 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <div className="min-w-0 space-y-3.5">
          <NowWorkingCard tasks={tasks} logs={logs} isPreview={isPreview} />
          <WorkTasksCard tasks={tasks} logs={logs} isPreview={isPreview} />
          <RecentLogsCard tasks={tasks} logs={logs} isPreview={isPreview} />
        </div>

        <div className="min-w-0 space-y-3.5">
          <TodosCard
            todos={todos}
            workspaceId={workspaceData?.workspaceId}
            isPreview={isPreview}
            createTodoOverride={createTodoOverride}
          />
          <MonthActivityCard />
          <GraphCard isPreview={isPreview} />
          <OpenIssuesCard logs={logs} isPreview={isPreview} />
          <MemoryCard />
        </div>
      </div>
    </div>
  );
}

function GuestWorkspacePreview({ children }: { children: ReactNode }) {
  return (
    <section aria-label="Workspace preview" className="relative">
      <div inert className="max-h-[640px] overflow-hidden xl:max-h-[860px]">
        {children}
      </div>

      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[38%] bg-gradient-to-t from-zinc-50 via-zinc-50/95 to-zinc-50/0 xl:h-[46%]"
        aria-hidden="true"
      />

      <div className="absolute inset-x-4 top-[min(52dvh,440px)] z-10 -translate-y-1/2 sm:inset-x-auto sm:left-1/2 sm:w-[440px] sm:-translate-x-1/2 xl:top-[min(58dvh,520px)]">
        <div className="rounded-2xl border border-zinc-200/80 bg-white/95 p-5 shadow-[0_24px_80px_rgba(24,24,27,0.16)] backdrop-blur">
          <div className="flex items-start gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-zinc-950 text-[19px] font-bold leading-none text-white [font-family:Georgia,serif]">
              O
            </span>
            <div className="min-w-0">
              <h2 className="text-[18px] font-bold tracking-[-0.01em] text-zinc-950">
                Create your workspace
              </h2>
              <p className="mt-1.5 text-[13.5px] leading-6 text-zinc-500">
                Commits and coding sessions are captured automatically, then
                become refined drafts and public posts when you choose.
              </p>
            </div>
          </div>

          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => handleOAuth("GITHUB", "/?tab=workspace")}
              className="inline-flex h-9 items-center justify-center gap-2 rounded-xl bg-zinc-950 px-4 text-[13px] font-semibold text-white transition hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20"
            >
              <GitHubIcon className="size-4" />
              Continue with GitHub
            </button>
            <button
              type="button"
              onClick={() => handleOAuth("GOOGLE", "/?tab=workspace")}
              className="inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 text-[13px] font-semibold text-zinc-950 transition hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20"
            >
              <Image
                src="/google.svg"
                alt=""
                width={16}
                height={16}
                aria-hidden="true"
                className="size-4"
              />
              Continue with Google
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

function DemoRepositoryBanner() {
  return (
    <section className="overflow-hidden rounded-2xl border border-zinc-200/70 bg-white">
      <div className="px-4 py-3 sm:px-[18px]">
        <div className="inline-flex min-w-0 items-center gap-3 rounded-xl">
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-zinc-950 text-white">
            <GitHubIcon className="size-[18px]" />
          </span>
          <span className="min-w-0">
            <span className="flex min-w-0 items-center gap-2">
              <span className="truncate text-[14px] font-semibold text-zinc-950">
                sample/openlog-demo
              </span>
              <span className="rounded-full border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-zinc-500">
                Sample
              </span>
            </span>
            <span className="block text-[12px] text-zinc-400">
              Example workspace — yours stays private
            </span>
          </span>
        </div>
      </div>
    </section>
  );
}

function NowWorkingCard({
  tasks,
  logs,
  isPreview = false,
}: {
  tasks: WorkspaceWorkItem[];
  logs: WorkspaceLogItem[];
  isPreview?: boolean;
}) {
  const task =
    tasks.find((item) => item.status === "doing") ??
    tasks.find((item) => item.status === "todo") ??
    tasks[0] ??
    workspaceWorkItems[0]!;
  const latestLog = logs.find((log) => log.taskId === task.id);
  const summary =
    getTaskExcerpt(task.body, 160) ||
    latestLog?.description ||
    "No active task summary yet.";

  return (
    <DashboardCard
      title="NOW WORKING"
      action={<IconBranch className="size-[15px] text-zinc-400" />}
    >
      <div className="px-[18px] pb-[18px] pt-3">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-[17px] font-bold tracking-[-0.01em] text-zinc-950">
            {task.title}
          </h2>
          {latestLog?.branch ? <BranchBadge>{latestLog.branch}</BranchBadge> : null}
        </div>

        <p className="mt-2 max-w-[62ch] text-[13px] leading-[1.6] text-zinc-500">
          {summary}
        </p>

        <dl className="mt-3 flex flex-wrap gap-x-[18px] gap-y-2 text-[12.5px] tabular-nums text-zinc-500">
          <div>
            Linked logs&nbsp;
            <dd className="inline font-semibold text-zinc-950">
              {logs.filter((log) => log.taskId === task.id).length}
            </dd>
          </div>
          {latestLog ? (
            <div>
              Latest&nbsp;
              <dd className="inline font-semibold text-zinc-950">
                {latestLog.meta.split(" · ")[0]}
              </dd>
            </div>
          ) : null}
        </dl>

        <div className="mt-4 flex flex-wrap gap-2">
          <LinkButton
            href="/write"
            tone="solid"
            size="sm"
            isPreview={isPreview}
          >
            <IconPencil className="size-3.5" />
            Log now
          </LinkButton>
          <LinkButton
            href={getNewOutputHref(task.id)}
            tone="outline"
            size="sm"
            isPreview={isPreview}
          >
            Create output
          </LinkButton>
          <LinkButton
            href="/write"
            tone="ghost"
            size="sm"
            isPreview={isPreview}
          >
            View diff
          </LinkButton>
        </div>
      </div>
    </DashboardCard>
  );
}

function WorkTasksCard({
  tasks,
  logs,
  isPreview = false,
}: {
  tasks: WorkspaceWorkItem[];
  logs: WorkspaceLogItem[];
  isPreview?: boolean;
}) {
  return (
    <DashboardCard
      title="TASKS"
      titleAside={<TaskStatusLegend />}
      action={
        <HeaderLink
          href={getTasksHref()}
          label="View all"
          isPreview={isPreview}
        />
      }
    >
      <PanelList>
        {tasks.map((item) => (
          <WorkItemRow
            key={item.id}
            item={item}
            logCount={logs.filter((log) => log.taskId === item.id).length}
            isPreview={isPreview}
          />
        ))}
      </PanelList>
      <PreviewableLink
        href="/write"
        isPreview={isPreview}
        className="block border-t border-zinc-100 px-[18px] py-2.5 text-[12.5px] font-medium text-zinc-400 transition hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20"
        previewClassName="block cursor-default border-t border-zinc-100 px-[18px] py-2.5 text-[12.5px] font-medium text-zinc-300"
      >
        + New task
      </PreviewableLink>
    </DashboardCard>
  );
}

function WorkItemRow({
  item,
  logCount,
  isPreview = false,
}: {
  item: WorkspaceWorkItem;
  logCount: number;
  isPreview?: boolean;
}) {
  const statusLabel =
    item.status === "doing"
      ? "doing"
      : item.status === "done"
        ? "done"
        : "todo";

  return (
    <PanelItem align="start">
      <TaskStatusDot status={item.status} />
      <div className="min-w-0 flex-1">
        <h3 className="text-[13px] font-semibold leading-[1.45] text-zinc-950">
          {item.title}
        </h3>
        <p className="mt-0.5 text-[12px] text-zinc-500">
          {statusLabel} · {logCount} log{logCount === 1 ? "" : "s"}
        </p>
      </div>
      <PreviewableLink
        href={getTaskHref(item.id)}
        isPreview={isPreview}
        aria-label={`Open ${item.title}`}
        className="shrink-0 self-center text-zinc-400 transition hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20"
        previewClassName="shrink-0 self-center text-zinc-300"
      >
        <IconArrowRight className="size-4" />
      </PreviewableLink>
    </PanelItem>
  );
}

function TaskStatusDot({
  status,
  size = "md",
  className,
}: {
  status: WorkspaceWorkStatus;
  size?: "sm" | "md";
  className?: string;
}) {
  return (
    <span
      className={cn(
        "shrink-0 rounded-full",
        size === "sm" ? "size-[7px]" : "mt-[5px] size-[9px]",
        status === "doing" && "border-2 border-blue-600",
        status === "done" && "bg-green-600",
        status === "todo" && "border-2 border-zinc-300",
        className,
      )}
    />
  );
}

function TaskStatusLegend() {
  const items: Array<{ status: WorkspaceWorkStatus; label: string }> = [
    { status: "doing", label: "doing" },
    { status: "done", label: "done" },
    { status: "todo", label: "todo" },
  ];

  return (
    <span className="inline-flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] font-medium normal-case tracking-normal text-zinc-400">
      {items.map((item) => (
        <span key={item.status} className="inline-flex items-center gap-1">
          <TaskStatusDot status={item.status} size="sm" />
          {item.label}
        </span>
      ))}
    </span>
  );
}

function TodosCard({
  todos,
  workspaceId,
  isPreview = false,
  createTodoOverride,
}: {
  todos: WorkspaceTodoItem[];
  workspaceId?: string;
  isPreview?: boolean;
  createTodoOverride?: (title: string) => Promise<WorkspaceActionResult>;
}) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"today" | "week">("today");
  const [isAdding, setIsAdding] = useState(false);
  const [draftTitle, setDraftTitle] = useState("");
  const [localTodos, setLocalTodos] = useState(todos);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLocalTodos(todos);
  }, [todos]);

  useEffect(() => {
    if (isAdding) {
      inputRef.current?.focus();
    }
  }, [isAdding]);

  const canAdd = !isPreview && activeTab === "today" && Boolean(workspaceId);

  function openAddRow() {
    if (!canAdd) {
      return;
    }

    setIsAdding(true);
    setDraftTitle("");
    setError(null);
  }

  function cancelAdd() {
    setIsAdding(false);
    setDraftTitle("");
    setError(null);
  }

  function submitTodo() {
    const trimmed = draftTitle.trim();
    if (!trimmed || !workspaceId || isPending) {
      return;
    }

    if (createTodoOverride) {
      setIsAdding(false);
      setDraftTitle("");
      setError(null);

      startTransition(async () => {
        const result = await createTodoOverride(trimmed);

        if (!result.ok) {
          setError(result.message ?? "Failed to add todo.");
          setIsAdding(true);
          setDraftTitle(trimmed);
        }
      });
      return;
    }

    const optimisticId = `pending-${Date.now()}`;
    const optimisticTodo: WorkspaceTodoItem = {
      id: optimisticId,
      title: trimmed,
      done: false,
    };

    setLocalTodos((current) => [...current, optimisticTodo]);
    setIsAdding(false);
    setDraftTitle("");
    setError(null);

    startTransition(async () => {
      const result = await createWorkspaceTodo({
        workspaceId,
        title: trimmed,
        plannedFor: todayIso(),
      });

      if (!result.ok) {
        setLocalTodos((current) =>
          current.filter((todo) => todo.id !== optimisticId),
        );
        setError(result.message ?? "Failed to add todo.");
        setIsAdding(true);
        setDraftTitle(trimmed);
        return;
      }

      router.refresh();
    });
  }

  function toggleTodo(todoId: string) {
    if (!workspaceId || isPreview || isPending || todoId.startsWith("pending-")) {
      return;
    }

    const targetTodo = localTodos.find((todo) => todo.id === todoId);
    if (!targetTodo) {
      return;
    }

    const nextDone = !targetTodo.done;

    setLocalTodos((current) =>
      current.map((todo) =>
        todo.id === todoId ? { ...todo, done: nextDone } : todo,
      ),
    );
    setError(null);

    startTransition(async () => {
      const result = await updateWorkspaceTodoDone({
        workspaceId,
        todoId,
        done: nextDone,
      });

      if (!result.ok) {
        setLocalTodos((current) =>
          current.map((todo) =>
            todo.id === todoId ? { ...todo, done: !nextDone } : todo,
          ),
        );
        setError(result.message ?? "Failed to update todo.");
        return;
      }

      router.refresh();
    });
  }

  function removeTodo(todoId: string) {
    if (!workspaceId || isPreview || isPending) {
      return;
    }

    if (todoId.startsWith("pending-")) {
      setLocalTodos((current) => current.filter((todo) => todo.id !== todoId));
      return;
    }

    const previousTodos = localTodos;

    setLocalTodos((current) => current.filter((todo) => todo.id !== todoId));
    setError(null);

    startTransition(async () => {
      const result = await deleteWorkspaceTodo({
        workspaceId,
        todoId,
      });

      if (!result.ok) {
        setLocalTodos(previousTodos);
        setError(result.message ?? "Failed to remove todo.");
        return;
      }

      router.refresh();
    });
  }

  return (
    <DashboardCard
      title="TODOS"
      testId="todos-card"
      action={
        <MiniTabs
          active={activeTab}
          onChange={setActiveTab}
          disabled={isPreview}
          items={[
            { key: "today", label: "Today" },
            { key: "week", label: "Week" },
          ]}
        />
      }
    >
      <div className="divide-y divide-zinc-100">
        {localTodos.map((todo) => (
          <TodoRow
            key={todo.id}
            todo={todo}
            disabled={
              isPreview || isPending || todo.id.startsWith("pending-")
            }
            onToggle={() => toggleTodo(todo.id)}
            onRemove={
              isPreview ? undefined : () => removeTodo(todo.id)
            }
          />
        ))}
        {isAdding ? (
          <TodoAddRow
            ref={inputRef}
            value={draftTitle}
            disabled={isPending}
            onChange={setDraftTitle}
            onSubmit={submitTodo}
            onCancel={cancelAdd}
          />
        ) : null}
      </div>
      {error ? (
        <p className="border-t border-zinc-100 px-[18px] py-2 text-[12px] text-rose-600">
          {error}
        </p>
      ) : null}
      {isPreview ? (
        <span className="flex h-10 items-center border-t border-zinc-100 px-[18px] text-[12.5px] font-medium text-zinc-300">
          + Add todo
        </span>
      ) : (
        <button
          type="button"
          data-testid="todo-add-button"
          onClick={openAddRow}
          disabled={!canAdd || isAdding}
          className={cn(
            "flex h-10 w-full items-center border-t border-zinc-100 px-[18px] text-left text-[12.5px] font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20",
            canAdd && !isAdding
              ? "text-zinc-400 hover:text-zinc-950"
              : "cursor-not-allowed text-zinc-300",
          )}
        >
          + Add todo
        </button>
      )}
    </DashboardCard>
  );
}

const TodoAddRow = forwardRef<
  HTMLInputElement,
  {
    value: string;
    disabled?: boolean;
    onChange: (value: string) => void;
    onSubmit: () => void;
    onCancel: () => void;
  }
>(function TodoAddRow(
  { value, disabled = false, onChange, onSubmit, onCancel },
  ref,
) {
  return (
    <TodoPanelRow testId="todo-add-row">
      <span className="size-[15px] shrink-0 rounded-[5px] border-[1.5px] border-zinc-300 bg-white" />
      <input
        ref={ref}
        data-testid="todo-add-input"
        type="text"
        value={value}
        disabled={disabled}
        placeholder="What needs to be done?"
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            onSubmit();
          }

          if (event.key === "Escape") {
            event.preventDefault();
            onCancel();
          }
        }}
        className="min-w-0 bg-transparent text-[13px] font-semibold leading-5 text-zinc-950 outline-none placeholder:font-medium placeholder:text-zinc-400 disabled:text-zinc-400"
      />
      <span className="size-6 shrink-0" aria-hidden="true" />
    </TodoPanelRow>
  );
});

function TodoPanelRow({
  multiline = false,
  testId = "todo-row",
  className,
  children,
}: {
  multiline?: boolean;
  testId?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      data-testid={testId}
      data-multiline={multiline ? "true" : "false"}
      className={cn(
        "flex gap-[11px] px-[18px]",
        multiline
          ? "items-start py-2.5"
          : "h-10 max-h-10 shrink-0 items-center overflow-hidden",
        className,
      )}
    >
      {children}
    </div>
  );
}

function TodoRow({
  todo,
  disabled = false,
  onToggle,
  onRemove,
}: {
  todo: WorkspaceTodoItem;
  disabled?: boolean;
  onToggle?: () => void;
  onRemove?: () => void;
}) {
  const hasDescription = Boolean(todo.description);

  return (
    <TodoPanelRow multiline={hasDescription} className="group">
      <button
        type="button"
        data-testid="todo-checkbox"
        aria-label={todo.done ? "Mark todo open" : "Mark todo done"}
        aria-pressed={todo.done}
        disabled={disabled || !onToggle}
        onClick={onToggle}
        className={cn(
          "flex size-[15px] shrink-0 items-center justify-center rounded-[5px] border-[1.5px] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20 disabled:cursor-not-allowed",
          hasDescription && "self-start mt-0.5",
          todo.done
            ? "border-zinc-950 bg-zinc-950 text-white"
            : "border-zinc-300 bg-white hover:border-zinc-400",
          disabled && "opacity-60",
        )}
      >
        {todo.done ? <IconCheck className="size-[9px]" /> : null}
      </button>
      <div className={cn("min-w-0 flex-1", hasDescription && "self-start")}>
        <p
          data-testid="todo-title"
          className={cn(
            "m-0 text-[13px] font-semibold leading-5 text-zinc-950",
            !hasDescription && "truncate",
            todo.done && "text-zinc-400 line-through",
          )}
        >
          {todo.title}
        </p>
        {todo.description ? (
          <p className="mt-0.5 text-[12px] leading-4 text-zinc-500">
            {todo.description}
          </p>
        ) : null}
      </div>
      {onRemove ? (
        <button
          type="button"
          data-testid="todo-remove"
          aria-label="Remove todo"
          disabled={disabled}
          onClick={onRemove}
          className={cn(
            "flex size-6 shrink-0 items-center justify-center rounded-md text-zinc-400 opacity-0 transition hover:bg-zinc-100 hover:text-zinc-700 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20 group-hover:opacity-100 disabled:cursor-not-allowed disabled:opacity-50",
            hasDescription && "self-start mt-0.5",
          )}
        >
          <IconClose className="size-3" />
        </button>
      ) : (
        <span className="size-6 shrink-0" aria-hidden="true" />
      )}
    </TodoPanelRow>
  );
}

function RecentLogsCard({
  tasks,
  logs,
  isPreview = false,
}: {
  tasks: WorkspaceWorkItem[];
  logs: WorkspaceLogItem[];
  isPreview?: boolean;
}) {
  const unassignedCount = logs.filter((log) => !log.taskId).length;

  return (
    <DashboardCard
      title="RECENT LOGS"
      action={
        <HeaderLink
          href={getLogsHref()}
          label="View all"
          isPreview={isPreview}
        />
      }
    >
      {unassignedCount > 0 ? (
        <p className="px-[18px] pt-1 text-[11.5px] text-zinc-400">
          {unassignedCount} unassigned · review when ready
        </p>
      ) : null}
      <div className="pb-1.5 pt-1.5">
        {logs.map((item) => (
          <WorkspaceLogRow
            key={item.id}
            item={item}
            task={
              item.taskId
                ? tasks.find((task) => task.id === item.taskId)
                : undefined
            }
            isPreview={isPreview}
          />
        ))}
      </div>
    </DashboardCard>
  );
}

function MonthActivityCard() {
  return (
    <DashboardCard title="THIS MONTH">
      <p className="px-[18px] pt-1 text-[12px] font-medium text-zinc-500">
        {workspaceMonthLabel}
      </p>
      <div className="overflow-x-auto px-4 pb-1 pt-2.5">
        <div className="inline-flex min-w-full justify-center gap-[3px]">
          {workspaceMonthGrass.map((week, weekIndex) => (
            <div key={weekIndex} className="flex flex-col gap-[3px]">
              {week.map((cell, dayIndex) =>
                cell.day === null ? (
                  <span
                    key={dayIndex}
                    className="size-[11px] shrink-0"
                    aria-hidden="true"
                  />
                ) : (
                  <GrassCell
                    key={dayIndex}
                    day={cell.day}
                    logCount={cell.logCount}
                    isToday={cell.isToday}
                    isFuture={cell.isFuture}
                    size="sm"
                  />
                ),
              )}
            </div>
          ))}
        </div>
      </div>
      <GrassLegend />
    </DashboardCard>
  );
}

const GRASS_EMPTY = "bg-zinc-100";
const GRASS_FUTURE =
  "border border-dashed border-orange-200/70 bg-orange-50/40";
const GRASS_LEVELS = [
  GRASS_EMPTY,
  "bg-[#fce8e0]",
  "bg-[#f0c4b0]",
  "bg-[#da7756]",
  "bg-[#a85638]",
] as const;

function getGrassLevel(logCount: number) {
  if (logCount <= 0) return 0;
  if (logCount === 1) return 1;
  if (logCount === 2) return 2;
  if (logCount === 3) return 3;
  return 4;
}

function GrassCell({
  day,
  logCount,
  isToday,
  isFuture,
  size = "md",
}: {
  day?: number;
  logCount: number;
  isToday?: boolean;
  isFuture?: boolean;
  size?: "sm" | "md";
}) {
  const dateLabel = day ? `Jul ${day}` : "";
  const countLabel =
    logCount === 0
      ? isFuture
        ? "Planned"
        : "No logs"
      : `${logCount} log${logCount === 1 ? "" : "s"}`;
  const label = day ? `${dateLabel} · ${countLabel}` : countLabel;

  return (
    <div
      title={label}
      aria-label={label}
      className={cn(
        "shrink-0 rounded-[2px]",
        size === "sm"
          ? "size-[11px]"
          : "aspect-square w-full max-w-[38px] rounded-[3px]",
        getGrassTone(logCount, isFuture),
        isToday &&
          (size === "sm"
            ? "ring-1 ring-[#a85638] ring-offset-1 ring-offset-white"
            : "ring-2 ring-[#a85638] ring-offset-2 ring-offset-white"),
      )}
    />
  );
}

function getGrassTone(logCount: number, isFuture?: boolean) {
  if (logCount === 0) {
    return isFuture ? GRASS_FUTURE : GRASS_EMPTY;
  }

  return GRASS_LEVELS[getGrassLevel(logCount)];
}

function GrassLegend() {
  const levels = [0, 1, 2, 3, 4] as const;

  return (
    <div className="flex items-center justify-end gap-1.5 px-[18px] pb-3.5 pt-2 text-[10px] text-zinc-400">
      <span>Less</span>
      <div className="flex items-center gap-[3px]">
        {levels.map((level) => (
          <span
            key={level}
            className={cn("size-[11px] rounded-[2px]", GRASS_LEVELS[level])}
          />
        ))}
      </div>
      <span>More</span>
    </div>
  );
}

function GraphCard({ isPreview = false }: { isPreview?: boolean }) {
  return (
    <DashboardCard
      title="GRAPH"
      action={
        <HeaderLink
          href={getWorkspaceGraphHref()}
          label="Open full view"
          isPreview={isPreview}
        />
      }
    >
      <div className="mx-[18px] mt-3 overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50">
        <svg
          viewBox="0 0 264 150"
          fill="none"
          aria-hidden="true"
          className="block w-full"
        >
          <path
            d="M118 78L62 44M118 78L56 110M118 78L152 34M118 78L204 57M118 78L196 116M62 44L152 34"
            stroke="#d4d4d8"
            strokeWidth="1.2"
          />
          <circle cx="62" cy="44" r="5" fill="#a1a1aa" />
          <circle cx="56" cy="110" r="5" fill="#a1a1aa" />
          <circle cx="152" cy="34" r="5" fill="#a1a1aa" />
          <circle cx="118" cy="78" r="7.5" fill="#09090b" />
          <text x="118" y="99" textAnchor="middle" fontSize="9" fill="#71717a">
            current log
          </text>
          <circle cx="204" cy="57" r="6" fill="#2563eb" />
          <text x="204" y="43" textAnchor="middle" fontSize="9" fill="#71717a">
            post
          </text>
          <circle
            cx="196"
            cy="116"
            r="6"
            fill="#ffffff"
            stroke="#09090b"
            strokeWidth="1.6"
          />
          <text x="196" y="137" textAnchor="middle" fontSize="9" fill="#71717a">
            memory
          </text>
        </svg>
      </div>
      <p className="mx-[18px] mb-[15px] mt-2.5 text-[12px] text-zinc-400">
        이 프로젝트의 log·post·memory 파생 관계.
      </p>
    </DashboardCard>
  );
}

function OpenIssuesCard({
  logs,
  isPreview = false,
}: {
  logs: WorkspaceLogItem[];
  isPreview?: boolean;
}) {
  const issues = logs.filter(
    (log) => log.label.toLowerCase() === "issue" && log.status !== "CLOSED",
  );

  return (
    <DashboardCard
      title="OPEN ISSUES"
      action={<HeaderLink href="/write" isPreview={isPreview} />}
    >
      <PanelList>
        {issues.map((issue) => (
          <PanelItem key={issue.id} align="start">
            <span className="mt-[5px] size-2 shrink-0 rounded-full border-[1.5px] border-amber-700" />
            <div className="min-w-0">
              <h3 className="text-[13px] font-semibold leading-[1.45] text-zinc-950">
                {issue.title}
              </h3>
              <p className="mt-0.5 text-[12px] text-zinc-500">
                {issue.meta}
              </p>
            </div>
          </PanelItem>
        ))}
      </PanelList>
    </DashboardCard>
  );
}

function WorkspaceLogRow({
  item,
  task,
  isPreview = false,
}: {
  item: WorkspaceLogItem;
  task?: WorkspaceWorkItem;
  isPreview?: boolean;
}) {
  return (
    <article className="border-t border-zinc-100 px-[18px] py-3 first:border-t-0">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-[14px] font-semibold text-zinc-950">
              {item.title}
            </h3>
          </div>
          <p className="mt-0.5 text-[12.5px] leading-5 text-zinc-500">
            {item.description}
          </p>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11.5px] text-zinc-400">
            <LogTypeLabel>{item.label}</LogTypeLabel>
            {task ? (
              <TaskLink
                label={task.title}
                href={getTaskHref(task.id)}
                isPreview={isPreview}
              />
            ) : null}
            {item.branch ? <CodePill>{item.branch}</CodePill> : null}
            <span>{item.meta}</span>
            {item.commit ? <CodePill>{item.commit}</CodePill> : null}
          </div>
        </div>
        <PreviewableLink
          href={getLogHref(item.id)}
          isPreview={isPreview}
          aria-label={`Open ${item.title}`}
          className="shrink-0 self-center text-zinc-400 transition hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20"
          previewClassName="shrink-0 self-center text-zinc-300"
        >
          <IconArrowRight className="size-4" />
        </PreviewableLink>
      </div>
    </article>
  );
}

function TaskLink({
  label,
  href,
  isPreview = false,
}: {
  label: string;
  href: string;
  isPreview?: boolean;
}) {
  return (
    <PreviewableLink
      href={href}
      isPreview={isPreview}
      title={label}
      className="inline-flex max-w-[148px] items-center truncate rounded-md bg-zinc-100 px-[7px] py-0.5 text-[10.5px] font-semibold text-zinc-600 transition hover:bg-zinc-200 hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20"
      previewClassName="inline-flex max-w-[148px] cursor-default items-center truncate rounded-md bg-zinc-100 px-[7px] py-0.5 text-[10.5px] font-semibold text-zinc-400"
    >
      {label}
    </PreviewableLink>
  );
}

function MemoryCard() {
  return (
    <DashboardCard title="PROJECT MEMORY">
      <div className="pb-2 pt-1">
        {workspaceMemories.map((memory) => (
          <article
            key={memory.title}
            className="border-t border-zinc-100 px-[18px] py-2.5 first:border-t-0"
          >
            <h3 className="text-[13px] font-semibold text-zinc-950">
              {memory.title}
            </h3>
            <p className="mt-0.5 text-[12px] leading-5 text-zinc-500">
              {memory.description}
            </p>
            <div className="mt-1.5 flex gap-2.5 font-mono text-[10.5px] text-zinc-400">
              <span>{memory.source}</span>
              <span>{memory.reads}</span>
            </div>
          </article>
        ))}
      </div>
    </DashboardCard>
  );
}

function DashboardCard({
  title,
  titleAside,
  action,
  testId,
  children,
}: {
  title: string;
  titleAside?: ReactNode;
  action?: ReactNode;
  testId?: string;
  children: ReactNode;
}) {
  return (
    <section
      data-testid={testId}
      className="overflow-hidden rounded-2xl border border-zinc-200/70 bg-white"
    >
      <div className="flex items-center justify-between gap-3 px-[18px] pt-3.5">
        <div className="flex min-w-0 flex-wrap items-center gap-x-2.5 gap-y-1">
          <h2 className="text-[11.5px] font-semibold uppercase tracking-[0.1em] text-zinc-400">
            {title}
          </h2>
          {titleAside}
        </div>
        {action ? (
          <div className="flex shrink-0 items-center gap-2.5 text-zinc-400">
            {action}
          </div>
        ) : null}
      </div>
      {children}
    </section>
  );
}

function PanelList({ children }: { children: ReactNode }) {
  return <div className="pb-2 pt-1">{children}</div>;
}

function PanelItem({
  align = "center",
  className,
  children,
}: {
  align?: "center" | "start";
  className?: string;
  children: ReactNode;
}) {
  return (
    <article
      className={cn(
        "flex gap-[11px] border-t border-zinc-100 px-[18px] py-2 first:border-t-0",
        align === "center" ? "items-center" : "items-start",
        className,
      )}
    >
      {children}
    </article>
  );
}

function MiniTabs<T extends string>({
  active,
  onChange,
  disabled = false,
  items,
}: {
  active: T;
  onChange: (value: T) => void;
  disabled?: boolean;
  items: Array<{ key: T; label: string }>;
}) {
  return (
    <div className="inline-flex gap-0.5">
      {items.map((item) => (
        <button
          key={item.key}
          type="button"
          disabled={disabled}
          onClick={() => {
            if (!disabled) {
              onChange(item.key);
            }
          }}
          className={cn(
            "rounded-full px-[11px] py-[3px] text-[12px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20",
            active === item.key
              ? "bg-zinc-100 text-zinc-950"
              : "text-zinc-400 hover:text-zinc-950",
          )}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}

function BranchBadge({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-1 font-mono text-[11.5px] font-medium text-zinc-600">
      <IconBranch className="size-3 text-zinc-400" />
      {children}
    </span>
  );
}

function CodePill({ children }: { children: ReactNode }) {
  return (
    <code className="rounded-md bg-zinc-100 px-[7px] py-0.5 font-mono text-[10.5px] text-zinc-500">
      {children}
    </code>
  );
}

function HeaderLink({
  href,
  label = "View all",
  isPreview = false,
}: {
  href: string;
  label?: string;
  isPreview?: boolean;
}) {
  return (
    <PreviewableLink
      href={href}
      isPreview={isPreview}
      className="text-[12px] font-medium text-zinc-500 transition hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20"
      previewClassName="cursor-default text-[12px] font-medium text-zinc-300"
    >
      {label}
    </PreviewableLink>
  );
}

function LinkButton({
  href,
  tone,
  size = "md",
  isPreview = false,
  children,
}: {
  href: string;
  tone: "solid" | "outline" | "ghost";
  size?: "md" | "sm";
  isPreview?: boolean;
  children: ReactNode;
}) {
  const className = cn(
    "inline-flex items-center gap-1.5 font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20",
    size === "sm"
      ? "h-[30px] rounded-[10px] px-[13px] text-[12.5px]"
      : "h-9 rounded-xl px-4 text-[13.5px]",
    tone === "solid" && "bg-zinc-950 text-white hover:bg-zinc-800",
    tone === "outline" &&
      "border border-zinc-200 bg-white text-zinc-950 hover:bg-zinc-50",
    tone === "ghost" && "text-zinc-500 hover:text-zinc-950",
  );
  const previewClassName = cn(
    "inline-flex cursor-default items-center gap-1.5 font-semibold",
    size === "sm"
      ? "h-[30px] rounded-[10px] px-[13px] text-[12.5px]"
      : "h-9 rounded-xl px-4 text-[13.5px]",
    tone === "solid" && "bg-zinc-200 text-zinc-500",
    tone === "outline" && "border border-zinc-200 bg-white text-zinc-400",
    tone === "ghost" && "text-zinc-300",
  );

  return (
    <PreviewableLink
      href={href}
      isPreview={isPreview}
      className={className}
      previewClassName={previewClassName}
    >
      {children}
    </PreviewableLink>
  );
}

function PreviewableLink({
  href,
  isPreview,
  className,
  previewClassName,
  children,
  title,
  "aria-label": ariaLabel,
}: {
  href: string;
  isPreview?: boolean;
  className: string;
  previewClassName?: string;
  children: ReactNode;
  title?: string;
  "aria-label"?: string;
}) {
  if (isPreview) {
    return (
      <span
        title={title}
        aria-label={ariaLabel}
        aria-disabled="true"
        className={previewClassName ?? className}
      >
        {children}
      </span>
    );
  }

  return (
    <Link
      href={href}
      className={className}
      title={title}
      aria-label={ariaLabel}
    >
      {children}
    </Link>
  );
}

function IconCheck({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M4 12.5l5 5L20 6.5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="3.2"
      />
    </svg>
  );
}

function IconClose({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M4 4l8 8"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M12 4L4 12"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconBranch({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <circle cx="6" cy="5" r="2.3" stroke="currentColor" strokeWidth="2" />
      <circle cx="6" cy="19" r="2.3" stroke="currentColor" strokeWidth="2" />
      <circle cx="18" cy="8" r="2.3" stroke="currentColor" strokeWidth="2" />
      <path
        d="M6 7.3v9.4M18 10.3c0 3-4 4.7-9 5.2"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="2"
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

function IconPencil({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M12 20h9"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="2"
      />
      <path
        d="M16.5 3.5a2.12 2.12 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}
