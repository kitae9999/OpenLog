"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { cn } from "@/shared/lib/cn";
import {
  getNewOutputHref,
  getOutputHref,
  getOutputsHref,
  getOutputStatusLabel,
  getTabHref,
  type WorkspaceOutputStatus,
  type WorkspaceTaskOutput,
} from "./data";
import {
  getOutputOverridesSnapshot,
  getOutputsWithOverrideSnapshot,
  subscribeOutputOverrides,
} from "./outputOverrides";
import type { WorkspaceUiData } from "./workspaceTypes";
import {
  DocumentBulkBar,
  SelectionCheckbox,
  useDocumentSelection,
} from "./DocumentBulkSelection";
import { deleteWorkspaceDocuments } from "./workspaceActions";

const statusItems: WorkspaceOutputStatus[] = ["draft", "published"];

export function OutputsListView({
  isLoggedIn,
  status,
  workspaceData,
}: {
  isLoggedIn: boolean;
  status: WorkspaceOutputStatus;
  workspaceData?: WorkspaceUiData | null;
}) {
  const router = useRouter();
  const outputOverridesSnapshot = useSyncExternalStore(
    subscribeOutputOverrides,
    getOutputOverridesSnapshot,
    () => "{}",
  );
  const outputs = useMemo(
    () =>
      workspaceData
        ? workspaceData.outputs
        : getOutputsWithOverrideSnapshot(
            [],
            outputOverridesSnapshot,
          ),
    [outputOverridesSnapshot, workspaceData],
  );

  const filteredOutputs = useMemo(
    () => outputs.filter((output) => output.status === status),
    [outputs, status],
  );
  const selection = useDocumentSelection(
    filteredOutputs.map((output) => output.id),
  );
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  async function deleteSelectedOutputs() {
    if (!workspaceData || isDeleting || selection.selectedIdList.length === 0) {
      return;
    }
    if (
      !window.confirm(
        `Delete ${selection.selectedIdList.length} selected output${selection.selectedIdList.length === 1 ? "" : "s"}? Published posts will be kept.`,
      )
    ) {
      return;
    }

    setIsDeleting(true);
    setDeleteError(null);
    const result = await deleteWorkspaceDocuments({
      workspaceId: workspaceData.workspaceId,
      documentType: "outputs",
      ids: selection.selectedIdList,
    });
    setIsDeleting(false);
    if (!result.ok) {
      setDeleteError(result.message ?? "Failed to delete selected outputs.");
      return;
    }
    selection.clear();
    router.refresh();
  }

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
        <header className="border-b border-zinc-100 px-6 pb-2.5 pt-[22px]">
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
                  {outputs.filter((output) => output.status === item).length}
                </span>
              </Link>
            ))}
          </div>
        </header>

        {workspaceData ? (
          <DocumentBulkBar
            visibleCount={filteredOutputs.length}
            selectedCount={selection.selectedIds.size}
            allVisibleSelected={selection.allVisibleSelected}
            someVisibleSelected={selection.someVisibleSelected}
            documentLabel="outputs"
            isDeleting={isDeleting}
            error={deleteError}
            onToggleAll={selection.toggleAllVisible}
            onClear={selection.clear}
            onDelete={deleteSelectedOutputs}
          />
        ) : null}

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
              <OutputRow
                key={output.id}
                output={output}
                selected={selection.selectedIds.has(output.id)}
                onToggle={() => selection.toggle(output.id)}
              />
            ))
          )}
        </div>
      </article>
    </div>
  );
}

function OutputRow({
  output,
  selected,
  onToggle,
}: {
  output: WorkspaceTaskOutput;
  selected: boolean;
  onToggle: () => void;
}) {
  const sourceLabel = [
    `${output.taskIds.length} task${output.taskIds.length === 1 ? "" : "s"}`,
    `${output.logIds.length} log${output.logIds.length === 1 ? "" : "s"}`,
  ].join(" · ");

  return (
    <article
      className={cn(
        "flex items-start gap-3 border-t border-zinc-100 py-3.5 first:border-t-0",
        selected && "bg-[#fffaf7]",
      )}
    >
      <SelectionCheckbox
        checked={selected}
        label={`${selected ? "Deselect" : "Select"} ${output.title}`}
        onChange={onToggle}
        className="mt-0.5"
      />
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
