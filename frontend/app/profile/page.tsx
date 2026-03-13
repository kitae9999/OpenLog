import type { Metadata } from "next";
import { OpenLogProfilePage } from "../_components/openlog/OpenLogProfilePage";

export const metadata: Metadata = {
  title: "Profile | OpenLog",
  description: "OpenLog profile page for contributors and authored posts.",
};

export default function ProfilePage() {
  return <OpenLogProfilePage />;
}
