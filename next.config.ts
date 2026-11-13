import path from 'node:path';
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // The dev-mode "N" badge would show up in Playwright screenshots; build errors still show as an overlay.
  devIndicators: false,
  // Lets every SCSS file write `@use 'tokens'` instead of a relative path.
  sassOptions: { includePaths: [path.join(process.cwd(), 'src/styles')] },
  images: {
    // Product images come from the Talking Club S3 bucket.
    remotePatterns: [{ protocol: 'https', hostname: 'talking-club-dev.s3.ap-northeast-2.amazonaws.com' }],
  },
};

export default nextConfig;
