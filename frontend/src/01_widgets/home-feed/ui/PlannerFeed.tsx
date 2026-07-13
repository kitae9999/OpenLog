import { redirect } from "next/navigation";
import { Footer } from "@/widgets/chrome/ui";
import { getUserOrRedirectToOnboarding } from "@/features/auth/api/requireOnboarding";
import { buildViewerProfileHref } from "@/shared/lib/publicRoutes";
import { PlannerView } from "./PlannerView";
import { requireWorkspaceData } from "./requireWorkspacePageData";
import { WorkspaceSectionShell } from "./WorkspaceSectionShell";
import {
  getWorkspaceTodosInRange,
  loadWorkspacePageData,
} from "./workspaceApi";

export async function PlannerFeed({
  requestedMonth,
  requestedDate,
}: {
  requestedMonth?: string;
  requestedDate?: string;
}) {
  const user = await getUserOrRedirectToOnboarding();
  if (!user) redirect("/");

  const pageData = await loadWorkspacePageData();
  const workspaceData = requireWorkspaceData(pageData);
  const today = getSeoulIsoDate(new Date());
  const month = isValidMonth(requestedMonth)
    ? requestedMonth
    : today.slice(0, 7);
  const { from, to } = getMonthRange(month);
  const selectedDate =
    isValidDate(requestedDate) && requestedDate.startsWith(`${month}-`)
      ? requestedDate
      : today.startsWith(`${month}-`)
        ? today
        : from;
  const todos = await getWorkspaceTodosInRange(
    workspaceData.workspaceId,
    from,
    to,
  );

  return (
    <WorkspaceSectionShell
      label="Planner"
      workspaceNav="planner"
      isLoggedIn
      profileImageUrl={user.profileImageUrl}
      profileHref={buildViewerProfileHref(user.username)}
      workspaces={pageData.workspaces}
      workspaceData={workspaceData}
      footer={<Footer />}
    >
      <PlannerView
        month={month}
        selectedDate={selectedDate}
        todos={todos}
        workspaceData={workspaceData}
      />
    </WorkspaceSectionShell>
  );
}

function isValidMonth(value?: string): value is string {
  if (!value || !/^\d{4}-\d{2}$/.test(value)) return false;
  const [year, month] = value.split("-").map(Number);
  return year >= 1970 && month >= 1 && month <= 12;
}

function isValidDate(value?: string): value is string {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

function getMonthRange(month: string) {
  const [year, monthNumber] = month.split("-").map(Number);
  const lastDay = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();
  return { from: `${month}-01`, to: `${month}-${String(lastDay).padStart(2, "0")}` };
}

function getSeoulIsoDate(date: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}
