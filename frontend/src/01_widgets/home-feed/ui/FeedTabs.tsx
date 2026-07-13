import Link from "next/link";
import { cn } from "@/shared/lib/cn";
import { getSidebarTabs, getTabHref, type TabKey } from "./data";

export function FeedTabs({
  active,
  isLoggedIn,
}: {
  active: TabKey;
  isLoggedIn: boolean;
}) {
  const sidebarTabs = getSidebarTabs(isLoggedIn);

  return (
    <div className="border-b border-zinc-200/70">
      <div className="flex gap-6">
        {sidebarTabs.map((tab) => {
          const isActive = tab.key === active;

          return (
            <Link
              key={tab.key}
              href={getTabHref(tab.key, isLoggedIn)}
              className={cn(
                "relative -mb-px inline-flex items-center gap-2 py-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20",
                isActive
                  ? "text-zinc-950"
                  : "text-zinc-500 hover:text-zinc-950",
              )}
            >
              {tab.label}
              {isActive ? (
                <span className="absolute inset-x-0 -bottom-px h-0.5 bg-zinc-950" />
              ) : null}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
