import type { NextConfig } from "next";

const nextConfig = {
  serverExternalPackages: ["@node-rs/argon2"],
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
};

export default nextConfig as NextConfig;
