import type { Metadata } from "next";
import { WorkspaceCreateFeed } from "@/widgets/home-feed/ui/WorkspaceCreateFeed";

export const metadata: Metadata = {
  title: "New workspace | OpenLog",
  description: "Create a new OpenLog workspace.",
};

export default function NewWorkspacePage() {
  return <WorkspaceCreateFeed />;
}
