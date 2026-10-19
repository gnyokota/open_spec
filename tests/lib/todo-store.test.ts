import { describe, expect, it, vi } from "vitest";

import {
  addTodo,
  getServerSnapshot,
  getSnapshot,
  resetTodoStore,
  subscribe,
  toggleTodo,
  TODOS_STORAGE_KEY,
  type Todo,
} from "@/lib/todo-store";

function stored(): unknown {
  const raw = localStorage.getItem(TODOS_STORAGE_KEY);
  return raw === null ? null : JSON.parse(raw);
}

function store(data: unknown) {
  localStorage.setItem(TODOS_STORAGE_KEY, JSON.stringify(data));
}

const milk: Todo = {
  id: "a",
  text: "Buy milk",
  date: "2026-10-20",
  done: true,
};
const mom: Todo = { id: "b", text: "Call mom", date: null, done: false };

describe("addTodo", () => {
  it("adds a trimmed, unchecked todo and returns it", () => {
    const todo = addTodo("  Pay rent  ", "2026-10-20");

    expect(todo).toEqual({
      id: expect.any(String),
      text: "Pay rent",
      date: "2026-10-20",
      done: false,
    });
    expect(getSnapshot()).toEqual([todo]);
  });

  it.each(["", "   "])("rejects blank text %j and changes nothing", (text) => {
    addTodo("Keep me", null);
    const before = getSnapshot();

    expect(addTodo(text, "2026-10-20")).toBeNull();
    expect(getSnapshot()).toBe(before);
  });

  it.each([null, "", "2026-02-30", "not a date"])(
    "stores no date for %j",
    (date) => {
      expect(addTodo("Call mom", date)?.date).toBeNull();
    },
  );

  it("appends in order with unique ids", () => {
    addTodo("First", null);
    addTodo("Second", null);
    addTodo("Third", null);

    const todos = getSnapshot();
    expect(todos.map((todo) => todo.text)).toEqual([
      "First",
      "Second",
      "Third",
    ]);
    expect(new Set(todos.map((todo) => todo.id)).size).toBe(3);
  });
});

describe("toggleTodo", () => {
  it("flips only the matching todo, and flips it back", () => {
    const first = addTodo("First", null)!;
    addTodo("Second", null);

    toggleTodo(first.id);
    expect(getSnapshot().map((todo) => todo.done)).toEqual([true, false]);

    toggleTodo(first.id);
    expect(getSnapshot().map((todo) => todo.done)).toEqual([false, false]);
  });

  it("changes nothing for an unknown id", () => {
    addTodo("First", null);
    const before = getSnapshot();

    toggleTodo("missing");
    expect(getSnapshot()).toEqual(before);
  });
});

describe("persistence", () => {
  it("saves the versioned list in order after every change", () => {
    const first = addTodo("First", "2026-10-20")!;
    const second = addTodo("Second", null)!;
    toggleTodo(first.id);

    expect(stored()).toEqual({
      version: 1,
      todos: [
        { ...first, done: true },
        { ...second, done: false },
      ],
    });
  });

  it("loads a valid stored list", () => {
    store({ version: 1, todos: [milk, mom] });
    resetTodoStore();

    expect(getSnapshot()).toEqual([milk, mom]);
  });

  it("starts empty when nothing is stored", () => {
    expect(getSnapshot()).toEqual([]);
  });

  it.each([
    ["wrong version", { version: 2, todos: [milk] }],
    ["non-array todos", { version: 1, todos: { 0: milk } }],
    ["blank text", { version: 1, todos: [{ ...milk, text: "  " }] }],
    ["bad date", { version: 1, todos: [{ ...milk, date: "2026-02-30" }] }],
    [
      "missing field",
      { version: 1, todos: [{ id: "a", text: "x", date: null }] },
    ],
    ["bare array", [milk]],
  ])("starts empty with %s", (_, data) => {
    store(data);
    expect(getSnapshot()).toEqual([]);
  });

  it("starts empty with invalid JSON", () => {
    localStorage.setItem(TODOS_STORAGE_KEY, "{not json");
    expect(getSnapshot()).toEqual([]);
  });

  it("starts empty when storage can't be read", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new DOMException("blocked", "SecurityError");
    });
    expect(getSnapshot()).toEqual([]);
  });

  it("keeps working in memory when storage can't be written", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("full", "QuotaExceededError");
    });
    const listener = vi.fn();
    subscribe(listener);

    const todo = addTodo("Buy milk", null)!;
    toggleTodo(todo.id);

    expect(getSnapshot()).toEqual([{ ...todo, done: true }]);
    expect(listener).toHaveBeenCalledTimes(2);
  });
});

describe("useSyncExternalStore contract", () => {
  it("returns the same snapshot until something changes", () => {
    const before = getSnapshot();
    expect(getSnapshot()).toBe(before);

    addTodo("Buy milk", null);
    const after = getSnapshot();
    expect(after).not.toBe(before);
    expect(getSnapshot()).toBe(after);
  });

  it("has no todos on the server", () => {
    expect(getServerSnapshot()).toBeNull();
  });

  it("notifies listeners on changes until unsubscribed", () => {
    const listener = vi.fn();
    const unsubscribe = subscribe(listener);

    const todo = addTodo("Buy milk", null)!;
    expect(listener).toHaveBeenCalledTimes(1);

    addTodo("   ", null);
    expect(listener).toHaveBeenCalledTimes(1);

    toggleTodo(todo.id);
    expect(listener).toHaveBeenCalledTimes(2);

    unsubscribe();
    addTodo("Call mom", null);
    expect(listener).toHaveBeenCalledTimes(2);
  });
});
