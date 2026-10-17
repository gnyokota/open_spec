## 0. Prerequisite

- [ ] 0.1 Confirm `setup-project` is fully implemented (Tailwind removed, Vitest and Playwright configured, CI green). Verify that `openspec instructions apply --change setup-project --json` reports `all_done`, and that `npm run lint && npm run typecheck && npm run test && npm run build` exits 0.

## 1. Design tokens and themes

- [ ] 1.1 Define the light-theme tokens on `:root` in `src/app/globals.css`: the colors, the `--space-*` scale, the `--padding-control`, `--padding-card`, and `--margin-section` aliases, `--radius`, `--font-size-*`, `--focus-ring`, and `color-scheme: light`. Add dark color overrides plus `color-scheme: dark` on `:root[data-theme="dark"]`, and the `@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) }` fallback. Base `body` styles must use only tokens. Verify that `npm run build` passes and that `/` renders dark when the OS prefers dark.
- [ ] 1.2 Add `tests/tokens.test.ts`, which parses `globals.css`, resolves each theme's text/background token pairs (text, muted text, accent-contrast on accent, danger on bg), and checks that each contrast ratio is at least 4.5:1. Verify that `npm run test` passes, and that it fails if a dark text token is temporarily set to the background color.

## 2. Theme switching

- [ ] 2.1 Create `src/lib/theme.ts` with the storage key constant, `type Theme = "light" | "dark"`, `subscribe`, `getSnapshot` (reads `<html data-theme>`), `getServerSnapshot` (returns `null`), and `setTheme` (sets the attribute, saves to localStorage inside try/catch, and notifies subscribers). Export the inline init-script string, built from the same key. Verify with `tests/theme.test.ts`: `setTheme` updates the attribute and storage, a throwing storage doesn't break `setTheme`, and evaluating the init script picks the stored value, then the `matchMedia` result for invalid or missing values.
- [ ] 2.2 In `src/app/layout.tsx`, render the init script in `<head>` and add `suppressHydrationWarning` to `<html>`. Verify that the dev server shows no hydration warning in the browser console in either theme.
- [ ] 2.3 Create `src/components/ThemeToggle/ThemeToggle.tsx` and `ThemeToggle.module.css`. It's a `<button type="button">` using `useSyncExternalStore`, with the accessible name "Switch to dark theme" or "Switch to light theme" (and "Toggle theme" before hydration), styled only with tokens. Verify with `tests/theme-toggle.test.tsx`: clicking flips `data-theme` and the accessible name.

## 3. Todo data

- [ ] 3.1 Create `src/lib/format-date.ts` (`YYYY-MM-DD` → medium locale date via UTC). Verify with `tests/format-date.test.ts`, which formats `2026-10-20` as "Oct 20, 2026" (en-US) under `TZ` values of `Pacific/Honolulu` and `Pacific/Kiritimati`.
- [ ] 3.2 Create `src/lib/todo-store.ts`: the `Todo` type, `subscribe`/`getSnapshot`/`getServerSnapshot`, `addTodo` (trims text, `null` date when empty, appends, `done: false`), and `toggleTodo`, with the versioned `todo-openspec:todos` format, hand-written shape validation, and try/catch around storage reads and writes. Verify with `tests/todo-store.test.ts`, covering: add with and without a date, trimming, insertion order, toggle, persistence round-trip, invalid JSON, wrong version, wrong field types → `[]`, a throwing `localStorage` still allows add and toggle in memory, and `getSnapshot` returning the same reference when nothing changed.

## 4. Todo UI

- [ ] 4.1 Create `src/components/TodoForm/TodoForm.tsx` and its `.module.css`. Inputs labelled "Todo" and "Date", an "Add" button, submit on Enter, blank → `aria-invalid` plus a `role="alert"` message saying "Enter a todo", the error clears on typing, and on success the fields clear and the text input is refocused. Verify each scenario in `tests/todo-form.test.tsx`.
- [ ] 4.2 Create `src/components/TodoItem/TodoItem.tsx` and its `.module.css`. A label with a checkbox (`aria-label="Mark <text> as done"`), the text, and an optional `<time dateTime>` with the formatted date. A `done` class strikes through and mutes the text, and `accent-color` uses the token. Verify with `tests/todo-item.test.tsx`: the checked state and the `line-through` class follow `done`, no date element renders when the date is `null`, and the change event calls `onToggle`.
- [ ] 4.3 Create `src/components/TodoApp/TodoApp.tsx` and its `.module.css`. It reads the store with `useSyncExternalStore`, renders `TodoForm`, renders nothing while the snapshot is `null`, shows "No todos yet" when the list is empty, and shows a `<ul>` of `TodoItem` otherwise. Verify with `tests/todo-app.test.tsx`: adding two todos lists them in order, checking one strikes it through, and the empty message appears and disappears.
- [ ] 4.4 Update `src/app/page.tsx` and `page.module.css` to render the header (the `<h1>Todo</h1>` and `<ThemeToggle />`) and `<TodoApp />` in a centered, token-spaced column. Verify that the existing home tests (`tests/home.test.tsx`, `e2e/home.spec.ts`) still pass, and that `npm run build` prerenders `/` without errors.
- [ ] 4.5 Check token-only styling. Verify that `grep -nE "#[0-9a-fA-F]{3,8}|rgb|hsl|[0-9]+px" src/**/*.module.css` finds no color, padding, or margin literals (border widths such as `1px` are allowed only where a token would be pointless, and each is noted in review).

## 5. End-to-end

- [ ] 5.1 Add `e2e/todos.spec.ts`. Add a todo with a date and one without, check one, and reload: the order, dates, and checked/struck-through state persist. A whitespace-only submit shows "Enter a todo" and adds nothing. Keyboard only: Tab to the inputs, Enter submits, and Space toggles a checkbox. With `test.use({ timezoneId: "Pacific/Honolulu" })` and again with `Pacific/Kiritimati`, `2026-10-20` displays as Oct 20, 2026. Verify that `npm run test:e2e` passes.
- [ ] 5.2 Add `e2e/theme.spec.ts`. `colorScheme: "dark"` → `data-theme="dark"` on first load, and `"light"` → light. Toggling switches the theme and the button name. After choosing dark under a light system preference and reloading, an init script recording `data-theme` at `DOMContentLoaded` sees `"dark"` (no flash). A stored "light" wins over a dark system preference. Verify that `npm run test:e2e` passes.

## 6. Wrap-up

- [ ] 6.1 Run the full CI sequence locally: `npm ci`, `lint`, `format:check`, `typecheck`, `test`, `build`, and `CI=1 npm run test:e2e`. Verify that every step exits 0 and `openspec validate project-ui --strict` passes.
- [ ] 6.2 Check both themes by hand in the dev server (add, check, and reload todos, and use the toggle), with no console errors or hydration warnings. Update README's feature list. Verify that README mentions todos, dates, completion, and themes.
