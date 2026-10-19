import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ThemeToggle } from "@/components/ThemeToggle/ThemeToggle";
import { THEME_STORAGE_KEY } from "@/lib/theme";

const attribute = () => document.documentElement.getAttribute("data-theme");

// The sun icon has a <circle>; the moon icon doesn't.
const showsSun = (button: HTMLElement) =>
  button.querySelector("svg circle") !== null;

describe("ThemeToggle", () => {
  it("applies the light theme on mount when nothing is set", async () => {
    render(<ThemeToggle />);

    const button = await screen.findByRole("button", {
      name: "Switch to dark theme",
    });
    expect(attribute()).toBe("light");
    expect(showsSun(button)).toBe(false);
  });

  it("switches themes, stores the choice, and renames itself", async () => {
    render(<ThemeToggle />);

    fireEvent.click(
      await screen.findByRole("button", { name: "Switch to dark theme" }),
    );
    const button = await screen.findByRole("button", {
      name: "Switch to light theme",
    });
    expect(attribute()).toBe("dark");
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe("dark");
    expect(showsSun(button)).toBe(true);

    fireEvent.click(button);
    await screen.findByRole("button", { name: "Switch to dark theme" });
    expect(attribute()).toBe("light");
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe("light");
  });

  it("starts dark when dark is stored", async () => {
    localStorage.setItem(THEME_STORAGE_KEY, "dark");
    render(<ThemeToggle />);

    expect(
      await screen.findByRole("button", { name: "Switch to light theme" }),
    ).toBeInTheDocument();
    expect(attribute()).toBe("dark");
  });
});
