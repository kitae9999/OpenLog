"use client";

import { LogDetailView } from "@/widgets/home-feed/ui/LogDetailView";
import { getLogById, workspaceLogs } from "@/widgets/home-feed/ui/data";

const log =
  getLogById("turbopack-pnpm") ??
  workspaceLogs.find((item) => item.id === "turbopack-pnpm") ??
  workspaceLogs[0];

export default function LogDetailE2EPage() {
  return (
    <main className="mx-auto w-full max-w-[1180px] bg-zinc-50 px-4 py-6 sm:px-6">
      <div data-testid="log-detail">
        <LogDetailView log={log} isLoggedIn />
      </div>
    </main>
  );
}
