"use client";

import Link from "next/link";
import { useMemo, useSyncExternalStore, type ReactNode } from "react";
import { cn } from "@/shared/lib/cn";
import {
  countOutputsByStatus,
  getNewOutputHref,
  getOutputHref,
  getOutputsHref,
  getOutputStatusLabel,
  getTabHref,
  workspaceTaskOutputs,
  type WorkspaceOutputStatus,
  type WorkspaceTaskOutput,
} from "./data";
import {
  getOutputOverridesSnapshot,
  getOutputsWithOverrideSnapshot,
  subscribeOutputOverrides,
} from "./outputOverrides";

const statusItems: WorkspaceOutputStatus[] = ["draft", "published"];

export function OutputsListView({
  isLoggedIn,
  status,
}: {
  isLoggedIn: boolean;
  status: WorkspaceOutputStatus;
}) {
  const outputOverridesSnapshot = useSyncExternalStore(
    subscribeOutputOverrides,
    getOutputOverridesSnapshot,
    () => "{}",
  );
  const outputs = useMemo(
    () =>
      getOutputsWithOverrideSnapshot(
        workspaceTaskOutputs,
        outputOverridesSnapshot,
      ),
    [outputOverridesSnapshot],
  );

  const filteredOutputs = useMemo(
    () => outputs.filter((output) => output.status === status),
    [outputs, status],
  );

  return (
    <div>
      <nav
        aria-label="Breadcrumb"
        className="mb-4 flex flex-wrap items-center gap-1.5 text-[13px] text-zinc-500"
      >
        <Link
          href={getTabHref("workspace", isLoggedIn)}
          className="font-semibold text-zinc-700 transition hover:text-zinc-950"
        >
          openlog
        </Link>
        <span className="text-zinc-300">/</span>
        <span className="font-semibold text-zinc-950">Outputs</span>
      </nav>

      <article className="overflow-hidden rounded-2xl border border-zinc-200/70 bg-white">
        <header className="border-b border-zinc-100 px-6 pb-5 pt-[22px]">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="font-[family-name:var(--font-georgia,Georgia,serif)] text-2xl font-bold tracking-[-0.01em] text-zinc-950">
                Outputs
              </h1>
              <p className="mt-1.5 text-[13px] text-zinc-500">
                Refined documents before publish
              </p>
            </div>
            <LinkButton href={getNewOutputHref()} tone="solid">
              New output
            </LinkButton>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            {statusItems.map((item) => (
              <Link
                key={item}
                href={getOutputsHref(item)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-[10px] px-3 py-1.5 text-[12.5px] font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20",
                  status === item
                    ? "bg-zinc-950 text-white"
                    : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 hover:text-zinc-950",
                )}
              >
                {getOutputStatusLabel(item)}
                <span className={status === item ? "text-zinc-300" : "text-zinc-400"}>
                  {outputs === workspaceTaskOutputs
                    ? countOutputsByStatus(item)
                    : outputs.filter((output) => output.status === item).length}
                </span>
              </Link>
            ))}
          </div>
        </header>

        <div className="px-[18px] pb-2 pt-1">
          {filteredOutputs.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-[14px] font-medium text-zinc-600">
                No {getOutputStatusLabel(status).toLowerCase()} outputs.
              </p>
              {status === "draft" ? (
                <div className="mt-4">
                  <LinkButton href={getNewOutputHref()} tone="outline">
                    Create output
                  </LinkButton>
                </div>
              ) : null}
            </div>
          ) : (
            filteredOutputs.map((output) => (
              <OutputRow key={output.id} output={output} />
            ))
          )}
        </div>
      </article>
    </div>
  );
}

function OutputRow({ output }: { output: WorkspaceTaskOutput }) {
  const sourceLabel = [
    `${output.taskIds.length} task${output.taskIds.length === 1 ? "" : "s"}`,
    `${output.logIds.length} log${output.logIds.length === 1 ? "" : "s"}`,
  ].join(" · ");

  return (
    <article className="flex items-start gap-3 border-t border-zinc-100 py-3.5 first:border-t-0">
      <div className="mt-1 size-2.5 shrink-0 rounded-full bg-zinc-950" />
      <div className="min-w-0 flex-1">
        <h2 className="text-[15px] font-semibold leading-snug text-zinc-950">
          {output.title}
        </h2>
        <p className="mt-1 line-clamp-2 text-[12.5px] leading-5 text-zinc-500">
          {output.description}
        </p>
        <p className="mt-1.5 text-[11.5px] text-zinc-400">
          <span className="font-medium text-zinc-500">
            {getOutputStatusLabel(output.status)}
          </span>
          {" · "}
          {sourceLabel}
          {" · "}
          Updated {output.updatedLabel}
        </p>
      </div>
      <Link
        href={getOutputHref(output.id)}
        aria-label={`Open ${output.title}`}
        className="shrink-0 self-center text-zinc-400 transition hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20"
      >
        <IconArrowRight className="size-4" />
      </Link>
    </article>
  );
}

function LinkButton({
  href,
  tone,
  children,
}: {
  href: string;
  tone: "solid" | "outline";
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex h-[30px] items-center justify-center rounded-[10px] px-[13px] text-[12.5px] font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20",
        tone === "solid" && "bg-zinc-950 text-white hover:bg-zinc-800",
        tone === "outline" &&
          "border border-zinc-200 bg-white text-zinc-950 hover:bg-zinc-50",
      )}
    >
      {children}
    </Link>
  );
}

function IconArrowRight({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M5 12h14M13 6l6 6-6 6"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}
