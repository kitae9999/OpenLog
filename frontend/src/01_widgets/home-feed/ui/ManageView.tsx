"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { getManageHref, getNewWorkspaceHref, getTabHref } from "./data";
import { deleteWorkspace, updateWorkspace } from "./workspaceActions";
import { clearActiveWorkspaceId } from "./workspaceSelection";
import { notifyWorkspaceChange } from "./useActiveWorkspace";
import type { ManagedWorkspace } from "./workspaceTypes";

export function ManageView({
  isLoggedIn,
  workspaces,
}: {
  isLoggedIn: boolean;
  workspaces: ManagedWorkspace[];
}) {
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
        <span>Settings</span>
        <span className="text-zinc-300">/</span>
        <span className="font-semibold text-zinc-950">Manage</span>
      </nav>

      <header className="flex flex-wrap items-end justify-between gap-3 pb-6">
        <div className="min-w-0">
          <h1 className="text-[22px] font-semibold tracking-tight text-zinc-950">
            Manage
          </h1>
          <p className="mt-1.5 max-w-[54ch] text-[13px] leading-6 text-zinc-500">
            Review your workspaces. Deletion is permanent.
          </p>
        </div>
        <Link
          href={getNewWorkspaceHref()}
          className="inline-flex text-[13px] font-medium text-zinc-500 transition hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20"
        >
          + New workspace
        </Link>
      </header>

      <div className="border-b border-zinc-200 pb-3">
        <h2 className="text-[13.5px] font-semibold tracking-tight text-zinc-600">
          Workspaces
        </h2>
      </div>

      {workspaces.length === 0 ? (
        <div className="mt-10 pl-5">
          <p className="text-sm text-zinc-500">No workspaces yet.</p>
          <Link
            href={getNewWorkspaceHref()}
            className="mt-3 inline-flex text-[13px] font-medium text-zinc-500 transition hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20"
          >
            + New workspace
          </Link>
        </div>
      ) : (
        <ul className="mt-2">
          {workspaces.map((workspace) => (
            <WorkspaceManageRow key={workspace.id} workspace={workspace} />
          ))}
        </ul>
      )}
    </div>
  );
}

function WorkspaceManageRow({ workspace }: { workspace: ManagedWorkspace }) {
  const router = useRouter();
  const titleId = useId();
  const descriptionId = useId();
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [name, setName] = useState(workspace.name);
  const [repoFullName, setRepoFullName] = useState(
    workspace.repoFullName ?? "",
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isConfirmOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !isPending) {
        setIsConfirmOpen(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isConfirmOpen, isPending]);

  function openConfirm() {
    if (isPending || isSaving) {
      return;
    }

    setErrorMessage(null);
    setIsConfirmOpen(true);
  }

  function closeConfirm() {
    if (isPending) {
      return;
    }

    setIsConfirmOpen(false);
  }

  function confirmDelete() {
    if (isPending) {
      return;
    }

    setErrorMessage(null);

    startTransition(async () => {
      try {
        const result = await deleteWorkspace({ workspaceId: workspace.id });
        if (!result.ok) {
          setErrorMessage(
            result.message ?? "Something went wrong while deleting this workspace.",
          );
          return;
        }

        setIsConfirmOpen(false);
        clearActiveWorkspaceId(workspace.id);
        notifyWorkspaceChange();
        router.replace(getManageHref());
        router.refresh();
      } catch {
        setErrorMessage("Something went wrong while deleting this workspace.");
      }
    });
  }

  function cancelEdit() {
    if (isSaving) {
      return;
    }

    setName(workspace.name);
    setRepoFullName(workspace.repoFullName ?? "");
    setErrorMessage(null);
    setIsEditing(false);
  }

  async function saveWorkspace() {
    const trimmedName = name.trim();
    if (!trimmedName || isSaving) {
      if (!trimmedName) {
        setErrorMessage("Workspace name is required.");
      }
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);
    const result = await updateWorkspace({
      workspaceId: workspace.id,
      name: trimmedName,
      repoFullName,
    });
    setIsSaving(false);

    if (!result.ok) {
      setErrorMessage(result.message ?? "Failed to update workspace.");
      return;
    }

    setIsEditing(false);
    notifyWorkspaceChange();
    router.refresh();
  }

  return (
    <li className="border-t border-zinc-200/80 first:border-t-0">
      <div className="flex flex-wrap items-start justify-between gap-3 rounded-lg px-2.5 py-3 transition hover:bg-zinc-50">
      <div className="min-w-0 flex-1">
        {isEditing ? (
          <div className="grid max-w-xl gap-3 sm:grid-cols-2">
            <label className="grid gap-1.5 text-[12px] font-medium text-zinc-500">
              Name
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                disabled={isSaving}
                className="h-9 rounded-lg border border-zinc-200 bg-white px-3 text-[13px] font-normal text-zinc-950 outline-none transition focus:border-zinc-400 focus:ring-2 focus:ring-zinc-900/10 disabled:bg-zinc-50"
              />
            </label>
            <label className="grid gap-1.5 text-[12px] font-medium text-zinc-500">
              Repository
              <input
                value={repoFullName}
                onChange={(event) => setRepoFullName(event.target.value)}
                disabled={isSaving}
                placeholder="owner/repository"
                className="h-9 rounded-lg border border-zinc-200 bg-white px-3 text-[13px] font-normal text-zinc-950 outline-none transition placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-2 focus:ring-zinc-900/10 disabled:bg-zinc-50"
              />
            </label>
          </div>
        ) : (
          <>
            <p className="truncate text-[14.5px] font-medium text-zinc-950">
              {workspace.name}
            </p>
            <p className="mt-1 truncate text-[12.5px] text-zinc-500">
              {workspace.repoFullName ?? workspace.slug}
            </p>
          </>
        )}
        {errorMessage && !isConfirmOpen ? (
          <p className="mt-2 text-xs font-medium leading-5 text-rose-600">
            {errorMessage}
          </p>
        ) : null}
      </div>

      <div className="flex shrink-0 items-center gap-3 pt-0.5">
        {isEditing ? (
          <>
            <button
              type="button"
              onClick={cancelEdit}
              disabled={isSaving}
              className="text-[13px] font-medium text-zinc-500 transition hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20 disabled:cursor-not-allowed disabled:text-zinc-300"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={saveWorkspace}
              disabled={isSaving || !name.trim()}
              className="text-[13px] font-medium text-zinc-950 transition hover:text-zinc-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20 disabled:cursor-not-allowed disabled:text-zinc-300"
            >
              {isSaving ? "Saving…" : "Save"}
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => {
              setErrorMessage(null);
              setIsEditing(true);
            }}
            disabled={isPending}
            className="text-[13px] font-medium text-zinc-500 transition hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20 disabled:cursor-not-allowed disabled:text-zinc-300"
          >
            Edit
          </button>
        )}
        {!isEditing ? (
          <button
            type="button"
            onClick={openConfirm}
            disabled={isPending}
            aria-haspopup="dialog"
            aria-expanded={isConfirmOpen}
            className="cursor-pointer text-[13px] font-medium text-zinc-500 transition hover:text-rose-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20 disabled:cursor-not-allowed disabled:text-zinc-300"
          >
            Delete
          </button>
        ) : null}
      </div>

      {isConfirmOpen
        ? createPortal(
            <div className="fixed inset-0 z-[80] grid place-items-center p-4">
              <button
                type="button"
                aria-label="Close delete confirmation"
                onClick={closeConfirm}
                disabled={isPending}
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
                  Delete workspace?
                </h2>
                <p
                  id={descriptionId}
                  className="mt-2 text-[13.5px] leading-6 text-zinc-500"
                >
                  <span className="font-semibold text-zinc-700">
                    {workspace.name}
                  </span>{" "}
                  and all of its tasks, logs, and outputs will be permanently
                  deleted. This cannot be undone.
                </p>

                {errorMessage ? (
                  <p className="mt-3 text-xs font-medium leading-5 text-rose-600">
                    {errorMessage}
                  </p>
                ) : null}

                <div className="mt-5 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={closeConfirm}
                    disabled={isPending}
                    className="inline-flex h-9 items-center rounded-xl px-3.5 text-[13px] font-semibold text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={confirmDelete}
                    disabled={isPending}
                    className="inline-flex h-9 items-center rounded-xl bg-rose-600 px-3.5 text-[13px] font-semibold text-white transition hover:bg-rose-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-900/20 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isPending ? "Deleting…" : "Delete"}
                  </button>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
      </div>
    </li>
  );
}
