import Link from "next/link";
import { cn } from "@/shared/lib/cn";
import { getActivityHref } from "@/entities/workspace/model/data";
import type { WorkspaceActivity } from "@/entities/workspace/model/workspaceTypes";

const LEVELS = [
  "bg-zinc-100",
  "bg-[#fce8e0]",
  "bg-[#f0c4b0]",
  "bg-[#da7756]",
  "bg-[#a85638]",
] as const;
const FUTURE_LEVEL =
  "border border-dashed border-orange-200/70 bg-orange-50/40";
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

export function ActivityYearGrid({
  activity,
  selectedDate,
}: {
  activity: WorkspaceActivity;
  selectedDate?: string;
}) {
  const months = buildActivityMonths(activity);
  const activityGridWidth = getActivityGridWidth(months);
  const selected = selectedDate ?? activity.to;

  return (
    <div aria-label="365 day activity grid">
      <div className="pb-3">
        <div
          className="mx-auto flex max-w-full items-start"
          style={{
            width:
              WEEKDAY_LABEL_WIDTH_PX + WEEKDAY_GAP_PX + activityGridWidth,
          }}
        >
          <div
            data-activity-weekday-labels
            aria-hidden="true"
            className="mr-1 mt-14 flex w-5 shrink-0 flex-col text-right font-mono text-[9px] font-medium text-zinc-400"
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
            className="openlog-scroll min-w-0 flex-1 overflow-x-auto overflow-y-visible pb-8 pt-14"
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
                    className="absolute -top-8 font-mono text-[9.5px] font-semibold text-zinc-500"
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
                      {week.map((day, dayIndex) =>
                        day ? (
                          <ActivityDayCell
                            key={day.date}
                            day={day}
                            selected={day.date === selected}
                            isToday={day.date === activity.to}
                            tooltipSide={dayIndex <= 1 ? "bottom" : "top"}
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
                            style={{
                              width: CELL_SIZE_PX,
                              height: CELL_SIZE_PX,
                            }}
                            aria-hidden="true"
                          />
                        ),
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-end gap-1.5 pt-2 text-[10px] text-zinc-400">
        <span>Less</span>
        {LEVELS.map((tone) => (
          <span key={tone} className={cn("size-[11px] rounded-[2px]", tone)} />
        ))}
        <span>More</span>
      </div>
    </div>
  );
}

function ActivityDayCell({
  day,
  selected,
  isToday,
  tooltipSide,
  tooltipAlignment,
}: {
  day: ActivityGridDay;
  selected: boolean;
  isToday: boolean;
  tooltipSide: "top" | "bottom";
  tooltipAlignment: "left" | "center" | "right";
}) {
  const dateLabel = formatDate(day.date);
  const logLabel = day.isFuture
    ? "Planned"
    : `${day.logCount} log${day.logCount === 1 ? "" : "s"}`;
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
        "pointer-events-none invisible absolute z-30 w-max rounded-lg bg-zinc-950 px-2.5 py-1.5 text-center text-[10.5px] font-medium leading-4 text-white opacity-0 shadow-[0_8px_24px_rgba(24,24,27,0.22)] transition duration-150 after:absolute after:border-4 after:border-transparent group-hover:visible group-hover:opacity-100 group-focus-visible:visible group-focus-visible:opacity-100",
        tooltipSide === "top" &&
          "bottom-[calc(100%+7px)] translate-y-1 after:top-full after:border-t-zinc-950 group-hover:translate-y-0 group-focus-visible:translate-y-0",
        tooltipSide === "bottom" &&
          "top-[calc(100%+7px)] -translate-y-1 after:bottom-full after:border-b-zinc-950 group-hover:translate-y-0 group-focus-visible:translate-y-0",
        tooltipAlignment === "left" && "left-0 after:left-[2px]",
        tooltipAlignment === "center" &&
          "left-1/2 -translate-x-1/2 after:left-1/2 after:-translate-x-1/2",
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
  const daysByMonth = new Map<string, WorkspaceActivity["days"]>();
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
      activityDay ??
        (month === today.slice(0, 7) && date > today
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
      previousLastWeek * cellPitch +
        CELL_SIZE_PX +
        MONTH_GAP_PX -
        currentFirstWeek * cellPitch,
    );
  }

  return currentLeft - previousWidth;
}

function getActivityGridWidth(months: ReturnType<typeof buildActivityMonths>) {
  return months.reduce((width, month, monthIndex) => {
    const marginLeft =
      monthIndex > 0 ? getMonthMarginLeft(months[monthIndex - 1], month) : 0;
    return width + marginLeft + getMonthWidth(month);
  }, 0);
}

function getMonthWidth(month: ReturnType<typeof buildMonthGrid>) {
  return (
    month.weeks.length * CELL_SIZE_PX + (month.weeks.length - 1) * CELL_GAP_PX
  );
}

function getLevel(count: number) {
  if (count <= 0) return 0;
  if (count === 1) return 1;
  if (count === 2) return 2;
  if (count === 3) return 3;
  return 4;
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${date}T00:00:00Z`));
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
