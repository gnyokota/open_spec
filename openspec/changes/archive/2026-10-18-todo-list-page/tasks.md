## 1. Clean slate and tooling

- [ ] 1.1 Delete `src/components/` and `src/lib/`. Reset `src/app/page.tsx` to the placeholder (`<main>` with `<h1>Todo</h1>`), and remove the theme script and `suppressHydrationWarning` from `src/app/layout.tsx`. Verify that `git status` shows those folders deleted and `npm run build` passes.
- [ ] 1.2 Set `"test": "vitest run --passWithNoTests"` and `"test:e2e": "playwright test --pass-with-no-tests"` in `package.json`, and remove `setupFiles` from `vitest.config.mts`. Verify that `npm run test` and `npm run test:e2e` both exit 0 with no test files.

## 2. Design tokens and theme

- [ ] 2.1 Rewrite `src/app/globals.css` with the token set from design Decision 8: the light colors and spacing scale on `:root`, dark color overrides on `:root[data-theme="dark"]`, the `prefers-color-scheme` fallback, `color-scheme` per theme, and token-only `body` and `:focus-visible` styles. Verify that `npm run build` passes and `/` renders dark when the OS prefers dark.
- [ ] 2.2 Create `src/lib/theme.ts`, with the storage-key constant, `Theme`, `resolveTheme`, `applyTheme`, `setTheme`, `subscribe` (a MutationObserver), `getSnapshot`, `getServerSnapshot`, and the `themeInitScript` string. Create `src/components/InlineScript/InlineScript.tsx`. Verify that `npm run typecheck` passes.
- [ ] 2.3 In `src/app/layout.tsx`, render `<InlineScript html={themeInitScript} />` in `<head>` and add `suppressHydrationWarning` to `<html>`. Verify in the dev server that `<html data-theme>` matches the OS preference on first load, with no hydration warning in the console.
- [ ] 2.4 Create `ThemeToggle` (`.tsx` + `.module.css`): a `<button type="button">` that reads the theme through `useSyncExternalStore`, is named "Switch to dark/light theme" ("Toggle theme" before hydration), shows a sun/moon icon marked `aria-hidden`, and re-applies the theme in a `useLayoutEffect` when the attribute is missing. Style it only with tokens. Verify by hand: clicking and pressing Enter/Space both switch the theme, the name updates, and the choice survives a reload with no flash.

## 3. Todo data

- [ ] 3.1 Create `src/lib/format-date.ts` with `isIsoDate` and `formatDate` (UTC-based, medium date style). Verify that `npm run typecheck` passes, and in the browser that a todo dated 2026-10-20 shows "Oct 20, 2026" (en-US).
- [ ] 3.2 Create `src/lib/todo-store.ts` per design Decisions 3–4: the `Todo` type, `subscribe`/`getSnapshot`/`getServerSnapshot`, `addTodo` (trim, `null` date when empty, append, `done: false`, returns `null` for blank), `toggleTodo`, the versioned `todo-openspec:todos` storage with hand-written validation, and `try/catch` around every storage call. Verify that `npm run typecheck` and `npm run lint` pass.

## 4. Todo UI

- [ ] 4.1 Create `TodoForm` (`.tsx` + `.module.css`): a single `<form noValidate onSubmit>` with inputs labelled "Todo" and "Date" and a `type="submit"` "Add" button. On blank text it sets `aria-invalid` and shows a `role="alert"` "Enter a todo" message that typing clears. On success it clears both fields and refocuses the text input. Verify by hand: the button adds, Enter in the text input adds, Enter in the date input adds, and whitespace-only text shows the error without adding.
- [ ] 4.2 Create `TodoItem` (`.tsx` + `.module.css`): a label wrapping the checkbox (`aria-label="Mark <text> as done"`) and the text, plus an optional `<time dateTime>`. A `done` class adds `line-through` and the muted color, and the checkbox uses `accent-color` from a token. Verify by hand: checking strikes the text through and unchecking removes it, with both mouse and Space.
- [ ] 4.3 Create `TodoApp` (`.tsx` + `.module.css`): it reads the store with `useSyncExternalStore`, renders `TodoForm`, renders no list while the snapshot is `null`, shows "No todos yet" when the list is empty, and shows a `<ul>` of `TodoItem` otherwise. Verify by hand: todos appear in the order added, and after a reload the todos, dates, and checked state are unchanged, with no "No todos yet" flash.
- [ ] 4.4 Update `src/app/page.tsx` and `page.module.css` to render the header (the `<h1>Todo</h1>` and `<ThemeToggle />`) and `<TodoApp />` in a centered column spaced with tokens. Verify that `npm run build` still prerenders `/` as static.
- [ ] 4.5 Check that styling uses only tokens. Verify that `grep -rnE "#[0-9a-fA-F]{3,8}|rgb|hsl|[0-9]+px" --include="*.module.css" src` finds nothing, and that every `margin`, `padding`, `color`, `background`, and `border` declaration in the modules uses `var(--…)` (or `0`/`auto`/`none`/`inherit`).

## 5. Wrap-up

- [ ] 5.1 Check every scenario in both spec files by hand, in both themes, in the dev server. That includes corrupted storage (set `todo-openspec:todos` to `"{bad"` in DevTools), blocked storage (by disabling site data), and the time-zone check (DevTools → Sensors → a UTC−10 and a UTC+14 location). Verify that each scenario behaves as specified and the console shows no errors or hydration warnings.
- [ ] 5.2 Update the README feature list (todos with an optional date, adding by button or Enter, the checkbox strike-through, saving to localStorage, and light/dark themes). Verify that the full CI sequence passes locally: `npm ci`, `lint`, `format:check`, `typecheck`, `test`, `build`, and `CI=1 npm run test:e2e`.
