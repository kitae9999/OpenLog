export type ToolbarAction =
  | "bold"
  | "italic"
  | "link"
  | "inline-code"
  | "code-block"
  | "quote"
  | "unordered-list"
  | "ordered-list";

export function formatSelection(
  action: ToolbarAction,
  source: string,
  selectedText: string,
  selectionStart: number,
  selectionEnd: number,
) {
  if (isBlockAction(action)) {
    const blockInsert = formatBlockInsertion(
      action,
      source,
      selectedText,
      selectionStart,
      selectionEnd,
    );

    if (blockInsert) {
      return blockInsert;
    }
  }

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
    case "inline-code":
      replacement = `\`${fallbackSelection}\``;
      nextSelectionStart = selectionStart + 1;
      nextSelectionEnd = nextSelectionStart + fallbackSelection.length;
      break;
    case "code-block":
      replacement = `\`\`\`\n${fallbackSelection}\n\`\`\``;
      nextSelectionStart = selectionStart + 4;
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
    case "inline-code":
      return "npm run lint";
    case "code-block":
      return "const answer = 42;";
    case "quote":
      return "Highlight a key takeaway.";
    case "unordered-list":
      return "List item";
    case "ordered-list":
      return "First step";
  }
}

function isBlockAction(
  action: ToolbarAction,
): action is Extract<
  ToolbarAction,
  "code-block" | "quote" | "unordered-list" | "ordered-list"
> {
  return (
    action === "code-block" ||
    action === "quote" ||
    action === "unordered-list" ||
    action === "ordered-list"
  );
}

function formatBlockInsertion(
  action: Extract<
    ToolbarAction,
    "code-block" | "quote" | "unordered-list" | "ordered-list"
  >,
  source: string,
  selectedText: string,
  selectionStart: number,
  selectionEnd: number,
) {
  const lineStart = findLineStart(source, selectionStart);
  const lineEnd = findLineEnd(source, selectionEnd);
  const currentLine = source.slice(lineStart, lineEnd);
  const hasCollapsedSelection = selectionStart === selectionEnd;
  const currentLineHasContent = currentLine.trim().length > 0;

  if (action === "code-block") {
    const repeatedCodeBlock = isRepeatedCodeBlockSelection(
      source,
      selectedText,
      selectionStart,
      selectionEnd,
    );
    if (repeatedCodeBlock) {
      return insertStandaloneBlock(
        source,
        repeatedCodeBlock.blockEnd,
        buildBlockReplacement(action, currentLine),
      );
    }

    if (hasCollapsedSelection && currentLineHasContent) {
      return insertStandaloneBlock(
        source,
        lineEnd,
        buildBlockReplacement(action, currentLine),
      );
    }

    return null;
  }

  if (isRepeatedLineBlockSelection(action, currentLine, selectedText)) {
    return insertStandaloneBlock(
      source,
      lineEnd,
      buildBlockReplacement(action, currentLine),
    );
  }

  if (hasCollapsedSelection && currentLineHasContent) {
    return insertStandaloneBlock(
      source,
      lineEnd,
      buildBlockReplacement(action, currentLine),
    );
  }

  return null;
}

function buildBlockReplacement(
  action: Extract<
    ToolbarAction,
    "code-block" | "quote" | "unordered-list" | "ordered-list"
  >,
  currentLine?: string,
) {
  const placeholder = placeholderForAction(action);

  switch (action) {
    case "code-block":
      return {
        content: `\`\`\`\n${placeholder}\n\`\`\``,
        selectionOffsetStart: 4,
        selectionLength: placeholder.length,
      };
    case "quote":
      return {
        content: `> ${placeholder}`,
        selectionOffsetStart: 2,
        selectionLength: placeholder.length,
      };
    case "unordered-list":
      return {
        content: `- ${placeholder}`,
        selectionOffsetStart: 2,
        selectionLength: placeholder.length,
      };
    case "ordered-list": {
      const nextNumber = getNextOrderedListNumber(currentLine);
      const prefix = `${nextNumber}. `;

      return {
        content: `${prefix}${placeholder}`,
        selectionOffsetStart: prefix.length,
        selectionLength: placeholder.length,
      };
    }
  }
}

function insertStandaloneBlock(
  source: string,
  insertAt: number,
  block: {
    content: string;
    selectionOffsetStart: number;
    selectionLength: number;
  },
) {
  const needsLeadingNewline =
    insertAt > 0 && source[insertAt - 1] !== "\n" && block.content.length > 0;
  const prefix = needsLeadingNewline ? "\n" : "";
  const insertion = `${prefix}${block.content}`;
  const nextSelectionStart =
    insertAt + prefix.length + block.selectionOffsetStart;

  return {
    nextValue: source.slice(0, insertAt) + insertion + source.slice(insertAt),
    nextSelectionStart,
    nextSelectionEnd: nextSelectionStart + block.selectionLength,
  };
}

function isRepeatedLineBlockSelection(
  action: Extract<ToolbarAction, "quote" | "unordered-list" | "ordered-list">,
  currentLine: string,
  selectedText: string,
) {
  if (!selectedText) {
    return false;
  }

  switch (action) {
    case "quote":
      return currentLine === `> ${selectedText}`;
    case "unordered-list":
      return currentLine === `- ${selectedText}`;
    case "ordered-list": {
      const match = currentLine.match(/^(\d+)\.\s(.*)$/);
      return Boolean(match && match[2] === selectedText);
    }
  }
}

function isRepeatedCodeBlockSelection(
  source: string,
  selectedText: string,
  selectionStart: number,
  selectionEnd: number,
) {
  if (!selectedText || selectionStart < 4) {
    return null;
  }

  const blockStart = selectionStart - 4;
  const blockEnd = selectionEnd + 4;

  if (
    source.slice(blockStart, selectionStart) !== "```\n" ||
    source.slice(selectionEnd, blockEnd) !== "\n```"
  ) {
    return null;
  }

  return { blockEnd };
}

function getNextOrderedListNumber(currentLine?: string) {
  const match = currentLine?.match(/^(\d+)\.\s/);
  if (!match) {
    return 1;
  }

  return Number(match[1]) + 1;
}

function findLineStart(source: string, index: number) {
  const previousNewline = source.lastIndexOf("\n", Math.max(0, index - 1));
  return previousNewline === -1 ? 0 : previousNewline + 1;
}

function findLineEnd(source: string, index: number) {
  const nextNewline = source.indexOf("\n", index);
  return nextNewline === -1 ? source.length : nextNewline;
}
