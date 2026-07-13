"use client";

import { useState } from "react";
import { cn } from "@/shared/lib/cn";

export function useDocumentSelection(visibleIds: string[]) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    () => new Set(),
  );
  const allVisibleSelected =
    visibleIds.length > 0 && visibleIds.every((id) => selectedIds.has(id));
  const someVisibleSelected = visibleIds.some((id) => selectedIds.has(id));

  function toggle(id: string) {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAllVisible() {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (allVisibleSelected) {
        for (const id of visibleIds) next.delete(id);
      } else {
        for (const id of visibleIds) next.add(id);
      }
      return next;
    });
  }

  function clear() {
    setSelectedIds(new Set());
  }

  return {
    selectedIds,
    selectedIdList: Array.from(selectedIds),
    allVisibleSelected,
    someVisibleSelected,
    toggle,
    toggleAllVisible,
    clear,
  };
}

export function DocumentBulkBar({
  visibleCount,
  selectedCount,
  allVisibleSelected,
  someVisibleSelected,
  documentLabel,
  isDeleting,
  error,
  onToggleAll,
  onClear,
  onDelete,
}: {
  visibleCount: number;
  selectedCount: number;
  allVisibleSelected: boolean;
  someVisibleSelected: boolean;
  documentLabel: string;
  isDeleting: boolean;
  error?: string | null;
  onToggleAll: () => void;
  onClear: () => void;
  onDelete: () => void;
}) {
  if (visibleCount === 0) return null;

  return (
    <div
      className={cn(
        "flex min-h-11 flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b px-[18px] py-2 transition-colors",
        selectedCount > 0
          ? "border-[#f3d7cc] bg-[#fff8f4]"
          : "border-zinc-100 bg-zinc-50/45",
      )}
    >
      <div className="flex items-center gap-2.5">
        <SelectionCheckbox
          checked={allVisibleSelected}
          mixed={!allVisibleSelected && someVisibleSelected}
          label={
            allVisibleSelected
              ? `Deselect all visible ${documentLabel}`
              : `Select all ${visibleCount} visible ${documentLabel}`
          }
          onChange={onToggleAll}
        />
        <span className="text-[12px] font-medium text-zinc-500">
          {selectedCount > 0 ? (
            <>
              <strong className="font-semibold tabular-nums text-zinc-900">
                {selectedCount}
              </strong>{" "}
              selected
            </>
          ) : (
            `Select ${documentLabel}`
          )}
        </span>
        {selectedCount > 0 ? (
          <button
            type="button"
            onClick={onClear}
            disabled={isDeleting}
            className="text-[11.5px] font-semibold text-zinc-400 transition hover:text-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20 disabled:opacity-50"
          >
            Clear
          </button>
        ) : null}
      </div>

      <div className="flex items-center gap-3">
        {error ? (
          <p role="alert" className="text-[11.5px] text-red-600">
            {error}
          </p>
        ) : null}
        {selectedCount > 0 ? (
          <button
            type="button"
            onClick={onDelete}
            disabled={isDeleting}
            className="inline-flex h-7 items-center rounded-lg border border-red-200 bg-white px-2.5 text-[11.5px] font-semibold text-red-600 transition hover:border-red-300 hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600/20 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isDeleting ? "Deleting..." : "Delete selected"}
          </button>
        ) : null}
      </div>
    </div>
  );
}

export function SelectionCheckbox({
  checked,
  mixed = false,
  label,
  onChange,
  className,
}: {
  checked: boolean;
  mixed?: boolean;
  label: string;
  onChange: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={mixed ? "mixed" : checked}
      aria-label={label}
      onClick={onChange}
      className={cn(
        "grid size-[17px] shrink-0 place-items-center rounded-[5px] border text-[10px] font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/25 focus-visible:ring-offset-1",
        checked || mixed
          ? "border-zinc-900 bg-zinc-900 text-white"
          : "border-zinc-300 bg-white text-transparent hover:border-zinc-500",
        className,
      )}
    >
      {mixed ? "−" : "✓"}
    </button>
  );
}
