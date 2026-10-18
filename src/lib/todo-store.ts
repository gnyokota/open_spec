import { isIsoDate } from "@/lib/format-date";

export type Todo = {
  id: string;
  text: string;
  /** `YYYY-MM-DD`, or null when no date was given. */
  date: string | null;
  done: boolean;
};

export const TODOS_STORAGE_KEY = "todo-openspec:todos";
const STORAGE_VERSION = 1;

/** null until first read on the client. */
let todos: Todo[] | null = null;
const listeners = new Set<() => void>();

function isTodo(value: unknown): value is Todo {
  if (typeof value !== "object" || value === null) return false;
  const todo = value as Record<string, unknown>;
  return (
    typeof todo.id === "string" &&
    typeof todo.text === "string" &&
    todo.text.trim() !== "" &&
    (todo.date === null || isIsoDate(todo.date)) &&
    typeof todo.done === "boolean"
  );
}

function load(): Todo[] {
  try {
    const raw = localStorage.getItem(TODOS_STORAGE_KEY);
    if (raw === null) return [];
    const data: unknown = JSON.parse(raw);
    if (
      typeof data === "object" &&
      data !== null &&
      "version" in data &&
      data.version === STORAGE_VERSION &&
      "todos" in data &&
      Array.isArray(data.todos) &&
      data.todos.every(isTodo)
    ) {
      return data.todos;
    }
  } catch {
    // Unreadable storage or invalid JSON: start fresh.
  }
  return [];
}

function commit(next: Todo[]): void {
  todos = next;
  try {
    localStorage.setItem(
      TODOS_STORAGE_KEY,
      JSON.stringify({ version: STORAGE_VERSION, todos: next }),
    );
  } catch {
    // Storage blocked or full: keep working in memory for this visit.
  }
  listeners.forEach((listener) => listener());
}

function createId(): string {
  // randomUUID needs a secure context; fall back for plain-http LAN access.
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getSnapshot(): Todo[] {
  todos ??= load();
  return todos;
}

/** Todos are unknown during server rendering. */
export function getServerSnapshot(): Todo[] | null {
  return null;
}

/** Appends a todo. Returns null (and changes nothing) for blank text. */
export function addTodo(text: string, date: string | null): Todo | null {
  const trimmed = text.trim();
  if (trimmed === "") return null;
  const todo: Todo = {
    id: createId(),
    text: trimmed,
    date: date && isIsoDate(date) ? date : null,
    done: false,
  };
  commit([...getSnapshot(), todo]);
  return todo;
}

export function toggleTodo(id: string): void {
  commit(
    getSnapshot().map((todo) =>
      todo.id === id ? { ...todo, done: !todo.done } : todo,
    ),
  );
}

/** Test helper: forget the in-memory list so the next read reloads storage. */
export function resetTodoStore(): void {
  todos = null;
  listeners.clear();
}
