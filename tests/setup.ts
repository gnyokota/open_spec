import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

import { resetTodoStore } from "@/lib/todo-store";

// The todo store caches its list in module scope and the theme lives on <html>,
// so reset both (plus storage and mocks) to keep tests independent.
afterEach(() => {
  cleanup();
  localStorage.clear();
  resetTodoStore();
  document.documentElement.removeAttribute("data-theme");
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
