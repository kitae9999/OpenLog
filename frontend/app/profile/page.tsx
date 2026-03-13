import type { Metadata } from "next";
import { ProfileView } from "@/widgets/profile/ui";

export const metadata: Metadata = {
  title: "Profile | OpenLog",
  description: "OpenLog profile page for contributors and authored posts.",
};

export default function ProfilePage() {
  return <ProfileView />;
}
