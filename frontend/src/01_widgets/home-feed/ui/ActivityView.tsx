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
          <div className="overflow-x-auto px-5 py-5">
            <div className="inline-flex min-w-full justify-center gap-[4px]">
              {weeks.map((week, weekIndex) => (
                <div key={weekIndex} className="flex flex-col gap-[4px]">
                  {week.map((day, dayIndex) => day ? (
                    <Link
                      key={day.date}
                      href={getActivityHref(day.date)}
                      title={`${formatDate(day.date)} · ${day.logCount} log${day.logCount === 1 ? "" : "s"}`}
                      aria-label={`${formatDate(day.date)}, ${day.logCount} log${day.logCount === 1 ? "" : "s"}`}
                      aria-current={day.date === selectedDate ? "date" : undefined}
                      className={cn("size-[13px] rounded-[3px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/40", LEVELS[getLevel(day.logCount)], day.date === selectedDate && "ring-2 ring-zinc-800 ring-offset-1")}
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

function buildActivityWeeks(activity: WorkspaceActivity) {
  const first = new Date(`${activity.from}T00:00:00Z`);
  const mondayOffset = (first.getUTCDay() + 6) % 7;
  const cells: Array<WorkspaceActivity["days"][number] | null> = Array.from({ length: mondayOffset }, () => null);
  cells.push(...activity.days);
  while (cells.length % 7 !== 0) cells.push(null);
  const weeks: Array<typeof cells> = [];
  for (let index = 0; index < cells.length; index += 7) weeks.push(cells.slice(index, index + 7));
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
