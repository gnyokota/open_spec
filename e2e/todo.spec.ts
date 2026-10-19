import { expect, test, type Page } from "@playwright/test";

import {
  addTodo,
  blockStorage,
  seedRawTodos,
  seedTodos,
  TODOS_KEY,
} from "./helpers";

const textInput = (page: Page) => page.getByLabel("Todo", { exact: true });
const dateInput = (page: Page) => page.getByLabel("Date", { exact: true });
const addButton = (page: Page) => page.getByRole("button", { name: "Add" });
const items = (page: Page) => page.getByRole("listitem");
const checkbox = (page: Page, text: string) =>
  page.getByRole("checkbox", { name: `Mark ${text} as done` });
// Next.js adds its own (empty) role="alert" route announcer, so match by text.
const errorAlert = (page: Page) =>
  page.getByRole("alert").filter({ hasText: "Enter a todo" });
const itemText = (page: Page, text: string) =>
  items(page).getByText(text, { exact: true });

test.beforeEach(async ({ page }) => {
  await page.goto("/");
});

test.describe("Todo entry form", () => {
  test("form is visible on load", async ({ page }) => {
    await expect(textInput(page)).toBeVisible();
    await expect(dateInput(page)).toBeVisible();
    await expect(addButton(page)).toBeVisible();
  });
});

test.describe("Add a todo by button or Enter", () => {
  test("adds with the button, then clears and refocuses", async ({ page }) => {
    await addTodo(page, "Buy milk", "2026-10-20");

    await expect(items(page)).toHaveCount(1);
    await expect(itemText(page, "Buy milk")).toBeVisible();
    await expect(items(page).locator("time")).toHaveAttribute(
      "datetime",
      "2026-10-20",
    );
    await expect(checkbox(page, "Buy milk")).not.toBeChecked();
    await expect(textInput(page)).toHaveValue("");
    await expect(dateInput(page)).toHaveValue("");
    await expect(textInput(page)).toBeFocused();
  });

  test("adds with Enter in the text input", async ({ page }) => {
    await textInput(page).fill("Call mom");
    await textInput(page).press("Enter");

    await expect(itemText(page, "Call mom")).toBeVisible();
    await expect(items(page).locator("time")).toHaveCount(0);
  });

  test("adds with Enter in the date input", async ({ page }) => {
    await textInput(page).fill("Pay rent");
    await dateInput(page).fill("2026-11-01");
    await dateInput(page).press("Enter");

    await expect(itemText(page, "Pay rent")).toBeVisible();
    await expect(items(page).locator("time")).toHaveAttribute(
      "datetime",
      "2026-11-01",
    );
  });

  test("trims surrounding whitespace", async ({ page }) => {
    await addTodo(page, "  Pay rent  ");

    await expect(itemText(page, "Pay rent")).toBeVisible();
    const saved = await page.evaluate(
      (key) => JSON.parse(localStorage.getItem(key)!),
      TODOS_KEY,
    );
    expect(saved.todos[0].text).toBe("Pay rent");
  });
});

test.describe("Reject blank todos", () => {
  for (const submit of ["button", "Enter"] as const) {
    test(`rejects whitespace submitted with ${submit}`, async ({ page }) => {
      await textInput(page).fill("   ");
      if (submit === "button") await addButton(page).click();
      else await textInput(page).press("Enter");

      await expect(errorAlert(page)).toBeVisible();
      await expect(textInput(page)).toHaveAttribute("aria-invalid", "true");
      await expect(textInput(page)).toHaveValue("   ");
      await expect(items(page)).toHaveCount(0);
      await expect(page.getByText("No todos yet")).toBeVisible();
    });
  }

  test("clears the error when the user types", async ({ page }) => {
    await addButton(page).click();
    await expect(errorAlert(page)).toBeVisible();

    await textInput(page).press("B");

    await expect(errorAlert(page)).toHaveCount(0);
    await expect(textInput(page)).toHaveAttribute("aria-invalid", "false");
  });
});

test.describe("Todo list display", () => {
  test("lists todos in the order they were added", async ({ page }) => {
    await addTodo(page, "First");
    await addTodo(page, "Second");

    await expect(items(page)).toHaveText([/First/, /Second/]);
  });

  test("shows only the text for a todo without a date", async ({ page }) => {
    await addTodo(page, "Call mom");

    await expect(items(page)).toHaveText("Call mom");
    await expect(items(page).locator("time")).toHaveCount(0);
  });

  test("shows the empty message when there are no todos", async ({ page }) => {
    await expect(page.getByText("No todos yet")).toBeVisible();
    await expect(page.getByRole("list")).toHaveCount(0);
  });

  for (const timezoneId of ["Pacific/Honolulu", "Pacific/Kiritimati"]) {
    test.describe(`in ${timezoneId}`, () => {
      test.use({ timezoneId, locale: "en-US" });

      test("shows the selected calendar day", async ({ page }) => {
        await addTodo(page, "Buy milk", "2026-10-20");

        const date = items(page).locator("time");
        await expect(date).toHaveText("Oct 20, 2026");
        await expect(date).toHaveAttribute("datetime", "2026-10-20");
      });
    });
  }
});

test.describe("Complete a todo with a checkbox", () => {
  test("clicking strikes the text through, and clicking again restores it", async ({
    page,
  }) => {
    await addTodo(page, "Buy milk");

    await checkbox(page, "Buy milk").click();
    await expect(checkbox(page, "Buy milk")).toBeChecked();
    await expect(itemText(page, "Buy milk")).toHaveCSS(
      "text-decoration-line",
      "line-through",
    );

    await checkbox(page, "Buy milk").click();
    await expect(checkbox(page, "Buy milk")).not.toBeChecked();
    await expect(itemText(page, "Buy milk")).toHaveCSS(
      "text-decoration-line",
      "none",
    );
  });

  test("Space toggles the focused checkbox", async ({ page }) => {
    await addTodo(page, "Buy milk");

    await checkbox(page, "Buy milk").focus();
    await page.keyboard.press("Space");
    await expect(checkbox(page, "Buy milk")).toBeChecked();
    await expect(itemText(page, "Buy milk")).toHaveCSS(
      "text-decoration-line",
      "line-through",
    );

    await page.keyboard.press("Space");
    await expect(checkbox(page, "Buy milk")).not.toBeChecked();
  });
});

test.describe("Todos persist across reloads", () => {
  test("keeps todos, order, and checked state", async ({ page }) => {
    await addTodo(page, "Buy milk");
    await addTodo(page, "Call mom");
    await checkbox(page, "Buy milk").click();

    await page.reload();

    await expect(items(page)).toHaveText([/Buy milk/, /Call mom/]);
    await expect(checkbox(page, "Buy milk")).toBeChecked();
    await expect(itemText(page, "Buy milk")).toHaveCSS(
      "text-decoration-line",
      "line-through",
    );
    await expect(checkbox(page, "Call mom")).not.toBeChecked();
  });

  test("starts empty with corrupted storage", async ({ page }) => {
    await seedRawTodos(page, "{not json");
    await page.reload();

    await expect(page.getByText("No todos yet")).toBeVisible();
    await addTodo(page, "Buy milk");
    await expect(itemText(page, "Buy milk")).toBeVisible();
  });

  test("works for the visit when storage is blocked", async ({ page }) => {
    await blockStorage(page);
    await page.reload();

    await expect(
      page.getByRole("heading", { level: 1, name: "Todo" }),
    ).toBeVisible();
    await expect(page.getByText("No todos yet")).toBeVisible();

    await addTodo(page, "Buy milk");
    await checkbox(page, "Buy milk").click();
    await expect(checkbox(page, "Buy milk")).toBeChecked();
  });

  test("never shows the empty message while stored todos load", async ({
    page,
  }) => {
    await seedTodos(page, [
      { id: "a", text: "Buy milk", date: null, done: false },
    ]);
    await page.addInitScript(() => {
      const w = window as { sawEmpty?: boolean };
      w.sawEmpty = false;
      const check = () => {
        if (document.body?.textContent?.includes("No todos yet")) {
          w.sawEmpty = true;
        }
      };
      new MutationObserver(check).observe(document, {
        childList: true,
        subtree: true,
        characterData: true,
      });
    });
    await page.reload();

    await expect(itemText(page, "Buy milk")).toBeVisible();
    expect(
      await page.evaluate(() => (window as { sawEmpty?: boolean }).sawEmpty),
    ).toBe(false);
  });
});
