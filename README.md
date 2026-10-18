# Todo

A todo app built with [Next.js](https://nextjs.org) (App Router) and TypeScript, planned and built change by change with [OpenSpec](https://github.com/Fission-AI/OpenSpec).

## Features

- Add todos with an optional date. Blank todos are rejected.
- Check a todo to mark it done, which strikes it through. Uncheck it to undo.
- Todos and their checked state are saved in the browser (localStorage) and survive a reload.
- Light and dark themes. The first visit follows your system setting, and the toggle in the header switches themes and remembers your choice.

## Prerequisites

- Node.js 22 (see `.nvmrc`; with nvm, run `nvm use`)
- npm (comes with Node)

## Setup

```bash
npm ci
npm run dev
```

Then open http://localhost:3000.

## Scripts

| Script                 | What it does                                                         |
| ---------------------- | -------------------------------------------------------------------- |
| `npm run dev`          | Start the dev server (Turbopack) on port 3000                        |
| `npm run build`        | Create a production build                                            |
| `npm run start`        | Serve the production build (run `build` first)                       |
| `npm run lint`         | Lint with ESLint (Next.js rules + Prettier compatibility)            |
| `npm run format`       | Format all files with Prettier                                       |
| `npm run format:check` | Check formatting without writing                                     |
| `npm run typecheck`    | Generate Next.js route types, then type-check with `tsc --noEmit`    |
| `npm run test`         | Run unit and component tests with Vitest                             |
| `npm run test:e2e`     | Run end-to-end tests with Playwright (starts the dev server for you) |

CI (`.github/workflows/ci.yml`) runs `lint`, `format:check`, `typecheck`, `test`, `build`, and `test:e2e` on every push to `main` and every pull request.

## Project layout

- `src/app/`: routes, layouts, and global CSS (design tokens live in `globals.css`)
- `tests/`: Vitest unit and component tests (`*.test.ts` / `*.test.tsx`, jsdom environment)
- `e2e/`: Playwright end-to-end tests (`*.spec.ts`, Chromium)
- `openspec/`: specs and change proposals

Styling uses CSS Modules (`*.module.css` next to each component) plus CSS custom properties. There's no Tailwind.

### Running e2e tests against a production build

Locally, `npm run test:e2e` starts `npm run dev`. To test the production build the way CI does:

```bash
npm run build
CI=1 npm run test:e2e
```

The first time, install the browser with `npx playwright install chromium`.

## OpenSpec workflow

Every change is planned before it's built:

1. **`/opsx:propose <idea>`** creates a change in `openspec/changes/<name>/` with a proposal, specs, a design, and tasks.
2. **`/opsx:apply <name>`** implements the tasks and checks them off.
3. **`/opsx:archive <name>`** merges the change's specs into `openspec/specs/` and moves the change to `openspec/changes/archive/`.

`/opsx:explore` is for thinking an idea through before proposing it.
