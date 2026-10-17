## Why

The app currently shows only a placeholder "Todo" heading. Users need a real todo list: a place to type a todo and pick a date, and a way to mark items done. The interface also needs light and dark themes, built on shared style variables so later changes stay visually consistent.

## What Changes

- Add a todo entry form with a text field, a date field, and an "Add" button. Empty or whitespace-only text is rejected.
- Show added todos as a list. Each item shows its text, its date (if one was given), and a checkbox. Checking the box strikes the text through, and unchecking removes the strike-through.
- Save todos (text, date, checked state) in the browser's localStorage so they survive a page refresh.
- Add light and dark themes. The first visit follows the operating system's color-scheme preference. A toggle button switches themes, and the choice is remembered across visits.
- Style everything with CSS Modules. Colors, padding, and margin values are defined once as CSS custom properties (design tokens) in global CSS and reused in every module. The dark theme only overrides the color tokens.

## Capabilities

### New Capabilities
- `todo-list`: entering todos with a text and an optional date, listing them, marking them complete with a strike-through, and keeping them across reloads.
- `theme`: light and dark color themes, defaulting to the system preference, switched with a toggle, and remembered across visits.

### Modified Capabilities
None. No specs exist yet.

## Non-goals

- Editing or deleting todos, reordering, filtering, or sorting by date.
- Server-side storage, accounts, or syncing between devices. Todos live only in the current browser.
- Overdue highlighting, reminders, or time-of-day on dates.

## Impact

- **Depends on `setup-project`** being implemented first. It provides the Next.js app, CSS Modules (no Tailwind), Vitest, and Playwright. That change is in progress (7 of 18 tasks done).
- **New code**: client components under `src/components/` (todo form, todo list/item, theme toggle) with co-located `*.module.css`, a todo storage module under `src/lib/`, design tokens in `src/app/globals.css`, and a theme init script in `src/app/layout.tsx`.
- **Replaced**: the placeholder content of `src/app/page.tsx`. The "Todo" heading stays, so setup-project's smoke tests keep passing.
- **Tests**: new Vitest component tests in `tests/` and Playwright tests in `e2e/`.
- **Dependencies**: none added.
