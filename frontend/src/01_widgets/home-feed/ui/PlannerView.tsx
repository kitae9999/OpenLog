"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { cn } from "@/shared/lib/cn";
import {
  getPlannerHref,
  getTabHref,
  getTaskHref,
  type WorkspaceTodoItem,
} from "./data";
import {
  createWorkspaceTodo,
  deleteWorkspaceTodo,
  updateWorkspaceTodoDone,
} from "./workspaceActions";
import type { WorkspaceUiData } from "./workspaceTypes";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function PlannerView({
  month,
  selectedDate,
  todos,
  workspaceData,
}: {
  month: string;
  selectedDate: string;
  todos: WorkspaceTodoItem[] | null;
  workspaceData: WorkspaceUiData;
}) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [taskId, setTaskId] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [pendingTodoId, setPendingTodoId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const days = useMemo(() => buildMonthCells(month), [month]);
  const todosByDate = useMemo(() => {
    const grouped = new Map<string, WorkspaceTodoItem[]>();
    for (const todo of todos ?? []) {
      if (!todo.plannedFor) continue;
      const items = grouped.get(todo.plannedFor) ?? [];
      items.push(todo);
      grouped.set(todo.plannedFor, items);
    }
    return grouped;
  }, [todos]);
  const selectedTodos = todosByDate.get(selectedDate) ?? [];
  const previousMonth = shiftMonth(month, -1);
  const nextMonth = shiftMonth(month, 1);

  async function createTodo() {
    const trimmedTitle = title.trim();
    if (!trimmedTitle || isCreating) return;

    setIsCreating(true);
    setError(null);
    const result = await createWorkspaceTodo({
      workspaceId: workspaceData.workspaceId,
      title: trimmedTitle,
      plannedFor: selectedDate,
      taskId: taskId || undefined,
    });
    setIsCreating(false);

    if (!result.ok) {
      setError(result.message ?? "Failed to create todo.");
      return;
    }

    setTitle("");
    router.refresh();
  }

  async function toggleTodo(todo: WorkspaceTodoItem) {
    if (pendingTodoId) return;
    setPendingTodoId(todo.id);
    setError(null);
    const result = await updateWorkspaceTodoDone({
      workspaceId: workspaceData.workspaceId,
      todoId: todo.id,
      done: !todo.done,
    });
    setPendingTodoId(null);
    if (!result.ok) {
      setError(result.message ?? "Failed to update todo.");
      return;
    }
    router.refresh();
  }

  async function deleteTodo(todoId: string) {
    if (pendingTodoId) return;
    setPendingTodoId(todoId);
    setError(null);
    const result = await deleteWorkspaceTodo({
      workspaceId: workspaceData.workspaceId,
      todoId,
    });
    setPendingTodoId(null);
    if (!result.ok) {
      setError(result.message ?? "Failed to delete todo.");
      return;
    }
    router.refresh();
  }

  return (
    <div>
      <nav
        aria-label="Breadcrumb"
        className="mb-4 flex items-center gap-1.5 text-[13px] text-zinc-500"
      >
        <Link
          href={getTabHref("workspace", true)}
          className="font-semibold text-zinc-700 hover:text-zinc-950"
        >
          openlog
        </Link>
        <span className="text-zinc-300">/</span>
        <span className="font-semibold text-zinc-950">Planner</span>
      </nav>

      <header className="flex flex-wrap items-end justify-between gap-4 border-b border-zinc-200/80 pb-5">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-400">
            Plan the work
          </p>
          <h1 className="mt-2 font-[family-name:var(--font-georgia,Georgia,serif)] text-3xl font-bold tracking-[-0.025em] text-zinc-950">
            {formatMonth(month)}
          </h1>
          <p className="mt-2 text-[13.5px] text-zinc-500">
            Todos arranged by their planned date.
          </p>
        </div>
        <div className="flex items-center gap-1 rounded-xl border border-zinc-200 bg-white p-1">
          <Link
            href={getPlannerHref(previousMonth)}
            aria-label={`Previous month, ${formatMonth(previousMonth)}`}
            className="grid size-8 place-items-center rounded-lg text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20"
          >
            ←
          </Link>
          <Link
            href={getPlannerHref()}
            className="rounded-lg px-3 py-1.5 text-[12px] font-semibold text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-950"
          >
            Today
          </Link>
          <Link
            href={getPlannerHref(nextMonth)}
            aria-label={`Next month, ${formatMonth(nextMonth)}`}
            className="grid size-8 place-items-center rounded-lg text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20"
          >
            →
          </Link>
        </div>
      </header>

      {todos === null ? (
        <div className="mt-5 rounded-2xl border border-red-100 bg-red-50 px-5 py-10 text-center text-[13px] text-red-700">
          Planner data could not be loaded.
        </div>
      ) : (
        <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_310px]">
          <section
            aria-label={`${formatMonth(month)} calendar`}
            className="overflow-x-auto rounded-2xl border border-zinc-200/80 bg-white"
          >
            <div className="min-w-[700px]">
              <div className="grid grid-cols-7 border-b border-zinc-100 bg-zinc-50/70">
                {WEEKDAYS.map((weekday) => (
                  <div
                    key={weekday}
                    className="px-3 py-2.5 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-zinc-400"
                  >
                    {weekday}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7">
                {days.map((day, index) => {
                  const dayTodos = day ? todosByDate.get(day) ?? [] : [];
                  return day ? (
                    <Link
                      key={day}
                      href={getPlannerHref(month, day)}
                      aria-current={day === selectedDate ? "date" : undefined}
                      className={cn(
                        "min-h-28 border-b border-r border-zinc-100 p-2.5 transition hover:bg-zinc-50 focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-zinc-900/30",
                        day === selectedDate && "bg-[#fff8f4]",
                      )}
                    >
                      <span
                        className={cn(
                          "grid size-6 place-items-center rounded-full text-[11px] font-semibold text-zinc-500",
                          day === selectedDate && "bg-[#d96f4a] text-white",
                        )}
                      >
                        {Number(day.slice(-2))}
                      </span>
                      <ul className="mt-1.5 space-y-1">
                        {dayTodos.slice(0, 3).map((todo) => (
                          <li
                            key={todo.id}
                            className={cn(
                              "truncate rounded-md bg-zinc-100 px-1.5 py-1 text-[10.5px] font-medium text-zinc-700",
                              todo.done && "text-zinc-400 line-through",
                            )}
                          >
                            {todo.title}
                          </li>
                        ))}
                      </ul>
                      {dayTodos.length > 3 ? (
                        <span className="mt-1 block text-[10px] font-semibold text-zinc-400">
                          +{dayTodos.length - 3} more
                        </span>
                      ) : null}
                    </Link>
                  ) : (
                    <div
                      key={`empty-${index}`}
                      className="min-h-28 border-b border-r border-zinc-100 bg-zinc-50/40"
                      aria-hidden="true"
                    />
                  );
                })}
              </div>
            </div>
          </section>

          <aside className="h-fit overflow-hidden rounded-2xl border border-zinc-200/80 bg-white xl:sticky xl:top-6">
            <header className="border-b border-zinc-100 bg-zinc-50/70 px-4 py-3.5">
              <h2 className="text-[13px] font-semibold text-zinc-950">
                {formatLongDate(selectedDate)}
              </h2>
              <p className="mt-1 text-[11.5px] text-zinc-400">
                {selectedTodos.length} todo{selectedTodos.length === 1 ? "" : "s"}
              </p>
            </header>

            <div className="border-b border-zinc-100 p-4">
              <label className="grid gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
                New todo
                <input
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") void createTodo();
                  }}
                  placeholder="What needs to happen?"
                  className="h-9 rounded-lg border border-zinc-200 px-3 text-[13px] font-normal normal-case tracking-normal text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-2 focus:ring-zinc-900/10"
                />
              </label>
              <div className="mt-2 flex gap-2">
                <label className="min-w-0 flex-1">
                  <span className="sr-only">Linked task</span>
                  <select
                    value={taskId}
                    onChange={(event) => setTaskId(event.target.value)}
                    className="h-9 w-full rounded-lg border border-zinc-200 bg-white px-2.5 text-[12px] text-zinc-600 outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-900/10"
                  >
                    <option value="">No task</option>
                    {workspaceData.tasks.map((task) => (
                      <option key={task.id} value={task.id}>
                        {task.title}
                      </option>
                    ))}
                  </select>
                </label>
                <button
                  type="button"
                  onClick={createTodo}
                  disabled={!title.trim() || isCreating}
                  className="h-9 rounded-lg bg-zinc-950 px-3 text-[12px] font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-300"
                >
                  {isCreating ? "Adding..." : "Add"}
                </button>
              </div>
              {error ? (
                <p className="mt-2 text-[12px] text-red-600">{error}</p>
              ) : null}
            </div>

            {selectedTodos.length === 0 ? (
              <div className="px-4 py-10 text-center">
                <p className="text-[13px] font-medium text-zinc-700">
                  Nothing planned
                </p>
                <p className="mt-1 text-[12px] text-zinc-400">
                  Add a todo for this date.
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-zinc-100">
                {selectedTodos.map((todo) => {
                  const task = workspaceData.tasks.find(
                    (item) => item.id === todo.taskId,
                  );
                  return (
                    <li key={todo.id} className="flex items-start gap-3 px-4 py-3">
                      <button
                        type="button"
                        onClick={() => toggleTodo(todo)}
                        disabled={pendingTodoId === todo.id}
                        aria-label={`${todo.done ? "Reopen" : "Complete"} ${todo.title}`}
                        aria-pressed={!!todo.done}
                        className={cn(
                          "mt-0.5 grid size-4 shrink-0 place-items-center rounded border transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20 disabled:opacity-50",
                          todo.done
                            ? "border-emerald-600 bg-emerald-600 text-white"
                            : "border-zinc-300 bg-white",
                        )}
                      >
                        {todo.done ? "✓" : null}
                      </button>
                      <div className="min-w-0 flex-1">
                        <p
                          className={cn(
                            "text-[12.5px] leading-5 text-zinc-800",
                            todo.done && "text-zinc-400 line-through",
                          )}
                        >
                          {todo.title}
                        </p>
                        {task ? (
                          <Link
                            href={getTaskHref(task.id)}
                            className="mt-0.5 inline-flex text-[10.5px] font-semibold text-zinc-400 hover:text-zinc-800"
                          >
                            {task.title}
                          </Link>
                        ) : null}
                      </div>
                      <button
                        type="button"
                        onClick={() => deleteTodo(todo.id)}
                        disabled={pendingTodoId === todo.id}
                        aria-label={`Delete ${todo.title}`}
                        className="text-[11px] font-semibold text-zinc-400 transition hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600/20 disabled:opacity-50"
                      >
                        Delete
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </aside>
        </div>
      )}
    </div>
  );
}

function buildMonthCells(month: string) {
  const [year, monthNumber] = month.split("-").map(Number);
  const firstDay = new Date(Date.UTC(year, monthNumber - 1, 1));
  const mondayOffset = (firstDay.getUTCDay() + 6) % 7;
  const dayCount = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();
  const cellCount = Math.ceil((mondayOffset + dayCount) / 7) * 7;
  return Array.from({ length: cellCount }, (_, index) => {
    const day = index - mondayOffset + 1;
    return day >= 1 && day <= dayCount
      ? `${month}-${String(day).padStart(2, "0")}`
      : null;
  });
}

function shiftMonth(month: string, amount: number) {
  const [year, monthNumber] = month.split("-").map(Number);
  const shifted = new Date(Date.UTC(year, monthNumber - 1 + amount, 1));
  return `${shifted.getUTCFullYear()}-${String(shifted.getUTCMonth() + 1).padStart(2, "0")}`;
}

function formatMonth(month: string) {
  return new Intl.DateTimeFormat("en", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${month}-01T00:00:00Z`));
}

function formatLongDate(date: string) {
  return new Intl.DateTimeFormat("en", {
    weekday: "long",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${date}T00:00:00Z`));
}
