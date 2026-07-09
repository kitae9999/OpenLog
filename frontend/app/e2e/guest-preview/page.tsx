"use client";

import { LandingSessionDemo } from "@/widgets/landing/ui/LandingSessionDemo";

/** Isolated landing session demo for Playwright. */
export default function GuestPreviewE2EPage() {
  return (
    <main className="min-h-screen bg-[var(--app-canvas)] px-4 py-6 sm:px-8">
      <LandingSessionDemo />
    </main>
  );
}
