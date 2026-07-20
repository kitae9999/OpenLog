import type { Metadata } from "next";
import { WorkspaceManageQueryView } from "@/pages/workspace-query/ui/WorkspaceQueryViews";

export const metadata: Metadata = {
  title: "Manage | OpenLog",
  description: "Manage your OpenLog workspaces.",
};

export default function ManagePage() {
  return <WorkspaceManageQueryView />;
}
