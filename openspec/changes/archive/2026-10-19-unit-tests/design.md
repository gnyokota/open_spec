## Context

- **Test tooling is installed but unused.** Vitest 5, `@vitejs/plugin-react`, jsdom, React Testing Library, and `@testing-library/jest-dom` are installed (`@testing-library/user-event` is not), and Vitest is configured in `vitest.config.mts` (jsdom, `tsconfigPaths`, `include: ["tests/**/*.test.{ts,tsx}"]`). `tests/` doesn't exist. The old `tests/setup.ts` (jest-dom matchers plus `cleanup`) was deleted, and its `setupFiles` entry was removed from the config.
- **Module-level state.** `src/lib/todo-store.ts` keeps `todos` and `listeners` in module scope and loads from `localStorage` lazily on the first `getSnapshot()`. It exports `resetTodoStore()` for tests. `src/lib/theme.ts` keeps its state on `<html data-theme>`.
- **jsdom gaps.** It has no `matchMedia` (so `getSystemTheme()` returns `"light"`), no layout or computed colors, and CSS Modules aren't processed by default (`css.include: []`).
- **Dates.** `formatDate` parses and formats in UTC through `Intl.DateTimeFormat`, so the result shouldn't depend on the process time zone.

See proposal.md for motivation and scope.

## Goals / Non-Goals

**Goals:**
- Each test is independent. It runs with an empty `localStorage`, a fresh todo store, no `data-theme` attribute, and an empty DOM, in any order.
- Tests check behavior through public exports and accessible roles and names, not internals, so refactors don't break them.
- The suite stays fast (a few seconds) and deterministic, with no real timers, network, or random IDs in assertions.

**Non-Goals:**
- Testing `next/font`, `layout.tsx`, or anything that needs a Next.js runtime.
- Mocking React or Next internals.

## Decisions

**1. File layout mirrors `src/`.**
`tests/lib/format-date.test.ts`, `tests/lib/todo-store.test.ts`, `tests/lib/theme.test.ts`, `tests/components/<Name>.test.tsx`, and `tests/app/page.test.tsx`. This fits the existing `include` glob, so no config change is needed for discovery.
*Alternative:* co-locating `*.test.tsx` next to components in `src/`. Rejected because the project context and README define `tests/` as the place for unit tests.

**2. One global setup file resets all shared state.**
`tests/setup.ts` imports `@testing-library/jest-dom/vitest`, and in `afterEach` runs `cleanup()`, `localStorage.clear()`, `resetTodoStore()`, removes `data-theme` from `<html>`, and calls `vi.restoreAllMocks()` and `vi.unstubAllGlobals()`. It goes back into `setupFiles`.
*Why:* the todo store caches its list in module scope. Without `resetTodoStore()`, one test's todos leak into the next.
*Alternative:* resetting in each test file. Rejected because it's easy to forget, and a forgotten reset gives order-dependent failures.

**3. Simulate storage failures with spies on `Storage.prototype`.**
`vi.spyOn(Storage.prototype, "getItem" | "setItem").mockImplementation(() => { throw new DOMException(...) })` covers "storage unavailable" and "storage full". Corrupt data is written directly with `localStorage.setItem(TODOS_STORAGE_KEY, ...)`: invalid JSON, wrong `version`, a non-array `todos`, and an item with a blank text, a bad date, or a missing field.
*Alternative:* replacing `window.localStorage` with a fake. Rejected because jsdom's real storage is closer to a browser, and spies are restored automatically.

**4. Stub `matchMedia` per test where needed.**
A small helper in the theme tests uses `vi.stubGlobal("matchMedia", (q) => ({ matches: ..., media: q, ... }))`. Tests without the stub cover the "no `matchMedia`" path, which falls back to light.

**5. Run `themeInitScript` for real.**
The test runs the exported string with `new Function(themeInitScript)()` against jsdom and checks the resulting `data-theme` for: stored `"dark"`, stored `"light"` with a dark system preference, a stored invalid value, and a throwing `getItem`. This is the only way to check that the inline script mirrors `resolveTheme()`, which the theme spec depends on.

**6. Check time-zone independence by changing `process.env.TZ`.**
Node applies a new `TZ` value at runtime. The `formatDate` tests set `TZ` to `Pacific/Honolulu` (UTC−10) and `Pacific/Kiritimati` (UTC+14), matching the todo-list spec scenario, assert `"Oct 20, 2026"` with locale `en-US`, and restore the original value afterward. The locale is always passed explicitly, so results don't depend on the CI machine's locale.

**7. Interact with components through `fireEvent`, not `user-event`.**
`@testing-library/user-event` isn't installed, and the proposal adds no dependencies. `fireEvent.change`, `fireEvent.click`, and `fireEvent.submit` cover typing, checking, and submitting. Pressing Enter is covered by submitting the form (`fireEvent.submit(form)`), since jsdom doesn't do implicit form submission on a keydown.
*Trade-off:* `fireEvent` skips some real browser event steps. The Playwright suite, a later change, covers real keyboard behavior.

**8. Assert the strike-through through the `done` class.**
jsdom can't compute `text-decoration`. `TodoItem` tests import its CSS module and assert `toHaveClass(styles.done)` when checked and not when unchecked, along with the checkbox's `checked` state. If Vitest returns an empty class name for unprocessed CSS modules, the config sets `css: { include: [/\.module\.css$/], modules: { classNameStrategy: "non-scoped" } }` so class names are stable and readable.

**9. Check the "no empty-message flash" rule with server rendering.**
`renderToString(<TodoApp />)` from `react-dom/server` uses `getServerSnapshot()` (null). The test asserts that the output has the form but not "No todos yet". A client `render` with stored todos then checks that they show up straight away.

**10. Drop `--passWithNoTests` from `npm run test`.**
Once tests exist, a run that finds zero tests means a broken glob or config, so it should fail. `test:e2e` keeps its flag because `e2e/` is still empty.

## Risks / Trade-offs

- **[Module state leaks between tests]** → The global `afterEach` reset (Decision 2). Vitest isolates each file by default, which also helps.
- **[`process.env.TZ` changes don't apply on some platform]** → The test first checks that `new Date(0).getTimezoneOffset()` changed. If it didn't, it fails with a clear message instead of passing for the wrong reason. Running Vitest with `TZ` set in the script is a fallback.
- **[`Intl` output differs between Node/ICU versions]** (for example, narrow no-break spaces) → Assert only the `en-US` medium date (`"Oct 20, 2026"`), which has no such characters. Node is pinned to 22 by `.nvmrc`.
- **[`useId` makes input IDs unpredictable]** → Query by label (`getByLabelText("Todo")`) and role, never by ID.
- **[A test exposes a real bug]** → Following the proposal, mark the test `it.fails` or skip it with a comment linking the problem, report it, and fix it in its own change. Don't change app code here.

## Migration Plan

Tests only. A rollback deletes `tests/` and restores the old `test` script. CI picks the suite up automatically through the existing `npm run test` step.
