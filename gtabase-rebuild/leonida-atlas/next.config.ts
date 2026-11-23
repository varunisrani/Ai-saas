import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // no backend in v1: pages read local sample data; personal progress lives in browser storage
  cacheComponents: false,
  partialPrefetching: false,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
