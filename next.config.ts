import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // GitHub Pages serves static files only.
  output: "export",
  // Set by .github/workflows/pages.yml (e.g. "/open_spec"); empty locally and in CI.
  basePath: process.env.PAGES_BASE_PATH ?? "",
  // cacheComponents and partialPrefetching are omitted: cacheComponents enables
  // Partial Prerendering, which static export rejects, and partialPrefetching
  // requires cacheComponents.
};

export default nextConfig;
