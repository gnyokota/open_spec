## Why

`e2e/` is empty, and `npm run test:e2e` passes only because of `--pass-with-no-tests`. The unit tests (archived change `unit-tests`) run in jsdom, which can't check what the user actually sees: real keyboard input, a real page reload restoring todos, dates in a real browser time zone, the theme applied before first paint, colors and contrast, and the production static export that is deployed to GitHub Pages. CI already installs Chromium and serves `out/` for Playwright, so only the tests are missing.

## What Changes

- Add Playwright tests in `e2e/` for the todo page (`/`), covering the `todo-list` spec scenarios in a real browser:
  - the form, adding with the button and with Enter (from the text and the date input), trimming, clearing, and focus;
  - blank todos rejected with the "Enter a todo" error, which clears on typing;
  - the list order, dates in the selected day under UTC−10 and UTC+14, todos without a date, and the empty message;
  - checking and unchecking with the mouse and the Space key, with a visible strike-through;
  - persistence across reloads, corrupted storage, blocked storage, and no "No todos yet" flash while loading.
- Cover the `theme` spec scenarios that need a real browser: the system preference default, the toggle and its name, the choice surviving a reload, a stored choice overriding the system, the theme applied before the app's JavaScript runs, and 4.5:1 text contrast in both themes.
- Keep shared steps (adding a todo, seeding storage, reading colors) in a small helper module in `e2e/`.
- Remove `--pass-with-no-tests` from the `test:e2e` script so CI fails if the e2e tests are missing or not picked up.
- Update the README's e2e section with what `e2e/` covers and how to run one file.

## Capabilities

### New Capabilities
None. The tests check existing behavior and don't change it, so the change sets `skip_specs: true`. The `todo-list` and `theme` specs are unchanged.

### Modified Capabilities
None.

## Non-goals

- Browsers other than Chromium. The Playwright config and CI stay Chromium-only.
- Testing the deployed GitHub Pages site or the `/open_spec/` base path. Tests run against the local dev server or the local static export at `/`.
- Visual snapshot (screenshot comparison) tests and a full accessibility audit with a new dependency such as axe. Contrast is checked from computed colors.
- Changes to app code, the CI workflow, or the Pages workflow. A bug found by a test is reported and fixed in a separate change.

## Assumptions

- **"The todo page" includes its theme toggle**, since it is part of the only page and the theme spec's remaining scenarios need a real browser.
- **CI keeps running e2e against the production build** (`serve out`), and local runs use `npm run dev`. The tests must pass in both.

## Impact

- **Tests**: new files in `e2e/` (`todo.spec.ts`, `theme.spec.ts`, and a helper module).
- **Config**: the `test:e2e` script in `package.json`. `playwright.config.ts` is unchanged unless a task finds a setting is needed.
- **Docs**: the e2e section of `README.md`.
- **CI**: no workflow changes; `ci.yml` already runs `npm run test:e2e` after the build.
- **Dependencies**: none new.
- **App code**: no changes.
