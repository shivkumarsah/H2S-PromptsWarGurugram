import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'maps.googleapis.com' },
    ],
  },
  // NOTE: Do NOT expose GEMINI_API_KEY or MAPS_API_KEY here.
  // Server-side env vars are accessed directly via process.env in API routes.
};

export default nextConfig;
