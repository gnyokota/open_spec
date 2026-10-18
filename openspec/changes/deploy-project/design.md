## Context

- **The app:** Next.js 16.4 App Router with one route, `/`, prerendered as static. All state lives in the browser (localStorage), and there are no Route Handlers, cookies, rewrites, redirects, headers, proxy, `next/image`, or Server Actions. Fonts come from `next/font/google`, which downloads and self-hosts them at build time. `next.config.ts` sets `cacheComponents: true` and `partialPrefetching: true`.
- **The repo:** `gnyokota/open_spec` is public, the default branch is `main`, and Pages isn't enabled yet. The project-site URL will be `https://gnyokota.github.io/open_spec/`.
- **CI** (`.github/workflows/ci.yml`) runs lint, format:check, typecheck, test, build, and test:e2e. Playwright's `webServer` runs `npm run start` when `CI` is set. CI is red right now because `tests/` and `e2e/` were deleted, `vitest.config.mts` still names `tests/setup.ts`, and neither runner allows zero tests.
- **Bundled Next 16 docs:** "Static Exports" lists the unsupported features, and this app uses none of them. The docs don't say whether `cacheComponents` works with `output: "export"`.

See proposal.md for motivation.

## Goals / Non-Goals

**Goals:**
- A push to `main` publishes the current app to GitHub Pages with no manual step after the one-time settings change.
- Asset URLs resolve correctly under `/open_spec/`, while `npm run dev`, local builds, and CI keep serving at `/`.
- No secrets. Deployment uses GitHub's OIDC-based Pages actions.

**Non-Goals:**
- Previews, a custom domain, and blocking deploys on CI checks.

## Decisions

**1. `output: "export"` in `next.config.ts`.**
`next build` writes static HTML/CSS/JS to `out/` (`index.html`, `404.html`, `_next/…`). GitHub Pages serves static files only, so this is required.
*Alternative:* building some other way and copying `.next`. Not viable, because Pages can't run `next start`.

**2. `basePath` from an environment variable set only by the Pages workflow.**
```ts
basePath: process.env.PAGES_BASE_PATH ?? "",
```
The workflow sets `PAGES_BASE_PATH` from the `base_path` output of `actions/configure-pages` (`/open_spec`). Everywhere else it's unset, so local dev, local builds, and CI e2e all run at `/`. A rename or a custom domain then needs no code change, because the action's output changes. `trailingSlash` stays `false`. Pages serves `/open_spec/` from `out/index.html`, and unknown paths get `out/404.html`.
*Alternatives:*
- *Hard-coding `"/open_spec"`.* This breaks local development at `/`, and it breaks if the repo is renamed.
- *Letting `configure-pages` inject the config (`static_site_generator: next`).* That rewrites a `next.config.js` file and isn't documented for `next.config.ts`.

**3. `cacheComponents` and `partialPrefetching`: keep them only if the export build accepts them.**
The first implementation task builds with `output: "export"` and both flags on:
- If `next build` succeeds and `out/index.html` contains the todo page, keep both flags.
- If the build rejects either flag, remove it and add a comment in `next.config.ts` saying static export requires that.

Neither affects this page at runtime: it has no `use cache`, no dynamic data, and no `<Link>`. This is the only open point, and either outcome leaves the rest of the plan unchanged.

**4. A separate `.github/workflows/pages.yml` that uses GitHub's official Pages actions.**
- **Triggers:** `on: push: branches: [main]` plus `workflow_dispatch`.
- **Permissions:** `contents: read`, `pages: write`, `id-token: write`.
- **Concurrency:** `concurrency: { group: pages, cancel-in-progress: false }`, so an in-progress deploy finishes and the newest one runs next.
- **`build` job:**
  - checkout
  - `actions/setup-node@v4` (`node-version-file: .nvmrc`, npm cache)
  - `actions/configure-pages@v5` (`id: pages`)
  - `npm ci`
  - `npm run build` with `env: PAGES_BASE_PATH: ${{ steps.pages.outputs.base_path }}`
  - `actions/upload-pages-artifact@v3` (`path: out`)
- **`deploy` job:** `needs: build`, `environment: { name: github-pages, url: ${{ steps.deployment.outputs.page_url }} }`, and `actions/deploy-pages@v4`.

Deployments from Actions skip Jekyll processing, so `_next/` is served without needing a `.nojekyll` file.
*Alternatives:*
- *Adding a deploy job to `ci.yml`.* That mixes PR checks with deploy permissions, and the proposal doesn't ask for deploys to wait on CI.
- *Pushing to a `gh-pages` branch.* That adds build output to git history and is the older approach.

**5. CI e2e serves the export with `serve`.**
`next start` doesn't work with `output: "export"`.
- In `playwright.config.ts`, the CI `webServer.command` becomes `npx serve out -l 3000`. Local runs still use `npm run dev`.
- Add `serve@14.2.6` as a pinned devDependency, so CI doesn't download an unpinned version at run time.
- CI builds without `PAGES_BASE_PATH`, so the export is served at `/`, which matches `baseURL`.

**6. Test steps tolerate zero tests.**
- `"test": "vitest run --passWithNoTests"`
- `"test:e2e": "playwright test --pass-with-no-tests"`
- remove `setupFiles` from `vitest.config.mts`

This fixes the red CI without writing tests. A later change that adds tests removes the flags and restores the setup file.

**7. Ignore `out/`.**
Add `/out/` to `.gitignore` (the scaffold's `.gitignore` already lists `/out/`, so this is a check) and to `.prettierignore`, so build output is never committed or formatted.

## Risks / Trade-offs

- **The first deploy fails until the owner sets Settings → Pages → Source to "GitHub Actions"** → This is an explicit owner task, and the deploy job's error says so. Re-run the workflow afterwards.
- **Deploys don't wait for CI, so a commit that fails lint can still go live** → `next build` still fails on type errors and broken imports, so a broken build never deploys. Gating can come later.
- **localStorage is scoped to the origin `gnyokota.github.io`, which every project site under that account shares** → Keys are prefixed `todo-openspec:` already, so they won't collide.
- **The duplicated `basePath` logic could drift if someone hard-codes `/` asset paths** → The app has no hard-coded asset URLs (fonts and the favicon go through Next), and the deploy check task loads the live site and checks for 404s.

## Migration Plan

1. Merge the config changes and the workflow to `main`.
2. The owner switches the Pages source to GitHub Actions, then re-runs "Deploy to GitHub Pages" if the first run failed.
3. Check the live URL.

Rollback: re-run the workflow on an earlier commit, or revert on `main` (the next push redeploys). To take the site down, use Settings → Pages → "Unpublish site", or disable Pages.
