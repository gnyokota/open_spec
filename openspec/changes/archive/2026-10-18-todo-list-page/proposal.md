## Why

The app needs its main screen: a todo list where users can type a todo, give it a date, and tick it off. It also needs light and dark themes. The code left in `src/components/` and `src/lib/` comes from a change whose planning record was removed, so this change rebuilds the page from scratch and becomes the record for its behavior.

## What Changes

- Remove the existing `src/components/*` and `src/lib/*` code, and the todo/theme wiring in `src/app/`, then rebuild the page as described below.
- Add a todo entry form with a text input, a date input, and an "Add" button. A todo is added either by clicking the button or by pressing Enter. Blank text is rejected.
- Show the todos as a list. Each item shows its text, its date (if set), and a checkbox. Checking the box strikes the text through, and unchecking removes the strike-through.
- Save todos in the browser's localStorage so they survive a reload.
- Add light and dark themes. The first visit follows the system preference, and a toggle button switches themes and remembers the choice.
- Style everything with CSS Modules. Colors, margins, and paddings are CSS custom properties defined once in global CSS. The dark theme only overrides the color variables.
- Make `npm run test` and `npm run test:e2e` pass when there are no test files, since tests are out of scope for now and CI still runs both.

## Capabilities

### New Capabilities
- `todo-list`: entering todos with a text and an optional date (by button or Enter), listing them, marking them complete with a strike-through, and keeping them across reloads.
- `theme`: light and dark color themes, defaulting to the system preference, switched with a toggle, and remembered across visits.

### Modified Capabilities
None. `openspec/specs/` has no capabilities. The earlier `todo-list` and `theme` main specs were removed so that this change could add them fresh.

## Non-goals

- Automated tests of any kind. The test runners stay configured, but no tests are written in this change.
- Editing, deleting, reordering, filtering, or sorting todos.
- Server-side storage, accounts, or syncing between devices or tabs.

## Assumptions

- The date is optional. Todos without one show only their text.
- New todos are added at the end of the list.
- Persistence (localStorage) and the theme behavior (system default plus a remembered toggle) are carried over from earlier choices for this same feature, because this request didn't mention them.

## Impact

- **Removed and rebuilt**: `src/components/**`, `src/lib/**`, plus the todo/theme parts of `src/app/page.tsx`, `src/app/page.module.css`, `src/app/layout.tsx`, and `src/app/globals.css`.
- **Tooling**: `package.json` test scripts, plus `vitest.config.mts`, whose setup file `tests/setup.ts` no longer exists.
- **Docs**: the README feature list.
- **Dependencies**: none added.
