import type { Metadata } from "next";
import { WriteView } from "@/widgets/write/ui";

export const metadata: Metadata = {
  title: "Write | OpenLog",
  description: "Compose a new story for the OpenLog knowledge feed.",
};

export default function WritePage() {
  return <WriteView />;
}
