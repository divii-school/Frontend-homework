import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // The floating dev badge would cover the menu in local screenshots.
  devIndicators: false,
  // Product images are public files on the QA bucket; they are shown as they are (no optimiser round trip).
  images: {
    unoptimized: true,
    remotePatterns: [{ protocol: "https", hostname: "*.amazonaws.com" }],
  },
  // The product list is the home screen of this app.
  async redirects() {
    return [{ source: "/", destination: "/products", permanent: false }];
  },
};

export default nextConfig;
