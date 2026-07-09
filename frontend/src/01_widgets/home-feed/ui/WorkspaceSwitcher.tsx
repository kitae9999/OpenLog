"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/shared/lib/cn";
import { getNewWorkspaceHref, getTabHref } from "./data";
import {
  getActiveWorkspaceId,
  setActiveWorkspaceId,
} from "./workspaceSelection";
import { notifyWorkspaceChange } from "./useActiveWorkspace";
import type { ManagedWorkspace } from "./workspaceTypes";

export function WorkspaceSwitcher({
  isLoggedIn,
  workspaces,
  activeWorkspaceId,
  onNavigate,
}: {
  isLoggedIn: boolean;
  workspaces: ManagedWorkspace[];
  activeWorkspaceId?: string | null;
  onNavigate?: () => void;
}) {
  const router = useRouter();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(
    activeWorkspaceId ?? null,
  );

  const resolvedActiveId = useMemo(() => {
    if (activeId && workspaces.some((workspace) => workspace.id === activeId)) {
      return activeId;
    }

    if (
      activeWorkspaceId &&
      workspaces.some((workspace) => workspace.id === activeWorkspaceId)
    ) {
      return activeWorkspaceId;
    }

    return workspaces[0]?.id ?? null;
  }, [activeId, activeWorkspaceId, workspaces]);

  const activeWorkspace =
    workspaces.find((workspace) => workspace.id === resolvedActiveId) ?? null;

  useEffect(() => {
    const storedId = getActiveWorkspaceId();
    if (storedId && workspaces.some((workspace) => workspace.id === storedId)) {
      setActiveId(storedId);
      return;
    }

    if (activeWorkspaceId) {
      setActiveId(activeWorkspaceId);
    }
  }, [activeWorkspaceId, workspaces]);

  useEffect(() => {
    if (!open) {
      return;
    }

    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  function selectWorkspace(workspaceId: string) {
    if (workspaceId === resolvedActiveId) {
      setOpen(false);
      return;
    }

    setActiveWorkspaceId(workspaceId);
    setActiveId(workspaceId);
    notifyWorkspaceChange();
    setOpen(false);
    onNavigate?.();
    router.push(getTabHref("workspace", isLoggedIn));
    router.refresh();
  }

  if (!isLoggedIn) {
    return null;
  }

  if (!activeWorkspace) {
    return (
      <div className="mb-4">
        <Link
          href={getNewWorkspaceHref()}
          onClick={onNavigate}
          className="flex w-full items-center gap-2 rounded-xl border border-dashed border-zinc-300 bg-white px-3 py-2.5 text-[13px] font-semibold text-zinc-600 transition hover:border-zinc-400 hover:bg-zinc-50 hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20"
        >
          <span className="grid size-6 shrink-0 place-items-center rounded-lg border border-dashed border-zinc-300 text-zinc-400">
            <IconPlus className="size-3.5" />
          </span>
          Create workspace
        </Link>
      </div>
    );
  }

  return (
    <div ref={rootRef} className="relative mb-4">
      <WorkspaceSwitcherTrigger
        name={activeWorkspace.name}
        repositoryFullName={activeWorkspace.repoFullName}
        initial={workspaceInitial(activeWorkspace.name)}
        open={open}
        onClick={() => setOpen((current) => !current)}
      />

      {open ? (
        <div
          role="menu"
          aria-label="Workspaces"
          className="absolute left-0 right-0 top-[calc(100%+6px)] z-50 overflow-hidden rounded-xl border border-zinc-200/70 bg-white shadow-[0_12px_40px_rgba(24,24,27,0.12)]"
        >
          <div className="max-h-[min(280px,50vh)] overflow-y-auto py-1">
            {workspaces.map((workspace) => {
              const isActive = workspace.id === resolvedActiveId;

              return (
                <button
                  key={workspace.id}
                  type="button"
                  role="menuitemradio"
                  aria-checked={isActive}
                  onClick={() => selectWorkspace(workspace.id)}
                  className={cn(
                    "flex w-full items-center gap-2.5 px-3 py-2.5 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-zinc-900/20",
                    isActive ? "bg-zinc-50" : "hover:bg-zinc-50",
                  )}
                >
                  <span className="grid size-6 shrink-0 place-items-center rounded-lg bg-zinc-100 text-[13px] font-bold text-zinc-600 [font-family:Georgia,serif]">
                    {workspaceInitial(workspace.name)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span
                      className={cn(
                        "block truncate text-[13px] text-zinc-950",
                        isActive ? "font-semibold" : "font-medium",
                      )}
                    >
                      {workspace.name}
                    </span>
                    <span className="block truncate font-mono text-[10.5px] text-zinc-400">
                      {workspace.repoFullName ?? workspace.slug}
                    </span>
                  </span>
                  {isActive ? (
                    <IconCheck className="size-4 shrink-0 text-zinc-950" />
                  ) : null}
                </button>
              );
            })}
          </div>

          <div className="border-t border-zinc-100 p-1.5">
            <Link
              href={getNewWorkspaceHref()}
              role="menuitem"
              onClick={() => {
                setOpen(false);
                onNavigate?.();
              }}
              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-[13px] font-semibold text-zinc-600 transition hover:bg-zinc-50 hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20"
            >
              <span className="grid size-6 shrink-0 place-items-center rounded-lg border border-dashed border-zinc-300 text-zinc-400">
                <IconPlus className="size-3.5" />
              </span>
              New workspace
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function workspaceInitial(name: string) {
  return name.trim().charAt(0).toUpperCase() || "W";
}

function WorkspaceSwitcherTrigger({
  name,
  repositoryFullName,
  initial,
  open,
  disabled = false,
  onClick,
}: {
  name: string;
  repositoryFullName: string | null;
  initial: string;
  open: boolean;
  disabled?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      aria-expanded={disabled ? undefined : open}
      aria-haspopup={disabled ? undefined : "menu"}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20",
        disabled ? "cursor-default" : "hover:bg-zinc-50",
      )}
    >
      <span className="grid size-6 shrink-0 place-items-center rounded-lg bg-zinc-100 text-[13px] font-bold text-zinc-600 [font-family:Georgia,serif]">
        {initial}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[13px] font-semibold text-zinc-950">
          {name}
        </span>
        <span className="block truncate font-mono text-[10.5px] text-zinc-400">
          {repositoryFullName ?? "No repository"}
        </span>
      </span>
      <IconChevronDown
        className={cn(
          "size-3.5 shrink-0 text-zinc-400 transition-transform",
          open && "rotate-180",
          disabled && "opacity-40",
        )}
      />
    </button>
  );
}

function IconChevronDown({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="m6 9 6 6 6-6"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}

function IconCheck({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M4 12.5l5 5L20 6.5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2.2"
      />
    </svg>
  );
}

function IconPlus({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M12 5v14M5 12h14"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="2"
      />
    </svg>
  );
}
