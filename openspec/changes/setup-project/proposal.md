## Why

The repository has OpenSpec and agent tooling but no application code. Every todo feature change needs a working Next.js + TypeScript project with linting, formatting, tests, and CI already in place. Without that, feature work would start with setup choices instead of behavior.

## What Changes

- Scaffold a Next.js (App Router) + TypeScript application at the repository root, alongside the existing `openspec/`, `.claude/`, and `.github/` directories, without changing them.
- Use plain CSS with CSS Modules for styling. Tailwind, which create-next-app adds by default, is removed.
- Configure strict TypeScript, ESLint (Next.js config), and Prettier, with npm scripts for `dev`, `build`, `start`, `lint`, `format`, `format:check`, `typecheck`, `test`, and `test:e2e`.
- Add Vitest + React Testing Library for unit/component tests and Playwright for end-to-end tests, each with one smoke test of the placeholder home page.
- Add a GitHub Actions CI workflow that installs, lints, checks formatting, type-checks, tests, builds, and runs the e2e smoke test on pushes and pull requests.
- Initialize git with a `.gitignore` covering Node/Next.js/Playwright artifacts, and pin the Node version (`.nvmrc` + `engines`).
- Add a README covering prerequisites, scripts, and the OpenSpec workflow.
- Fill in `openspec/config.yaml` `context` with the chosen stack and conventions so later changes inherit them.

## Capabilities

### New Capabilities
None. This change sets up tooling and project structure only and adds no user-facing todo behavior, so the change sets `skip_specs: true`. The placeholder home page is scaffolding and will be replaced by the first feature change, so it gets no spec.

### Modified Capabilities
None.

## Non-goals

- Todo features of any kind (create, list, complete, delete). Each comes in its own later change with its own spec.
- Persistence: choosing a database or ORM, and data modeling. These are deferred to the first feature change, which needs a data model.
- Authentication, deployment/hosting configuration, and visual design beyond the scaffold defaults.

## Impact

- **New code**: `package.json`, `package-lock.json`, `tsconfig.json`, `next.config.ts`, `eslint.config.mjs`, Prettier config, `vitest.config.ts`, `playwright.config.ts`, `src/app/**`, `tests/**`, `e2e/**`, `README.md`, `.gitignore`, `.nvmrc`.
- **CI**: new `.github/workflows/ci.yml`. The existing `copilot-setup-steps.yml` is unchanged.
- **Config**: `openspec/config.yaml` gains a `context` block.
- **Dependencies**: `next`, `react`, `react-dom`; dev dependencies for TypeScript, ESLint, Prettier, Vitest, Testing Library, jsdom, and Playwright.
- **Repository**: becomes a git repository (it isn't one today).
