"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  startTransition,
  useActionState,
  useDeferredValue,
  useEffect,
  useEffectEvent,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { useFormStatus } from "react-dom";
import { submitPost } from "@/app/write/actions";
import {
  initialWriteActionState,
  type WriteActionState,
} from "@/app/write/action-state";
import { cn } from "@/shared/lib/cn";
import { formatSelection, type ToolbarAction } from "@/shared/lib/markdown";
import { MarkdownContent, MarkdownToolbar } from "@/shared/ui/markdown";
import { Footer, Header } from "@/widgets/chrome/ui";

type ComposerMode = "edit" | "preview";
type WriteViewMode = "create" | "edit";
type SaveReason = "auto" | "manual" | "restored" | "cleared";
type WriteAction = (
  prevState: WriteActionState,
  formData: FormData,
) => Promise<WriteActionState>;

export type WriteViewInitialValues = {
  title: string;
  description: string;
  topics: string[];
  content: string;
};

const DRAFT_STORAGE_KEY = "openlog.write.draft";
const EMPTY_WRITE_VALUES: WriteViewInitialValues = {
  title: "",
  description: "",
  topics: [],
  content: "",
};
const DESCRIPTION_MAX_LENGTH = 50;

export function WriteView({
  isLoggedIn,
  profileImageUrl,
  profileHref,
  mode: writeMode = "create",
  action = submitPost,
  initialValues = EMPTY_WRITE_VALUES,
  draftStorageKey = DRAFT_STORAGE_KEY,
  backHref = "/?tab=trending",
  backLabel = "Back to feed",
  submitLabel = "Publish",
  pendingSubmitLabel = "Publishing...",
}: {
  isLoggedIn: boolean;
  profileImageUrl?: string | null;
  profileHref?: string;
  mode?: WriteViewMode;
  action?: WriteAction;
  initialValues?: WriteViewInitialValues;
  draftStorageKey?: string;
  backHref?: string;
  backLabel?: string;
  submitLabel?: string;
  pendingSubmitLabel?: string;
}) {
  const router = useRouter();
  const [composerMode, setComposerMode] = useState<ComposerMode>("edit");
  const [title, setTitle] = useState(initialValues.title);
  const [description, setDescription] = useState(
    normalizeDescription(initialValues.description),
  );
  const [topicInput, setTopicInput] = useState("");
  const [topics, setTopics] = useState<string[]>(() =>
    normalizeTopics(initialValues.topics),
  );
  const [body, setBody] = useState(initialValues.content);
  const [statusMessage, setStatusMessage] = useState(
    defaultStatusMessage(writeMode),
  );
  const [hasRestoredDraft, setHasRestoredDraft] = useState(false);
  const [submitErrors, setSubmitErrors] = useState<WriteActionState["errors"]>(
    () => ({ ...initialWriteActionState.errors }),
  );
  const [isTitleFocused, setIsTitleFocused] = useState(false);
  const [titleCaretLeft, setTitleCaretLeft] = useState(0);
  const [isTitleCaretVisible, setIsTitleCaretVisible] = useState(false);
  const [actionState, formAction] = useActionState(
    action,
    initialWriteActionState,
  );
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);

  const deferredTitle = useDeferredValue(title);
  const deferredDescription = useDeferredValue(description);
  const deferredTopics = useDeferredValue(topics);
  const deferredBody = useDeferredValue(body);

  useEffect(() => {
    setSubmitErrors(actionState?.errors ?? {});
  }, [actionState]);

  useEffect(() => {
    if (!actionState.redirectTo) {
      return;
    }

    window.localStorage.removeItem(draftStorageKey);
    router.replace(actionState.redirectTo);
  }, [actionState.redirectTo, draftStorageKey, router]);

  function persistDraft(reason: SaveReason) {
    const trimmedTitle = title.trim();
    const trimmedDescription = description.trim();
    const trimmedBody = body.trim();

    if (
      !trimmedTitle &&
      !trimmedDescription &&
      !trimmedBody &&
      topics.length === 0
    ) {
      const hasStoredDraft = Boolean(
        window.localStorage.getItem(draftStorageKey),
      );
      window.localStorage.removeItem(draftStorageKey);
      setStatusMessage(
        hasStoredDraft
          ? statusLabel("cleared")
          : defaultStatusMessage(writeMode),
      );
      return;
    }

    const updatedAt = new Date().toISOString();
    window.localStorage.setItem(
      draftStorageKey,
      JSON.stringify({
        title,
        description,
        topics,
        body,
        updatedAt,
      }),
    );
    setStatusMessage(statusLabel(reason, updatedAt));
  }

  const persistDraftFromEffect = useEffectEvent(() => {
    persistDraft("auto");
  });

  useEffect(() => {
    const rawDraft = window.localStorage.getItem(draftStorageKey);
    if (!rawDraft) {
      setHasRestoredDraft(true);
      return;
    }

    try {
      const draft = JSON.parse(rawDraft) as Partial<{
        title: string;
        description: string;
        topics: string[];
        body: string;
        updatedAt: string;
      }>;

      setTitle(draft.title ?? "");
      setDescription(normalizeDescription(draft.description ?? ""));
      setTopics(normalizeTopics(draft.topics ?? []));
      setBody(draft.body ?? "");
      setStatusMessage(statusLabel("restored", draft.updatedAt));
    } catch {
      window.localStorage.removeItem(draftStorageKey);
      setStatusMessage("Corrupted local draft was discarded.");
    } finally {
      setHasRestoredDraft(true);
    }
  }, [draftStorageKey]);

  useEffect(() => {
    if (!hasRestoredDraft) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      persistDraftFromEffect();
    }, 900);

    return () => window.clearTimeout(timeoutId);
  }, [body, description, hasRestoredDraft, title, topics]);

  useEffect(() => {
    if (!isTitleFocused) {
      return;
    }

    syncTitleCaret();
  }, [isTitleFocused, title]);

  function handleModeChange(nextMode: ComposerMode) {
    startTransition(() => {
      setComposerMode(nextMode);
    });
  }

  function handleSaveDraft() {
    persistDraft("manual");
  }

  function clearError(name: keyof WriteActionState["errors"]) {
    setSubmitErrors((current) => ({
      ...current,
      [name]: undefined,
      form: undefined,
    }));
  }

  function handleTitleChange(nextValue: string) {
    setTitle(nextValue);
    clearError("title");
  }

  function syncTitleCaret(input = titleInputRef.current) {
    if (!input) {
      return;
    }

    const selectionStart = input.selectionStart ?? input.value.length;
    const selectionEnd = input.selectionEnd ?? selectionStart;
    setIsTitleCaretVisible(
      document.activeElement === input && selectionStart === selectionEnd,
    );

    const textBeforeCaret = input.value.slice(0, selectionStart);
    if (!textBeforeCaret) {
      setTitleCaretLeft(0);
      return;
    }

    const styles = window.getComputedStyle(input);
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    if (!context) {
      return;
    }

    context.font = [
      styles.fontStyle,
      styles.fontVariant,
      styles.fontWeight,
      styles.fontSize,
      styles.fontFamily,
    ].join(" ");

    const metrics = context.measureText(textBeforeCaret);
    const textRight = Math.max(metrics.width, metrics.actualBoundingBoxRight);
    setTitleCaretLeft(textRight - input.scrollLeft + 1);
  }

  function scheduleTitleCaretSync(input = titleInputRef.current) {
    window.requestAnimationFrame(() => syncTitleCaret(input));
  }

  function handleDescriptionChange(nextValue: string) {
    setDescription(normalizeDescription(nextValue));
    clearError("description");
  }

  function handleBodyChange(nextValue: string) {
    setBody(nextValue);
    clearError("content");
  }

  function handleTopicInputChange(nextValue: string) {
    setTopicInput(nextValue);
    clearError("form");
  }

  function addTopic(rawValue: string) {
    const nextTopic = normalizeTopic(rawValue);
    if (!nextTopic) {
      setTopicInput("");
      return;
    }

    setTopics((current) =>
      current.includes(nextTopic) ? current : [...current, nextTopic],
    );
    setTopicInput("");
  }

  function removeTopic(targetTopic: string) {
    setTopics((current) => current.filter((topic) => topic !== targetTopic));
  }

  function handleTopicKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.nativeEvent.isComposing) {
      return;
    }

    if (event.key !== "Enter") {
      return;
    }

    event.preventDefault();
    addTopic(topicInput);
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
    clearError("content");
    handleModeChange("edit");

    window.requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(nextSelectionStart, nextSelectionEnd);
    });
  }

  return (
    <div className="min-h-dvh bg-zinc-50 text-zinc-950">
      <Header
        isLoggedIn={isLoggedIn}
        profileImageUrl={profileImageUrl}
        profileHref={profileHref}
        showWriteAction={false}
      />

      <main className="mx-auto w-full max-w-[1083px] px-4 pb-16 pt-6 sm:px-8">
        <form action={formAction} className="flex flex-col gap-6">
          {topics.map((topic) => (
            <input key={topic} type="hidden" name="topics" value={topic} />
          ))}
          {composerMode === "preview" ? (
            <input type="hidden" name="content" value={body} />
          ) : null}

          <div className="flex flex-col gap-6 border-b border-zinc-200/80 pb-3 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0 flex-1">
              <Link
                href={backHref}
                className="inline-flex items-center gap-2 rounded-full px-1 py-1 text-sm font-medium text-zinc-500 transition hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20"
              >
                <IconArrowLeft className="size-4" />
                {backLabel}
              </Link>

              <div className="mt-3 space-y-1">
                <label className="relative block">
                  <span className="sr-only">Title</span>
                  <input
                    ref={titleInputRef}
                    name="title"
                    value={title}
                    onChange={(event) => {
                      handleTitleChange(event.target.value);
                      scheduleTitleCaretSync(event.currentTarget);
                    }}
                    onFocus={(event) => {
                      setIsTitleFocused(true);
                      scheduleTitleCaretSync(event.currentTarget);
                    }}
                    onBlur={() => {
                      setIsTitleFocused(false);
                      setIsTitleCaretVisible(false);
                    }}
                    onClick={(event) =>
                      scheduleTitleCaretSync(event.currentTarget)
                    }
                    onKeyUp={(event) =>
                      scheduleTitleCaretSync(event.currentTarget)
                    }
                    onSelect={(event) =>
                      scheduleTitleCaretSync(event.currentTarget)
                    }
                    placeholder="add title"
                    className={cn(
                      "w-full bg-transparent text-[36px] font-bold leading-tight tracking-normal text-zinc-950 caret-transparent outline-none placeholder:text-zinc-400 sm:text-[44px] [font-family:Georgia,serif]",
                      submitErrors.title ? "placeholder:text-rose-300" : "",
                    )}
                  />
                  {isTitleFocused && isTitleCaretVisible ? (
                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute left-0 top-0 h-[1.18em] w-px bg-zinc-950 text-[36px] sm:text-[44px] [animation:openlog-caret-blink_1s_steps(1,end)_infinite]"
                      style={{ transform: `translateX(${titleCaretLeft}px)` }}
                    />
                  ) : null}
                  {submitErrors.title ? (
                    <p className="mt-2 text-sm text-rose-600">
                      {submitErrors.title}
                    </p>
                  ) : null}
                </label>

                <label className="block">
                  <span className="sr-only">Description</span>
                  <input
                    name="description"
                    value={description}
                    onChange={(event) =>
                      handleDescriptionChange(event.target.value)
                    }
                    placeholder="add summary"
                    maxLength={DESCRIPTION_MAX_LENGTH}
                    className={cn(
                      "h-7 w-full bg-transparent text-[16px] leading-7 tracking-normal text-zinc-700 outline-none placeholder:text-zinc-400",
                      submitErrors.description
                        ? "placeholder:text-rose-300"
                        : "",
                    )}
                  />
                  {submitErrors.description ? (
                    <p className="mt-1 text-sm text-rose-600">
                      {submitErrors.description}
                    </p>
                  ) : null}
                </label>
              </div>
            </div>

            <div className="flex flex-col gap-3 self-stretch sm:self-auto">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="rounded-xl bg-zinc-100 p-1">
                  <div className="flex items-center gap-1">
                    <ModeButton
                      active={composerMode === "edit"}
                      icon={<IconEdit className="size-4" />}
                      label="Edit"
                      onClick={() => handleModeChange("edit")}
                    />
                    <ModeButton
                      active={composerMode === "preview"}
                      icon={
                        <Image
                          src="/Eye.svg"
                          alt=""
                          width={16}
                          height={16}
                          aria-hidden="true"
                          className="size-4"
                        />
                      }
                      label="Preview"
                      onClick={() => handleModeChange("preview")}
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleSaveDraft}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#00a63e] px-5 text-sm font-semibold text-white shadow-[0_1px_3px_rgba(0,0,0,0.12),0_1px_2px_rgba(0,0,0,0.08)] transition hover:bg-[#009338] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00a63e]/30"
                >
                  <IconSave className="size-4" />
                  Save Draft
                </button>

                <PublishButton
                  label={submitLabel}
                  pendingLabel={pendingSubmitLabel}
                />
              </div>

              <p
                className="text-xs font-medium text-zinc-400 sm:text-right"
                aria-live="polite"
              >
                {statusMessage}
              </p>

              {submitErrors.form ? (
                <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {submitErrors.form}
                </p>
              ) : null}
            </div>
          </div>

          <div>
            <section className="overflow-hidden rounded-[8px] border border-zinc-200 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.08),0_1px_2px_rgba(0,0,0,0.06)]">
              <div className="border-b border-zinc-200 bg-zinc-50 px-4 py-2">
                <MarkdownToolbar
                  disabled={composerMode === "preview"}
                  onAction={insertFormatting}
                />
              </div>

              <div className="min-h-[520px] bg-white">
                {composerMode === "edit" ? (
                  <textarea
                    ref={editorRef}
                    name="content"
                    value={body}
                    onChange={(event) => handleBodyChange(event.target.value)}
                    placeholder="Share your ideas, code, and insights…"
                    className="min-h-[520px] w-full resize-none px-6 py-6 text-[16px] leading-8 tracking-normal text-zinc-900 outline-none placeholder:text-zinc-400"
                  />
                ) : (
                  <MarkdownPreview
                    title={deferredTitle}
                    description={deferredDescription}
                    topics={deferredTopics}
                    body={deferredBody}
                  />
                )}
              </div>

              <div className="border-t border-zinc-200 px-6 py-3">
                <div className="flex min-h-8 flex-wrap items-center gap-2">
                  {topics.map((topic) => (
                    <TopicChip
                      key={topic}
                      topic={topic}
                      onRemove={() => removeTopic(topic)}
                    />
                  ))}
                  <label className="min-w-[140px] flex-1">
                    <span className="sr-only">Topics</span>
                    <input
                      value={topicInput}
                      onChange={(event) =>
                        handleTopicInputChange(event.target.value)
                      }
                      onKeyDown={handleTopicKeyDown}
                      placeholder="add tags"
                      className="h-7 w-full bg-transparent text-[14px] tracking-normal text-zinc-700 outline-none placeholder:text-zinc-400"
                    />
                  </label>
                </div>
              </div>

              {submitErrors.content ? (
                <div className="border-t border-rose-200 bg-rose-50 px-6 py-3 text-sm text-rose-700">
                  {submitErrors.content}
                </div>
              ) : null}
            </section>
          </div>
        </form>
      </main>

      <Footer />
    </div>
  );
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
        "inline-flex h-9 items-center gap-2 rounded-[8px] px-4 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20",
        active
          ? "bg-white text-zinc-950 shadow-[0_1px_3px_rgba(0,0,0,0.08),0_1px_2px_rgba(0,0,0,0.06)]"
          : "text-zinc-500 hover:text-zinc-950",
      )}
    >
      {icon}
      {label}
    </button>
  );
}

function PublishButton({
  label,
  pendingLabel,
}: {
  label: string;
  pendingLabel: string;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-zinc-900 bg-zinc-950 px-5 text-sm font-semibold text-white shadow-[0_1px_3px_rgba(0,0,0,0.18),0_1px_2px_rgba(0,0,0,0.1)] transition hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/25 disabled:cursor-not-allowed disabled:bg-zinc-400"
    >
      {pending ? pendingLabel : label}
    </button>
  );
}

function TopicChip({
  topic,
  onRemove,
}: {
  topic: string;
  onRemove: () => void;
}) {
  return (
    <span className="inline-flex h-7 items-center gap-1.5 rounded-md bg-zinc-100 px-2 text-[12px] font-medium tracking-normal text-zinc-600">
      <span>{topic}</span>
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove ${topic}`}
        className="grid size-4 place-items-center rounded-full text-zinc-400 transition hover:bg-zinc-200 hover:text-zinc-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20"
      >
        <IconClose className="size-3" />
      </button>
    </span>
  );
}

function MarkdownPreview({
  title,
  description,
  topics,
  body,
}: {
  title: string;
  description: string;
  topics: string[];
  body: string;
}) {
  const hasContent =
    title.trim() || description.trim() || body.trim() || topics.length > 0;

  if (!hasContent) {
    return (
      <div className="flex min-h-130 items-center justify-center px-6 py-10">
        <div className="max-w-90 text-center">
          <p className="text-sm font-medium text-zinc-500">Preview is empty</p>
          <p className="mt-2 text-sm leading-6 text-zinc-400">
            Add a title, description, topics, or markdown content to see the
            article preview here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <article className="min-h-130 px-6 py-8">
      <header className="border-b border-zinc-200 pb-8">
        <p className="text-[11px] font-semibold uppercase tracking-normal text-zinc-400">
          Live Preview
        </p>
        <h2 className="mt-4 font-[Georgia,serif] text-[34px] font-bold leading-tight tracking-normal text-zinc-950">
          {title.trim() || "Untitled story"}
        </h2>
        {description.trim() ? (
          <p className="mt-4 max-w-[60ch] text-[17px] leading-8 text-zinc-600">
            {description}
          </p>
        ) : null}
        {topics.length > 0 ? (
          <div className="mt-5 flex flex-wrap gap-2">
            {topics.map((topic) => (
              <span
                key={topic}
                className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-[11px] font-medium uppercase tracking-normal text-zinc-600"
              >
                {topic}
              </span>
            ))}
          </div>
        ) : null}
      </header>

      <div className="mt-8 space-y-6 text-[16px] leading-8 text-zinc-700">
        <MarkdownContent
          markdown={body}
          emptyFallback={
            <p className="text-zinc-400">
              Your markdown body will render here once you start writing.
            </p>
          }
        />
      </div>
    </article>
  );
}

function normalizeTopic(value: string) {
  return value.trim().toLowerCase();
}

function normalizeDescription(value: string) {
  return value.slice(0, DESCRIPTION_MAX_LENGTH);
}

function normalizeTopics(values: string[]) {
  return values
    .map(normalizeTopic)
    .filter(
      (value, index, list) => Boolean(value) && list.indexOf(value) === index,
    );
}

function defaultStatusMessage(mode: WriteViewMode) {
  return mode === "edit"
    ? "Edits save locally in this browser."
    : "Drafts save locally in this browser.";
}

function statusLabel(reason: SaveReason, isoDate?: string) {
  switch (reason) {
    case "manual":
      return `Saved locally ${formatTimeLabel(isoDate)}`;
    case "auto":
      return `Autosaved ${formatTimeLabel(isoDate)}`;
    case "restored":
      return isoDate
        ? `Restored draft from ${formatTimeLabel(isoDate)}`
        : "Restored your last local draft.";
    case "cleared":
      return "Cleared empty local draft.";
  }
}

function formatTimeLabel(isoDate?: string) {
  if (!isoDate) {
    return "just now";
  }

  const parsed = new Date(isoDate);
  if (Number.isNaN(parsed.getTime())) {
    return "just now";
  }

  return parsed.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
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
        d="M15 18l-6-6 6-6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9 12h10"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
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

function IconSave({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M17 21v-8H7v8"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M7 3v5h8"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconClose({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M4 4l8 8"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M12 4L4 12"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}
