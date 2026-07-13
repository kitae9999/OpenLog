import Link from "next/link";
import { cn } from "@/shared/lib/cn";
import { getActivityHref, getLogHref, getTabHref, type WorkspaceLogItem } from "./data";
import type { WorkspaceActivity } from "./workspaceTypes";

const LEVELS = ["bg-zinc-100", "bg-[#fce8e0]", "bg-[#f0c4b0]", "bg-[#da7756]", "bg-[#a85638]"] as const;

export function ActivityView({ activity, selectedDate, selectedLogs }: { activity: WorkspaceActivity | null; selectedDate: string; selectedLogs: WorkspaceLogItem[] }) {
  const weeks = activity ? buildActivityWeeks(activity) : [];

  return (
    <div>
      <nav aria-label="Breadcrumb" className="mb-4 flex items-center gap-1.5 text-[13px] text-zinc-500">
        <Link href={getTabHref("workspace", true)} className="font-semibold text-zinc-700 hover:text-zinc-950">openlog</Link>
        <span className="text-zinc-300">/</span><span className="font-semibold text-zinc-950">Activity</span>
      </nav>
      <header className="border-b border-zinc-200/80 pb-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-400">Workspace rhythm</p>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-[family-name:var(--font-georgia,Georgia,serif)] text-3xl font-bold tracking-[-0.025em]">Activity</h1>
            <p className="mt-2 text-[13.5px] text-zinc-500">Log activity across the last 365 days, in Asia/Seoul time.</p>
          </div>
          <p className="font-mono text-[12px] text-zinc-500"><span className="text-lg font-semibold text-zinc-950">{activity?.totalLogCount ?? 0}</span> logs</p>
        </div>
      </header>

      <section className="mt-5 overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-[0_1px_2px_rgba(24,24,27,0.04)]" aria-label="365 day activity grid">
        {activity ? (
          <div className="overflow-x-auto px-16 pb-5 pt-11">
            <div className="inline-flex min-w-full justify-center gap-[4px]">
              {weeks.map((week, weekIndex) => (
                <div
                  key={week.days.find((day) => day)?.date ?? weekIndex}
                  data-month-break={week.monthBreak ?? undefined}
                  className={cn(
                    "flex flex-col gap-[4px]",
                    week.monthBreak && "ml-[6px]",
                  )}
                >
                  {week.days.map((day, dayIndex) => day ? (
                    <ActivityDayCell
                      key={day.date}
                      day={day}
                      selected={day.date === selectedDate}
                    />
                  ) : <span key={dayIndex} className="size-[13px]" aria-hidden="true" />)}
                </div>
              ))}
            </div>
          </div>
        ) : <div className="px-6 py-14 text-center text-[13px] text-zinc-500">Activity could not be loaded.</div>}
        <div className="flex items-center justify-end gap-1.5 border-t border-zinc-100 px-5 py-3 text-[10px] text-zinc-400">
          <span>Less</span>{LEVELS.map((tone) => <span key={tone} className={cn("size-[11px] rounded-[2px]", tone)} />)}<span>More</span>
        </div>
      </section>

      <section className="mt-5 overflow-hidden rounded-2xl border border-zinc-200/80 bg-white" aria-labelledby="selected-activity-date">
        <header className="flex items-center justify-between gap-4 border-b border-zinc-100 bg-zinc-50/60 px-5 py-3.5">
          <h2 id="selected-activity-date" className="text-[13px] font-semibold text-zinc-900">{formatLongDate(selectedDate)}</h2>
          <span className="font-mono text-[10.5px] text-zinc-400">{selectedLogs.length} log{selectedLogs.length === 1 ? "" : "s"}</span>
        </header>
        {selectedLogs.length === 0 ? (
          <div className="px-5 py-10 text-center"><p className="text-[13px] font-medium text-zinc-700">No logs on this day</p><p className="mt-1 text-[12px] text-zinc-400">Choose a darker square to inspect captured work.</p></div>
        ) : selectedLogs.map((log) => (
          <Link key={log.id} href={getLogHref(log.id)} className="group flex items-start justify-between gap-4 border-t border-zinc-100 px-5 py-3.5 first:border-t-0 hover:bg-zinc-50/70">
            <div className="min-w-0"><p className="text-[13px] font-semibold text-zinc-900 group-hover:underline group-hover:underline-offset-4">{log.title}</p><p className="mt-0.5 line-clamp-1 text-[12px] text-zinc-500">{log.description}</p></div>
            <span className="shrink-0 rounded-md bg-zinc-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-500">{log.label}</span>
          </Link>
        ))}
      </section>
    </div>
  );
}

function ActivityDayCell({
  day,
  selected,
}: {
  day: WorkspaceActivity["days"][number];
  selected: boolean;
}) {
  const dateLabel = formatDate(day.date);
  const logLabel = `${day.logCount} log${day.logCount === 1 ? "" : "s"}`;

  return (
    <Link
      href={getActivityHref(day.date)}
      title={`${dateLabel} · ${logLabel}`}
      aria-label={`${dateLabel}, ${logLabel}`}
      aria-current={selected ? "date" : undefined}
      className={cn(
        "group relative size-[13px] rounded-[3px] transition-transform duration-150 hover:z-20 hover:scale-125 focus-visible:z-20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/40",
        LEVELS[getLevel(day.logCount)],
        selected && "ring-2 ring-zinc-800 ring-offset-1",
      )}
    >
      <span
        role="tooltip"
        className="pointer-events-none invisible absolute bottom-[calc(100%+7px)] left-1/2 z-30 w-max -translate-x-1/2 translate-y-1 rounded-lg bg-zinc-950 px-2.5 py-1.5 text-center text-[10.5px] font-medium leading-4 text-white opacity-0 shadow-[0_8px_24px_rgba(24,24,27,0.22)] transition duration-150 after:absolute after:left-1/2 after:top-full after:-translate-x-1/2 after:border-4 after:border-transparent after:border-t-zinc-950 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:visible group-focus-visible:translate-y-0 group-focus-visible:opacity-100"
      >
        <span className="block whitespace-nowrap">{dateLabel}</span>
        <span className="block whitespace-nowrap text-zinc-300">{logLabel}</span>
      </span>
    </Link>
  );
}

function buildActivityWeeks(activity: WorkspaceActivity) {
  const first = new Date(`${activity.from}T00:00:00Z`);
  const mondayOffset = (first.getUTCDay() + 6) % 7;
  const cells: Array<WorkspaceActivity["days"][number] | null> = Array.from({ length: mondayOffset }, () => null);
  cells.push(...activity.days);
  while (cells.length % 7 !== 0) cells.push(null);
  const weeks: Array<{
    days: typeof cells;
    monthBreak: string | null;
  }> = [];
  for (let index = 0; index < cells.length; index += 7) {
    const days = cells.slice(index, index + 7);
    const monthStart = days.find((day) => day?.date.endsWith("-01"));
    weeks.push({
      days,
      monthBreak:
        index > 0 && monthStart ? monthStart.date.slice(0, 7) : null,
    });
  }
  return weeks;
}

function getLevel(count: number) {
  if (count <= 0) return 0;
  if (count === 1) return 1;
  if (count === 2) return 2;
  if (count === 3) return 3;
  return 4;
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }).format(new Date(`${date}T00:00:00Z`));
}

function formatLongDate(date: string) {
  return new Intl.DateTimeFormat("en", { weekday: "long", month: "long", day: "numeric", year: "numeric", timeZone: "UTC" }).format(new Date(`${date}T00:00:00Z`));
}
