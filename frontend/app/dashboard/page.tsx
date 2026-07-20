import type { Metadata } from "next";
import { HomeFeed } from "@/pages/home/ui";

export const metadata: Metadata = {
  title: "Dashboard",
  robots: { index: false, follow: false },
};

export default function DashboardPage() {
  return <HomeFeed activeTab="workspace" />;
}
