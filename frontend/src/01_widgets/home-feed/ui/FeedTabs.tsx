import Image from "next/image";
import Link from "next/link";
import { cn } from "@/shared/lib/cn";
import { tabs, type TabKey } from "./data";

export function FeedTabs({
  active,
  isLoggedIn,
}: {
  active: TabKey;
  isLoggedIn: boolean;
}) {
  const visibleTabs = isLoggedIn
    ? tabs
    : tabs.filter((tab) => tab.key !== "following");

  return (
    <div className="border-b border-zinc-200/70">
      <div className="flex gap-6">
        {visibleTabs.map((tab) => {
          const isActive = tab.key === active;

          return (
            <Link
              key={tab.key}
              href={`/?tab=${tab.key}`}
              className={cn(
                "relative -mb-px inline-flex items-center gap-2 py-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20",
                isActive
                  ? "text-zinc-950"
                  : "text-zinc-500 hover:text-zinc-950",
              )}
            >
              <Image
                src={tab.iconSrc}
                alt=""
                width={16}
                height={16}
                aria-hidden="true"
                className={cn(
                  "size-4",
                  isActive ? "brightness-0" : "opacity-70",
                )}
              />
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
