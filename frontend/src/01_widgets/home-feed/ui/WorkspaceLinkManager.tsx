"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { getLogHref, getTaskHref } from "./data";
import {
  createWorkspaceLogLink,
  createWorkspaceTaskLink,
  deleteWorkspaceLogLink,
  deleteWorkspaceTaskLink,
} from "./workspaceActions";
import type {
  WorkspaceLogLinkItem,
  WorkspaceTaskLinkItem,
  WorkspaceUiData,
} from "./workspaceTypes";

type LinkKind = "task" | "log";

export function WorkspaceLinkManager({
  workspaceData,
}: {
  workspaceData: WorkspaceUiData;
}) {
  const router = useRouter();
  const [kind, setKind] = useState<LinkKind>("task");
  const [fromId, setFromId] = useState("");
  const [toId, setToId] = useState("");
  const [taskRelation, setTaskRelation] =
    useState<WorkspaceTaskLinkItem["relation"]>("RELATES_TO");
  const [logRelation, setLogRelation] =
    useState<WorkspaceLogLinkItem["relation"]>("RELATES_TO");
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const items = kind === "task" ? workspaceData.tasks : workspaceData.logs;
  const links =
    kind === "task" ? workspaceData.taskLinks : workspaceData.logLinks;
  const isDuplicate = links.some((link) => {
    if (kind === "task") {
      const taskLink = link as WorkspaceTaskLinkItem;
      return (
        taskLink.fromTaskId === fromId &&
        taskLink.toTaskId === toId &&
        taskLink.relation === taskRelation
      );
    }

    const logLink = link as WorkspaceLogLinkItem;
    return (
      logLink.fromLogId === fromId &&
      logLink.toLogId === toId &&
      logLink.relation === logRelation
    );
  });
  const canSubmit =
    fromId.length > 0 &&
    toId.length > 0 &&
    fromId !== toId &&
    !isDuplicate &&
    !isSaving;

  function changeKind(nextKind: LinkKind) {
    setKind(nextKind);
    setFromId("");
    setToId("");
    setError(null);
  }

  async function createLink() {
    if (!canSubmit) {
      return;
    }

    setIsSaving(true);
    setError(null);
    const result =
      kind === "task"
        ? await createWorkspaceTaskLink({
            workspaceId: workspaceData.workspaceId,
            fromTaskId: fromId,
            toTaskId: toId,
            relation: taskRelation,
          })
        : await createWorkspaceLogLink({
            workspaceId: workspaceData.workspaceId,
            fromLogId: fromId,
            toLogId: toId,
            relation: logRelation,
          });
    setIsSaving(false);

    if (!result.ok) {
      setError(result.message ?? "Failed to create connection.");
      return;
    }

    setFromId("");
    setToId("");
    router.refresh();
  }

  async function deleteLink(linkId: string) {
    if (deletingId) {
      return;
    }

    setDeletingId(linkId);
    setError(null);
    const result =
      kind === "task"
        ? await deleteWorkspaceTaskLink({
            workspaceId: workspaceData.workspaceId,
            taskLinkId: linkId,
          })
        : await deleteWorkspaceLogLink({
            workspaceId: workspaceData.workspaceId,
            logLinkId: linkId,
          });
    setDeletingId(null);

    if (!result.ok) {
      setError(result.message ?? "Failed to delete connection.");
      return;
    }

    router.refresh();
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-zinc-200/70 bg-white">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-100 px-[18px] py-3.5">
        <div>
          <h2 className="text-[15px] font-bold tracking-[-0.01em] text-zinc-950">
            Connections
          </h2>
          <p className="mt-1 text-[12.5px] text-zinc-500">
            Define relationships rendered as graph edges.
          </p>
        </div>
        <div className="flex rounded-lg bg-zinc-100 p-0.5" role="tablist">
          {(["task", "log"] as const).map((itemKind) => (
            <button
              key={itemKind}
              type="button"
              role="tab"
              aria-selected={kind === itemKind}
              onClick={() => changeKind(itemKind)}
              className={`rounded-md px-3 py-1.5 text-[12px] font-semibold capitalize transition ${
                kind === itemKind
                  ? "bg-white text-zinc-950 shadow-sm"
                  : "text-zinc-500 hover:text-zinc-800"
              }`}
            >
              {itemKind}s
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-5 p-[18px] lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <div className="space-y-3">
          <div className="grid gap-2 sm:grid-cols-2">
            <ConnectionSelect
              label={`From ${kind}`}
              value={fromId}
              items={items}
              onChange={setFromId}
            />
            <ConnectionSelect
              label={`To ${kind}`}
              value={toId}
              items={items}
              onChange={setToId}
            />
          </div>
          <label className="grid gap-1.5 text-[12px] font-semibold text-zinc-600">
            Relationship
            {kind === "task" ? (
              <select
                value={taskRelation}
                onChange={(event) =>
                  setTaskRelation(
                    event.target.value as WorkspaceTaskLinkItem["relation"],
                  )
                }
                className="h-9 rounded-lg border border-zinc-200 bg-white px-3 text-[13px] font-medium text-zinc-800 outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-900/10"
              >
                <option value="PRECEDES">Precedes</option>
                <option value="BLOCKS">Blocks</option>
                <option value="RELATES_TO">Relates to</option>
              </select>
            ) : (
              <select
                value={logRelation}
                onChange={(event) =>
                  setLogRelation(
                    event.target.value as WorkspaceLogLinkItem["relation"],
                  )
                }
                className="h-9 rounded-lg border border-zinc-200 bg-white px-3 text-[13px] font-medium text-zinc-800 outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-900/10"
              >
                <option value="FIXES">Fixes</option>
                <option value="RELATES_TO">Relates to</option>
                <option value="SUPERSEDES">Supersedes</option>
              </select>
            )}
          </label>

          {fromId && fromId === toId ? (
            <p className="text-[12px] text-amber-700">
              Choose two different {kind}s.
            </p>
          ) : isDuplicate ? (
            <p className="text-[12px] text-amber-700">
              This connection already exists.
            </p>
          ) : null}
          {error ? <p className="text-[12px] text-red-600">{error}</p> : null}

          <button
            type="button"
            onClick={createLink}
            disabled={!canSubmit}
            className="inline-flex h-9 items-center justify-center rounded-xl bg-zinc-950 px-4 text-[13px] font-semibold text-white transition hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20 disabled:cursor-not-allowed disabled:bg-zinc-300"
          >
            {isSaving ? "Connecting..." : "Add connection"}
          </button>
        </div>

        <div className="min-w-0 rounded-xl border border-zinc-100 bg-zinc-50/60">
          {links.length === 0 ? (
            <p className="px-4 py-8 text-center text-[13px] text-zinc-500">
              No explicit {kind} connections yet.
            </p>
          ) : (
            <ul className="divide-y divide-zinc-100">
              {links.map((link) => (
                <ConnectionRow
                  key={link.id}
                  kind={kind}
                  link={link}
                  workspaceData={workspaceData}
                  deleting={deletingId === link.id}
                  onDelete={() => deleteLink(link.id)}
                />
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}

function ConnectionSelect({
  label,
  value,
  items,
  onChange,
}: {
  label: string;
  value: string;
  items: Array<{ id: string; title: string }>;
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid gap-1.5 text-[12px] font-semibold text-zinc-600">
      {label}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-9 min-w-0 rounded-lg border border-zinc-200 bg-white px-3 text-[13px] font-medium text-zinc-800 outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-900/10"
      >
        <option value="">Select</option>
        {items.map((item) => (
          <option key={item.id} value={item.id}>
            {item.title}
          </option>
        ))}
      </select>
    </label>
  );
}

function ConnectionRow({
  kind,
  link,
  workspaceData,
  deleting,
  onDelete,
}: {
  kind: LinkKind;
  link: WorkspaceTaskLinkItem | WorkspaceLogLinkItem;
  workspaceData: WorkspaceUiData;
  deleting: boolean;
  onDelete: () => void;
}) {
  const isTask = kind === "task";
  const typedLink = link as WorkspaceTaskLinkItem & WorkspaceLogLinkItem;
  const fromId = isTask ? typedLink.fromTaskId : typedLink.fromLogId;
  const toId = isTask ? typedLink.toTaskId : typedLink.toLogId;
  const items = isTask ? workspaceData.tasks : workspaceData.logs;
  const from = items.find((item) => item.id === fromId);
  const to = items.find((item) => item.id === toId);
  const getHref = isTask ? getTaskHref : getLogHref;

  return (
    <li className="flex items-center gap-3 px-4 py-3">
      <div className="min-w-0 flex-1 text-[12.5px] text-zinc-600">
        <Link
          href={getHref(fromId)}
          className="font-semibold text-zinc-900 hover:underline"
        >
          {from?.title ?? `#${fromId}`}
        </Link>
        <span className="mx-2 rounded-full bg-zinc-200/70 px-2 py-0.5 font-mono text-[10px] text-zinc-600">
          {formatRelation(link.relation)}
        </span>
        <Link
          href={getHref(toId)}
          className="font-semibold text-zinc-900 hover:underline"
        >
          {to?.title ?? `#${toId}`}
        </Link>
      </div>
      <button
        type="button"
        onClick={onDelete}
        disabled={deleting}
        aria-label={`Delete connection from ${from?.title ?? fromId} to ${to?.title ?? toId}`}
        className="shrink-0 text-[12px] font-semibold text-zinc-400 transition hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600/20 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {deleting ? "Deleting..." : "Delete"}
      </button>
    </li>
  );
}

function formatRelation(relation: string) {
  return relation.toLowerCase().replaceAll("_", " ");
}
