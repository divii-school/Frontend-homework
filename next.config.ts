import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // Lets every SCSS partial write `@use 'tokens' as *;` / `@use 'mixins' as *;`
  // instead of relative ../../ paths.
  sassOptions: {
    includePaths: [path.join(process.cwd(), "src/styles")],
  },
  // Product images come from the Talking Club S3 / CDN; we render them with <img>, so no
  // next/image remote patterns are needed.
  poweredByHeader: false,
};

export default nextConfig;
