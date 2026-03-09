"use client";

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
import { OpenLogFooter, OpenLogHeader, cn } from "./OpenLogChrome";

type ComposerMode = "edit" | "preview";
type SaveReason = "auto" | "manual" | "restored" | "cleared";

type MarkdownBlock =
  | { type: "heading"; level: 1 | 2 | 3; text: string }
  | { type: "paragraph"; text: string }
  | { type: "quote"; lines: string[] }
  | { type: "unordered-list"; items: string[] }
  | { type: "ordered-list"; items: string[] }
  | { type: "code"; language: string; code: string };

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
  { syntax: "`Code`", label: "Code" },
  { syntax: "# Heading", label: "H1" },
] as const;

export function OpenLogWritePage() {
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
      <OpenLogHeader />

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
                      icon={<IconEye className="size-4" />}
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
                <div className="flex flex-wrap items-center gap-2 border-b border-zinc-200 bg-zinc-50 px-4 py-2">
                  <ToolbarButton
                    label="Bold"
                    active={false}
                    disabled={mode === "preview"}
                    onClick={() => insertFormatting("bold")}
                  >
                    <span className="text-[15px] font-bold">B</span>
                  </ToolbarButton>
                  <ToolbarButton
                    label="Italic"
                    active={false}
                    disabled={mode === "preview"}
                    onClick={() => insertFormatting("italic")}
                  >
                    <span className="text-[15px] italic">I</span>
                  </ToolbarButton>
                  <ToolbarDivider />
                  <ToolbarButton
                    label="Link"
                    active={false}
                    disabled={mode === "preview"}
                    onClick={() => insertFormatting("link")}
                  >
                    <IconLink className="size-4" />
                  </ToolbarButton>
                  <ToolbarButton
                    label="Code"
                    active={false}
                    disabled={mode === "preview"}
                    onClick={() => insertFormatting("code")}
                  >
                    <span className="text-[12px] font-semibold">&lt;/&gt;</span>
                  </ToolbarButton>
                  <ToolbarButton
                    label="Quote"
                    active={false}
                    disabled={mode === "preview"}
                    onClick={() => insertFormatting("quote")}
                  >
                    <IconQuote className="size-4" />
                  </ToolbarButton>
                  <ToolbarDivider />
                  <ToolbarButton
                    label="Bulleted list"
                    active={false}
                    disabled={mode === "preview"}
                    onClick={() => insertFormatting("unordered-list")}
                  >
                    <IconList className="size-4" />
                  </ToolbarButton>
                  <ToolbarButton
                    label="Numbered list"
                    active={false}
                    disabled={mode === "preview"}
                    onClick={() => insertFormatting("ordered-list")}
                  >
                    <IconOrderedList className="size-4" />
                  </ToolbarButton>
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

      <OpenLogFooter />
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

function ToolbarButton({
  children,
  label,
  disabled,
  active,
  onClick,
}: {
  children: ReactNode;
  label: string;
  disabled: boolean;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "inline-flex size-8 items-center justify-center rounded-md text-zinc-500 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20",
        disabled
          ? "cursor-not-allowed opacity-40"
          : active
            ? "bg-white text-zinc-950"
            : "hover:bg-white hover:text-zinc-950",
      )}
    >
      {children}
    </button>
  );
}

function ToolbarDivider() {
  return <span className="h-4 w-px bg-zinc-300" aria-hidden="true" />;
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
  const blocks = parseMarkdown(body);
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
        {blocks.length > 0 ? (
          blocks.map((block, index) => {
            const key = `${block.type}-${index}`;

            switch (block.type) {
              case "heading": {
                const className =
                  block.level === 1
                    ? "text-[32px]"
                    : block.level === 2
                      ? "text-[26px]"
                      : "text-[20px]";

                return (
                  <h3
                    key={key}
                    className={cn(
                      "[font-family:Georgia,serif] font-bold leading-tight tracking-[-0.03em] text-zinc-950",
                      className,
                    )}
                  >
                    {renderInlineContent(block.text, key)}
                  </h3>
                );
              }
              case "paragraph":
                return (
                  <p key={key} className="max-w-[66ch]">
                    {renderInlineContent(block.text, key)}
                  </p>
                );
              case "quote":
                return (
                  <blockquote
                    key={key}
                    className="border-l-4 border-zinc-200 pl-5 text-zinc-600"
                  >
                    <div className="space-y-3">
                      {block.lines.map((line, lineIndex) => (
                        <p key={`${key}-${lineIndex}`}>
                          {renderInlineContent(line, `${key}-${lineIndex}`)}
                        </p>
                      ))}
                    </div>
                  </blockquote>
                );
              case "unordered-list":
                return (
                  <ul key={key} className="list-disc space-y-2 pl-6">
                    {block.items.map((item, itemIndex) => (
                      <li key={`${key}-${itemIndex}`}>
                        {renderInlineContent(item, `${key}-${itemIndex}`)}
                      </li>
                    ))}
                  </ul>
                );
              case "ordered-list":
                return (
                  <ol key={key} className="list-decimal space-y-2 pl-6">
                    {block.items.map((item, itemIndex) => (
                      <li key={`${key}-${itemIndex}`}>
                        {renderInlineContent(item, `${key}-${itemIndex}`)}
                      </li>
                    ))}
                  </ol>
                );
              case "code":
                return (
                  <div
                    key={key}
                    className="overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-950 text-zinc-100"
                  >
                    <div className="border-b border-white/10 px-4 py-2 text-[11px] uppercase tracking-[0.22em] text-zinc-400">
                      {block.language || "code"}
                    </div>
                    <pre className="overflow-x-auto p-4 text-[13px] leading-6">
                      <code>{block.code}</code>
                    </pre>
                  </div>
                );
            }
          })
        ) : (
          <p className="text-zinc-400">
            Your markdown body will render here once you start writing.
          </p>
        )}
      </div>
    </article>
  );
}

type ToolbarAction =
  | "bold"
  | "italic"
  | "link"
  | "code"
  | "quote"
  | "unordered-list"
  | "ordered-list";

function formatSelection(
  action: ToolbarAction,
  source: string,
  selectedText: string,
  selectionStart: number,
  selectionEnd: number,
) {
  const fallbackSelection = selectedText || placeholderForAction(action);
  let replacement = fallbackSelection;
  let nextSelectionStart = selectionStart;
  let nextSelectionEnd = selectionEnd;

  switch (action) {
    case "bold":
      replacement = `**${fallbackSelection}**`;
      nextSelectionStart = selectionStart + 2;
      nextSelectionEnd = nextSelectionStart + fallbackSelection.length;
      break;
    case "italic":
      replacement = `*${fallbackSelection}*`;
      nextSelectionStart = selectionStart + 1;
      nextSelectionEnd = nextSelectionStart + fallbackSelection.length;
      break;
    case "link":
      replacement = `[${fallbackSelection}](https://example.com)`;
      nextSelectionStart = selectionStart + 1;
      nextSelectionEnd = nextSelectionStart + fallbackSelection.length;
      break;
    case "code":
      replacement = `\`${fallbackSelection}\``;
      nextSelectionStart = selectionStart + 1;
      nextSelectionEnd = nextSelectionStart + fallbackSelection.length;
      break;
    case "quote":
      replacement = `> ${fallbackSelection}`;
      nextSelectionStart = selectionStart + 2;
      nextSelectionEnd = nextSelectionStart + fallbackSelection.length;
      break;
    case "unordered-list":
      replacement = `- ${fallbackSelection}`;
      nextSelectionStart = selectionStart + 2;
      nextSelectionEnd = nextSelectionStart + fallbackSelection.length;
      break;
    case "ordered-list":
      replacement = `1. ${fallbackSelection}`;
      nextSelectionStart = selectionStart + 3;
      nextSelectionEnd = nextSelectionStart + fallbackSelection.length;
      break;
  }

  return {
    nextValue:
      source.slice(0, selectionStart) + replacement + source.slice(selectionEnd),
    nextSelectionStart,
    nextSelectionEnd,
  };
}

function placeholderForAction(action: ToolbarAction) {
  switch (action) {
    case "bold":
      return "important insight";
    case "italic":
      return "subtle emphasis";
    case "link":
      return "reference";
    case "code":
      return "npm run lint";
    case "quote":
      return "Highlight a key takeaway.";
    case "unordered-list":
      return "List item";
    case "ordered-list":
      return "First step";
  }
}

function parseMarkdown(markdown: string): MarkdownBlock[] {
  const normalized = markdown.replace(/\r\n/g, "\n");
  const lines = normalized.split("\n");
  const blocks: MarkdownBlock[] = [];

  for (let index = 0; index < lines.length; ) {
    const line = lines[index];

    if (!line.trim()) {
      index += 1;
      continue;
    }

    if (line.startsWith("```")) {
      const language = line.slice(3).trim();
      const codeLines: string[] = [];
      index += 1;

      while (index < lines.length && !lines[index].startsWith("```")) {
        codeLines.push(lines[index]);
        index += 1;
      }

      if (index < lines.length) {
        index += 1;
      }

      blocks.push({
        type: "code",
        language,
        code: codeLines.join("\n"),
      });
      continue;
    }

    const headingMatch = line.match(/^(#{1,3})\s+(.+)$/);
    if (headingMatch) {
      blocks.push({
        type: "heading",
        level: headingMatch[1].length as 1 | 2 | 3,
        text: headingMatch[2],
      });
      index += 1;
      continue;
    }

    if (line.startsWith(">")) {
      const quoteLines: string[] = [];

      while (index < lines.length && lines[index].startsWith(">")) {
        quoteLines.push(lines[index].replace(/^>\s?/, ""));
        index += 1;
      }

      blocks.push({ type: "quote", lines: quoteLines });
      continue;
    }

    if (isUnorderedListLine(line)) {
      const items: string[] = [];

      while (index < lines.length && isUnorderedListLine(lines[index])) {
        items.push(lines[index].replace(/^[-*]\s+/, ""));
        index += 1;
      }

      blocks.push({ type: "unordered-list", items });
      continue;
    }

    if (isOrderedListLine(line)) {
      const items: string[] = [];

      while (index < lines.length && isOrderedListLine(lines[index])) {
        items.push(lines[index].replace(/^\d+\.\s+/, ""));
        index += 1;
      }

      blocks.push({ type: "ordered-list", items });
      continue;
    }

    const paragraphLines = [line.trim()];
    index += 1;

    while (
      index < lines.length &&
      lines[index].trim() &&
      !isStructuredMarkdownLine(lines[index])
    ) {
      paragraphLines.push(lines[index].trim());
      index += 1;
    }

    blocks.push({
      type: "paragraph",
      text: paragraphLines.join(" "),
    });
  }

  return blocks;
}

function renderInlineContent(text: string, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const pattern =
    /(\*\*([^*]+)\*\*|\*([^*]+)\*|`([^`]+)`|\[([^\]]+)\]\(([^)]+)\))/g;
  let lastIndex = 0;

  for (const match of text.matchAll(pattern)) {
    const matchIndex = match.index ?? 0;

    if (matchIndex > lastIndex) {
      nodes.push(text.slice(lastIndex, matchIndex));
    }

    if (match[2]) {
      nodes.push(
        <strong key={`${keyPrefix}-${matchIndex}`} className="font-semibold text-zinc-950">
          {match[2]}
        </strong>,
      );
    } else if (match[3]) {
      nodes.push(
        <em key={`${keyPrefix}-${matchIndex}`} className="italic">
          {match[3]}
        </em>,
      );
    } else if (match[4]) {
      nodes.push(
        <code
          key={`${keyPrefix}-${matchIndex}`}
          className="rounded bg-zinc-100 px-1.5 py-0.5 text-[0.92em] text-zinc-900"
        >
          {match[4]}
        </code>,
      );
    } else if (match[5] && match[6]) {
      nodes.push(
        <a
          key={`${keyPrefix}-${matchIndex}`}
          href={match[6]}
          target="_blank"
          rel="noreferrer"
          className="font-medium text-[#1f3f9f] underline decoration-[#1f3f9f]/30 underline-offset-4"
        >
          {match[5]}
        </a>,
      );
    }

    lastIndex = matchIndex + match[0].length;
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  return nodes.length > 0 ? nodes : [text];
}

function isStructuredMarkdownLine(line: string) {
  return (
    line.startsWith("```") ||
    /^#{1,3}\s+/.test(line) ||
    line.startsWith(">") ||
    isUnorderedListLine(line) ||
    isOrderedListLine(line)
  );
}

function isUnorderedListLine(line: string) {
  return /^[-*]\s+/.test(line);
}

function isOrderedListLine(line: string) {
  return /^\d+\.\s+/.test(line);
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

function IconEye({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
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

function IconLink({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M10 13a5 5 0 007.07 0l2.83-2.83a5 5 0 10-7.07-7.07L11 4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M14 11a5 5 0 00-7.07 0L4.1 13.83a5 5 0 107.07 7.07L13 20"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconQuote({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M10 11H6a2 2 0 01-2-2V7a4 4 0 014-4h2v4H8v2h2v2z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M20 11h-4a2 2 0 01-2-2V7a4 4 0 014-4h2v4h-2v2h2v2z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconList({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M9 6h11"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M9 12h11"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M9 18h11"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="4" cy="6" r="1.5" fill="currentColor" />
      <circle cx="4" cy="12" r="1.5" fill="currentColor" />
      <circle cx="4" cy="18" r="1.5" fill="currentColor" />
    </svg>
  );
}

function IconOrderedList({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M10 6h10"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M10 12h10"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M10 18h10"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M4 7V5l-1 1"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M3.5 11.5h1a1.5 1.5 0 010 3h-1.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M3 17.5h2v1.5H3l2-2a1 1 0 00-.71-1.71H3"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
