import Link from "next/link";
import { cn } from "@/shared/lib/cn";
import { getActivityHref, getLogHref, getTabHref, type WorkspaceLogItem } from "./data";
import type { WorkspaceActivity } from "./workspaceTypes";

const LEVELS = ["bg-zinc-100", "bg-[#fce8e0]", "bg-[#f0c4b0]", "bg-[#da7756]", "bg-[#a85638]"] as const;
const FUTURE_LEVEL = "border border-dashed border-orange-200/70 bg-orange-50/40";
const CELL_SIZE_PX = 11;
const CELL_GAP_PX = 3;
const MONTH_GAP_PX = 10;
const WEEKDAY_LABEL_WIDTH_PX = 20;
const WEEKDAY_GAP_PX = 4;
// 주 중간 시작 달을 한 칸 왼쪽으로 당겨, 이전 달 오목에 볼록이 테트리스처럼 맞물리게 한다.
// 월 박스가 아니라 실제 셀 외곽선을 비교해 이 간격만 남긴다.

type ActivityGridDay = WorkspaceActivity["days"][number] & {
  isFuture?: boolean;
};

export function ActivityView({ activity, selectedDate, selectedLogs }: { activity: WorkspaceActivity | null; selectedDate: string; selectedLogs: WorkspaceLogItem[] }) {
  const months = activity ? buildActivityMonths(activity) : [];
  const activityGridWidth = getActivityGridWidth(months);

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
          <div className="px-5 pb-3">
            <div
              className="mx-auto flex max-w-full items-start"
              style={{
                width:
                  WEEKDAY_LABEL_WIDTH_PX
                  + WEEKDAY_GAP_PX
                  + activityGridWidth,
              }}
            >
              <div
                data-activity-weekday-labels
                aria-hidden="true"
                className="mr-1 mt-11 flex w-5 shrink-0 flex-col text-right font-mono text-[9px] font-medium text-zinc-400"
                style={{ gap: CELL_GAP_PX }}
              >
                {["Mon", "", "Wed", "", "Fri", "", ""].map((label, dayIndex) => (
                  <span
                    key={dayIndex}
                    className="block"
                    style={{ height: CELL_SIZE_PX, lineHeight: `${CELL_SIZE_PX}px` }}
                  >
                    {label}
                  </span>
                ))}
              </div>
              <div
                data-activity-scroll
                className="min-w-0 flex-1 overflow-x-auto pb-2 pt-11"
              >
                <div data-activity-months className="flex w-max">
                  {months.map((month, monthIndex) => (
                    <div
                      key={month.key}
                      role="group"
                      aria-label={formatMonth(month.key)}
                      data-activity-month={month.key}
                      className="pointer-events-none relative inline-flex"
                      style={{
                        gap: CELL_GAP_PX,
                        marginLeft:
                          monthIndex > 0
                            ? getMonthMarginLeft(months[monthIndex - 1], month)
                            : undefined,
                      }}
                    >
                      <span
                        data-activity-month-label
                        aria-hidden="true"
                        className="absolute -top-7 font-mono text-[9.5px] font-semibold text-zinc-500"
                        style={{ left: month.labelOffsetPx }}
                      >
                        {formatShortMonth(month.key)}
                      </span>
                      {month.weeks.map((week, weekIndex) => (
                        <div
                          key={weekIndex}
                          data-activity-week
                          className="flex flex-col"
                          style={{ gap: CELL_GAP_PX }}
                        >
                          {week.map((day, dayIndex) => day ? (
                            <ActivityDayCell
                              key={day.date}
                              day={day}
                              selected={day.date === selectedDate}
                              isToday={day.date === activity.to}
                              tooltipAlignment={
                                monthIndex === 0 && weekIndex === 0
                                  ? "left"
                                  : monthIndex === months.length - 1
                                    ? "right"
                                    : "center"
                              }
                            />
                          ) : (
                            <span
                              key={dayIndex}
                              className="pointer-events-none"
                              style={{ width: CELL_SIZE_PX, height: CELL_SIZE_PX }}
                              aria-hidden="true"
                            />
                          ))}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
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
  isToday,
  tooltipAlignment,
}: {
  day: ActivityGridDay;
  selected: boolean;
  isToday: boolean;
  tooltipAlignment: "left" | "center" | "right";
}) {
  const dateLabel = formatDate(day.date);
  const logLabel = day.isFuture
    ? "Planned"
    : `${day.logCount} log${day.logCount === 1 ? "" : "s"}`;
  const label = `${dateLabel} · ${logLabel}`;
  const cellClassName = cn(
    "pointer-events-auto group relative rounded-[3px] transition-transform duration-150 hover:z-20 hover:scale-125 focus-visible:z-20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/40",
    day.isFuture ? FUTURE_LEVEL : LEVELS[getLevel(day.logCount)],
    selected
      ? "ring-2 ring-zinc-800 ring-offset-1"
      : isToday && "ring-1 ring-[#a85638] ring-offset-1 ring-offset-white",
  );
  const tooltip = (
    <span
      role="tooltip"
      className={cn(
        "pointer-events-none invisible absolute bottom-[calc(100%+7px)] z-30 w-max translate-y-1 rounded-lg bg-zinc-950 px-2.5 py-1.5 text-center text-[10.5px] font-medium leading-4 text-white opacity-0 shadow-[0_8px_24px_rgba(24,24,27,0.22)] transition duration-150 after:absolute after:top-full after:border-4 after:border-transparent after:border-t-zinc-950 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:visible group-focus-visible:translate-y-0 group-focus-visible:opacity-100",
        tooltipAlignment === "left" && "left-0 after:left-[2px]",
        tooltipAlignment === "center"
          && "left-1/2 -translate-x-1/2 after:left-1/2 after:-translate-x-1/2",
        tooltipAlignment === "right" && "right-0 after:right-[2px]",
      )}
    >
      <span className="block whitespace-nowrap">{dateLabel}</span>
      <span className="block whitespace-nowrap text-zinc-300">{logLabel}</span>
    </span>
  );

  if (day.isFuture) {
    return (
      <span
        role="img"
        title={label}
        aria-label={`${dateLabel}, ${logLabel}`}
        className={cellClassName}
        style={{ width: CELL_SIZE_PX, height: CELL_SIZE_PX }}
      >
        {tooltip}
      </span>
    );
  }

  return (
    <Link
      href={getActivityHref(day.date)}
      title={label}
      aria-label={`${dateLabel}, ${logLabel}`}
      aria-current={selected ? "date" : undefined}
      className={cellClassName}
      style={{ width: CELL_SIZE_PX, height: CELL_SIZE_PX }}
    >
      {tooltip}
    </Link>
  );
}

function buildActivityMonths(activity: WorkspaceActivity) {
  const daysByMonth = new Map<
    string,
    WorkspaceActivity["days"]
  >();
  for (const day of activity.days) {
    const month = day.date.slice(0, 7);
    const days = daysByMonth.get(month) ?? [];
    days.push(day);
    daysByMonth.set(month, days);
  }

  return Array.from(daysByMonth, ([key, days]) => ({
    key,
    ...buildMonthGrid(key, days, activity.to),
  }));
}

function buildMonthGrid(
  month: string,
  activityDays: WorkspaceActivity["days"],
  today: string,
) {
  const [year, monthNumber] = month.split("-").map(Number);
  const firstDay = new Date(Date.UTC(year, monthNumber - 1, 1));
  const mondayOffset = (firstDay.getUTCDay() + 6) % 7;
  const dayCount = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();
  const activityByDate = new Map(
    activityDays.map((day) => [day.date, day] as const),
  );
  const cells: Array<ActivityGridDay | null> = Array.from(
    { length: mondayOffset },
    () => null,
  );
  for (let day = 1; day <= dayCount; day += 1) {
    const date = `${month}-${String(day).padStart(2, "0")}`;
    const activityDay = activityByDate.get(date);
    cells.push(
      activityDay
        ?? (month === today.slice(0, 7) && date > today
          ? { date, logCount: 0, isFuture: true }
          : null),
    );
  }
  while (cells.length % 7 !== 0) cells.push(null);

  const weeks: Array<typeof cells> = [];
  for (let index = 0; index < cells.length; index += 7) {
    weeks.push(cells.slice(index, index + 7));
  }
  const firstOccupiedWeek = weeks.findIndex((week) =>
    week.some((day) => day !== null),
  );
  return {
    labelOffsetPx:
      Math.max(0, firstOccupiedWeek) * (CELL_SIZE_PX + CELL_GAP_PX),
    weeks,
  };
}

function getMonthMarginLeft(
  previousMonth: ReturnType<typeof buildMonthGrid> & { key: string },
  currentMonth: ReturnType<typeof buildMonthGrid> & { key: string },
) {
  const cellPitch = CELL_SIZE_PX + CELL_GAP_PX;
  const previousWidth = getMonthWidth(previousMonth);
  let currentLeft = 0;

  for (let dayIndex = 0; dayIndex < 7; dayIndex += 1) {
    const previousLastWeek = previousMonth.weeks.findLastIndex(
      (week) => week[dayIndex] !== null,
    );
    const currentFirstWeek = currentMonth.weeks.findIndex(
      (week) => week[dayIndex] !== null,
    );
    if (previousLastWeek < 0 || currentFirstWeek < 0) continue;

    currentLeft = Math.max(
      currentLeft,
      previousLastWeek * cellPitch
        + CELL_SIZE_PX
        + MONTH_GAP_PX
        - currentFirstWeek * cellPitch,
    );
  }

  return currentLeft - previousWidth;
}

function getActivityGridWidth(months: ReturnType<typeof buildActivityMonths>) {
  return months.reduce((width, month, monthIndex) => {
    const marginLeft = monthIndex > 0
      ? getMonthMarginLeft(months[monthIndex - 1], month)
      : 0;
    return width + marginLeft + getMonthWidth(month);
  }, 0);
}

function getMonthWidth(month: ReturnType<typeof buildMonthGrid>) {
  return month.weeks.length * CELL_SIZE_PX
    + (month.weeks.length - 1) * CELL_GAP_PX;
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

function formatMonth(month: string) {
  return new Intl.DateTimeFormat("en", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${month}-01T00:00:00Z`));
}

function formatShortMonth(month: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    timeZone: "UTC",
  }).format(new Date(`${month}-01T00:00:00Z`));
}

function formatLongDate(date: string) {
  return new Intl.DateTimeFormat("en", { weekday: "long", month: "long", day: "numeric", year: "numeric", timeZone: "UTC" }).format(new Date(`${date}T00:00:00Z`));
}
