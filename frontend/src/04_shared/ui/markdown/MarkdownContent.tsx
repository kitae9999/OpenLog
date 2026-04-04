import type { ReactNode } from "react";
import { cn } from "@/shared/lib/cn";
import { highlightCodeBlock } from "@/shared/lib/markdown/highlightCode";

type MarkdownBlock =
  | { type: "heading"; level: 1 | 2 | 3; text: string }
  | { type: "paragraph"; text: string }
  | { type: "quote"; lines: string[] }
  | { type: "unordered-list"; items: string[] }
  | { type: "ordered-list"; items: string[] }
  | { type: "code"; language: string; code: string };

export function MarkdownContent({
  markdown,
  variant = "default",
  emptyFallback = null,
}: {
  markdown: string;
  variant?: "default" | "compact";
  emptyFallback?: ReactNode;
}) {
  const blocks = parseMarkdown(markdown);

  if (blocks.length === 0) {
    return <>{emptyFallback}</>;
  }

  return (
    <div
      className={cn(
        variant === "default"
          ? "space-y-6 text-[16px] leading-8 text-zinc-700"
          : "space-y-4 text-sm leading-6 text-zinc-800",
      )}
    >
      {blocks.map((block, index) => {
        const key = `${block.type}-${index}`;

        switch (block.type) {
          case "heading": {
            const className =
              variant === "default"
                ? block.level === 1
                  ? "text-[32px]"
                  : block.level === 2
                    ? "text-[26px]"
                    : "text-[20px]"
                : block.level === 1
                  ? "text-[24px]"
                  : block.level === 2
                    ? "text-[20px]"
                    : "text-[18px]";

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
              <p key={key} className={variant === "default" ? "max-w-[66ch]" : ""}>
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
          case "code": {
            const highlighted = highlightCodeBlock(block.code, block.language);
            return (
              <div
                key={key}
                className="markdown-code overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-950 text-zinc-100 shadow-[0_20px_50px_rgba(9,9,11,0.18)]"
              >
                <div className="border-b border-white/10 px-4 py-2 text-[11px] uppercase tracking-[0.22em] text-zinc-400">
                  {highlighted.languageLabel}
                </div>
                <pre
                  className={cn(
                    "overflow-x-auto p-4 font-mono",
                    variant === "default" ? "text-[13px] leading-6" : "text-xs leading-5",
                  )}
                >
                  <code
                    className="hljs block bg-transparent p-0"
                    dangerouslySetInnerHTML={{ __html: highlighted.html }}
                  />
                </pre>
              </div>
            );
          }
        }
      })}
    </div>
  );
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
        <strong
          key={`${keyPrefix}-${matchIndex}`}
          className="font-semibold text-zinc-950"
        >
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
