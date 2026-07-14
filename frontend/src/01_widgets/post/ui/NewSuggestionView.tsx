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
import {
  formatSelection,
  getImageFallbackText,
  type ToolbarAction,
  type ToolbarActionPayload,
} from "@/shared/lib/markdown";
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

  function insertFormatting(
    action: ToolbarAction,
    payload?: ToolbarActionPayload,
  ) {
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
      { fallbackText: getImageFallbackText(payload) },
    );

    setBody(nextValue);
    handleModeChange("edit");

    window.requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(nextSelectionStart, nextSelectionEnd);
    });
  }

  function insertDescriptionFormatting(
    action: ToolbarAction,
    payload?: ToolbarActionPayload,
  ) {
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
      { fallbackText: getImageFallbackText(payload) },
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
            <h1 className="mt-3 text-[32px] font-semibold leading-[1.15] tracking-tight text-zinc-950">
              {resolvedHeading}
            </h1>
          </header>

          <div className="mt-8 space-y-8">
            <section className="space-y-3">
              <label
                htmlFor="suggestion-title"
                className="text-[13.5px] font-semibold tracking-tight text-zinc-600"
              >
                Suggestion title
              </label>
              <input
                id="suggestion-title"
                name="title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="add title"
                className="h-11 w-full border-0 border-b border-zinc-200 bg-transparent px-0 text-[16px] font-medium text-zinc-950 outline-none transition placeholder:text-zinc-400 focus:border-zinc-900"
              />
              {actionState.errors.title ? (
                <p className="text-[12.5px] font-medium text-rose-600">
                  {actionState.errors.title}
                </p>
              ) : null}
            </section>

            <section className="space-y-3">
              <div>
                <label
                  htmlFor="suggestion-description"
                  className="text-[13.5px] font-semibold tracking-tight text-zinc-600"
                >
                  Description
                </label>
              </div>

              <div>
                <div
                  role="tablist"
                  aria-label="Description editor"
                  className="flex items-end gap-1 border-b border-zinc-200"
                >
                  <TabButton
                    active={descriptionMode === "edit"}
                    onClick={() => handleDescriptionModeChange("edit")}
                  >
                    Write
                  </TabButton>
                  <TabButton
                    active={descriptionMode === "preview"}
                    onClick={() => handleDescriptionModeChange("preview")}
                  >
                    Preview
                  </TabButton>
                </div>

                <div className="mt-3">
                  <MarkdownToolbar
                    disabled={descriptionMode === "preview"}
                    onAction={insertDescriptionFormatting}
                  />
                </div>

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
                    className="openlog-scroll mt-3 min-h-[220px] w-full resize-none overflow-hidden border-0 bg-transparent py-2 font-mono text-[13.5px] leading-7 text-zinc-800 outline-none transition placeholder:text-zinc-400"
                  />
                ) : (
                  <article className="mt-3 min-h-[220px] py-2 text-[15px] leading-7 text-zinc-800">
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
              {actionState.errors.description ? (
                <p className="text-[12.5px] font-medium text-rose-600">
                  {actionState.errors.description}
                </p>
              ) : null}
            </section>

            <section>
              <div
                role="tablist"
                aria-label="Content editor"
                className="flex items-end gap-1 border-b border-zinc-200"
              >
                <TabButton
                  active={composerMode === "edit"}
                  onClick={() => handleModeChange("edit")}
                >
                  Write
                </TabButton>
                <TabButton
                  active={composerMode === "preview"}
                  onClick={() => handleModeChange("preview")}
                >
                  Preview
                </TabButton>
              </div>

              <div className="mt-3">
                <MarkdownToolbar
                  disabled={composerMode === "preview"}
                  onAction={insertFormatting}
                />
              </div>

              {composerMode === "edit" ? (
                <textarea
                  ref={editorRef}
                  name="content"
                  value={body}
                  onChange={(event) => setBody(event.target.value)}
                  className="openlog-scroll mt-3 min-h-[520px] w-full resize-none overflow-y-auto border-0 bg-transparent py-2 text-[16px] leading-8 tracking-normal text-zinc-900 outline-none placeholder:text-zinc-400"
                />
              ) : (
                <article className="mt-3 min-h-[520px] py-2 text-[15px] leading-8 text-zinc-800">
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
            </section>

            <FilesChanged rows={diffRows} hasChanges={hasChanges} />

            {actionState.errors.content ? (
              <p className="text-[12.5px] font-medium text-rose-600">
                {actionState.errors.content}
              </p>
            ) : null}

            {actionState.errors.form ? (
              <p className="text-[12.5px] font-medium text-rose-600">
                {actionState.errors.form}
              </p>
            ) : null}

            <div className="flex flex-col-reverse gap-3 border-t border-zinc-200 pt-6 sm:flex-row sm:items-center sm:justify-between">
              <Link
                href={articleHref}
                className="cursor-pointer text-[13px] font-medium text-zinc-500 transition hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20"
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

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        "relative h-9 cursor-pointer px-2.5 text-[13px] font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20",
        active ? "text-zinc-950" : "text-zinc-500 hover:text-zinc-800",
      )}
    >
      {children}
      {active ? (
        <span className="absolute inset-x-2 -bottom-px h-0.5 bg-zinc-950" />
      ) : null}
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
      className={cn(
        "cursor-pointer text-[13px] font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20",
        !canSubmit || pending
          ? "cursor-not-allowed text-zinc-400"
          : "text-zinc-950 hover:text-zinc-700",
      )}
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
    <section>
      <div className="border-b border-zinc-200 pb-3">
        <h2 className="inline-flex items-center gap-2 text-sm font-bold text-zinc-950">
          <IconFileDiff className="size-4" />
          Files changed
        </h2>
      </div>

      {hasChanges ? (
        <div className="openlog-scroll overflow-x-auto">
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
        <div className="py-10 text-center text-sm font-medium text-zinc-500">
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
