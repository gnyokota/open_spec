## Context

This builds on `setup-project`: Next.js 16.4 App Router, React 19, strict TypeScript, `src/` layout, CSS Modules with no Tailwind, Vitest + Testing Library in `tests/`, and Playwright in `e2e/`. `next.config.ts` has `cacheComponents: true`, so pages are prerendered and anything that only exists in the browser (localStorage, `matchMedia`) has to be read on the client. The repo has no shared components or utilities yet. Requirements are in `specs/todo-list/spec.md` and `specs/theme/spec.md`.

## Goals / Non-Goals

**Goals:**
- One set of design tokens (CSS custom properties) that every module uses for color, padding, and margin. Switching themes changes only color tokens.
- No hydration warnings, and no flash of the wrong theme or of a false "No todos yet" before stored todos load.
- Storage logic in plain TypeScript, separate from React, so it can be unit-tested without the DOM.

**Non-Goals:**
- Syncing between tabs. With two open tabs, the last write wins. This can be added later with the `storage` event.
- A general component library. Only the components this screen needs.
- Stylelint or other automated token enforcement. Token use is checked by review and a grep in the tasks.

## Decisions

**1. Component layout.**
`src/app/page.tsx` stays a Server Component and renders the page shell: a header with the "Todo" `<h1>` and `<ThemeToggle />`, followed by `<TodoApp />`. The client components live in `src/components/`:
- `ThemeToggle/ThemeToggle.tsx`
- `TodoApp/TodoApp.tsx`, which owns the list state
- `TodoForm/TodoForm.tsx`
- `TodoItem/TodoItem.tsx`

Each has a co-located `*.module.css`. Keeping the shell on the server means the heading and layout are prerendered, and only the interactive parts ship JavaScript.
*Alternative:* making the whole page a Client Component. That is simpler, but it gives up prerendering and puts layout and behavior in one file.

**2. Todo state as an external store read with `useSyncExternalStore`.**
`src/lib/todo-store.ts` exports `subscribe`, `getSnapshot`, `getServerSnapshot`, `addTodo(text, date)`, and `toggleTodo(id)`. The store loads from localStorage lazily on the first client `getSnapshot` call, keeps an immutable cached array (so snapshots are referentially stable), and writes through to storage on every change. `getServerSnapshot` returns `null`, which means "not loaded yet". While the snapshot is `null`, `TodoApp` renders the form but no list and no empty message. That prevents a false "No todos yet" from showing during hydration.
*Alternatives:* `useState` + `useEffect` loading. That causes an extra render and is flagged by the React Hooks lint rules (`set-state-in-effect`) that `eslint-config-next` 16 enables. A context/reducer adds code without benefit for a single list.

**3. Data model and storage format.**
`type Todo = { id: string; text: string; date: string | null; done: boolean }`:
- `id` comes from `crypto.randomUUID()`.
- `date` is the date input's raw `YYYY-MM-DD` value, or `null`.

The data is stored under the localStorage key `todo-openspec:todos` as `{ "version": 1, "todos": Todo[] }`. Loading validates the shape by hand: it must be an object with `version === 1` and an array of todos with the right field types and a valid date pattern. Any failure (a parse error, the wrong shape, or a throwing `localStorage`) yields `[]`. Writes are wrapped in `try/catch`, so a blocked storage or quota error leaves the in-memory list working. The version field allows a future migration, for example when a server is added.
*Alternative:* storing dates as ISO timestamps. Rejected because converting a date-only value through `Date` and a time zone shifts the day.

**4. Time-zone-safe date display.**
`src/lib/format-date.ts` splits `YYYY-MM-DD` into numbers and formats `new Date(Date.UTC(y, m - 1, d))` with `Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeZone: "UTC" })`. Using UTC on both sides means the calendar day never shifts, whatever the user's time zone. The item renders `<time dateTime="YYYY-MM-DD">`.

**5. Form behavior.**
`TodoForm` is a controlled `<form>` with `onSubmit` (so Enter submits). It has a labelled text input, a labelled `type="date"` input, and a submit button. On a blank submit, it sets an error state: `aria-invalid="true"`, `aria-describedby` pointing to a `role="alert"` message saying "Enter a todo". Typing clears the error. On success, it calls `addTodo`, resets both fields, and refocuses the text input through a ref. The native `required` attribute is not used, because the browser's own tooltip would replace the specified message, and it would not catch whitespace-only text.

**6. Checkbox and strike-through.**
`TodoItem` renders a `<label>` containing `<input type="checkbox">` and the text. That makes the whole row clickable, and the accessible name is set with `aria-label={`Mark ${text} as done`}`. A `done` class applies `text-decoration: line-through` and the muted text color. `accent-color: var(--color-accent)` themes the native checkbox.

**7. Design tokens in `src/app/globals.css`.**
- **Colors:** `--color-bg`, `--color-surface`, `--color-text`, `--color-text-muted`, `--color-border`, `--color-accent`, `--color-accent-contrast`, `--color-danger`, `--color-focus`.
- **Spacing:** a single scale used for every padding, margin, and gap: `--space-1` 4px, `--space-2` 8px, `--space-3` 12px, `--space-4` 16px, `--space-6` 24px, `--space-8` 32px. Semantic aliases sit on top of it: `--padding-control`, `--padding-card`, `--margin-section`.
- **Other:** `--radius`, `--font-size-*`, and a `--focus-ring` shorthand.

Light values go on `:root`, and dark color overrides go on `:root[data-theme="dark"]`. Each theme also sets `color-scheme` (light/dark), so native controls like the date picker and scrollbars match. CSS Modules use only `var(--…)` for color, padding, and margin. Raw values appear only in the token definitions. Colors are chosen to meet WCAG AA in both themes and are checked in the tasks.
*Alternative:* separate padding and margin scales. Rejected because one spacing scale keeps rhythm consistent, and the semantic aliases cover the "padding" and "margin" names.

**8. Theme application without a flash.**
The active theme is the `data-theme` attribute on `<html>`. `layout.tsx` puts a small inline `<script>` in `<head>`, which runs before first paint. It reads `localStorage["todo-openspec:theme"]`, uses it if it is `"light"` or `"dark"`, and otherwise uses `matchMedia("(prefers-color-scheme: dark)")`. It then sets `data-theme`, and everything is wrapped in `try/catch`. `<html>` gets `suppressHydrationWarning`, because the attribute differs from the server HTML. A CSS fallback, `@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) { … } }`, keeps the system default working even if the script fails.
`src/lib/theme.ts` exposes the current theme as an external store. It reads `document.documentElement.dataset.theme`, and `setTheme` sets the attribute, saves the choice, and notifies subscribers. `ThemeToggle` reads it with `useSyncExternalStore`. Its server snapshot is `null`, so before hydration it renders with the neutral name "Toggle theme", and after hydration it switches to the "Switch to dark/light theme" name.
*Alternative:* the `next-themes` package. It would solve this, but it adds a dependency for about 30 lines of code.

**9. Testing split.**
- **Vitest, logic:** `todo-store` (add, trim, toggle, persistence round-trip, corrupted and throwing storage), `format-date` (time zones, using `process.env.TZ` set per test file), and `theme`.
- **Vitest, components:** `TodoForm`, `TodoItem`, `TodoApp`, and `ThemeToggle`, using Testing Library `fireEvent`. No new dependencies.
- **Playwright, browser behavior:** reload persistence, `colorScheme` emulation for the system default, theme persistence across reload with no flash (the `data-theme` attribute is checked in an init script at `DOMContentLoaded`), keyboard operation, and `timezoneId` for the date display.

## Risks / Trade-offs

- [The inline theme script is a raw string in JSX, so it isn't type-checked or linted] → Keep it under about 10 lines, build it from constants shared with `src/lib/theme.ts` (the storage key), and cover it with the Playwright no-flash and persistence tests.
- [`cacheComponents` prerendering changes around client-only APIs in future Next versions] → All browser-API access goes through `getSnapshot` / event handlers, never during render on the server. `npm run build` in CI catches prerender errors.
- [Two tabs overwrite each other's todos] → Accepted for now, as listed in the Non-Goals.
- [Contrast regressions when token colors are tweaked] → The tasks include a contrast check of each text/background token pair in both themes. A Vitest test computes the ratios from the token values.
- [The native date input looks different across browsers] → This is accepted. It is themed through `color-scheme`, and only Chromium is tested in e2e.
