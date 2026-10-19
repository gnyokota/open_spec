import { expect, test, type Page } from "@playwright/test";

import {
  contrastRatio,
  seedTheme,
  seedTodos,
  THEME_KEY,
  type SeedTodo,
} from "./helpers";

const BACKGROUND = {
  light: "rgb(247, 247, 248)",
  dark: "rgb(15, 15, 18)",
} as const;

const toggle = (page: Page) =>
  page.getByRole("button", { name: /^(Switch to (dark|light)|Toggle) theme$/ });
const html = (page: Page) => page.locator("html");

async function expectTheme(page: Page, theme: "light" | "dark") {
  const other = theme === "light" ? "dark" : "light";
  await expect(html(page)).toHaveAttribute("data-theme", theme);
  await expect(page.locator("body")).toHaveCSS(
    "background-color",
    BACKGROUND[theme],
  );
  await expect(toggle(page)).toHaveAccessibleName(`Switch to ${other} theme`);
}

test.describe("Default to the system preference", () => {
  for (const [colorScheme, theme] of [
    ["dark", "dark"],
    ["light", "light"],
    ["no-preference", "light"],
  ] as const) {
    test.describe(`with a ${colorScheme} system`, () => {
      test.use({ colorScheme });

      test(`renders the ${theme} theme`, async ({ page }) => {
        await page.goto("/");
        await expectTheme(page, theme);
      });
    });
  }
});

test.describe("Theme toggle", () => {
  test.use({ colorScheme: "light" });

  test("switches immediately without a reload", async ({ page }) => {
    await page.goto("/");
    await expectTheme(page, "light");

    // A reload would clear this marker.
    await page.evaluate(() => {
      (window as { marker?: boolean }).marker = true;
    });
    await toggle(page).click();
    await expectTheme(page, "dark");

    await toggle(page).click();
    await expectTheme(page, "light");
    expect(
      await page.evaluate(() => (window as { marker?: boolean }).marker),
    ).toBe(true);
  });

  for (const key of ["Enter", "Space"]) {
    test(`works with ${key}`, async ({ page }) => {
      await page.goto("/");
      await expectTheme(page, "light");

      await toggle(page).focus();
      await page.keyboard.press(key);
      await expectTheme(page, "dark");
    });
  }
});

test.describe("Remember the chosen theme", () => {
  test.describe("with a light system", () => {
    test.use({ colorScheme: "light" });

    test("keeps the chosen theme after a reload", async ({ page }) => {
      await page.goto("/");
      await toggle(page).click();
      await expectTheme(page, "dark");

      await page.reload();
      await expectTheme(page, "dark");
      expect(
        await page.evaluate((key) => localStorage.getItem(key), THEME_KEY),
      ).toBe("dark");
    });
  });

  test.describe("with a dark system", () => {
    test.use({ colorScheme: "dark" });

    test("a stored light theme overrides the system", async ({ page }) => {
      await seedTheme(page, "light");
      await page.goto("/");
      await expectTheme(page, "light");
    });
  });
});

// With the app's JavaScript blocked, only the inline <head> script can set the
// theme, so these show what the first paint looks like.
test.describe("Applied before first paint", () => {
  test.beforeEach(async ({ page }) => {
    await page.route("**/_next/static/**/*.js", (route) => route.abort());
  });

  async function expectFirstPaint(page: Page, theme: "light" | "dark") {
    await page.goto("/", { waitUntil: "load" });
    // Not hydrated: the server-rendered name is still the generic one.
    await expect(toggle(page)).toHaveAccessibleName("Toggle theme");
    await expect(html(page)).toHaveAttribute("data-theme", theme);
    await expect(page.locator("body")).toHaveCSS(
      "background-color",
      BACKGROUND[theme],
    );
  }

  test.describe("with a light system", () => {
    test.use({ colorScheme: "light" });

    test("the app's JavaScript really is blocked", async ({ page }) => {
      await page.goto("/", { waitUntil: "load" });
      await page.getByLabel("Todo", { exact: true }).fill("Buy milk");
      await page.getByRole("button", { name: "Add" }).click();
      await page.waitForLoadState("load");

      await expect(page.getByRole("listitem")).toHaveCount(0);
      await expect(toggle(page)).toHaveAccessibleName("Toggle theme");
    });

    test("a stored dark theme is applied", async ({ page }) => {
      await seedTheme(page, "dark");
      await expectFirstPaint(page, "dark");
    });
  });

  test.describe("with a dark system", () => {
    test.use({ colorScheme: "dark" });

    test("the system theme is applied when nothing is stored", async ({
      page,
    }) => {
      await expectFirstPaint(page, "dark");
    });

    test("a stored light theme is applied", async ({ page }) => {
      await seedTheme(page, "light");
      await expectFirstPaint(page, "light");
    });
  });
});

test.describe("Contrast in both themes", () => {
  const todos: SeedTodo[] = [
    { id: "a", text: "Call mom", date: null, done: false },
    { id: "b", text: "Buy milk", date: "2026-10-20", done: true },
  ];

  for (const theme of ["light", "dark"] as const) {
    test.describe(`${theme} theme`, () => {
      test.beforeEach(async ({ page }) => {
        await seedTheme(page, theme);
      });

      test("text has at least 4.5:1 contrast", async ({ page }) => {
        await seedTodos(page, todos);
        await page.goto("/");
        await expect(html(page)).toHaveAttribute("data-theme", theme);
        // Show the blank-todo error, then move the mouse off the button so
        // it isn't measured in its hover state.
        await page.getByRole("button", { name: "Add" }).click();
        await page.mouse.move(0, 0);

        const items = page.getByRole("listitem");
        const elements = {
          heading: page.getByRole("heading", { level: 1 }),
          "Todo label": page.locator("label", { hasText: /^Todo$/ }),
          "text input": page.getByLabel("Todo", { exact: true }),
          "Add button": page.getByRole("button", { name: "Add" }),
          error: page.getByText("Enter a todo"),
          "todo text": items.getByText("Call mom", { exact: true }),
          "done text": items.getByText("Buy milk", { exact: true }),
          date: items.locator("time"),
        };

        for (const [name, locator] of Object.entries(elements)) {
          const ratio = await contrastRatio(locator);
          expect(
            ratio,
            `${name}: ${ratio.toFixed(2)}:1`,
          ).toBeGreaterThanOrEqual(4.5);
        }
      });

      test("the empty message has at least 4.5:1 contrast", async ({
        page,
      }) => {
        await page.goto("/");
        const ratio = await contrastRatio(page.getByText("No todos yet"));
        expect(ratio, `${ratio.toFixed(2)}:1`).toBeGreaterThanOrEqual(4.5);
      });
    });
  }
});
