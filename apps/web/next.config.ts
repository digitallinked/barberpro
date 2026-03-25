import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Default is 1MB; receipt photos exceed that and abort the server-action POST (Failed to fetch).
  serverActions: {
    bodySizeLimit: "8mb"
  }
};

export default nextConfig;
