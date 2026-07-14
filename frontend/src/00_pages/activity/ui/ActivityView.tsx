import Link from "next/link";
import { cn } from "@/shared/lib/cn";
import { getLogHref, getTabHref, type WorkspaceLogItem } from "@/entities/workspace/model/data";
import type { WorkspaceActivity } from "@/entities/workspace/model/workspaceTypes";
import { ActivityYearGrid } from "@/widgets/activity-calendar/ui/ActivityYearGrid";

export function ActivityView({
  activity,
  selectedDate,
  selectedLogs,
}: {
  activity: WorkspaceActivity | null;
  selectedDate: string;
  selectedLogs: WorkspaceLogItem[];
}) {
  return (
    <div className="mx-auto w-full max-w-[920px]">
      <nav
        aria-label="Breadcrumb"
        className="mb-6 flex items-center gap-1.5 text-[13px] text-zinc-500"
      >
        <Link
          href={getTabHref("workspace", true)}
          className="font-medium text-zinc-500 transition hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20"
        >
          openlog
        </Link>
        <span className="text-zinc-300">/</span>
        <span className="font-semibold text-zinc-950">Activity</span>
      </nav>

      <header className="flex flex-wrap items-end justify-between gap-3 pb-6">
        <div className="min-w-0">
          <h1 className="text-[22px] font-semibold tracking-tight text-zinc-950">
            Activity
          </h1>
          <p className="mt-1.5 text-[13px] text-zinc-500">
            Log activity across the last 365 days, in Asia/Seoul time.
          </p>
        </div>
        <p className="text-[13px] font-medium text-zinc-500">
          <span className="tabular-nums text-zinc-950">
            {activity?.totalLogCount ?? 0}
          </span>{" "}
          logs
        </p>
      </header>

      <section aria-label="365 day activity grid" className="openlog-scroll overflow-x-auto">
        {activity ? (
          <ActivityYearGrid activity={activity} selectedDate={selectedDate} />
        ) : (
          <p className="mt-4 pl-5 text-sm text-zinc-500">
            Activity could not be loaded.
          </p>
        )}
      </section>

      <section className="mt-10" aria-labelledby="selected-activity-date">
        <div className="flex items-baseline justify-between gap-3 border-b border-zinc-200 pb-3">
          <h2
            id="selected-activity-date"
            className="text-[13.5px] font-semibold tracking-tight text-zinc-600"
          >
            {formatLongDate(selectedDate)}
          </h2>
          <span className="text-[12.5px] font-medium text-zinc-500">
            {selectedLogs.length} log{selectedLogs.length === 1 ? "" : "s"}
          </span>
        </div>

        {selectedLogs.length === 0 ? (
          <div className="mt-10 pl-5">
            <p className="text-sm text-zinc-500">No logs on this day.</p>
            <p className="mt-1 text-sm text-zinc-400">
              Choose a darker square to inspect captured work.
            </p>
          </div>
        ) : (
          <ul className="mt-2">
            {selectedLogs.map((log) => (
              <li
                key={log.id}
                className="border-t border-zinc-200/80 first:border-t-0"
              >
                <Link
                  href={getLogHref(log.id)}
                  className={cn(
                    "grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-2.5 rounded-lg px-2.5 py-2.5 transition hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20",
                  )}
                >
                  <span className="min-w-0">
                    <span className="block truncate text-[14.5px] font-medium leading-5 text-zinc-950">
                      {log.title}
                    </span>
                    {log.description ? (
                      <span className="mt-1 block truncate text-[12.5px] leading-5 text-zinc-500">
                        {log.description}
                      </span>
                    ) : null}
                  </span>
                  <span className="shrink-0 text-[12px] font-medium text-zinc-400">
                    {log.label}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function formatLongDate(date: string) {
  return new Intl.DateTimeFormat("en", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${date}T00:00:00Z`));
}
