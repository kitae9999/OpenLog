export type DiffRow = {
  oldLine?: number;
  newLine?: number;
  kind: "context" | "remove" | "add";
  content: string;
};

export function buildDiffRows(
  originalContent: string,
  nextContent: string,
): DiffRow[] {
  const originalLines = splitLines(originalContent);
  const nextLines = splitLines(nextContent);

  if (
    originalLines.length === nextLines.length &&
    originalLines.every((line, index) => line === nextLines[index])
  ) {
    return [];
  }

  const commonLengths = buildCommonSubsequenceLengths(originalLines, nextLines);
  const rows: DiffRow[] = [];
  let originalIndex = 0;
  let nextIndex = 0;

  while (originalIndex < originalLines.length || nextIndex < nextLines.length) {
    if (
      originalIndex < originalLines.length &&
      nextIndex < nextLines.length &&
      originalLines[originalIndex] === nextLines[nextIndex]
    ) {
      rows.push({
        oldLine: originalIndex + 1,
        newLine: nextIndex + 1,
        kind: "context",
        content: originalLines[originalIndex],
      });
      originalIndex += 1;
      nextIndex += 1;
      continue;
    }

    const shouldAdd =
      nextIndex < nextLines.length &&
      (originalIndex === originalLines.length ||
        commonLengths[originalIndex][nextIndex + 1] >
          commonLengths[originalIndex + 1][nextIndex]);

    if (shouldAdd) {
      rows.push({
        newLine: nextIndex + 1,
        kind: "add",
        content: nextLines[nextIndex],
      });
      nextIndex += 1;
      continue;
    }

    rows.push({
      oldLine: originalIndex + 1,
      kind: "remove",
      content: originalLines[originalIndex],
    });
    originalIndex += 1;
  }

  return trimUnchangedContext(rows);
}

function splitLines(value: string) {
  return value.replace(/\r\n/g, "\n").split("\n");
}

function buildCommonSubsequenceLengths(
  originalLines: string[],
  nextLines: string[],
) {
  const commonLengths = Array.from({ length: originalLines.length + 1 }, () =>
    Array.from({ length: nextLines.length + 1 }, () => 0),
  );

  for (
    let originalIndex = originalLines.length - 1;
    originalIndex >= 0;
    originalIndex -= 1
  ) {
    for (let nextIndex = nextLines.length - 1; nextIndex >= 0; nextIndex -= 1) {
      commonLengths[originalIndex][nextIndex] =
        originalLines[originalIndex] === nextLines[nextIndex]
          ? commonLengths[originalIndex + 1][nextIndex + 1] + 1
          : Math.max(
              commonLengths[originalIndex + 1][nextIndex],
              commonLengths[originalIndex][nextIndex + 1],
            );
    }
  }

  return commonLengths;
}

function trimUnchangedContext(rows: DiffRow[]) {
  const firstChangedIndex = rows.findIndex((row) => row.kind !== "context");
  let lastChangedIndex = -1;

  for (let index = rows.length - 1; index >= 0; index -= 1) {
    if (rows[index].kind !== "context") {
      lastChangedIndex = index;
      break;
    }
  }

  if (firstChangedIndex === -1 || lastChangedIndex === -1) {
    return [];
  }

  const startIndex = Math.max(0, firstChangedIndex - 2);
  const endIndex = Math.min(rows.length, lastChangedIndex + 3);
  return rows.slice(startIndex, endIndex);
}
