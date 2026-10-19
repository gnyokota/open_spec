## Context

- **Playwright is configured but has no tests.** `playwright.config.ts` uses `testDir: "e2e"`, Chromium only, `baseURL` `http://localhost:3000`, `fullyParallel`, two retries and an HTML report on CI, and traces on the first retry. Its `webServer` runs `npm run dev` locally and `npx serve out -l 3000` on CI (after `npm run build` writes the static export).
- **The page.** `/` has an `<h1>Todo</h1>`, a theme toggle button, and `TodoApp` (the form plus the list). Todos are stored in `localStorage` under `todo-openspec:todos` as `{ version: 1, todos }`. The theme is stored under `todo-openspec:theme`, and an inline `<head>` script sets `<html data-theme>` before first paint.
- **Colors** are hex CSS custom properties in `src/app/globals.css`, so computed colors are plain `rgb()` values and contrast can be calculated in the test.
- **Unit tests** already cover the logic in jsdom (see the archived `unit-tests` change). These tests focus on what only a real browser shows.

See proposal.md for motivation and scope.

## Goals / Non-Goals

**Goals:**
- Each test starts from a fresh browser context, so it has empty storage and needs no cleanup.
- The tests pass against both the dev server (local) and the static export (CI), with no retries needed.
- Every assertion uses Playwright's auto-waiting `expect`, never fixed waits (`waitForTimeout`).

**Non-Goals:**
- Testing component internals or anything the unit tests already cover well, such as every malformed-storage variant.

## Decisions

**1. Two spec files plus one helper module.**
`e2e/todo.spec.ts` covers the `todo-list` spec, and `e2e/theme.spec.ts` covers the `theme` spec. `e2e/helpers.ts` holds the shared steps: `addTodo(page, text, date?)`, `seedTodos(page, todos)`, `seedTheme(page, theme)`, and `contrastRatio(page, locator)`. Each spec's `test.describe` blocks are named after spec requirements, so a failure points at the requirement it breaks.
*Alternative:* one file per requirement. Rejected because there are only two capabilities and one page, so more files would mean repeated setup.

**2. Locators by role and label.**
`getByLabel("Todo")`, `getByLabel("Date")`, `getByRole("button", { name: "Add" })`, `getByRole("checkbox", { name: "Mark Buy milk as done" })`, and `getByRole("listitem")`. These are the names the spec defines, so the tests double as accessibility checks. No `data-testid` attributes are added, since that would need app code changes.

**3. Seed storage before the page loads.**
`page.addInitScript` writes `localStorage` before the app's scripts run on every navigation. For reload tests, the seed is guarded by a `sessionStorage` flag so a reload keeps what the app saved instead of re-seeding. Corrupted data is seeded the same way, as a raw string.

**4. Blocked storage makes `window.localStorage` throw.**
An init script redefines the `localStorage` getter on `window` to throw a `SecurityError`, which is what browsers do when site data is blocked. The app reads storage inside `try` blocks, so the page should still load, add, and check todos, and must show no error page.
*Alternative:* stubbing only `getItem` and `setItem`. Rejected because it is less like the real blocked case.

**5. Time zones with `test.use({ timezoneId, locale })`.**
The "date shown as selected day" scenario runs in a `describe` per zone, with `timezoneId` set to `Pacific/Honolulu` (UTC−10) and then `Pacific/Kiritimati` (UTC+14), and `locale: "en-US"`. It adds a todo dated 2026-10-20 and expects the item to show "Oct 20, 2026" in a `<time dateTime="2026-10-20">`.

**6. Check for the "No todos yet" flash with a `MutationObserver`.**
With todos seeded, an init script starts a `MutationObserver` on the document before the app runs and records whether "No todos yet" ever appears in the DOM. After the seeded todos are visible, the test asserts that the flag was never set. This catches a flash of any length, unlike a screenshot taken at one moment.

**7. Check "before first paint" by blocking the app's JavaScript.**
`page.route("**/_next/static/**/*.js", (route) => route.abort())` stops React and the app bundle from loading. Only the inline `<head>` script can then set the theme. The test seeds a stored theme or emulates a color scheme with `page.emulateMedia({ colorScheme })`, loads `/`, and asserts `<html data-theme>` and the body's computed background color. If the inline script didn't work, the page would show the wrong theme until hydration, and this test fails.
*Alternative:* screenshots early in loading. Rejected because their timing is unreliable.

**8. Calculate contrast from computed colors.**
`contrastRatio(page, locator)` reads the element's computed `color` and the first non-transparent `background-color` found walking up its ancestors, then applies the WCAG 2.1 relative-luminance formula. In both themes it checks text that is always visible: the heading, the "Todo" label (muted text), the input text, the "Add" button text, the error message, a todo's text and its date (muted), the struck-through done text, and "No todos yet". Each must be at least 4.5.
*Alternative:* `@axe-core/playwright`. Rejected because the proposal adds no dependencies, and axe's color check covers only part of this anyway.

**9. Real keyboard input.**
Enter is pressed with `page.keyboard.press("Enter")` while focus is in the text input, and again in the date input. Checking uses `press("Space")` on the focused checkbox. The date is filled with `locator.fill("2026-10-20")`, which Chromium accepts for `type="date"`.

**10. Remove `--pass-with-no-tests` from `test:e2e`.**
Same reasoning as the unit test change: a run that finds no tests means something is broken.

## Risks / Trade-offs

- **[Dev and static export behave differently]** (dev's Strict Mode remount, the Next.js dev tools button, slower first compile) → Locate elements by exact accessible name and rely on auto-waiting. Task 4.2 runs the suite both ways.
- **[The route pattern doesn't match dev-server chunks]** → Task 3.3 first checks that the pattern blocks the app (the "Add" button doesn't work), so the first-paint test can't pass without blocking anything.
- **[Contrast walk misreads layered backgrounds]** → All surfaces are opaque hex colors, so the first non-transparent ancestor is the real background. The helper fails clearly if it reaches `<html>` without one.
- **[Flaky timing on CI]** → No fixed waits; CI has two retries and traces on the first retry. A test that only passes on retry is a bug to fix, not to accept.
- **[A test exposes a real bug]** → Mark it `test.fail()` with a comment explaining the problem, report it, and fix it in a separate change.

## Migration Plan

Tests only. A rollback deletes the `e2e/` files and restores the old `test:e2e` script. CI picks the tests up through its existing `npm run test:e2e` step.
