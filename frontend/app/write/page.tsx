import type { Metadata } from "next";
import { getUser } from "@/features/auth/api/getUser";
import { WriteView } from "@/widgets/write/ui";

export const metadata: Metadata = {
  title: "Write | OpenLog",
  description: "Compose a new story for the OpenLog knowledge feed.",
};

export default async function WritePage() {
  const data = await getUser();

  return <WriteView isLoggedIn={!!data} />;
}
