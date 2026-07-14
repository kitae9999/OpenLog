"use client";

import Link from "next/link";
import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/shared/lib/cn";
import { getLogHref, getMemoryHref, getOutputHref, getTaskHref } from "@/entities/workspace/model/data";
import {
  createWorkspaceCrossLink,
  createWorkspaceLogLink,
  createWorkspaceTaskLink,
  deleteWorkspaceCrossLink,
  deleteWorkspaceLogLink,
  deleteWorkspaceTaskLink,
} from "@/features/workspace-actions/api/workspaceActions";
import type {
  WorkspaceCrossLinkRelation,
  WorkspaceLogLinkItem,
  WorkspaceNodeKind,
  WorkspaceTaskLinkItem,
  WorkspaceUiData,
} from "@/entities/workspace/model/workspaceTypes";

type NodeKind = WorkspaceNodeKind;
type NodeRef = { kind: NodeKind; id: string };

type GraphNodeOption = {
  value: string;
  kind: NodeKind;
  id: string;
  title: string;
  meta: string;
  searchText: string;
};

type ListedConnection = {
  id: string;
  linkKind: "task" | "log" | "cross";
  fromKind: NodeKind;
  toKind: NodeKind;
  fromId: string;
  toId: string;
  relation: string;
};

const TASK_RELATIONS: Array<{
  value: WorkspaceTaskLinkItem["relation"];
  label: string;
}> = [
  { value: "PRECEDES", label: "Precedes" },
  { value: "BLOCKS", label: "Blocks" },
  { value: "RELATES_TO", label: "Relates to" },
];

const LOG_RELATIONS: Array<{
  value: WorkspaceLogLinkItem["relation"];
  label: string;
}> = [
  { value: "FIXES", label: "Fixes" },
  { value: "RELATES_TO", label: "Relates to" },
  { value: "SUPERSEDES", label: "Supersedes" },
];

const CROSS_RELATIONS: Array<{
  value: WorkspaceCrossLinkRelation;
  label: string;
}> = [
  { value: "RELATES_TO", label: "Relates to" },
  { value: "REFERENCES", label: "References" },
  { value: "SUPPORTS", label: "Supports" },
  { value: "DERIVED_FROM", label: "Derived from" },
];

export function WorkspaceLinkManager({
  workspaceData,
}: {
  workspaceData: WorkspaceUiData;
}) {
  const router = useRouter();
  const [fromValue, setFromValue] = useState("");
  const [toValue, setToValue] = useState("");
  const [taskRelation, setTaskRelation] =
    useState<WorkspaceTaskLinkItem["relation"]>("RELATES_TO");
  const [logRelation, setLogRelation] =
    useState<WorkspaceLogLinkItem["relation"]>("RELATES_TO");
  const [crossRelation, setCrossRelation] =
    useState<WorkspaceCrossLinkRelation>("RELATES_TO");
  const [isSaving, setIsSaving] = useState(false);
  const [deletingKey, setDeletingKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const nodeOptions = useMemo(
    () => buildNodeOptions(workspaceData),
    [workspaceData],
  );
  const fromNode = parseNodeValue(fromValue);
  const toNode = parseNodeValue(toValue);
  const pairKind =
    fromNode && toNode && fromNode.kind === toNode.kind ? fromNode.kind : null;
  const isCrossKind =
    Boolean(fromNode && toNode) && fromNode!.kind !== toNode!.kind;
  const supportsPair = pairKind === "task" || pairKind === "log" || isCrossKind;

  const connections = useMemo(
    () => listConnections(workspaceData),
    [workspaceData],
  );

  const isDuplicate =
    pairKind === "task"
      ? workspaceData.taskLinks.some(
          (link) =>
            link.fromTaskId === fromNode!.id &&
            link.toTaskId === toNode!.id &&
            link.relation === taskRelation,
        )
      : pairKind === "log"
        ? workspaceData.logLinks.some(
            (link) =>
              link.fromLogId === fromNode!.id &&
              link.toLogId === toNode!.id &&
              link.relation === logRelation,
          )
        : isCrossKind
          ? (workspaceData.crossLinks ?? []).some(
              (link) =>
                link.fromType === fromNode!.kind &&
                link.fromNodeId === fromNode!.id &&
                link.toType === toNode!.kind &&
                link.toNodeId === toNode!.id &&
                link.relation === crossRelation,
            )
          : false;

  const canSubmit =
    supportsPair &&
    Boolean(fromNode && toNode) &&
    !(fromNode!.kind === toNode!.kind && fromNode!.id === toNode!.id) &&
    !isDuplicate &&
    !isSaving;

  async function createLink() {
    if (!canSubmit || !fromNode || !toNode) {
      return;
    }

    setIsSaving(true);
    setError(null);
    const result = isCrossKind
      ? await createWorkspaceCrossLink({
          workspaceId: workspaceData.workspaceId,
          fromType: fromNode.kind,
          fromNodeId: fromNode.id,
          toType: toNode.kind,
          toNodeId: toNode.id,
          relation: crossRelation,
        })
      : pairKind === "task"
        ? await createWorkspaceTaskLink({
            workspaceId: workspaceData.workspaceId,
            fromTaskId: fromNode.id,
            toTaskId: toNode.id,
            relation: taskRelation,
          })
        : await createWorkspaceLogLink({
            workspaceId: workspaceData.workspaceId,
            fromLogId: fromNode.id,
            toLogId: toNode.id,
            relation: logRelation,
          });
    setIsSaving(false);

    if (!result.ok) {
      setError(result.message ?? "Failed to create connection.");
      return;
    }

    setFromValue("");
    setToValue("");
    router.refresh();
  }

  async function deleteLink(connection: ListedConnection) {
    if (deletingKey) {
      return;
    }

    setDeletingKey(toConnectionKey(connection));
    setError(null);
    const result =
      connection.linkKind === "cross"
        ? await deleteWorkspaceCrossLink({
            workspaceId: workspaceData.workspaceId,
            crossLinkId: connection.id,
          })
        : connection.linkKind === "task"
          ? await deleteWorkspaceTaskLink({
              workspaceId: workspaceData.workspaceId,
              taskLinkId: connection.id,
            })
          : await deleteWorkspaceLogLink({
              workspaceId: workspaceData.workspaceId,
              logLinkId: connection.id,
            });
    setDeletingKey(null);

    if (!result.ok) {
      setError(result.message ?? "Failed to delete connection.");
      return;
    }

    router.refresh();
  }

  return (
    <section>
      <div className="min-w-0">
        <h2 className="text-[13.5px] font-semibold tracking-tight text-zinc-600">
          Connections
        </h2>
        <p className="mt-1 text-[13px] text-zinc-500">
          Search nodes to connect. Relationship options follow the selected
          types.
        </p>
      </div>

      <div className="mt-5 grid gap-8 lg:grid-cols-2 lg:gap-10">
        <div className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <NodeSearchSelect
              label="From"
              value={fromValue}
              options={nodeOptions}
              onChange={(next) => {
                setFromValue(next);
                setError(null);
              }}
            />
            <NodeSearchSelect
              label="To"
              value={toValue}
              options={nodeOptions}
              onChange={(next) => {
                setToValue(next);
                setError(null);
              }}
            />
          </div>

          <label className="grid gap-1.5 text-[12.5px] font-medium text-zinc-500">
            Relationship
            {isCrossKind ? (
              <select
                value={crossRelation}
                onChange={(event) =>
                  setCrossRelation(
                    event.target.value as WorkspaceCrossLinkRelation,
                  )
                }
                className="h-9 border-0 border-b border-zinc-200 bg-transparent px-0 text-[13px] font-medium text-zinc-800 outline-none focus:border-zinc-400"
              >
                {CROSS_RELATIONS.map((relation) => (
                  <option key={relation.value} value={relation.value}>
                    {relation.label}
                  </option>
                ))}
              </select>
            ) : pairKind === "log" ? (
              <select
                value={logRelation}
                onChange={(event) =>
                  setLogRelation(
                    event.target.value as WorkspaceLogLinkItem["relation"],
                  )
                }
                className="h-9 border-0 border-b border-zinc-200 bg-transparent px-0 text-[13px] font-medium text-zinc-800 outline-none focus:border-zinc-400"
              >
                {LOG_RELATIONS.map((relation) => (
                  <option key={relation.value} value={relation.value}>
                    {relation.label}
                  </option>
                ))}
              </select>
            ) : (
              <select
                value={taskRelation}
                disabled={pairKind !== "task"}
                onChange={(event) =>
                  setTaskRelation(
                    event.target.value as WorkspaceTaskLinkItem["relation"],
                  )
                }
                className="h-9 border-0 border-b border-zinc-200 bg-transparent px-0 text-[13px] font-medium text-zinc-800 outline-none focus:border-zinc-400 disabled:text-zinc-300"
              >
                {TASK_RELATIONS.map((relation) => (
                  <option key={relation.value} value={relation.value}>
                    {relation.label}
                  </option>
                ))}
              </select>
            )}
          </label>

          {fromNode &&
          toNode &&
          fromNode.kind === toNode.kind &&
          fromNode.id === toNode.id ? (
            <p className="text-[12.5px] text-amber-700">
              Choose two different nodes.
            </p>
          ) : pairKind === "output" || pairKind === "memory" ? (
            <p className="text-[12.5px] text-amber-700">
              Same-type connections are available for tasks and logs.
            </p>
          ) : isDuplicate ? (
            <p className="text-[12.5px] text-amber-700">
              This connection already exists.
            </p>
          ) : null}
          {error ? (
            <p className="text-[12.5px] font-medium text-rose-600">{error}</p>
          ) : null}

          <button
            type="button"
            onClick={createLink}
            disabled={!canSubmit}
            className="inline-flex text-[13px] font-medium text-zinc-500 transition hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20 disabled:cursor-not-allowed disabled:text-zinc-300"
          >
            {isSaving ? "Connecting..." : "+ Add connection"}
          </button>
        </div>

        <div className="min-w-0">
          {connections.length === 0 ? (
            <p className="text-sm text-zinc-500">No explicit connections yet.</p>
          ) : (
            <ul className="divide-y divide-zinc-200/80">
              {connections.map((connection) => (
                <ConnectionRow
                  key={toConnectionKey(connection)}
                  connection={connection}
                  workspaceData={workspaceData}
                  deleting={deletingKey === toConnectionKey(connection)}
                  onDelete={() => deleteLink(connection)}
                />
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}

function NodeSearchSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: GraphNodeOption[];
  onChange: (value: string) => void;
}) {
  const listboxId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const selected = options.find((option) => option.value === value) ?? null;
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);

  const filtered = useMemo(() => {
    const normalized = normalizeSearch(query);
    if (!normalized) {
      return options;
    }
    return options.filter((option) => option.searchText.includes(normalized));
  }, [options, query]);

  const grouped = useMemo(() => {
    return {
      tasks: filtered.filter((option) => option.kind === "task"),
      logs: filtered.filter((option) => option.kind === "log"),
      outputs: filtered.filter((option) => option.kind === "output"),
      memories: filtered.filter((option) => option.kind === "memory"),
    };
  }, [filtered]);

  useEffect(() => {
    if (!open) {
      return;
    }

    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [open]);

  function selectOption(option: GraphNodeOption) {
    onChange(option.value);
    setQuery("");
    setOpen(false);
    inputRef.current?.blur();
  }

  function clearSelection() {
    onChange("");
    setQuery("");
    setActiveIndex(0);
    setOpen(true);
    inputRef.current?.focus();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (!open && (event.key === "ArrowDown" || event.key === "Enter")) {
      setOpen(true);
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      setOpen(false);
      setQuery("");
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setOpen(true);
      setActiveIndex((current) =>
        filtered.length === 0 ? 0 : Math.min(current + 1, filtered.length - 1),
      );
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((current) => Math.max(current - 1, 0));
      return;
    }

    if (event.key === "Enter" && open && filtered[activeIndex]) {
      event.preventDefault();
      selectOption(filtered[activeIndex]);
    }
  }

  const inputValue = open ? query : selected ? selected.title : "";

  return (
    <div ref={rootRef} className="relative grid gap-1.5">
      <label
        htmlFor={listboxId}
        className="text-[12.5px] font-medium text-zinc-500"
      >
        {label}
      </label>
      <div className="relative">
        <input
          ref={inputRef}
          id={listboxId}
          role="combobox"
          aria-expanded={open}
          aria-autocomplete="list"
          aria-controls={`${listboxId}-listbox`}
          value={inputValue}
          placeholder="Search nodes..."
          onFocus={() => {
            setActiveIndex(0);
            setOpen(true);
            setQuery("");
          }}
          onChange={(event) => {
            setQuery(event.target.value);
            setActiveIndex(0);
            setOpen(true);
            if (value) {
              onChange("");
            }
          }}
          onKeyDown={handleKeyDown}
          className="h-9 w-full border-0 border-b border-zinc-200 bg-transparent pr-14 text-[13px] font-medium text-zinc-800 outline-none placeholder:font-medium placeholder:text-zinc-400 focus:border-zinc-400"
        />
        {selected && !open ? (
          <span className="pointer-events-none absolute right-8 top-1/2 -translate-y-1/2 text-[11px] font-medium uppercase tracking-wide text-zinc-400">
            {selected.kind}
          </span>
        ) : null}
        {value ? (
          <button
            type="button"
            aria-label={`Clear ${label}`}
            onClick={clearSelection}
            className="absolute right-0 top-1/2 -translate-y-1/2 text-[12.5px] font-medium text-zinc-400 transition hover:text-zinc-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20"
          >
            Clear
          </button>
        ) : null}
      </div>

      {open ? (
        <div
          id={`${listboxId}-listbox`}
          role="listbox"
          className="openlog-scroll absolute inset-x-0 top-full z-20 mt-1.5 max-h-56 overflow-y-auto rounded-lg border border-zinc-200/70 bg-white shadow-[0_4px_18px_rgba(24,24,27,0.08)]"
        >
          {filtered.length === 0 ? (
            <p className="px-2.5 py-2.5 text-[13px] text-zinc-500">
              No matching nodes.
            </p>
          ) : (
            <>
              {grouped.tasks.length > 0 ? (
                <NodeOptionGroup
                  label="Task"
                  options={grouped.tasks}
                  filtered={filtered}
                  activeIndex={activeIndex}
                  onSelect={selectOption}
                  onHover={setActiveIndex}
                />
              ) : null}
              {grouped.logs.length > 0 ? (
                <NodeOptionGroup
                  label="Log"
                  options={grouped.logs}
                  filtered={filtered}
                  activeIndex={activeIndex}
                  onSelect={selectOption}
                  onHover={setActiveIndex}
                />
              ) : null}
              {grouped.outputs.length > 0 ? (
                <NodeOptionGroup
                  label="Output"
                  options={grouped.outputs}
                  filtered={filtered}
                  activeIndex={activeIndex}
                  onSelect={selectOption}
                  onHover={setActiveIndex}
                />
              ) : null}
              {grouped.memories.length > 0 ? (
                <NodeOptionGroup
                  label="Memory"
                  options={grouped.memories}
                  filtered={filtered}
                  activeIndex={activeIndex}
                  onSelect={selectOption}
                  onHover={setActiveIndex}
                />
              ) : null}
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}

function NodeOptionGroup({
  label,
  options,
  filtered,
  activeIndex,
  onSelect,
  onHover,
}: {
  label: string;
  options: GraphNodeOption[];
  filtered: GraphNodeOption[];
  activeIndex: number;
  onSelect: (option: GraphNodeOption) => void;
  onHover: (index: number) => void;
}) {
  return (
    <div>
      <p className="border-b border-zinc-100 px-2.5 py-1.5 text-[11px] font-medium uppercase tracking-wide text-zinc-400">
        {label}
      </p>
      {options.map((option) => {
        const index = filtered.findIndex((item) => item.value === option.value);
        const active = index === activeIndex;
        return (
          <button
            key={option.value}
            type="button"
            role="option"
            aria-selected={active}
            onMouseEnter={() => onHover(index)}
            onClick={() => onSelect(option)}
            className={cn(
              "flex w-full items-baseline justify-between gap-3 px-2.5 py-2 text-left text-[13px] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-zinc-900/20",
              active
                ? "bg-zinc-50 text-zinc-950"
                : "text-zinc-700 hover:bg-zinc-50 hover:text-zinc-950",
            )}
          >
            <span className="min-w-0 truncate font-medium">{option.title}</span>
            {option.meta ? (
              <span className="shrink-0 text-[11.5px] text-zinc-400">
                {option.meta}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

function ConnectionRow({
  connection,
  workspaceData,
  deleting,
  onDelete,
}: {
  connection: ListedConnection;
  workspaceData: WorkspaceUiData;
  deleting: boolean;
  onDelete: () => void;
}) {
  const from = findNode(workspaceData, connection.fromKind, connection.fromId);
  const to = findNode(workspaceData, connection.toKind, connection.toId);
  const fromHref = getNodeHref(connection.fromKind, connection.fromId);
  const toHref = getNodeHref(connection.toKind, connection.toId);

  return (
    <li className="flex items-center gap-3 px-2.5 py-2.5">
      <div className="min-w-0 flex-1 text-[13px] text-zinc-600">
        <span className="mr-2 text-[11px] font-medium uppercase tracking-wide text-zinc-400">
          {connection.fromKind === connection.toKind
            ? connection.fromKind
            : `${connection.fromKind} → ${connection.toKind}`}
        </span>
        <Link
          href={fromHref}
          className="font-medium text-zinc-950 transition hover:text-zinc-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20"
        >
          {from?.title ?? `#${connection.fromId}`}
        </Link>
        <span className="mx-2 font-mono text-[11px] text-zinc-400">
          {formatRelation(connection.relation)}
        </span>
        <Link
          href={toHref}
          className="font-medium text-zinc-950 transition hover:text-zinc-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20"
        >
          {to?.title ?? `#${connection.toId}`}
        </Link>
      </div>
      <button
        type="button"
        onClick={onDelete}
        disabled={deleting}
        aria-label={`Delete connection from ${from?.title ?? connection.fromId} to ${to?.title ?? connection.toId}`}
        className="shrink-0 text-[12.5px] font-medium text-zinc-400 transition hover:text-rose-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-600/20 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {deleting ? "Deleting..." : "Delete"}
      </button>
    </li>
  );
}

function buildNodeOptions(workspaceData: WorkspaceUiData): GraphNodeOption[] {
  return [
    ...workspaceData.tasks.map((task) => ({
      value: toNodeValue("task", task.id),
      kind: "task" as const,
      id: task.id,
      title: task.title,
      meta: task.status,
      searchText: normalizeSearch(`task ${task.title} ${task.status}`),
    })),
    ...workspaceData.logs.map((log) => ({
      value: toNodeValue("log", log.id),
      kind: "log" as const,
      id: log.id,
      title: log.title,
      meta: log.label,
      searchText: normalizeSearch(
        `log ${log.label} ${log.title} ${log.description ?? ""}`,
      ),
    })),
    ...workspaceData.outputs.map((output) => ({
      value: toNodeValue("output", output.id),
      kind: "output" as const,
      id: output.id,
      title: output.title,
      meta: output.status,
      searchText: normalizeSearch(
        `output ${output.title} ${output.status} ${output.description ?? ""}`,
      ),
    })),
    ...workspaceData.memories.map((memory) => ({
      value: toNodeValue("memory", memory.id),
      kind: "memory" as const,
      id: memory.id,
      title: memory.title,
      meta: memory.task?.title ?? "Memory",
      searchText: normalizeSearch(
        `memory ${memory.title} ${memory.excerpt} ${memory.task?.title ?? ""}`,
      ),
    })),
  ];
}

function listConnections(workspaceData: WorkspaceUiData): ListedConnection[] {
  return [
    ...workspaceData.taskLinks.map((link) => ({
      id: link.id,
      linkKind: "task" as const,
      fromKind: "task" as const,
      toKind: "task" as const,
      fromId: link.fromTaskId,
      toId: link.toTaskId,
      relation: link.relation,
    })),
    ...workspaceData.logLinks.map((link) => ({
      id: link.id,
      linkKind: "log" as const,
      fromKind: "log" as const,
      toKind: "log" as const,
      fromId: link.fromLogId,
      toId: link.toLogId,
      relation: link.relation,
    })),
    ...(workspaceData.crossLinks ?? []).map((link) => ({
      id: link.id,
      linkKind: "cross" as const,
      fromKind: link.fromType,
      toKind: link.toType,
      fromId: link.fromNodeId,
      toId: link.toNodeId,
      relation: link.relation,
    })),
  ];
}

function findNode(
  workspaceData: WorkspaceUiData,
  kind: NodeKind,
  id: string,
): { title: string } | undefined {
  if (kind === "task") {
    return workspaceData.tasks.find((task) => task.id === id);
  }
  if (kind === "log") {
    return workspaceData.logs.find((log) => log.id === id);
  }
  if (kind === "output") {
    return workspaceData.outputs.find((output) => output.id === id);
  }
  return workspaceData.memories.find((memory) => memory.id === id);
}

function getNodeHref(kind: NodeKind, id: string) {
  if (kind === "task") return getTaskHref(id);
  if (kind === "log") return getLogHref(id);
  if (kind === "output") return getOutputHref(id);
  return getMemoryHref(id);
}

function toNodeValue(kind: NodeKind, id: string) {
  return `${kind}:${id}`;
}

function parseNodeValue(value: string): NodeRef | null {
  if (!value) {
    return null;
  }
  const separator = value.indexOf(":");
  if (separator <= 0) {
    return null;
  }
  const kind = value.slice(0, separator);
  const id = value.slice(separator + 1);
  if (
    (kind !== "task" &&
      kind !== "log" &&
      kind !== "output" &&
      kind !== "memory") ||
    !id
  ) {
    return null;
  }
  return { kind: kind as NodeKind, id };
}

function toConnectionKey(connection: ListedConnection) {
  return `${connection.linkKind}:${connection.id}`;
}

function normalizeSearch(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function formatRelation(relation: string) {
  return relation.toLowerCase().replaceAll("_", " ");
}
