import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Product images are public files on the Talking Club S3 bucket (QA/dev).
    remotePatterns: [{ protocol: "https", hostname: "talking-club-dev.s3.ap-northeast-2.amazonaws.com", pathname: "/**" }],
  },
};

export default nextConfig;
