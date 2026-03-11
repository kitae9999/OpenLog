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
