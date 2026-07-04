import Link from "next/link";
import { useState, type ReactNode } from "react";
import { cn } from "@/shared/lib/cn";
import {
  workspaceIssues,
  workspaceLogs,
  workspaceMemories,
  workspaceTasks,
  workspaceWeekDays,
  type WorkspaceLogItem,
  type WorkspaceTask,
  type WorkspaceTone,
} from "./data";
import { WorkspaceGuestPrompt } from "./WorkspaceGuestPrompt";

export function WorkspaceView({ isLoggedIn }: { isLoggedIn: boolean }) {
  if (!isLoggedIn) {
    return <WorkspaceGuestPrompt />;
  }

  return (
    <div className="grid items-start gap-3.5 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
      <div className="min-w-0 space-y-3.5">
        <NowWorkingCard />
        <TasksCard />
        <RecentLogsCard />
      </div>

      <div className="min-w-0 space-y-3.5">
        <ThisWeekCard />
        <GraphCard />
        <OpenIssuesCard />
        <MemoryCard />
      </div>
    </div>
  );
}

function NowWorkingCard() {
  return (
    <DashboardCard
      title="NOW WORKING"
      action={<IconBranch className="size-[15px] text-zinc-400" />}
    >
      <div className="px-[18px] pb-[18px] pt-3">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-[17px] font-bold tracking-[-0.01em] text-zinc-950">
            홈 피드 → 워크스페이스 뷰 전환
          </h2>
          <BranchBadge>fix/pnpm</BranchBadge>
        </div>

        <p className="mt-2 max-w-[62ch] text-[13px] leading-[1.6] text-zinc-500">
          WorkspaceView·WorkspaceGuestPrompt 신규 추가, HomeFeedShell에서 로그인
          분기 처리 중. — session summary
        </p>

        <dl className="mt-3 flex flex-wrap gap-x-[18px] gap-y-2 text-[12.5px] tabular-nums text-zinc-500">
          <div>
            Last commit&nbsp;
            <dd className="inline font-semibold text-zinc-950">
              fix: turbopack 버그 수정
            </dd>
          </div>
          <div>
            Uncommitted&nbsp;
            <dd className="inline font-semibold text-zinc-950">+412 −96</dd>
          </div>
        </dl>

        <div className="mt-4 flex flex-wrap gap-2">
          <LinkButton href="/write" tone="solid" size="sm">
            <IconPencil className="size-3.5" />
            Log now
          </LinkButton>
          <LinkButton href="/write" tone="outline" size="sm">
            Generate PR doc
          </LinkButton>
          <LinkButton href="/write" tone="ghost" size="sm">
            View diff
          </LinkButton>
        </div>
      </div>
    </DashboardCard>
  );
}

function TasksCard() {
  const [activeTab, setActiveTab] = useState<"today" | "week">("today");

  return (
    <DashboardCard
      title="TASKS"
      action={
        <MiniTabs
          active={activeTab}
          onChange={setActiveTab}
          items={[
            { key: "today", label: "Today" },
            { key: "week", label: "This week" },
          ]}
        />
      }
    >
      <PanelList>
        {workspaceTasks.map((task) => (
          <TaskRow key={task.id} task={task} />
        ))}
      </PanelList>
      <Link
        href="/write"
        className="block border-t border-zinc-100 px-[18px] py-2.5 text-[12.5px] font-medium text-zinc-400 transition hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20"
      >
        + Add task
      </Link>
    </DashboardCard>
  );
}

function TaskRow({ task }: { task: WorkspaceTask }) {
  return (
    <PanelItem align="start">
      <span
        className={cn(
          "mt-[2.5px] flex size-[15px] shrink-0 items-center justify-center rounded-[5px] border-[1.5px]",
          task.done
            ? "border-zinc-950 bg-zinc-950 text-white"
            : "border-zinc-300 bg-white",
        )}
      >
        {task.done ? <IconCheck className="size-[9px]" /> : null}
      </span>
      <div className="min-w-0 flex-1">
        <h3
          className={cn(
            "text-[13px] font-semibold leading-[1.45] text-zinc-950",
            task.done && "text-zinc-400 line-through",
          )}
        >
          {task.title}
        </h3>
        {task.description ? (
          <p className="mt-0.5 text-[12px] text-zinc-500">{task.description}</p>
        ) : null}
      </div>
      {task.dueLabel ? (
        <span className="shrink-0 pt-0.5 text-[11px] tabular-nums text-zinc-400">
          {task.dueLabel}
        </span>
      ) : null}
    </PanelItem>
  );
}

function RecentLogsCard() {
  return (
    <DashboardCard title="RECENT LOGS" action={<HeaderLink href="/write" />}>
      <div className="pb-1.5 pt-1.5">
        {workspaceLogs.map((item) => (
          <WorkspaceLogRow key={item.id} item={item} />
        ))}
      </div>
    </DashboardCard>
  );
}

function ThisWeekCard() {
  return (
    <DashboardCard title="THIS WEEK" action={<HeaderLink href="/write" label="Planner" />}>
      <div className="grid grid-cols-7 gap-0.5 px-3 pb-1 pt-3 text-center">
        {workspaceWeekDays.map((day) => (
          <div key={`${day.label}-${day.day}`} className="min-w-0">
            <span className="block text-[9.5px] font-semibold tracking-[0.08em] text-zinc-400">
              {day.label}
            </span>
            <span
              className={cn(
                "mx-auto mt-1 inline-grid size-6 place-items-center rounded-full text-[12.5px] font-semibold tabular-nums",
                day.isToday
                  ? "bg-zinc-950 text-white"
                  : "text-zinc-950",
              )}
            >
              {day.day}
            </span>
            <div className="mt-[5px] flex h-[5px] items-center justify-center gap-[2.5px]">
              {Array.from({ length: day.logDots }).map((_, index) => (
                <span
                  key={index}
                  className="size-[4.5px] rounded-full bg-zinc-300"
                />
              ))}
              {day.hasPlanned ? (
                <span className="size-[4.5px] rounded-full border border-zinc-400 bg-transparent" />
              ) : null}
            </div>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-3.5 px-[18px] pb-3.5 pt-1.5 text-[10.5px] text-zinc-400">
        <span className="inline-flex items-center gap-1.5">
          <span className="size-[5px] rounded-full bg-zinc-300" />
          logs
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="size-[5px] rounded-full border border-zinc-400 bg-transparent" />
          planned
        </span>
      </div>
    </DashboardCard>
  );
}

function GraphCard() {
  return (
    <DashboardCard
      title="GRAPH"
      action={<HeaderLink href="/write" label="Open full view" />}
    >
      <div className="mx-[18px] mt-3 overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50">
        <svg viewBox="0 0 264 150" fill="none" aria-hidden="true" className="block w-full">
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

function OpenIssuesCard() {
  return (
    <DashboardCard title="OPEN ISSUES" action={<HeaderLink href="/write" />}>
      <PanelList>
        {workspaceIssues.map((issue) => (
          <PanelItem key={issue.title} align="start">
            <span className="mt-[5px] size-2 shrink-0 rounded-full border-[1.5px] border-amber-700" />
            <div className="min-w-0">
              <h3 className="text-[13px] font-semibold leading-[1.45] text-zinc-950">
                {issue.title}
              </h3>
              <p className="mt-0.5 text-[12px] text-zinc-500">
                {issue.description}
              </p>
            </div>
          </PanelItem>
        ))}
      </PanelList>
    </DashboardCard>
  );
}

function WorkspaceLogRow({ item }: { item: WorkspaceLogItem }) {
  return (
    <article className="flex items-start gap-3 border-t border-zinc-100 px-[18px] py-3 first:border-t-0">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <ToneBadge tone={item.tone}>{item.label}</ToneBadge>
          <h3 className="text-[14px] font-semibold text-zinc-950">{item.title}</h3>
        </div>
        <p className="mt-0.5 text-[12.5px] leading-5 text-zinc-500">
          {item.description}
        </p>
        <div className="mt-1.5 flex flex-wrap items-center gap-3 text-[11.5px] text-zinc-400">
          <span>{item.meta}</span>
          {item.commit ? <CodePill>{item.commit}</CodePill> : null}
        </div>
      </div>
      <Link
        href={item.href}
        className="shrink-0 self-center text-[12.5px] font-medium text-zinc-400 transition hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20"
      >
        Open
      </Link>
    </article>
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
  action,
  children,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-zinc-200/70 bg-white">
      <div className="flex items-center justify-between gap-3 px-[18px] pt-3.5">
        <h2 className="text-[11.5px] font-semibold uppercase tracking-[0.1em] text-zinc-400">
          {title}
        </h2>
        {action ? (
          <div className="flex items-center gap-2.5 text-zinc-400">{action}</div>
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
  children,
}: {
  align?: "center" | "start";
  children: ReactNode;
}) {
  return (
    <article
      className={cn(
        "flex gap-[11px] border-t border-zinc-100 px-[18px] py-2 first:border-t-0",
        align === "center" ? "items-center" : "items-start",
      )}
    >
      {children}
    </article>
  );
}

function MiniTabs<T extends string>({
  active,
  onChange,
  items,
}: {
  active: T;
  onChange: (value: T) => void;
  items: Array<{ key: T; label: string }>;
}) {
  return (
    <div className="inline-flex gap-0.5">
      {items.map((item) => (
        <button
          key={item.key}
          type="button"
          onClick={() => onChange(item.key)}
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
}: {
  href: string;
  label?: string;
}) {
  return (
    <Link
      href={href}
      className="text-[12px] font-medium text-zinc-500 transition hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20"
    >
      {label}
    </Link>
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
        "inline-flex items-center gap-1.5 font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20",
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
