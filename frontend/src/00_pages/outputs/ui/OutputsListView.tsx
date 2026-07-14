"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useSyncExternalStore } from "react";
import { cn } from "@/shared/lib/cn";
import {
  getNewOutputHref,
  getOutputHref,
  getOutputsHref,
  getOutputStatusLabel,
  getTabHref,
  type WorkspaceOutputStatus,
  type WorkspaceTaskOutput,
} from "@/entities/workspace/model/data";
import {
  getOutputOverridesSnapshot,
  getOutputsWithOverrideSnapshot,
  subscribeOutputOverrides,
} from "@/features/document-overrides/model/outputOverrides";
import type { WorkspaceUiData } from "@/entities/workspace/model/workspaceTypes";
import {
  DocumentBulkBar,
  SelectionCheckbox,
  useDocumentSelection,
} from "@/features/document-selection/ui/DocumentBulkSelection";
import { deleteWorkspaceDocuments } from "@/features/workspace-actions/api/workspaceActions";

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
        : getOutputsWithOverrideSnapshot([], outputOverridesSnapshot),
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
      return false;
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
      return false;
    }
    selection.clear();
    router.refresh();
    return true;
  }

  return (
    <div className="mx-auto w-full max-w-[920px]">
      <nav
        aria-label="Breadcrumb"
        className="mb-6 flex flex-wrap items-center gap-1.5 text-[13px] text-zinc-500"
      >
        <Link
          href={getTabHref("workspace", isLoggedIn)}
          className="font-medium text-zinc-500 transition hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20"
        >
          openlog
        </Link>
        <span className="text-zinc-300">/</span>
        <span className="font-semibold text-zinc-950">Outputs</span>
      </nav>

      <header className="flex flex-wrap items-end justify-between gap-3 pb-6">
        <div className="min-w-0">
          <h1 className="text-[22px] font-semibold tracking-tight text-zinc-950">
            Outputs
          </h1>
          <p className="mt-1.5 text-[13px] text-zinc-500">
            {outputs.length} total · refined documents before publish
          </p>
        </div>
        <Link
          href={getNewOutputHref()}
          className="inline-flex text-[13px] font-medium text-zinc-500 transition hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20"
        >
          + New output
        </Link>
      </header>

      <div
        role="tablist"
        aria-label="Output filters"
        className="flex flex-wrap items-end gap-1 border-b border-zinc-200"
      >
        {statusItems.map((item) => {
          const active = status === item;
          const count = outputs.filter(
            (output) => output.status === item,
          ).length;

          return (
            <Link
              key={item}
              href={getOutputsHref(item)}
              role="tab"
              aria-selected={active}
              className={cn(
                "group relative flex h-9 cursor-pointer items-center px-2.5 text-[13px] font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20",
                active ? "text-zinc-950" : "text-zinc-500 hover:text-zinc-950",
              )}
            >
              <span className="inline-flex items-center gap-1.5">
                {getOutputStatusLabel(item)}
                <span
                  className={cn(
                    "tabular-nums transition",
                    active
                      ? "text-zinc-500"
                      : "text-zinc-400 group-hover:text-zinc-500",
                  )}
                >
                  {count}
                </span>
              </span>
              {active ? (
                <span className="absolute inset-x-2 -bottom-px h-0.5 bg-zinc-950" />
              ) : (
                <span className="absolute inset-x-2 -bottom-px h-0.5 bg-zinc-300 opacity-0 transition group-hover:opacity-100" />
              )}
            </Link>
          );
        })}
      </div>

      {workspaceData ? (
        <DocumentBulkBar
          visibleCount={filteredOutputs.length}
          selectedCount={selection.selectedIds.size}
          allVisibleSelected={selection.allVisibleSelected}
          someVisibleSelected={selection.someVisibleSelected}
          documentLabel="outputs"
          deleteImpact="Published posts will be kept."
          isDeleting={isDeleting}
          error={deleteError}
          onToggleAll={selection.toggleAllVisible}
          onClear={selection.clear}
          onDelete={deleteSelectedOutputs}
        />
      ) : null}

      {filteredOutputs.length === 0 ? (
        <div className="mt-10 pl-5">
          <p className="text-sm text-zinc-500">
            No {getOutputStatusLabel(status).toLowerCase()} outputs.
          </p>
          {status === "draft" ? (
            <Link
              href={getNewOutputHref()}
              className="mt-3 inline-flex text-[13px] font-medium text-zinc-500 transition hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20"
            >
              + New output
            </Link>
          ) : null}
        </div>
      ) : (
        <ul className="mt-2">
          {filteredOutputs.map((output) => (
            <OutputRow
              key={output.id}
              output={output}
              selected={selection.selectedIds.has(output.id)}
              onToggle={() => selection.toggle(output.id)}
            />
          ))}
        </ul>
      )}
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
    `${output.taskCount ?? output.taskIds.length} task${(output.taskCount ?? output.taskIds.length) === 1 ? "" : "s"}`,
    `${output.logCount ?? output.logIds.length} log${(output.logCount ?? output.logIds.length) === 1 ? "" : "s"}`,
  ].join(" · ");

  return (
    <li className="border-t border-zinc-200/80 first:border-t-0">
      <div
        className={cn(
          "group rounded-lg px-2.5 py-2.5 transition",
          selected ? "bg-zinc-50" : "hover:bg-zinc-50",
        )}
      >
        <div className="grid grid-cols-[17px_minmax(0,1fr)_auto] items-center gap-x-2.5">
          <SelectionCheckbox
            checked={selected}
            label={`${selected ? "Deselect" : "Select"} ${output.title}`}
            onChange={onToggle}
          />
          <Link
            href={getOutputHref(output.id)}
            className="min-w-0 truncate text-[14.5px] font-medium leading-5 text-zinc-950 transition hover:text-zinc-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20"
          >
            {output.title}
          </Link>
          <span className="shrink-0 text-[12px] font-medium text-zinc-400">
            {getOutputStatusLabel(output.status)}
          </span>
        </div>
        {output.description ? (
          <p className="mt-1 line-clamp-2 pl-[calc(17px+0.625rem)] text-[12.5px] leading-5 text-zinc-500">
            {output.description}
          </p>
        ) : null}
        <p className="mt-1.5 pl-[calc(17px+0.625rem)] text-[12px] text-zinc-400">
          {sourceLabel}
          {" · "}
          Updated {output.updatedLabel}
        </p>
      </div>
    </li>
  );
}
