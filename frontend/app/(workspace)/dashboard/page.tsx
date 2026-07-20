import type { Metadata } from "next";
import { WorkspaceDashboardQueryView } from "@/pages/workspace-query/ui/WorkspaceQueryViews";

export const metadata: Metadata = {
  title: "Dashboard",
  robots: { index: false, follow: false },
};

export default function DashboardPage() {
  return <WorkspaceDashboardQueryView />;
}
