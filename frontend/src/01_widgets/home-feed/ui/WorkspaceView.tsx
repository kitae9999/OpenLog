import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/shared/lib/cn";
import {
  workspaceDecisions,
  workspaceLogs,
  workspaceMemories,
  workspaceMetrics,
  workspaceOutputs,
  workspaceTodos,
  type WorkspaceLogItem,
  type WorkspaceTone,
} from "./data";
import { WorkspaceGuestPrompt } from "./WorkspaceGuestPrompt";

export function WorkspaceView({ isLoggedIn }: { isLoggedIn: boolean }) {
  if (!isLoggedIn) {
    return <WorkspaceGuestPrompt />;
  }

  return (
    <div className="space-y-4">
      <MetricGrid />

      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1.55fr)_minmax(320px,1fr)]">
        <div className="min-w-0 space-y-4">
          <NowWorkingCard />
          <RecentLogsCard />
        </div>

        <div className="min-w-0 space-y-4">
          <DecisionsCard />
          <TodosCard />
          <OutputsCard />
          <MemoryCard />
        </div>
      </div>
    </div>
  );
}

function MetricGrid() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {workspaceMetrics.map((metric) => (
        <section
          key={metric.label}
          className="rounded-2xl border border-zinc-200/70 bg-white px-5 py-4"
        >
          <div className="text-[11px] font-semibold uppercase tracking-[0.1em] text-zinc-400">
            {metric.label}
          </div>
          <div className="mt-1 text-[30px] font-bold leading-tight tracking-tight text-zinc-950 [font-family:Georgia,serif]">
            {metric.value}
          </div>
          <p className="mt-0.5 text-[12px] text-zinc-400">
            {metric.emphasis ? (
              <span
                className={cn(
                  "font-semibold",
                  metric.tone === "positive" && "text-green-700",
                  metric.tone === "warning" && "text-amber-700",
                  !metric.tone && "text-zinc-600",
                )}
              >
                {metric.emphasis}
              </span>
            ) : null}
            {metric.emphasis
              ? metric.description.replace(metric.emphasis, "")
              : metric.description}
          </p>
        </section>
      ))}
    </div>
  );
}

function NowWorkingCard() {
  return (
    <DashboardCard
      title="NOW WORKING"
      action={<IconBranch className="size-[15px] text-zinc-400" />}
    >
      <div className="px-5 pb-5 pt-3">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-[17px] font-bold tracking-[-0.01em] text-zinc-950">
            홈 피드 → 워크스페이스 뷰 전환
          </h2>
          <BranchBadge>fix/pnpm</BranchBadge>
        </div>

        <div className="mt-3 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">
          <span className="block text-[10.5px] font-semibold uppercase tracking-[0.1em] text-blue-700">
            SESSION SUMMARY
          </span>
          <p className="mt-1 text-[13.5px] leading-6 text-zinc-700">
            홈 피드를 개인 워크스페이스 구조로 분리하는 중. WorkspaceView,
            WorkspaceGuestPrompt 컴포넌트를 추가했고 HomeFeedShell에서 로그인
            분기를 처리하도록 변경.
          </p>
        </div>

        <dl className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-[12.5px] text-zinc-500">
          <div>
            Last commit&nbsp;
            <dd className="inline font-semibold text-zinc-950">
              fix: turbopack 버그 수정
            </dd>
          </div>
          <div>
            Files changed&nbsp;
            <dd className="inline font-semibold text-zinc-950">8</dd>
          </div>
          <div>
            Uncommitted&nbsp;
            <dd className="inline font-semibold text-zinc-950">+412 -96</dd>
          </div>
        </dl>

        <div className="mt-4 flex flex-wrap gap-2">
          <LinkButton href="/write" tone="solid">
            <IconPencil className="size-3.5" />
            Log now
          </LinkButton>
          <LinkButton href="/write" tone="outline">
            Generate PR doc
          </LinkButton>
          <LinkButton href="/write" tone="ghost">
            View diff
          </LinkButton>
        </div>
      </div>
    </DashboardCard>
  );
}

function RecentLogsCard() {
  return (
    <DashboardCard title="RECENT LOGS" action={<HeaderLink href="/write" />}>
      <div className="pb-2 pt-1">
        {workspaceLogs.map((item) => (
          <WorkspaceLogRow key={item.id} item={item} />
        ))}
      </div>
    </DashboardCard>
  );
}

function WorkspaceLogRow({ item }: { item: WorkspaceLogItem }) {
  return (
    <article className="flex items-start gap-3 border-t border-zinc-100 px-5 py-3 first:border-t-0">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <ToneBadge tone={item.tone}>{item.label}</ToneBadge>
          <h3 className="text-[14px] font-semibold text-zinc-950">
            {item.title}
          </h3>
        </div>
        <p className="mt-1 text-[12.5px] leading-5 text-zinc-500">
          {item.description}
        </p>
        <div className="mt-1.5 flex flex-wrap items-center gap-3 text-[11.5px] text-zinc-400">
          <span>{item.meta}</span>
          {item.commit ? <CodePill>{item.commit}</CodePill> : null}
        </div>
      </div>
      <Link
        href={item.href}
        className="mt-5 shrink-0 text-[12.5px] font-medium text-zinc-400 transition hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20"
      >
        Open
      </Link>
    </article>
  );
}

function DecisionsCard() {
  return (
    <DashboardCard title="DECISIONS">
      <PanelList>
        {workspaceDecisions.map((decision) => (
          <PanelItem key={decision.title}>
            <div className="min-w-0">
              <h3 className="text-[13px] font-semibold leading-5 text-zinc-950">
                {decision.title}
              </h3>
              <p className="mt-0.5 text-[12px] text-zinc-500">
                {decision.description}
              </p>
            </div>
            {decision.status === "Review" ? (
              <ToneBadge tone="blue">{decision.status}</ToneBadge>
            ) : (
              <span className="shrink-0 text-[11px] tabular-nums text-zinc-400">
                {decision.status}
              </span>
            )}
          </PanelItem>
        ))}
      </PanelList>
    </DashboardCard>
  );
}

function TodosCard() {
  return (
    <DashboardCard title="OPEN TODOS">
      <PanelList>
        {workspaceTodos.map((todo) => (
          <PanelItem key={todo.title} align="start">
            <span className="mt-[3px] size-[15px] shrink-0 rounded-[5px] border-[1.5px] border-zinc-300" />
            <div className="min-w-0">
              <h3 className="text-[13px] font-semibold leading-5 text-zinc-950">
                {todo.title}
              </h3>
              {todo.description ? (
                <p className="mt-0.5 text-[12px] text-zinc-500">
                  {todo.description}
                </p>
              ) : null}
            </div>
          </PanelItem>
        ))}
      </PanelList>
    </DashboardCard>
  );
}

function OutputsCard() {
  return (
    <DashboardCard title="OUTPUTS">
      <div className="grid grid-cols-1 gap-2 px-5 pb-5 pt-2 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
        {workspaceOutputs.map((output) => (
          <Link
            key={output.title}
            href="/write"
            className="rounded-xl border border-zinc-200 px-3.5 py-3 transition hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20"
          >
            <div className="flex items-center gap-2 text-[13px] font-semibold text-zinc-950">
              <OutputIcon
                kind={output.kind}
                className="size-3.5 text-zinc-400"
              />
              {output.title}
            </div>
            <p className="mt-0.5 text-[11.5px] text-zinc-400">
              {output.description}
            </p>
          </Link>
        ))}
      </div>
    </DashboardCard>
  );
}

function MemoryCard() {
  return (
    <DashboardCard title="PROJECT MEMORY" action={<ToneBadge tone="zinc">MCP</ToneBadge>}>
      <div className="pb-2 pt-1">
        {workspaceMemories.map((memory) => (
          <article
            key={memory.title}
            className="border-t border-zinc-100 px-5 py-3 first:border-t-0"
          >
            <h3 className="text-[13px] font-semibold text-zinc-950">
              {memory.title}
            </h3>
            <p className="mt-0.5 text-[12px] leading-5 text-zinc-500">
              {memory.description}
            </p>
            <div className="mt-1.5 flex gap-3 font-mono text-[10.5px] text-zinc-400">
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
      <div className="flex items-center justify-between gap-3 px-5 pt-4">
        <h2 className="text-[11.5px] font-semibold uppercase tracking-[0.1em] text-zinc-400">
          {title}
        </h2>
        {action ? (
          <div className="flex items-center gap-2 text-zinc-400">{action}</div>
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
        "flex gap-3 border-t border-zinc-100 px-5 py-2.5 first:border-t-0",
        align === "center" ? "items-center" : "items-start",
      )}
    >
      {children}
    </article>
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
    <code className="rounded-md bg-zinc-100 px-1.5 py-0.5 font-mono text-[10.5px] text-zinc-500">
      {children}
    </code>
  );
}

function HeaderLink({ href }: { href: string }) {
  return (
    <Link
      href={href}
      className="text-[12px] font-medium text-zinc-500 transition hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20"
    >
      View all
    </Link>
  );
}

function LinkButton({
  href,
  tone,
  children,
}: {
  href: string;
  tone: "solid" | "outline" | "ghost";
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex h-9 items-center gap-2 rounded-xl px-4 text-[13.5px] font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20",
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

function OutputIcon({
  kind,
  className,
}: {
  kind: (typeof workspaceOutputs)[number]["kind"];
  className?: string;
}) {
  if (kind === "pull-request") {
    return <IconPullRequest className={className} />;
  }

  if (kind === "post") {
    return <IconGlobe className={className} />;
  }

  if (kind === "calendar") {
    return <IconCalendar className={className} />;
  }

  return <IconRelease className={className} />;
}

function IconPullRequest({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <circle cx="6" cy="6" r="2.5" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="6" cy="18" r="2.5" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="18" cy="18" r="2.5" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M6 8.5v7M15 6h-2a2 2 0 0 0-2 2"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.8"
      />
      <path
        d="M18 15.5V10a4 4 0 0 0-4-4"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function IconGlobe({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M3.5 12h17M12 3.5c2.3 2.3 3.5 5.2 3.5 8.5s-1.2 6.2-3.5 8.5c-2.3-2.3-3.5-5.2-3.5-8.5s1.2-6.2 3.5-8.5z"
        stroke="currentColor"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function IconCalendar({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <rect
        x="4"
        y="5"
        width="16"
        height="16"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M8 3v4M16 3v4M4 10h16"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function IconRelease({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M20 12v7a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-7"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.8"
      />
      <path
        d="M2 7h20v5H2zM12 7v13M12 7s-1.5-4-5-4c-2 0-2.5 4 5 4zM12 7s1.5-4 5-4c2 0 2.5 4-5 4z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}
