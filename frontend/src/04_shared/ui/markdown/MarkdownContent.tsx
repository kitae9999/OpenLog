import type { ReactNode } from "react";
import { cn } from "@/shared/lib/cn";
import { highlightCodeBlock } from "@/shared/lib/markdown/highlightCode";
import { MarkdownCodeBlock } from "./MarkdownCodeBlock";
import { MarkdownMermaidBlock } from "./MarkdownMermaidBlock";

type MarkdownBlock =
  | { type: "heading"; level: HeadingLevel; text: string }
  | { type: "paragraph"; lines: string[] }
  | { type: "quote"; lines: string[] }
  | { type: "unordered-list"; items: string[] }
  | { type: "ordered-list"; items: string[] }
  | {
      type: "table";
      header: string[];
      alignments: TableAlignment[];
      rows: string[][];
    }
  | { type: "code"; language: string; code: string };

type HeadingLevel = 1 | 2 | 3 | 4 | 5;
type HeadingTag = `h${HeadingLevel}`;
type TableAlignment = "left" | "center" | "right";

const TABLE_DELIMITER_PATTERN = /^:?-{3,}:?$/;

const headingClassNamesByVariant: Record<
  "default" | "compact" | "dense",
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
  dense: {
    1: "text-[16px]",
    2: "text-[13px]",
    3: "text-[12.5px]",
    4: "text-[12px]",
    5: "text-[12px]",
  },
};

const headingFontClassNamesByVariant: Record<
  "default" | "compact" | "dense",
  string
> = {
  default: "font-bold leading-tight text-zinc-950",
  compact: "font-bold leading-tight text-zinc-950",
  dense:
    "font-semibold uppercase tracking-[0.08em] leading-tight text-zinc-500",
};

const bodyClassNamesByVariant: Record<"default" | "compact" | "dense", string> =
  {
    default: "space-y-6 text-[16px] leading-8 text-zinc-700",
    compact: "space-y-4 text-sm leading-6 text-zinc-800",
    dense: "space-y-3.5 text-[14px] leading-6 text-zinc-700",
  };

export function MarkdownContent({
  markdown,
  wikiLinks = [],
  variant = "default",
  emptyFallback = null,
}: {
  markdown: string;
  wikiLinks?: MarkdownWikiLink[];
  variant?: "default" | "compact" | "dense";
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
    <div className={bodyClassNamesByVariant[variant]}>
      {blocks.map((block, index) => {
        const key = `${block.type}-${index}`;

        switch (block.type) {
          case "heading": {
            const HeadingTag = `h${block.level}` as HeadingTag;

            return (
              <HeadingTag
                key={key}
                className={cn(
                  headingFontClassNamesByVariant[variant],
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
          case "table":
            return (
              <MarkdownTable
                key={key}
                header={block.header}
                alignments={block.alignments}
                rows={block.rows}
                variant={variant}
                keyPrefix={key}
                wikiLinksByLabel={wikiLinksByLabel}
              />
            );
          case "code": {
            if (block.language.toLowerCase() === "mermaid") {
              return (
                <MarkdownMermaidBlock
                  key={key}
                  code={block.code}
                  variant={variant}
                />
              );
            }

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

    const table = parseTable(lines, index);
    if (table) {
      blocks.push(table.block);
      index = table.nextIndex;
      continue;
    }

    const paragraphLines = [line.trim()];
    index += 1;

    while (
      index < lines.length &&
      lines[index].trim() &&
      !isStructuredMarkdownLine(lines[index]) &&
      !isTableStart(lines, index)
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

function MarkdownTable({
  header,
  alignments,
  rows,
  variant,
  keyPrefix,
  wikiLinksByLabel,
}: {
  header: string[];
  alignments: TableAlignment[];
  rows: string[][];
  variant: "default" | "compact" | "dense";
  keyPrefix: string;
  wikiLinksByLabel: Map<string, MarkdownWikiLink>;
}) {
  const cellPadding = variant === "dense" ? "px-3 py-1.5" : "px-4 py-2.5";

  return (
    <div className="overflow-x-auto rounded-lg border border-zinc-200">
      <table className="w-max min-w-full border-collapse text-[0.94em] leading-6">
        <thead className="bg-zinc-50 text-zinc-950">
          <tr>
            {header.map((cell, cellIndex) => (
              <th
                key={`${keyPrefix}-header-${cellIndex}`}
                scope="col"
                className={cn(
                  cellPadding,
                  "border-b border-zinc-200 font-semibold",
                  cellIndex > 0 && "border-l border-zinc-200",
                  tableAlignmentClassNames[alignments[cellIndex]],
                )}
              >
                {renderInlineContent(
                  cell,
                  `${keyPrefix}-header-${cellIndex}`,
                  wikiLinksByLabel,
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-200">
          {rows.map((row, rowIndex) => (
            <tr key={`${keyPrefix}-row-${rowIndex}`}>
              {row.map((cell, cellIndex) => (
                <td
                  key={`${keyPrefix}-row-${rowIndex}-${cellIndex}`}
                  className={cn(
                    cellPadding,
                    cellIndex > 0 && "border-l border-zinc-200",
                    tableAlignmentClassNames[alignments[cellIndex]],
                  )}
                >
                  {renderInlineContent(
                    cell,
                    `${keyPrefix}-row-${rowIndex}-${cellIndex}`,
                    wikiLinksByLabel,
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const tableAlignmentClassNames: Record<TableAlignment, string> = {
  left: "text-left",
  center: "text-center",
  right: "text-right",
};

function parseTable(
  lines: string[],
  startIndex: number,
): {
  block: Extract<MarkdownBlock, { type: "table" }>;
  nextIndex: number;
} | null {
  const header = parseTableRow(lines[startIndex]);
  const alignments = parseTableDelimiterRow(lines[startIndex + 1]);

  if (!header || !alignments || header.length !== alignments.length) {
    return null;
  }

  const rows: string[][] = [];
  let nextIndex = startIndex + 2;

  while (nextIndex < lines.length && lines[nextIndex].trim()) {
    const row = parseTableRow(lines[nextIndex]);
    if (!row) {
      break;
    }

    rows.push(normalizeTableRow(row, header.length));
    nextIndex += 1;
  }

  return {
    block: { type: "table", header, alignments, rows },
    nextIndex,
  };
}

function parseTableDelimiterRow(
  line: string | undefined,
): TableAlignment[] | null {
  if (!line) {
    return null;
  }

  const cells = parseTableRow(line);
  if (!cells || cells.some((cell) => !TABLE_DELIMITER_PATTERN.test(cell))) {
    return null;
  }

  return cells.map((cell): TableAlignment => {
    const leftAligned = cell.startsWith(":");
    const rightAligned = cell.endsWith(":");

    if (leftAligned && rightAligned) {
      return "center";
    }

    return rightAligned ? "right" : "left";
  });
}

function parseTableRow(line: string | undefined): string[] | null {
  if (!line) {
    return null;
  }

  const trimmed = line.trim();
  if (!hasUnescapedPipe(trimmed)) {
    return null;
  }

  const startsWithPipe = trimmed.startsWith("|");
  const lastIndex = trimmed.length - 1;
  const endsWithPipe =
    trimmed.endsWith("|") && !isEscapedCharacter(trimmed, lastIndex);
  const content = trimmed.slice(
    startsWithPipe ? 1 : 0,
    endsWithPipe ? lastIndex : trimmed.length,
  );
  const cells: string[] = [];
  let currentCell = "";

  for (let index = 0; index < content.length; index += 1) {
    const character = content[index];

    if (character === "|" && !isEscapedCharacter(content, index)) {
      cells.push(currentCell.trim());
      currentCell = "";
      continue;
    }

    if (character === "|" && isEscapedCharacter(content, index)) {
      currentCell = `${currentCell.slice(0, -1)}|`;
      continue;
    }

    currentCell += character;
  }

  cells.push(currentCell.trim());
  return cells;
}

function normalizeTableRow(row: string[], columnCount: number): string[] {
  return Array.from({ length: columnCount }, (_, index) => row[index] ?? "");
}

function isTableStart(lines: string[], index: number) {
  const header = parseTableRow(lines[index]);
  const alignments = parseTableDelimiterRow(lines[index + 1]);
  return Boolean(header && alignments && header.length === alignments.length);
}

function hasUnescapedPipe(line: string) {
  for (let index = 0; index < line.length; index += 1) {
    if (line[index] === "|" && !isEscapedCharacter(line, index)) {
      return true;
    }
  }

  return false;
}

function isEscapedCharacter(value: string, index: number) {
  let precedingBackslashes = 0;

  for (
    let cursor = index - 1;
    cursor >= 0 && value[cursor] === "\\";
    cursor -= 1
  ) {
    precedingBackslashes += 1;
  }

  return precedingBackslashes % 2 === 1;
}

function renderInlineContent(
  text: string,
  keyPrefix: string,
  wikiLinksByLabel: Map<string, MarkdownWikiLink>,
): ReactNode[] {
  const nodes: ReactNode[] = [];
  const pattern =
    /(\*\*([^*]+)\*\*|\*([^*]+)\*|`([^`]+)`|!\[([^\]]*)\]\(([^)]+)\)|\[([^\]]+)\]\(([^)]+)\)|\[\[([^\[\]\n]+)]])/g;
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
    } else if (match[5] !== undefined && match[6]) {
      nodes.push(
        <MarkdownImage
          key={`${keyPrefix}-${matchIndex}`}
          alt={match[5]}
          src={match[6]}
        />,
      );
    } else if (match[7] && match[8]) {
      nodes.push(
        <a
          key={`${keyPrefix}-${matchIndex}`}
          href={match[8]}
          target="_blank"
          rel="noreferrer"
          className="font-medium text-[#1f3f9f] underline decoration-[#1f3f9f]/30 underline-offset-4"
        >
          {match[7]}
        </a>,
      );
    } else if (match[9]) {
      const label = match[9].trim();
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

function MarkdownImage({ alt, src }: { alt: string; src: string }) {
  if (src.startsWith("uploading://")) {
    return (
      <span className="my-4 block rounded-lg border border-dashed border-zinc-300 bg-zinc-50 px-4 py-5 text-sm font-medium text-zinc-500">
        Uploading image...
      </span>
    );
  }

  if (src.startsWith("upload-failed://")) {
    return (
      <span className="my-4 block rounded-lg border border-rose-200 bg-rose-50 px-4 py-5 text-sm font-medium text-rose-700">
        Image upload failed.
      </span>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      loading="lazy"
      className="my-4 block max-h-[720px] max-w-full rounded-lg border border-zinc-200 object-contain"
    />
  );
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
