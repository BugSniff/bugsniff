import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Para monorepo Turborepo
  transpilePackages: ["@bugsniff/shared"],
};

export default nextConfig;
