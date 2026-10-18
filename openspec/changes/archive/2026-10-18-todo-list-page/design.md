## Context

The stack is Next.js 16.4 App Router with `cacheComponents: true` (pages are prerendered), React 19, strict TypeScript, the `src/` layout, CSS Modules, and no Tailwind. Anything that exists only in the browser (localStorage, `matchMedia`) must be read on the client without causing hydration mismatches. A previous, now-removed change left code in `src/components/` and `src/lib/`. Per the proposal, that code is deleted and rebuilt. The `tests/` and `e2e/` folders are gone, but `vitest.config.mts` still names `tests/setup.ts`, and CI still runs `npm run test` and `npm run test:e2e`. Requirements are in `specs/todo-list/spec.md` and `specs/theme/spec.md`.

## Goals / Non-Goals

**Goals:**
- One set of CSS custom properties for colors, margins, and paddings, used by every module. Switching themes changes only the color variables.
- No hydration warnings, no flash of the wrong theme, and no false "No todos yet" before saved todos appear.
- Storage and theme logic in small plain-TypeScript modules, kept out of components.

**Non-Goals:**
- Tests. Runners stay installed and CI keeps its test steps, but they pass with zero tests.
- Syncing between tabs (last write wins), and a general component library.

## Decisions

**1. Start clean.**
Delete `src/components/` and `src/lib/`, and reset `src/app/page.tsx`, `page.module.css`, `layout.tsx`, and `globals.css` to the placeholder state, before building. This way, every file in the result comes from this plan.
*Alternative:* editing the leftover code in place. Rejected by the user in favor of a rebuild.

**2. Component layout.**
`src/app/page.tsx` stays a Server Component and renders a header (the "Todo" `<h1>` and `<ThemeToggle />`) followed by `<TodoApp />`. The client components live in `src/components/<Name>/<Name>.tsx`, each with a co-located `<Name>.module.css`:
- `ThemeToggle`
- `TodoApp`, which owns the list
- `TodoForm`
- `TodoItem`

**3. Todo state: an external store read with `useSyncExternalStore`.**
`src/lib/todo-store.ts` exports `subscribe`, `getSnapshot`, `getServerSnapshot`, `addTodo(text, date)`, and `toggleTodo(id)`:
- It loads lazily from localStorage on the first client read.
- It keeps an immutable cached array, so snapshots are referentially stable.
- It writes through to storage on every change.
- `getServerSnapshot` returns `null` ("not loaded"). While the snapshot is `null`, `TodoApp` renders only the form, so "No todos yet" never flashes before saved todos appear.

*Alternative:* `useState` + `useEffect`. That causes an extra render, and the `set-state-in-effect` rule that `eslint-config-next` 16 enables flags it.

**4. Data model and storage.**
`type Todo = { id: string; text: string; date: string | null; done: boolean }`:
- `date` is the date input's raw `YYYY-MM-DD` value, or `null`.
- `id` comes from `crypto.randomUUID()`, with a fallback for non-secure contexts such as plain-http LAN access.

The data is stored under the key `todo-openspec:todos` as `{ "version": 1, "todos": [...] }`. Loading validates the shape by hand, and any failure (bad JSON, wrong version or field types, or a throwing `localStorage`) yields `[]`. Writes are wrapped in `try/catch`, so blocked or full storage leaves the in-memory list working.

**5. Date display safe across time zones.**
`src/lib/format-date.ts` builds `new Date(Date.UTC(y, m - 1, d))` from the `YYYY-MM-DD` parts and formats it with `Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeZone: "UTC" })`. Using UTC on both sides means the day never shifts. The item renders `<time dateTime="YYYY-MM-DD">`. Todos render only on the client (see Decision 3), so locale formatting can't cause a hydration mismatch.

**6. Form: one `<form onSubmit>` covers both the button and Enter.**
`TodoForm` has a labelled text input, a labelled `type="date"` input, and a `type="submit"` "Add" button inside a single `<form>`. The browser submits it when the button is clicked or when Enter is pressed in either input, so there are no key handlers to write. `onSubmit` calls `preventDefault()`, then:
- **Blank text:** set the error state. The input gets `aria-invalid="true"` and `aria-describedby` pointing to a `role="alert"` "Enter a todo" message, and typing clears it.
- **Otherwise:** call `addTodo`, reset both fields, and refocus the text input through a ref.

The form uses `noValidate` and no `required` attribute, so the browser tooltip doesn't replace the specified message. That attribute also wouldn't catch whitespace-only text.

**7. Checkbox and strike-through.**
`TodoItem` renders a `<label>` that wraps `<input type="checkbox" aria-label="Mark <text> as done">` and the text, so the whole row is clickable. A `done` class applies `text-decoration: line-through` and the muted color, and `accent-color: var(--color-accent)` themes the native box.

**8. Design tokens in `src/app/globals.css`.**
- **Colors:** `--color-bg`, `--color-surface`, `--color-text`, `--color-text-muted`, `--color-border`, `--color-border-strong`, `--color-accent`, `--color-accent-hover`, `--color-accent-contrast`, `--color-danger`, `--color-focus`.
- **Spacing:** one scale, `--space-1` to `--space-16` (0.25rem to 4rem), used for every margin, padding, and gap. Named aliases sit on top: `--padding-control`, `--padding-card`, `--padding-page`, `--margin-section`.
- **Other:** `--radius`, `--border-width`, `--font-size-*`, `--content-width`, `--focus-ring`.

Light values go on `:root`, and dark color overrides go on `:root[data-theme="dark"]`. Each theme also sets `color-scheme`, so the native date picker and checkbox match. A `@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) { … } }` copy of the dark colors keeps the system default working if the script never runs. Modules use only `var(--…)` for color, margin, and padding (plus `0`, `auto`, and `none`). Colors are chosen for WCAG AA in both themes. For example, light text `#18181b` on `#f7f7f8` and dark text `#f4f4f5` on `#0f0f12` are both well above 4.5:1.

**9. Theme without a flash (following the bundled Next 16 guide, "Preventing flash before hydration").**
- **Before paint:** the theme is the `data-theme` attribute on `<html>`. `layout.tsx` renders an inline script in `<head>`. It reads `localStorage["todo-openspec:theme"]`, uses it if it is `"light"` or `"dark"`, and otherwise uses `matchMedia("(prefers-color-scheme: dark)")`. It then sets the attribute, inside `try/catch`. `<html>` gets `suppressHydrationWarning`.
- **No dev warning:** the script is rendered through a small `InlineScript` component. It renders `type="text/javascript"` on the server and `text/plain` on the client, which avoids React's development warning about `<script>` tags.
- **Live updates:** `src/lib/theme.ts` exposes the theme as an external store. `getSnapshot` reads the attribute, `subscribe` uses a `MutationObserver` on it, and `setTheme` sets the attribute and saves the choice. `ThemeToggle` reads it with `useSyncExternalStore`. Its server snapshot is `null`, so it renders with the neutral name "Toggle theme" until hydrated.
- **Dev remount:** Strict Mode's remount in dev can clear the attribute, so `ThemeToggle` re-applies the resolved theme in a `useLayoutEffect` when the attribute is missing.

*Alternative:* `next-themes`. It adds a dependency for about 40 lines of code.

**10. Test scripts pass with no tests.**
- Change `"test"` to `vitest run --passWithNoTests` and `"test:e2e"` to `playwright test --pass-with-no-tests`.
- Remove `setupFiles` from `vitest.config.mts`, since that file no longer exists.

CI stays unchanged. When tests come back, a future change re-adds the setup file and removes the flags.
*Alternative:* removing the test steps from CI. Rejected because it's more churn to undo later.

## Risks / Trade-offs

- **Without tests, regressions show up only by hand** → The tasks include a hands-on check of every spec scenario in both themes and a production-build smoke run. Tests are the obvious follow-up change.
- **The inline theme script is a string, so it isn't type-checked** → Keep it short, and build it from the same storage-key constant as `theme.ts`.
- **Two tabs overwrite each other's todos** → This is accepted, as listed in the Non-Goals.
- **The dark colors are duplicated in the `@media` fallback** → A comment marks the pair as needing to stay in sync. The block is short.
