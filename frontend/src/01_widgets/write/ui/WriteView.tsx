"use client";

import Image from "next/image";
import Link from "next/link";
import {
  startTransition,
  useDeferredValue,
  useEffect,
  useEffectEvent,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { cn } from "@/shared/lib/cn";
import { MarkdownContent, MarkdownToolbar } from "@/shared/ui/markdown";
import {
  formatSelection,
  type ToolbarAction,
} from "@/shared/lib/markdown";
import { Footer, Header } from "@/widgets/chrome/ui";

type ComposerMode = "edit" | "preview";
type SaveReason = "auto" | "manual" | "restored" | "cleared";

const DRAFT_STORAGE_KEY = "openlog.write.draft";

const writingGuidelines = [
  "Open with the problem, then state the insight in the first two paragraphs.",
  "Keep each section anchored to one technical idea or experiment.",
  "Verify technical accuracy and add references before publishing.",
  "Respect the original author's tone when drafting a collaborative piece.",
] as const;

const markdownCheatsheet = [
  { syntax: "**Bold**", label: "Bold" },
  { syntax: "*Italic*", label: "Italic" },
  { syntax: "[Link](url)", label: "Link" },
  { syntax: "`Code`", label: "Inline code" },
  { syntax: "```\\nCode block\\n```", label: "Code block" },
  { syntax: "# Heading", label: "H1" },
] as const;

export function WriteView({ isLoggedIn }: { isLoggedIn: boolean }) {
  const [mode, setMode] = useState<ComposerMode>("edit");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [body, setBody] = useState("");
  const [statusMessage, setStatusMessage] = useState(
    "Drafts save locally in this browser.",
  );
  const [hasRestoredDraft, setHasRestoredDraft] = useState(false);
  const editorRef = useRef<HTMLTextAreaElement>(null);

  const deferredTitle = useDeferredValue(title);
  const deferredDescription = useDeferredValue(description);
  const deferredBody = useDeferredValue(body);
  const wordCount = countWords(
    `${deferredTitle} ${deferredDescription} ${deferredBody}`,
  );
  const readTimeMinutes =
    wordCount === 0 ? 0 : Math.max(1, Math.ceil(wordCount / 220));

  function persistDraft(reason: SaveReason) {
    const trimmedTitle = title.trim();
    const trimmedDescription = description.trim();
    const trimmedBody = body.trim();

    if (!trimmedTitle && !trimmedDescription && !trimmedBody) {
      const hasStoredDraft = Boolean(
        window.localStorage.getItem(DRAFT_STORAGE_KEY),
      );
      window.localStorage.removeItem(DRAFT_STORAGE_KEY);
      setStatusMessage(
        hasStoredDraft
          ? statusLabel("cleared")
          : "Drafts save locally in this browser.",
      );
      return;
    }

    const updatedAt = new Date().toISOString();
    window.localStorage.setItem(
      DRAFT_STORAGE_KEY,
      JSON.stringify({
        title,
        description,
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
    const rawDraft = window.localStorage.getItem(DRAFT_STORAGE_KEY);
    if (!rawDraft) {
      setHasRestoredDraft(true);
      return;
    }

    try {
      const draft = JSON.parse(rawDraft) as Partial<{
        title: string;
        description: string;
        body: string;
        updatedAt: string;
      }>;

      setTitle(draft.title ?? "");
      setDescription(draft.description ?? "");
      setBody(draft.body ?? "");
      setStatusMessage(statusLabel("restored", draft.updatedAt));
    } catch {
      window.localStorage.removeItem(DRAFT_STORAGE_KEY);
      setStatusMessage("Corrupted local draft was discarded.");
    } finally {
      setHasRestoredDraft(true);
    }
  }, []);

  useEffect(() => {
    if (!hasRestoredDraft) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      persistDraftFromEffect();
    }, 900);

    return () => window.clearTimeout(timeoutId);
  }, [body, description, hasRestoredDraft, title]);

  function handleModeChange(nextMode: ComposerMode) {
    startTransition(() => {
      setMode(nextMode);
    });
  }

  function handleSaveDraft() {
    persistDraft("manual");
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

  return (
    <div className="min-h-dvh bg-zinc-50 text-zinc-950">
      <Header isLoggedIn={isLoggedIn} />

      <main className="mx-auto w-full max-w-[1083px] px-4 pb-16 pt-6 sm:px-8">
        <section className="flex flex-col gap-6">
          <div className="flex flex-col gap-6 border-b border-zinc-200/80 pb-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <Link
                href="/?tab=trending"
                className="inline-flex items-center gap-2 rounded-full px-1 py-1 text-sm font-medium text-zinc-500 transition hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20"
              >
                <IconArrowLeft className="size-4" />
                Back to feed
              </Link>

              <div className="mt-3">
                <h1 className="[font-family:Georgia,serif] text-[34px] font-bold leading-tight tracking-[-0.03em] text-zinc-950 sm:text-[40px]">
                  New Story
                </h1>

                <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-zinc-500">
                  <span>For OpenLog knowledge feed</span>
                  <span className="text-zinc-300">|</span>
                  <span className="rounded-md bg-zinc-100 px-2 py-0.5 text-[12px] [font-family:Menlo,Monaco,monospace] text-zinc-600">
                    draft
                  </span>
                </div>

                <p className="mt-3 text-sm text-zinc-500">
                  {wordCount} words
                  <span className="mx-2 text-zinc-300">|</span>
                  {readTimeMinutes} min read
                  <span className="mx-2 text-zinc-300">|</span>
                  {statusMessage}
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3 self-stretch sm:self-auto">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="rounded-xl bg-zinc-100 p-1">
                  <div className="flex items-center gap-1">
                    <ModeButton
                      active={mode === "edit"}
                      icon={<IconEdit className="size-4" />}
                      label="Edit"
                      onClick={() => handleModeChange("edit")}
                    />
                    <ModeButton
                      active={mode === "preview"}
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
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_240px]">
            <div className="space-y-6">
              <section className="rounded-[14px] border border-zinc-200 bg-white px-6 py-6 shadow-[0_1px_3px_rgba(0,0,0,0.08),0_1px_2px_rgba(0,0,0,0.06)]">
                <div className="space-y-4">
                  <label className="block">
                    <span className="text-sm font-medium text-zinc-700">
                      Title
                    </span>
                    <input
                      value={title}
                      onChange={(event) => setTitle(event.target.value)}
                      placeholder="Summarize your idea with a clear title"
                      className="mt-1 h-[42px] w-full rounded-[10px] border border-zinc-200 px-4 text-[16px] tracking-[-0.02em] text-zinc-950 outline-none transition placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-4 focus:ring-zinc-900/5"
                    />
                  </label>

                  <label className="block">
                    <span className="text-sm font-medium text-zinc-700">
                      Description
                    </span>
                    <textarea
                      value={description}
                      onChange={(event) => setDescription(event.target.value)}
                      placeholder="Describe why this story matters and what readers will learn..."
                      rows={4}
                      className="mt-1 w-full rounded-[10px] border border-zinc-200 px-4 py-3 text-[16px] leading-6 tracking-[-0.02em] text-zinc-950 outline-none transition placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-4 focus:ring-zinc-900/5"
                    />
                  </label>
                </div>
              </section>

              <section className="overflow-hidden rounded-[14px] border border-zinc-200 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.08),0_1px_2px_rgba(0,0,0,0.06)]">
                <div className="border-b border-zinc-200 bg-zinc-50 px-4 py-2">
                  <MarkdownToolbar
                    disabled={mode === "preview"}
                    onAction={insertFormatting}
                  />
                </div>

                <div className="min-h-[520px] bg-white">
                  {mode === "edit" ? (
                    <textarea
                      ref={editorRef}
                      value={body}
                      onChange={(event) => setBody(event.target.value)}
                      placeholder="Start typing..."
                      className="min-h-[520px] w-full resize-none px-6 py-6 text-[16px] leading-8 tracking-[-0.01em] text-zinc-900 outline-none placeholder:text-zinc-400"
                    />
                  ) : (
                    <MarkdownPreview
                      title={deferredTitle}
                      description={deferredDescription}
                      body={deferredBody}
                    />
                  )}
                </div>
              </section>
            </div>

            <aside className="space-y-4">
              <section className="rounded-[14px] border border-[#d8e3ff] bg-[linear-gradient(180deg,#eef4ff_0%,#f7faff_100%)] p-5 shadow-sm">
                <h2 className="text-sm font-bold uppercase tracking-[0.14em] text-[#1f3f9f]">
                  Writing Guidelines
                </h2>
                <ul className="mt-4 space-y-3 text-sm leading-5 text-[rgba(25,60,184,0.84)]">
                  {writingGuidelines.map((item) => (
                    <li key={item} className="flex gap-2">
                      <span className="font-bold">-</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </section>

              <section className="rounded-[14px] border border-zinc-200 bg-zinc-50 p-5">
                <h2 className="text-sm font-bold uppercase tracking-[0.14em] text-zinc-700">
                  Markdown Cheatsheet
                </h2>
                <div className="mt-4 space-y-3">
                  {markdownCheatsheet.map((item) => (
                    <div
                      key={item.syntax}
                      className="flex items-center justify-between gap-4"
                    >
                      <code className="[font-family:Menlo,Monaco,monospace] text-[12px] text-zinc-600">
                        {item.syntax}
                      </code>
                      <span className="text-[12px] text-zinc-400">
                        {item.label}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            </aside>
          </div>
        </section>
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

function MarkdownPreview({
  title,
  description,
  body,
}: {
  title: string;
  description: string;
  body: string;
}) {
  const hasContent = title.trim() || description.trim() || body.trim();

  if (!hasContent) {
    return (
      <div className="flex min-h-[520px] items-center justify-center px-6 py-10">
        <div className="max-w-[360px] text-center">
          <p className="text-sm font-medium text-zinc-500">Preview is empty</p>
          <p className="mt-2 text-sm leading-6 text-zinc-400">
            Add a title, description, or markdown content to see the article
            preview here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <article className="min-h-[520px] px-6 py-8">
      <header className="border-b border-zinc-200 pb-8">
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-zinc-400">
          Live Preview
        </p>
        <h2 className="mt-4 [font-family:Georgia,serif] text-[34px] font-bold leading-tight tracking-[-0.03em] text-zinc-950">
          {title.trim() || "Untitled story"}
        </h2>
        {description.trim() ? (
          <p className="mt-4 max-w-[60ch] text-[17px] leading-8 text-zinc-600">
            {description}
          </p>
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

function countWords(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return 0;
  }

  return trimmed.split(/\s+/).length;
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
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
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
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
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
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
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
