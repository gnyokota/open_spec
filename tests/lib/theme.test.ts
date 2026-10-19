import { describe, expect, it, vi } from "vitest";

import {
  applyTheme,
  getServerSnapshot,
  getSnapshot,
  getStoredTheme,
  getSystemTheme,
  isTheme,
  resolveTheme,
  setTheme,
  subscribe,
  THEME_STORAGE_KEY,
  themeInitScript,
} from "@/lib/theme";

function stubSystemTheme(prefersDark: boolean) {
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: prefersDark && query === "(prefers-color-scheme: dark)",
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
}

function blockStorageReads() {
  vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
    throw new DOMException("blocked", "SecurityError");
  });
}

const attribute = () => document.documentElement.getAttribute("data-theme");

describe("isTheme", () => {
  it.each([
    ["light", true],
    ["dark", true],
    ["Dark", false],
    ["", false],
    [null, false],
  ])("%j → %s", (value, expected) => {
    expect(isTheme(value)).toBe(expected);
  });
});

describe("getStoredTheme", () => {
  it.each(["light", "dark"] as const)("returns a stored %s", (theme) => {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
    expect(getStoredTheme()).toBe(theme);
  });

  it("returns null for an invalid or missing value", () => {
    expect(getStoredTheme()).toBeNull();
    localStorage.setItem(THEME_STORAGE_KEY, "blue");
    expect(getStoredTheme()).toBeNull();
  });

  it("returns null when storage can't be read", () => {
    blockStorageReads();
    expect(getStoredTheme()).toBeNull();
  });
});

describe("getSystemTheme", () => {
  it("is dark when the system prefers dark", () => {
    stubSystemTheme(true);
    expect(getSystemTheme()).toBe("dark");
  });

  it("is light when the system prefers light", () => {
    stubSystemTheme(false);
    expect(getSystemTheme()).toBe("light");
  });

  it("is light when matchMedia is unavailable", () => {
    expect(typeof matchMedia).not.toBe("function");
    expect(getSystemTheme()).toBe("light");
  });
});

describe("resolveTheme", () => {
  it("prefers a stored theme over the system preference", () => {
    stubSystemTheme(true);
    localStorage.setItem(THEME_STORAGE_KEY, "light");
    expect(resolveTheme()).toBe("light");
  });

  it("falls back to the system preference", () => {
    stubSystemTheme(true);
    localStorage.setItem(THEME_STORAGE_KEY, "blue");
    expect(resolveTheme()).toBe("dark");
  });
});

describe("applyTheme and setTheme", () => {
  it("applyTheme sets the attribute without storing it", () => {
    applyTheme("dark");
    expect(attribute()).toBe("dark");
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBeNull();
  });

  it("setTheme sets the attribute and stores it", () => {
    setTheme("dark");
    expect(attribute()).toBe("dark");
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe("dark");
  });

  it("setTheme still applies when storage can't be written", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("full", "QuotaExceededError");
    });
    setTheme("dark");
    expect(attribute()).toBe("dark");
  });
});

describe("external store", () => {
  it("snapshots the attribute, or null when missing or invalid", () => {
    expect(getSnapshot()).toBeNull();
    document.documentElement.setAttribute("data-theme", "blue");
    expect(getSnapshot()).toBeNull();
    applyTheme("light");
    expect(getSnapshot()).toBe("light");
  });

  it("is unknown on the server", () => {
    expect(getServerSnapshot()).toBeNull();
  });

  it("notifies on attribute changes until unsubscribed", async () => {
    const listener = vi.fn();
    const unsubscribe = subscribe(listener);

    applyTheme("dark");
    await Promise.resolve();
    expect(listener).toHaveBeenCalledTimes(1);

    unsubscribe();
    applyTheme("light");
    await Promise.resolve();
    expect(listener).toHaveBeenCalledTimes(1);
  });
});

describe("themeInitScript", () => {
  const run = () => new Function(themeInitScript)();

  it("applies a stored dark theme", () => {
    stubSystemTheme(false);
    localStorage.setItem(THEME_STORAGE_KEY, "dark");
    run();
    expect(attribute()).toBe("dark");
  });

  it("prefers a stored light theme over a dark system", () => {
    stubSystemTheme(true);
    localStorage.setItem(THEME_STORAGE_KEY, "light");
    run();
    expect(attribute()).toBe("light");
  });

  it("ignores an invalid stored value", () => {
    stubSystemTheme(true);
    localStorage.setItem(THEME_STORAGE_KEY, "blue");
    run();
    expect(attribute()).toBe("dark");
  });

  it("uses light when nothing is stored and the system isn't dark", () => {
    stubSystemTheme(false);
    run();
    expect(attribute()).toBe("light");
  });

  it("falls back to the system when storage can't be read", () => {
    stubSystemTheme(true);
    blockStorageReads();
    run();
    expect(attribute()).toBe("dark");
  });

  it("matches resolveTheme", () => {
    stubSystemTheme(true);
    run();
    expect(attribute()).toBe(resolveTheme());
  });
});
