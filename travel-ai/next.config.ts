import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'maps.googleapis.com' },
    ],
  },
  env: {
    GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
    MAPS_API_KEY: process.env.MAPS_API_KEY || '',
  },
};

export default nextConfig;
