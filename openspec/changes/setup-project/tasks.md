## 1. Repository baseline

- [x] 1.1 Run `git init` (default branch `main`) and commit the existing OpenSpec/agent files as the baseline. Verify that `git log` shows one commit and `git status` is clean.

## 2. Scaffold Next.js app

- [x] 2.1 In an OS temp directory, run `npx create-next-app@16.4.2 todo-openspec --ts --app --src-dir --eslint --tailwind --import-alias "@/*" --use-npm --disable-git --agents-md --no-agent-feedback --skip-install`. Verify that the generated `package.json` lists `next@16.4.2`, and that `src/app/` and `eslint.config.mjs` exist.
- [x] 2.2 Copy the generated files into the repo root without overwriting anything (excluding `node_modules`). Report any collision instead of overwriting. Verify that `git status` shows only new files, with no modifications under `openspec/`, `.claude/`, or `.github/`.
- [x] 2.3 Run `npm install` in the repo root. Verify that `package-lock.json` is created and `npm run dev` serves `http://localhost:3000` with HTTP 200.
- [x] 2.4 Replace the scaffold home page (`src/app/page.tsx`) with a minimal page that renders an `<h1>Todo</h1>`, set the `metadata` title in `src/app/layout.tsx` to "Todo", and remove unused scaffold assets from `public/`. Verify by loading `/` in the dev server.

## 3. TypeScript, lint, and format

- [x] 3.1 Confirm `"strict": true` in `tsconfig.json`, add `"typecheck": "next typegen && tsc --noEmit"` (typegen is needed on a clean checkout), add `"engines": { "node": ">=22" }` to `package.json`, and add an `.nvmrc` containing `22`. Verify that `npm run typecheck` exits 0.
- [x] 3.2 Install `prettier`, `eslint-config-prettier`, and `prettier-plugin-tailwindcss`. Add a Prettier config and a `.prettierignore` (excluding `openspec/`, `.claude/`, `.github/prompts/`, `.github/skills/`, `.github/agents/`, `.next/`, `playwright-report/`, `test-results/`, and `package-lock.json`), extend `eslint.config.mjs` with `eslint-config-prettier`, and add the `format` and `format:check` scripts. Verify that `npm run format` and then `npm run format:check` and `npm run lint` all exit 0, and that `git status` shows no changes under the ignored directories.
- [x] 3.3 Remove Tailwind: uninstall `tailwindcss`, `@tailwindcss/turbopack`, and `prettier-plugin-tailwindcss`. Remove the Turbopack `*.css` loader rule from `next.config.ts`, the `@import "tailwindcss"` and `@theme` blocks from `src/app/globals.css`, and the plugin settings from `.prettierrc.json`. Replace the utility classes in `src/app/layout.tsx` and `src/app/page.tsx` with a `page.module.css` and plain global body styles. Verify that `grep -ri tailwind src next.config.ts .prettierrc.json package.json` finds nothing, and that `npm run build`, `npm run lint`, and `npm run format:check` exit 0 and `/` still renders the "Todo" heading.

## 4. Testing

- [x] 4.1 Raise `@types/node` to `^22` (required by Vitest 5), then install `vitest`, `@vitejs/plugin-react`, `jsdom`, `@testing-library/react`, `@testing-library/dom`, and `@testing-library/jest-dom`. Add `vitest.config.mts` (ESM; `resolve.tsconfigPaths: true` for the `@/*` alias, jsdom environment, setup file loading jest-dom, `include: ["tests/**/*.test.{ts,tsx}"]`) and a `"test": "vitest run"` script. Verify that the config loads with `npx vitest run --passWithNoTests`.
- [x] 4.2 Add `tests/home.test.tsx`, which renders the home page and checks for a heading named "Todo". Verify that `npm run test` passes, and that it fails if the heading text is changed temporarily.
- [x] 4.3 Install `@playwright/test`, run `npx playwright install chromium`, and add `playwright.config.ts` (Chromium only, `testDir: "e2e"`, `baseURL` `http://localhost:3000`, `webServer` running `npm run dev` locally and `npm run start` when `CI` is set, `reuseExistingServer: !process.env.CI`). Add a `"test:e2e": "playwright test"` script. Verify that `npx playwright test --list` loads the config.
- [x] 4.4 Add `e2e/home.spec.ts`, which visits `/` and checks that the "Todo" heading is visible. Verify that `npm run test:e2e` passes locally, and after `npm run build`, with `CI=1 npm run test:e2e`.
- [x] 4.5 Add `playwright-report/`, `test-results/`, and `/blob-report/` to `.gitignore`, and make sure `.next/`, `node_modules/`, and `.env*.local` are already ignored. Verify that `git status` lists no build or test output after running all scripts.

## 5. Continuous integration

- [x] 5.1 Add `.github/workflows/ci.yml`. It triggers on push to `main` and on `pull_request`, runs on `ubuntu-latest`, uses `actions/setup-node` with `node-version-file: .nvmrc` and npm cache, and runs these steps in order: `npm ci`, `npm run lint`, `npm run format:check`, `npm run typecheck`, `npm run test`, `npm run build`, `npx playwright install --with-deps chromium`, `npm run test:e2e`. It uploads `playwright-report/` on failure. Verify that the YAML parses (e.g. `npx yaml-lint` or `actionlint` if available) and that `copilot-setup-steps.yml` is unchanged.
- [x] 5.2 Run the full CI sequence locally, from a clean `npm ci` (with `CI=1` for the e2e step). Verify that every step exits 0.

## 6. Documentation and project context

- [ ] 6.1 Write `README.md` covering prerequisites (Node 22, npm), setup, every npm script, the test layout (`tests/` vs `e2e/`), and a short section on the OpenSpec workflow (`/opsx:propose` → `/opsx:apply` → `/opsx:archive`). Verify that every script named in the README exists in `package.json`.
- [x] 6.2 Fill in the `context` field in `openspec/config.yaml` with the stack and conventions (Next.js 16 App Router + TypeScript strict, `src/` layout, CSS Modules + CSS custom properties (no Tailwind), npm, ESLint + Prettier, Vitest in `tests/`, Playwright in `e2e/`, persistence not yet chosen). Verify that `openspec instructions proposal --change setup-project --json` shows the new context.
- [x] 6.3 Commit the scaffold. Verify that `openspec validate setup-project` passes and `git status` is clean.
