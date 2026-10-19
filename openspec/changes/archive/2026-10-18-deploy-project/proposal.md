## Why

The todo app only runs locally. Publishing it on GitHub Pages gives it a free public URL at `https://gnyokota.github.io/open_spec/`, served from the same public repository. Deploying on every push to `main` keeps the site in step with the code without manual steps.

## What Changes

- Build the app as a **static export** (`output: "export"` → `out/`). The app is already fully client-side (todos and theme live in localStorage, and there are no API routes or server data), so no feature is lost.
- Serve it under the repository's Pages path: `basePath` comes from the Pages workflow at build time, so local development and CI still run at `/`.
- Add a GitHub Actions workflow, `.github/workflows/pages.yml`, that builds the export and deploys it to GitHub Pages **on every push to `main`**, and can also be run by hand.
- Switch the GitHub repository's Pages source to "GitHub Actions". This is a one-time owner step in the repository settings.
- Keep the existing CI working with the export:
  - `npm run start` (`next start`) doesn't work with `output: "export"`, so Playwright's CI web server serves `out/` with a static file server instead.
  - Fix the currently failing test steps (no test files exist) with pass-with-no-tests flags, and remove the deleted `tests/setup.ts` from the Vitest config.
- Document the live URL and how deployment works in the README.

## Capabilities

### New Capabilities
None. Hosting doesn't change what the app does, so the change sets `skip_specs: true`. The `todo-list` and `theme` specs are unchanged.

### Modified Capabilities
None.

## Non-goals

- A custom domain, PR preview deployments (GitHub Pages has none), and blocking deploys on the CI workflow's results.
- Server features of any kind (API routes, rewrites, headers, image optimization with the default loader).
- Writing tests.

## Assumptions

- **The site is a project site at `/open_spec/`**, which is the repository name. It isn't a user site at the domain root.
- **The Pages workflow runs separately from CI.** It deploys whenever `main` changes, even if a CI check failed. That matches "deploy on every push to main". Gating can be added later.
- **`cacheComponents` and `partialPrefetching` may not survive the export.** The bundled Next 16 docs don't say whether they work with `output: "export"`. If the export build rejects them, they're turned off. This page doesn't use either at runtime, so turning them off changes nothing visible.

## Impact

- **Config**: `next.config.ts` (`output`, `basePath`, and possibly the `cacheComponents`/`partialPrefetching` flags), `package.json` (test scripts and a `serve` dev dependency), `vitest.config.mts`, and `playwright.config.ts`.
- **CI/CD**: a new `.github/workflows/pages.yml`. `.github/workflows/ci.yml` is unchanged.
- **Repo settings**: Pages source set to "GitHub Actions", and a `github-pages` environment, which the first deploy creates.
- **Docs**: a Deployment section in `README.md`.
- **App code**: no changes expected.
