"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  startTransition,
  useActionState,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useFormStatus } from "react-dom";
import type { SuggestionActionState } from "@/features/suggest/api/suggestionActions";
import { cn } from "@/shared/lib/cn";
import { buildDiffRows, type DiffRow } from "@/shared/lib/diffRows";
import { formatSelection, type ToolbarAction } from "@/shared/lib/markdown";
import { MarkdownContent, MarkdownToolbar } from "@/shared/ui/markdown";

type ComposerMode = "edit" | "preview";

export type NewSuggestionInitialValues = {
  postTitle: string;
  baseContent: string;
  title?: string;
  description?: string;
  content?: string;
};

type SubmitSuggestionAction = (
  prevState: SuggestionActionState,
  formData: FormData,
) => Promise<SuggestionActionState>;

const initialSuggestionActionState: SuggestionActionState = {
  errors: {},
};

export function NewSuggestionView({
  initialValues,
  backHref,
  articleHref,
  action = unavailableSuggestionAction,
  mode = "create",
  eyebrow = "New Suggest",
  heading,
  submitLabel,
  pendingSubmitLabel,
  cancelLabel = "Cancel",
}: {
  initialValues: NewSuggestionInitialValues;
  backHref: string;
  articleHref: string;
  action?: SubmitSuggestionAction;
  mode?: "create" | "edit";
  eyebrow?: string;
  heading?: string;
  submitLabel?: string;
  pendingSubmitLabel?: string;
  cancelLabel?: string;
}) {
  const router = useRouter();
  const [actionState, formAction] = useActionState(
    action,
    initialSuggestionActionState,
  );
  const [composerMode, setComposerMode] = useState<ComposerMode>("edit");
  const [descriptionMode, setDescriptionMode] = useState<ComposerMode>("edit");
  const [title, setTitle] = useState(initialValues.title ?? "");
  const [description, setDescription] = useState(
    initialValues.description ?? DEFAULT_DESCRIPTION,
  );
  const [body, setBody] = useState(
    initialValues.content ?? initialValues.baseContent,
  );
  const descriptionRef = useRef<HTMLTextAreaElement>(null);
  const editorRef = useRef<HTMLTextAreaElement>(null);

  useLayoutEffect(() => {
    if (descriptionMode !== "edit") {
      return;
    }

    const textarea = descriptionRef.current;
    if (!textarea) {
      return;
    }

    fitTextareaToContent(textarea);
  }, [description, descriptionMode]);

  const diffRows = buildDiffRows(initialValues.baseContent, body);
  const hasChanges = diffRows.some((row) => row.kind !== "context");
  const hasEditedFields =
    title.trim() !== (initialValues.title ?? "").trim() ||
    description.trim() !== (initialValues.description ?? DEFAULT_DESCRIPTION).trim() ||
    body.trim() !== (initialValues.content ?? initialValues.baseContent).trim();
  const canSubmit =
    title.trim().length > 0 &&
    description.trim().length > 0 &&
    body.trim().length > 0 &&
    (mode === "edit"
      ? hasEditedFields
      : body.trim() !== initialValues.baseContent.trim());
  const resolvedHeading =
    heading ?? `Suggest edit for "${initialValues.postTitle}"`;
  const resolvedSubmitLabel =
    submitLabel ?? (mode === "edit" ? "Save suggestion" : "Submit suggestion");
  const resolvedPendingSubmitLabel =
    pendingSubmitLabel ?? (mode === "edit" ? "Saving..." : "Submitting...");

  useEffect(() => {
    if (!actionState.redirectTo) {
      return;
    }

    router.replace(actionState.redirectTo);
  }, [actionState.redirectTo, router]);

  function handleModeChange(nextMode: ComposerMode) {
    startTransition(() => {
      setComposerMode(nextMode);
    });
  }

  function handleDescriptionModeChange(nextMode: ComposerMode) {
    startTransition(() => {
      setDescriptionMode(nextMode);
    });
  }

  function insertFormatting(action: ToolbarAction) {
    const textarea = editorRef.current;
    if (!textarea) {
      return;
    }

    const selectionStart = textarea.selectionStart;
    const selectionEnd = textarea.selectionEnd;
    const selectedText = body.slice(selectionStart, selectionEnd);
    const { nextValue, nextSelectionStart, nextSelectionEnd } = formatSelection(
      action,
      body,
      selectedText,
      selectionStart,
      selectionEnd,
    );

    setBody(nextValue);
    handleModeChange("edit");

    window.requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(nextSelectionStart, nextSelectionEnd);
    });
  }

  function insertDescriptionFormatting(action: ToolbarAction) {
    const textarea = descriptionRef.current;
    if (!textarea) {
      return;
    }

    const selectionStart = textarea.selectionStart;
    const selectionEnd = textarea.selectionEnd;
    const selectedText = description.slice(selectionStart, selectionEnd);
    const { nextValue, nextSelectionStart, nextSelectionEnd } = formatSelection(
      action,
      description,
      selectedText,
      selectionStart,
      selectionEnd,
    );

    setDescription(nextValue);
    handleDescriptionModeChange("edit");

    window.requestAnimationFrame(() => {
      fitTextareaToContent(textarea);
      textarea.focus();
      textarea.setSelectionRange(nextSelectionStart, nextSelectionEnd);
    });
  }

  return (
    <div className="mx-auto w-full max-w-[950px] pb-12">
      <div className="flex items-start gap-15">
        <div className="hidden w-[60px] shrink-0 lg:block" aria-hidden="true" />

        <form
          className="w-full max-w-[768px]"
          action={formAction}
        >
          <Link
            href={backHref}
            className="inline-flex items-center gap-2 text-sm text-zinc-500 transition hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20"
          >
            <IconArrowLeft className="size-4" />
            Back to Suggestions
          </Link>

          <header className="mt-7 border-b border-zinc-200 pb-6">
            <p className="text-[11px] font-semibold uppercase tracking-normal text-zinc-400">
              {eyebrow}
            </p>
            <h1 className="mt-3 font-serif text-[32px] font-bold leading-[1.15] tracking-tight text-zinc-950">
              {resolvedHeading}
            </h1>
          </header>

          <div className="mt-8 space-y-8">
            <section className="space-y-3">
              <label
                htmlFor="suggestion-title"
                className="text-sm font-bold text-zinc-950"
              >
                Suggestion title
              </label>
              <input
                id="suggestion-title"
                name="title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="add title"
                className="h-12 w-full rounded-lg border border-zinc-200 bg-white px-4 text-[16px] font-medium text-zinc-950 outline-none transition placeholder:text-zinc-400 focus:border-zinc-950 focus:ring-2 focus:ring-zinc-900/10"
              />
              {actionState.errors.title ? (
                <p className="text-sm text-rose-700">
                  {actionState.errors.title}
                </p>
              ) : null}
            </section>

            <section className="space-y-3">
              <div>
                <label
                  htmlFor="suggestion-description"
                  className="text-sm font-bold text-zinc-950"
                >
                  Description
                </label>
              </div>

              <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200 bg-zinc-50 px-4 py-2">
                  <MarkdownToolbar
                    disabled={descriptionMode === "preview"}
                    onAction={insertDescriptionFormatting}
                  />
                  <div className="rounded-lg bg-zinc-100 p-1">
                    <div className="flex items-center gap-1">
                      <ModeButton
                        active={descriptionMode === "edit"}
                        icon={<IconEdit className="size-4" />}
                        label="Edit"
                        onClick={() => handleDescriptionModeChange("edit")}
                      />
                      <ModeButton
                        active={descriptionMode === "preview"}
                        icon={<IconEye className="size-4" />}
                        label="Preview"
                        onClick={() => handleDescriptionModeChange("preview")}
                      />
                    </div>
                  </div>
                </div>

                <div className="min-h-[220px] bg-white">
                  {descriptionMode === "edit" ? (
                    <textarea
                      ref={descriptionRef}
                      id="suggestion-description"
                      name="description"
                      value={description}
                      onChange={(event) => {
                        setDescription(event.target.value);
                        fitTextareaToContent(event.currentTarget);
                      }}
                      className="min-h-[220px] w-full resize-none overflow-hidden px-4 py-4 font-mono text-[14px] leading-7 text-zinc-900 outline-none transition placeholder:text-zinc-400"
                    />
                  ) : (
                    <article className="min-h-[220px] px-4 py-4">
                      <MarkdownContent
                        markdown={description}
                        emptyFallback={
                          <p className="text-zinc-400">
                            Description preview will render here.
                          </p>
                        }
                      />
                    </article>
                  )}
                </div>
              </div>
              {actionState.errors.description ? (
                <p className="text-sm text-rose-700">
                  {actionState.errors.description}
                </p>
              ) : null}
            </section>

            <section className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200 bg-zinc-50 px-4 py-2">
                <MarkdownToolbar
                  disabled={composerMode === "preview"}
                  onAction={insertFormatting}
                />
                <div className="rounded-lg bg-zinc-100 p-1">
                  <div className="flex items-center gap-1">
                    <ModeButton
                      active={composerMode === "edit"}
                      icon={<IconEdit className="size-4" />}
                      label="Edit"
                      onClick={() => handleModeChange("edit")}
                    />
                    <ModeButton
                      active={composerMode === "preview"}
                      icon={<IconEye className="size-4" />}
                      label="Preview"
                      onClick={() => handleModeChange("preview")}
                    />
                  </div>
                </div>
              </div>

              <div className="min-h-[520px] bg-white">
                {composerMode === "edit" ? (
                  <textarea
                    ref={editorRef}
                    name="content"
                    value={body}
                    onChange={(event) => setBody(event.target.value)}
                    className="min-h-[520px] w-full resize-y px-6 py-6 text-[16px] leading-8 tracking-normal text-zinc-900 outline-none placeholder:text-zinc-400"
                  />
                ) : (
                  <article className="min-h-[520px] px-6 py-8">
                    <MarkdownContent
                      markdown={body}
                      emptyFallback={
                        <p className="text-zinc-400">
                          Edited article content will render here.
                        </p>
                      }
                    />
                  </article>
                )}
              </div>
            </section>

            <FilesChanged rows={diffRows} hasChanges={hasChanges} />

            {actionState.errors.content ? (
              <p className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {actionState.errors.content}
              </p>
            ) : null}

            {actionState.errors.form ? (
              <p className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {actionState.errors.form}
              </p>
            ) : null}

            <div className="flex flex-col-reverse gap-3 border-t border-zinc-200 pt-6 sm:flex-row sm:items-center sm:justify-between">
              <Link
                href={articleHref}
                className="inline-flex h-10 items-center justify-center rounded-lg border border-zinc-300 px-5 text-sm font-semibold text-zinc-700 transition hover:border-zinc-950 hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20"
              >
                {cancelLabel}
              </Link>

              <SubmitSuggestionButton
                canSubmit={canSubmit}
                submitLabel={resolvedSubmitLabel}
                pendingSubmitLabel={resolvedPendingSubmitLabel}
              />
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

async function unavailableSuggestionAction(): Promise<SuggestionActionState> {
  return {
    errors: {
      form: "이 글은 아직 제안을 제출할 수 없습니다.",
    },
  };
}

const DEFAULT_DESCRIPTION = `## Summary


## Reason
`;

const DESCRIPTION_MIN_HEIGHT = 220;
const DESCRIPTION_MAX_HEIGHT = 520;

function fitTextareaToContent(textarea: HTMLTextAreaElement) {
  textarea.style.height = "auto";
  const nextHeight = Math.min(
    Math.max(textarea.scrollHeight, DESCRIPTION_MIN_HEIGHT),
    DESCRIPTION_MAX_HEIGHT,
  );

  textarea.style.height = `${nextHeight}px`;
  textarea.style.overflowY =
    textarea.scrollHeight > DESCRIPTION_MAX_HEIGHT ? "auto" : "hidden";
}

function ModeButton({
  active,
  icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20",
        active
          ? "bg-white text-zinc-950 shadow-sm"
          : "text-zinc-500 hover:text-zinc-950",
      )}
    >
      {icon}
      {label}
    </button>
  );
}

function SubmitSuggestionButton({
  canSubmit,
  submitLabel,
  pendingSubmitLabel,
}: {
  canSubmit: boolean;
  submitLabel: string;
  pendingSubmitLabel: string;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={!canSubmit || pending}
      className="inline-flex h-10 items-center justify-center rounded-lg bg-zinc-950 px-5 text-sm font-semibold text-white transition hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/30 disabled:cursor-not-allowed disabled:bg-zinc-400"
    >
      {pending ? pendingSubmitLabel : submitLabel}
    </button>
  );
}

function FilesChanged({
  rows,
  hasChanges,
}: {
  rows: DiffRow[];
  hasChanges: boolean;
}) {
  return (
    <section className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200 bg-zinc-50 px-4 py-3">
        <div>
          <h2 className="inline-flex items-center gap-2 text-sm font-bold text-zinc-950">
            <IconFileDiff className="size-4" />
            Files changed
          </h2>
        </div>
      </div>

      {hasChanges ? (
        <div className="overflow-x-auto">
          <div className="min-w-[664px]">
            {rows.map((row, index) => (
              <DiffRowView
                key={`${row.kind}-${row.oldLine ?? "x"}-${row.newLine ?? "x"}-${index}`}
                row={row}
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="px-4 py-10 text-center text-sm font-medium text-zinc-500">
          No changes yet.
        </div>
      )}
    </section>
  );
}

function DiffRowView({ row }: { row: DiffRow }) {
  const rowClassName =
    row.kind === "remove"
      ? "bg-rose-50"
      : row.kind === "add"
        ? "bg-emerald-50"
        : "bg-white";
  const gutterClassName =
    row.kind === "remove"
      ? "bg-rose-100/80"
      : row.kind === "add"
        ? "bg-emerald-100/80"
        : "bg-white";
  const marker = row.kind === "remove" ? "-" : row.kind === "add" ? "+" : "";
  const markerColor =
    row.kind === "remove"
      ? "text-rose-700"
      : row.kind === "add"
        ? "text-emerald-700"
        : "text-transparent";

  return (
    <div
      className={cn(
        "grid grid-cols-[56px_56px_28px_minmax(0,1fr)]",
        rowClassName,
      )}
    >
      <div
        className={cn(
          "border-r border-zinc-200 px-3 py-1.5 text-right font-mono text-xs text-zinc-400",
          gutterClassName,
        )}
      >
        {row.oldLine ?? ""}
      </div>
      <div
        className={cn(
          "border-r border-zinc-200 px-3 py-1.5 text-right font-mono text-xs text-zinc-400",
          gutterClassName,
        )}
      >
        {row.newLine ?? ""}
      </div>
      <div
        className={cn("px-2 py-1.5 text-center font-mono text-xs", markerColor)}
      >
        {marker}
      </div>
      <pre className="overflow-hidden whitespace-pre-wrap px-1 py-1.5 font-mono text-xs leading-5 text-zinc-800">
        {row.content || " "}
      </pre>
    </div>
  );
}

function IconArrowLeft({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M19 12H5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M12 19l-7-7 7-7"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconEdit({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M12 20h9"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M16.5 3.5a2.12 2.12 0 113 3L7 19l-4 1 1-4L16.5 3.5z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconEye({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

function IconFileDiff({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M14 2v6h6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9 13h6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M12 10v6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M9 18h6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
