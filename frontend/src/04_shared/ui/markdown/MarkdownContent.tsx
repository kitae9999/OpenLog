import type { ReactNode } from "react";
import { cn } from "@/shared/lib/cn";
import { highlightCodeBlock } from "@/shared/lib/markdown/highlightCode";
import { MarkdownCodeBlock } from "./MarkdownCodeBlock";

type MarkdownBlock =
  | { type: "heading"; level: HeadingLevel; text: string }
  | { type: "paragraph"; lines: string[] }
  | { type: "quote"; lines: string[] }
  | { type: "unordered-list"; items: string[] }
  | { type: "ordered-list"; items: string[] }
  | { type: "code"; language: string; code: string };

type HeadingLevel = 1 | 2 | 3 | 4 | 5;
type HeadingTag = `h${HeadingLevel}`;

const headingClassNamesByVariant: Record<
  "default" | "compact",
  Record<HeadingLevel, string>
> = {
  default: {
    1: "text-[32px]",
    2: "text-[28px]",
    3: "text-[24px]",
    4: "text-[20px]",
    5: "text-[16px]",
  },
  compact: {
    1: "text-[24px]",
    2: "text-[22px]",
    3: "text-[20px]",
    4: "text-[18px]",
    5: "text-[16px]",
  },
};

export function MarkdownContent({
  markdown,
  wikiLinks = [],
  variant = "default",
  emptyFallback = null,
}: {
  markdown: string;
  wikiLinks?: MarkdownWikiLink[];
  variant?: "default" | "compact";
  emptyFallback?: ReactNode;
}) {
  const blocks = parseMarkdown(markdown);
  const wikiLinksByLabel = new Map(
    wikiLinks.map((link) => [link.label, link] as const),
  );

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
            const HeadingTag = `h${block.level}` as HeadingTag;

            return (
              <HeadingTag
                key={key}
                className={cn(
                  "[font-family:Georgia,serif] font-bold leading-tight text-zinc-950",
                  headingClassNamesByVariant[variant][block.level],
                )}
              >
                {renderInlineContent(block.text, key, wikiLinksByLabel)}
              </HeadingTag>
            );
          }
          case "paragraph":
            return (
              <p key={key} className={variant === "default" ? "max-w-[66ch]" : ""}>
                {renderInlineLines(block.lines, key, wikiLinksByLabel)}
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
                      {renderInlineContent(
                        line,
                        `${key}-${lineIndex}`,
                        wikiLinksByLabel,
                      )}
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
                    {renderInlineContent(
                      item,
                      `${key}-${itemIndex}`,
                      wikiLinksByLabel,
                    )}
                  </li>
                ))}
              </ul>
            );
          case "ordered-list":
            return (
              <ol key={key} className="list-decimal space-y-2 pl-6">
                {block.items.map((item, itemIndex) => (
                  <li key={`${key}-${itemIndex}`}>
                    {renderInlineContent(
                      item,
                      `${key}-${itemIndex}`,
                      wikiLinksByLabel,
                    )}
                  </li>
                ))}
              </ol>
            );
          case "code": {
            const highlighted = highlightCodeBlock(block.code, block.language);
            return (
              <MarkdownCodeBlock
                key={key}
                code={block.code}
                highlightedHtml={highlighted.html}
                languageLabel={highlighted.languageLabel}
                variant={variant}
              />
            );
          }
        }
      })}
    </div>
  );
}

export type MarkdownWikiLink = {
  label: string;
  href?: string;
  targetSlug?: string;
};

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

    const headingMatch = line.match(/^(#{1,5})\s+(.+)$/);
    if (headingMatch) {
      blocks.push({
        type: "heading",
        level: headingMatch[1].length as HeadingLevel,
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
        items.push(lines[index].replace(/^[-*+]\s+/, ""));
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
      lines: paragraphLines,
    });
  }

  return blocks;
}

function renderInlineContent(
  text: string,
  keyPrefix: string,
  wikiLinksByLabel: Map<string, MarkdownWikiLink>,
): ReactNode[] {
  const nodes: ReactNode[] = [];
  const pattern =
    /(\*\*([^*]+)\*\*|\*([^*]+)\*|`([^`]+)`|\[([^\]]+)\]\(([^)]+)\)|\[\[([^\[\]\n]+)]])/g;
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
    } else if (match[7]) {
      const label = match[7].trim();
      const wikiLink = wikiLinksByLabel.get(label);

      if (wikiLink?.href) {
        nodes.push(
          <a
            key={`${keyPrefix}-${matchIndex}`}
            href={wikiLink.href}
            className="rounded bg-emerald-50 px-1 py-0.5 font-medium text-[#087f5b] underline decoration-[#087f5b]/25 underline-offset-4"
          >
            {label}
          </a>,
        );
      } else if (wikiLink) {
        nodes.push(
          <span
            key={`${keyPrefix}-${matchIndex}`}
            className="rounded bg-emerald-50 px-1 py-0.5 font-medium text-[#087f5b]"
          >
            {label}
          </span>,
        );
      } else {
        nodes.push(
          <span
            key={`${keyPrefix}-${matchIndex}`}
            className="rounded bg-zinc-100 px-1 py-0.5 font-medium text-zinc-500"
          >
            {label}
          </span>,
        );
      }
    }

    lastIndex = matchIndex + match[0].length;
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  return nodes.length > 0 ? nodes : [text];
}

function renderInlineLines(
  lines: string[],
  keyPrefix: string,
  wikiLinksByLabel: Map<string, MarkdownWikiLink>,
): ReactNode[] {
  return lines.flatMap((line, index) => {
    const nodes = renderInlineContent(
      line,
      `${keyPrefix}-${index}`,
      wikiLinksByLabel,
    );

    return index === 0
      ? nodes
      : [
          <br key={`${keyPrefix}-${index}-break`} />,
          ...nodes,
        ];
  });
}

function isStructuredMarkdownLine(line: string) {
  return (
    line.startsWith("```") ||
    /^#{1,5}\s+/.test(line) ||
    line.startsWith(">") ||
    isUnorderedListLine(line) ||
    isOrderedListLine(line)
  );
}

function isUnorderedListLine(line: string) {
  return /^[-*+]\s+/.test(line);
}

function isOrderedListLine(line: string) {
  return /^\d+\.\s+/.test(line);
}
