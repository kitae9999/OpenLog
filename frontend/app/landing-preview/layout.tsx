import { notFound } from "next/navigation";
import type { ReactNode } from "react";

export default function LandingPreviewLayout({
  children,
}: {
  children: ReactNode;
}) {
  if (
    process.env.NODE_ENV === "production" ||
    process.env.ENABLE_E2E_ROUTES !== "true"
  ) {
    notFound();
  }

  return children;
}
