import { expect, test } from "@playwright/test";
import {
  assertSingleLineTodoAlignment,
  readBox,
  singleLineTodoRows,
} from "./helpers/todoLayout";

const fixturePath = "/e2e/todos-layout";

test.describe("Todos section layout", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(fixturePath);
    await expect(page.getByTestId("todos-section")).toBeVisible();
  });

  test("keeps single-line rows aligned and equal height", async ({ page }) => {
    await assertSingleLineTodoAlignment(page, { minRows: 3 });
  });

  test("keeps the always-visible composer below existing rows", async ({
    page,
  }) => {
    await assertSingleLineTodoAlignment(page, { minRows: 3 });

    const input = page.getByTestId("todo-add-input");
    await expect(input).toBeVisible();
    const inputBox = await readBox(input);
    const lastRowBox = await readBox(singleLineTodoRows(page).last());
    expect(inputBox.y).toBeGreaterThanOrEqual(lastRowBox.y + lastRowBox.height);
  });

  test("clears a todo draft with Escape", async ({ page }) => {
    const input = page.getByTestId("todo-add-input");
    await input.fill("temporary todo");
    await input.press("Escape");
    await expect(input).toHaveValue("");
  });

  test("keeps newly added todo row the same height as existing rows", async ({
    page,
  }) => {
    await assertSingleLineTodoAlignment(page, { minRows: 3 });

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
    await expect(page.getByTestId("todos-section")).toHaveScreenshot(
      "todos-section-aligned.png",
      {
        maxDiffPixelRatio: 0.01,
      },
    );
  });
});
