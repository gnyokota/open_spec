## 1. Static export

- [x] 1.1 In `next.config.ts`, add `output: "export"` and `basePath: process.env.PAGES_BASE_PATH ?? ""`. Run `npm run build`. If the build rejects `cacheComponents` or `partialPrefetching`, remove the rejected flag and add a one-line comment explaining why. Verify that the build exits 0 and `out/index.html` exists and contains `<h1`.
- [x] 1.2 Run `PAGES_BASE_PATH=/open_spec npm run build`. Verify that the asset URLs in `out/index.html` start with `/open_spec/_next/`, and that the favicon link starts with `/open_spec/`.
- [x] 1.3 Make sure `.gitignore` and `.prettierignore` both list `/out/` (add it where it's missing). Verify that `git status` doesn't show `out/` after a build, and that `npm run format:check` passes.

## 2. Keep CI green

- [x] 2.1 Set `"test": "vitest run --passWithNoTests"` and `"test:e2e": "playwright test --pass-with-no-tests"`, and remove `setupFiles` from `vitest.config.mts`. Verify that `npm run test` and `npm run test:e2e` exit 0 with no test files.
- [x] 2.2 Add `serve@14.2.6` as a devDependency (exact version). In `playwright.config.ts`, change the CI `webServer.command` to `npx serve out -l 3000`. Verify that `npm run build` followed by `CI=1 npm run test:e2e` exits 0, and that `npx serve out -l 3000` serves the todo page at `http://localhost:3000/`.
- [x] 2.3 Run the full CI sequence locally: `npm ci`, `lint`, `format:check`, `typecheck`, `test`, `build`, and `CI=1 npm run test:e2e`. Verify that every step exits 0.

## 3. Pages workflow

- [x] 3.1 Create `.github/workflows/pages.yml` per design Decision 4:
  - triggers: push to `main` and `workflow_dispatch`
  - permissions: `contents: read`, `pages: write`, `id-token: write`
  - concurrency group `pages`, without canceling the run in progress
  - a `build` job: checkout → setup-node (`.nvmrc`, npm cache) → `configure-pages@v5` (`id: pages`) → `npm ci` → `npm run build` with `PAGES_BASE_PATH: ${{ steps.pages.outputs.base_path }}` → `upload-pages-artifact@v3` with `path: out`
  - a `deploy` job: `deploy-pages@v4` in the `github-pages` environment

  Verify that `npx yaml-lint .github/workflows/pages.yml` passes, `npm run format:check` passes, and `ci.yml` and `copilot-setup-steps.yml` are unchanged.

## 4. Enable and deploy

- [x] 4.1 **Owner step:** in GitHub, open `gnyokota/open_spec` → Settings → Pages → Build and deployment → Source, and choose **GitHub Actions**. Verify that the setting shows "GitHub Actions".
- [x] 4.2 Commit and push the changes to `main`. Verify that the "Deploy to GitHub Pages" run succeeds (both jobs green), the "CI" run for the same commit is green, and the `github-pages` environment shows the URL `https://gnyokota.github.io/open_spec/`.
- [x] 4.3 Open `https://gnyokota.github.io/open_spec/`. Verify:
  - the page loads with styles and fonts, and the browser's network tab shows no 404s
  - adding a todo works with the button and with Enter
  - checking a todo strikes it through
  - todos survive a reload
  - the theme toggle switches and remembers the theme
  - there are no console errors

## 5. Documentation

- [x] 5.1 Add a "Deployment" section to `README.md`: the live URL, that every push to `main` deploys through `.github/workflows/pages.yml` (and that it can also be run by hand from the Actions tab), that the build is a static export served under `/open_spec/` via `PAGES_BASE_PATH`, and how to roll back (re-run the workflow on an earlier commit, or revert on `main`). Verify that the README links the live URL and that `npm run format:check` passes.
