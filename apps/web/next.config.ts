import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: {
    // Default is 1MB; receipt photos can exceed that and abort the server-action POST.
    serverActions: {
      bodySizeLimit: "8mb",
    },
  },
};

export default nextConfig;
