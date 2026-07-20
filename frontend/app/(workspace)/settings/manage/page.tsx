import type { Metadata } from "next";
import { ManageFeed } from "@/pages/workspace-manage/ui/ManageFeed";

export const metadata: Metadata = {
  title: "Manage | OpenLog",
  description: "Manage your OpenLog workspaces.",
};

export default function ManagePage() {
  return <ManageFeed />;
}
