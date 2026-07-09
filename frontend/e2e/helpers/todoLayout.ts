import { expect, type Locator, type Page } from "@playwright/test";

export type Box = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export function centerY(box: Box) {
  return box.y + box.height / 2;
}

export function singleLineTodoRows(page: Page) {
  return page.locator('[data-testid="todo-row"][data-multiline="false"]');
}

export async function readBox(locator: Locator) {
  const box = await locator.boundingBox();
  expect(box, "element should be visible").not.toBeNull();
  return box as Box;
}

export async function assertSingleLineTodoAlignment(
  page: Page,
  options?: {
    minRows?: number;
    centerTolerancePx?: number;
    heightTolerancePx?: number;
    expectedHeightPx?: number;
  },
) {
  const minRows = options?.minRows ?? 2;
  const centerTolerancePx = options?.centerTolerancePx ?? 2;
  const heightTolerancePx = options?.heightTolerancePx ?? 1;
  const expectedHeightPx = options?.expectedHeightPx ?? 40;

  const rows = singleLineTodoRows(page);
  await expect(rows).toHaveCount(minRows, { timeout: 10_000 });

  const count = await rows.count();
  const heights: number[] = [];

  for (let index = 0; index < count; index += 1) {
    const row = rows.nth(index);
    const rowBox = await readBox(row);
    const checkboxBox = await readBox(row.getByTestId("todo-checkbox"));
    const titleBox = await readBox(row.getByTestId("todo-title"));

    heights.push(rowBox.height);

    const rowCenterY = centerY(rowBox);
    const checkboxCenterY = centerY(checkboxBox);
    const titleCenterY = centerY(titleBox);

    expect(
      Math.abs(rowCenterY - checkboxCenterY),
      `row ${index}: checkbox should be vertically centered`,
    ).toBeLessThanOrEqual(centerTolerancePx);

    expect(
      Math.abs(rowCenterY - titleCenterY),
      `row ${index}: title should be vertically centered`,
    ).toBeLessThanOrEqual(centerTolerancePx);

    expect(
      Math.abs(checkboxCenterY - titleCenterY),
      `row ${index}: checkbox and title should share centerline`,
    ).toBeLessThanOrEqual(centerTolerancePx);
  }

  const roundedHeights = heights.map((height) => Math.round(height));
  const minHeight = Math.min(...roundedHeights);
  const maxHeight = Math.max(...roundedHeights);

  expect(
    maxHeight - minHeight,
    `single-line row heights should match: ${roundedHeights.join(", ")}`,
  ).toBeLessThanOrEqual(heightTolerancePx);

  expect(
    Math.abs(minHeight - expectedHeightPx),
    `single-line row height should be ${expectedHeightPx}px`,
  ).toBeLessThanOrEqual(heightTolerancePx);
}
