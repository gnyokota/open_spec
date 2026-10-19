import { expect, type Locator, type Page } from "@playwright/test";

export const TODOS_KEY = "todo-openspec:todos";
export const THEME_KEY = "todo-openspec:theme";

export type SeedTodo = {
  id: string;
  text: string;
  date: string | null;
  done: boolean;
};

/** Fills the form and clicks "Add". */
export async function addTodo(page: Page, text: string, date?: string) {
  await page.getByLabel("Todo", { exact: true }).fill(text);
  if (date) await page.getByLabel("Date", { exact: true }).fill(date);
  await page.getByRole("button", { name: "Add" }).click();
}

/**
 * Writes a raw value to localStorage before the app runs. With `once`, only
 * the first load is seeded, so a reload keeps what the app saved.
 */
export async function seedStorage(
  page: Page,
  key: string,
  value: string,
  { once = false } = {},
) {
  await page.addInitScript(
    ({ key, value, once }) => {
      const flag = `seeded:${key}`;
      if (once && sessionStorage.getItem(flag)) return;
      localStorage.setItem(key, value);
      sessionStorage.setItem(flag, "1");
    },
    { key, value, once },
  );
}

export function seedTodos(
  page: Page,
  todos: SeedTodo[],
  options?: { once?: boolean },
) {
  return seedStorage(
    page,
    TODOS_KEY,
    JSON.stringify({ version: 1, todos }),
    options,
  );
}

export function seedRawTodos(page: Page, raw: string) {
  return seedStorage(page, TODOS_KEY, raw, { once: true });
}

export function seedTheme(page: Page, theme: "light" | "dark") {
  return seedStorage(page, THEME_KEY, theme, { once: true });
}

/** Makes `window.localStorage` throw, as browsers do when site data is blocked. */
export async function blockStorage(page: Page) {
  await page.addInitScript(() => {
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      get() {
        throw new DOMException("The operation is insecure.", "SecurityError");
      },
    });
  });
}

/**
 * WCAG 2.1 contrast ratio between an element's text color and the first
 * non-transparent background behind it.
 */
export async function contrastRatio(locator: Locator): Promise<number> {
  await expect(locator).toBeVisible();
  return locator.evaluate((element) => {
    const parse = (value: string) => {
      const match = value.match(/rgba?\(([^)]+)\)/);
      if (!match) throw new Error(`Unsupported color: ${value}`);
      const [r, g, b, a = 1] = match[1]
        .split(/[ ,/]+/)
        .filter(Boolean)
        .map(Number);
      return { r, g, b, a };
    };
    const luminance = ({ r, g, b }: { r: number; g: number; b: number }) => {
      const channel = (c: number) => {
        const s = c / 255;
        return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
      };
      return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
    };

    const text = parse(getComputedStyle(element).color);
    let background: ReturnType<typeof parse> | null = null;
    for (let node: Element | null = element; node; node = node.parentElement) {
      const color = parse(getComputedStyle(node).backgroundColor);
      if (color.a === 1) {
        background = color;
        break;
      }
      if (color.a !== 0) {
        throw new Error(`Translucent background on ${node.tagName}`);
      }
    }
    if (!background) throw new Error("No opaque background found");

    const [light, dark] = [luminance(text), luminance(background)].sort(
      (x, y) => y - x,
    );
    return (light + 0.05) / (dark + 0.05);
  });
}
