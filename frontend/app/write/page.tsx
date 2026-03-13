import type { Metadata } from "next";
import { OpenLogWritePage } from "@/widgets/write/ui/OpenLogWritePage";

export const metadata: Metadata = {
  title: "Write | OpenLog",
  description: "Compose a new story for the OpenLog knowledge feed.",
};

export default function WritePage() {
  return <OpenLogWritePage />;
}
