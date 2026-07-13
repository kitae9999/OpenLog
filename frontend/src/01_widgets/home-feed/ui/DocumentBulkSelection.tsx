"use client";

import { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
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
  deleteImpact,
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
  deleteImpact?: string;
  isDeleting: boolean;
  error?: string | null;
  onToggleAll: () => void;
  onClear: () => void;
  onDelete: () => Promise<boolean>;
}) {
  const titleId = useId();
  const descriptionId = useId();
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  useEffect(() => {
    if (!isConfirmOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !isDeleting) {
        setIsConfirmOpen(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isConfirmOpen, isDeleting]);

  if (visibleCount === 0) return null;

  function closeConfirm() {
    if (!isDeleting) setIsConfirmOpen(false);
  }

  async function confirmDelete() {
    if (isDeleting) return;
    if (await onDelete()) setIsConfirmOpen(false);
  }

  return (
    <>
      <div
        data-testid="document-bulk-bar"
        className="flex min-h-11 flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-zinc-100 bg-zinc-50/45 px-[18px] py-2 transition-colors"
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
          {error && !isConfirmOpen ? (
            <p role="alert" className="text-[11.5px] text-red-600">
              {error}
            </p>
          ) : null}
          {selectedCount > 0 ? (
            <button
              type="button"
              onClick={() => setIsConfirmOpen(true)}
              disabled={isDeleting}
              aria-haspopup="dialog"
              aria-expanded={isConfirmOpen}
              className="inline-flex h-7 items-center rounded-lg border border-red-200 bg-white px-2.5 text-[11.5px] font-semibold text-red-600 transition hover:border-red-300 hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600/20 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Delete selected
            </button>
          ) : null}
        </div>
      </div>

      {isConfirmOpen
        ? createPortal(
            <div className="fixed inset-0 z-[80] grid place-items-center p-4">
              <button
                type="button"
                aria-label="Close delete confirmation"
                onClick={closeConfirm}
                disabled={isDeleting}
                className="absolute inset-0 bg-zinc-950/12 backdrop-blur-[10px] backdrop-saturate-150 disabled:cursor-not-allowed"
              />

              <div
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                aria-describedby={descriptionId}
                className="relative z-10 w-full max-w-[360px] rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-[0_18px_50px_rgba(24,24,27,0.12)]"
              >
                <h2
                  id={titleId}
                  className="text-[16px] font-semibold tracking-[-0.01em] text-zinc-950"
                >
                  Delete selected {documentLabel}?
                </h2>
                <p
                  id={descriptionId}
                  className="mt-2 text-[13.5px] leading-6 text-zinc-500"
                >
                  <span className="font-semibold text-zinc-700">
                    {selectedCount} selected{" "}
                    {getCountLabel(documentLabel, selectedCount)}
                  </span>{" "}
                  will be permanently deleted. This cannot be undone.
                  {deleteImpact ? ` ${deleteImpact}` : ""}
                </p>

                {error ? (
                  <p
                    role="alert"
                    className="mt-3 text-xs font-medium leading-5 text-rose-600"
                  >
                    {error}
                  </p>
                ) : null}

                <div className="mt-5 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={closeConfirm}
                    disabled={isDeleting}
                    className="inline-flex h-9 items-center rounded-xl px-3.5 text-[13px] font-semibold text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={confirmDelete}
                    disabled={isDeleting}
                    className="inline-flex h-9 items-center rounded-xl bg-rose-600 px-3.5 text-[13px] font-semibold text-white transition hover:bg-rose-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-900/20 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isDeleting ? "Deleting…" : "Delete"}
                  </button>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}

function getCountLabel(documentLabel: string, count: number) {
  if (count !== 1) return documentLabel;
  if (documentLabel === "memories") return "memory";
  return documentLabel.endsWith("s")
    ? documentLabel.slice(0, -1)
    : documentLabel;
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
