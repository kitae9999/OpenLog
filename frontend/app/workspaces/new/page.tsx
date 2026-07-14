import type { Metadata } from "next";
import { WorkspaceCreateFeed } from "@/pages/workspace-create/ui/WorkspaceCreateFeed";

export const metadata: Metadata = {
  title: "New workspace | OpenLog",
  description: "Create a new OpenLog workspace.",
};

export default function NewWorkspacePage() {
  return <WorkspaceCreateFeed />;
}
