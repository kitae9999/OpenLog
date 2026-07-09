import { expect, test } from "@playwright/test";
import {
  assertSingleLineTodoAlignment,
  readBox,
  singleLineTodoRows,
} from "./helpers/todoLayout";

const fixturePath = "/e2e/todos-layout";

test.describe("Todos card layout", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(fixturePath);
    await expect(page.getByTestId("todos-card")).toBeVisible();
  });

  test("keeps single-line rows aligned and equal height", async ({ page }) => {
    await assertSingleLineTodoAlignment(page, { minRows: 3 });
  });

  test("keeps add input row aligned with existing rows", async ({ page }) => {
    await assertSingleLineTodoAlignment(page, { minRows: 3 });

    await page.getByTestId("todo-add-button").click();
    await expect(page.getByTestId("todo-add-input")).toBeVisible();

    const addRow = page.getByTestId("todo-add-row");
    const referenceRow = page
      .locator('[data-testid="todo-row"][data-multiline="false"]')
      .first();

    const addRowBox = await readBox(addRow);
    const referenceBox = await readBox(referenceRow);

    expect(Math.round(addRowBox.height)).toBe(Math.round(referenceBox.height));
  });

  test("cancels empty add row with trailing x button", async ({ page }) => {
    await page.getByTestId("todo-add-button").click();
    await expect(page.getByTestId("todo-add-input")).toBeVisible();
    await expect(page.getByTestId("todo-add-cancel")).toBeVisible();

    await page.getByTestId("todo-add-cancel").click();

    await expect(page.getByTestId("todo-add-input")).toHaveCount(0);
    await expect(page.getByTestId("todo-add-button")).toBeVisible();
  });

  test("keeps newly added todo row the same height as existing rows", async ({
    page,
  }) => {
    await assertSingleLineTodoAlignment(page, { minRows: 3 });

    await page.getByTestId("todo-add-button").click();
    await page.getByTestId("todo-add-input").fill("new todo item");
    await page.getByTestId("todo-add-input").press("Enter");

    await expect(
      page.getByTestId("todo-title").filter({ hasText: "new todo item" }),
    ).toBeVisible();

    const rows = singleLineTodoRows(page);
    await expect(rows).toHaveCount(4);

    const firstBox = await readBox(rows.first());
    const lastBox = await readBox(rows.last());

    expect(Math.round(lastBox.height)).toBe(Math.round(firstBox.height));
    await assertSingleLineTodoAlignment(page, { minRows: 4 });
  });

  test("captures layout screenshot for visual review", async ({ page }) => {
    test.skip(
      !process.env.UPDATE_SNAPSHOTS,
      "Set UPDATE_SNAPSHOTS=1 to refresh visual baseline",
    );

    await assertSingleLineTodoAlignment(page, { minRows: 3 });
    await expect(page.getByTestId("todos-card")).toHaveScreenshot(
      "todos-card-aligned.png",
      {
        maxDiffPixelRatio: 0.01,
      },
    );
  });
});
