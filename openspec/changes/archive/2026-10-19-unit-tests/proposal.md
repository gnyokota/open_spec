## Why

The project has no unit tests. `tests/` was removed with the todo-list page change, and `npm run test` passes only because of `--passWithNoTests`. The todo store, date handling, and theme logic carry most of the app's rules (trimming, blank rejection, storage validation, time-zone-safe dates, theme fallback), and nothing checks them before a push deploys to GitHub Pages. Vitest, React Testing Library, and jsdom are already installed and run in CI, so only the tests and a setup file are missing.

## What Changes

- Restore `tests/setup.ts`, which loads the jest-dom matchers and resets the DOM, `localStorage`, the todo store, and the theme attribute between tests. Wire it back into `vitest.config.mts`.
- Add unit tests for the library modules in `src/lib/`:
  - `format-date`: date validation and the time-zone-independent medium date format.
  - `todo-store`: add, trim, blank rejection, toggle, ordering, versioned persistence, recovery from missing, malformed, or unavailable storage, subscriptions, and stable snapshots.
  - `theme`: stored-versus-system resolution, apply/set, storage failures, the attribute snapshot and subscription, and the inline `themeInitScript`.
- Add component tests with React Testing Library for `TodoForm`, `TodoItem`, `TodoApp`, `ThemeToggle`, `InlineScript`, and the home page.
- Test the existing `todo-list` and `theme` spec scenarios that can run in jsdom.
- Remove `--passWithNoTests` from the `test` script so CI fails if the tests are ever missing or not picked up.
- Update the README's testing section to describe what `tests/` covers.

## Capabilities

### New Capabilities
None. The tests check existing behavior and don't change it, so the change sets `skip_specs: true`. The `todo-list` and `theme` specs are unchanged.

### Modified Capabilities
None.

## Non-goals

- Playwright end-to-end tests in `e2e/`. These are a separate change; `test:e2e` keeps `--pass-with-no-tests`.
- Coverage reporting or coverage thresholds in CI.
- Visual and contrast checks (for example, the theme spec's 4.5:1 contrast requirement). jsdom doesn't compute layout or colors.
- Changes to app code. If a test finds a bug, it's reported and fixed in a separate change, not silently here.

## Assumptions

- **"Unit tests" means the Vitest suite in `tests/`**, including component tests rendered in jsdom, because the project context puts React Testing Library there.
- **Tests reflect the current behavior and specs.** Where code and spec agree, the test asserts that. If they differ, the conflict is reported instead of being decided in the test.

## Impact

- **Tests**: new files under `tests/` (`setup.ts`, `lib/*.test.ts`, `components/*.test.tsx`, `app/page.test.tsx`).
- **Config**: `vitest.config.mts` (`setupFiles`, and CSS module class names if needed for assertions), and the `test` script in `package.json`.
- **Docs**: the testing section in `README.md`.
- **CI**: no workflow changes. `ci.yml` already runs `npm run test`.
- **Dependencies**: none new.
- **App code**: no changes.
