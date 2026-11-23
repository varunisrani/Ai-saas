import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // no backend in v1: pages read local sample data; personal progress lives in browser storage
  cacheComponents: false,
  partialPrefetching: false,
  // trailing slashes are canonical on some routes and not on others (R-002): handled in src/proxy.ts
  skipTrailingSlashRedirect: true,
  turbopack: {
    // pin the workspace root: a parent folder has its own lockfile and PostCSS config
    root: path.resolve(__dirname),
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
