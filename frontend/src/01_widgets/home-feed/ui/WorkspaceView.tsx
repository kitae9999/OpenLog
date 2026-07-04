import Link from "next/link";
import { cn } from "@/shared/lib/cn";
import {
  workspaceItems,
  workspaceMetrics,
  type WorkspaceItem,
  type WorkspaceItemKind,
} from "./data";
import { WorkspaceGuestPrompt } from "./WorkspaceGuestPrompt";

export function WorkspaceView({ isLoggedIn }: { isLoggedIn: boolean }) {
  if (!isLoggedIn) {
    return <WorkspaceGuestPrompt />;
  }

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-3">
        {workspaceMetrics.map((metric) => (
          <div
            key={metric.label}
            className="rounded-xl border border-zinc-200/80 px-4 py-4"
          >
            <p className="text-[13px] font-medium text-zinc-500">
              {metric.label}
            </p>
            <p className="mt-1 text-[28px] font-bold tracking-tight text-zinc-950">
              {metric.value}
            </p>
            <p className="mt-1 text-[13px] leading-5 text-zinc-500">
              {metric.description}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-2 divide-y divide-zinc-200/80">
        {workspaceItems.map((item) => (
          <WorkspaceItemCard key={item.id} item={item} />
        ))}
      </div>
    </>
  );
}

function WorkspaceItemCard({ item }: { item: WorkspaceItem }) {
  return (
    <article className="py-8">
      <Link
        href={item.href}
        className="group block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20"
      >
        <div className="flex flex-wrap items-center gap-2">
          <WorkspaceStatusBadge kind={item.kind} label={item.progressLabel} />
          <span className="text-[13px] text-zinc-500">{item.meta}</span>
        </div>

        <h2 className="mt-4 max-w-[680px] text-[24px] font-bold leading-[1.16] tracking-tight text-zinc-950 transition-colors group-hover:text-zinc-700 sm:text-[30px] [font-family:Georgia,serif]">
          {item.title}
        </h2>

        <p className="mt-3 max-w-[650px] text-[16px] leading-7 text-zinc-600">
          {item.description}
        </p>
      </Link>

      <p className="mt-5 text-[13px] text-zinc-500">{item.countLabel}</p>
    </article>
  );
}

function WorkspaceStatusBadge({
  kind,
  label,
}: {
  kind: WorkspaceItemKind;
  label: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-[12px] font-semibold tracking-wide",
        kind === "draft" && "bg-zinc-100 text-zinc-700",
        kind === "review" && "bg-zinc-950 text-white",
        kind === "stale" && "border border-zinc-300 bg-zinc-50 text-zinc-700",
        kind === "published" && "bg-zinc-100 text-zinc-600",
      )}
    >
      {label}
    </span>
  );
}
