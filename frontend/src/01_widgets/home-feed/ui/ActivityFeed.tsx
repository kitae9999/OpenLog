import { redirect } from "next/navigation";
import { Footer } from "@/widgets/chrome/ui";
import { getUserOrRedirectToOnboarding } from "@/features/auth/api/requireOnboarding";
import { buildViewerProfileHref } from "@/shared/lib/publicRoutes";
import { ActivityView } from "./ActivityView";
import { WorkspaceSectionShell } from "./WorkspaceSectionShell";
import { getWorkspaceActivity, getWorkspaceActivityDayLogs, loadWorkspacePageData } from "./workspaceApi";

export async function ActivityFeed({ requestedDate }: { requestedDate?: string }) {
  const user = await getUserOrRedirectToOnboarding();
  if (!user) redirect("/");
  const pageData = await loadWorkspacePageData();
  const workspaceData = pageData.workspaceData;
  const today = getSeoulIsoDate(new Date());
  const from = getSeoulIsoDate(new Date(new Date(`${today}T00:00:00Z`).getTime() - 364 * 24 * 60 * 60 * 1000));
  const selectedDate = requestedDate && /^\d{4}-\d{2}-\d{2}$/.test(requestedDate) && requestedDate >= from && requestedDate <= today ? requestedDate : today;

  if (!workspaceData) {
    if (pageData.status === "empty") redirect("/workspaces/new");

    return (
      <WorkspaceSectionShell label="Activity" workspaceNav="activity" isLoggedIn profileImageUrl={user.profileImageUrl} profileHref={buildViewerProfileHref(user.username)} workspaces={pageData.workspaces} workspaceData={null} footer={<Footer />}>
        <ActivityView activity={null} selectedDate={selectedDate} selectedLogs={[]} />
      </WorkspaceSectionShell>
    );
  }

  const [activity, selectedLogs] = await Promise.all([
    getWorkspaceActivity(workspaceData.workspaceId, from, today),
    getWorkspaceActivityDayLogs(workspaceData.workspaceId, selectedDate),
  ]);

  return (
    <WorkspaceSectionShell label="Activity" workspaceNav="activity" isLoggedIn profileImageUrl={user.profileImageUrl} profileHref={buildViewerProfileHref(user.username)} workspaces={pageData.workspaces} workspaceData={workspaceData} footer={<Footer />}>
      <ActivityView activity={activity} selectedDate={selectedDate} selectedLogs={selectedLogs} />
    </WorkspaceSectionShell>
  );
}

function getSeoulIsoDate(date: Date) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul", year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
}
