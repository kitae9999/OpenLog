import type { Metadata } from "next";
import { WorkspaceCreateQueryView } from "@/pages/workspace-query/ui/WorkspaceQueryViews";

export const metadata: Metadata = {
  title: "New workspace | OpenLog",
  description: "Create a new OpenLog workspace.",
};

export default function NewWorkspacePage() {
  return <WorkspaceCreateQueryView />;
}
