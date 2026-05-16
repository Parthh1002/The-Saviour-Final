import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // SSR mode — API routes and Puppeteer work correctly
  images: {
    unoptimized: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: {
    outputFileTracingRoot: require('path').join(__dirname, '../'),
  },
};

export default nextConfig;
