import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  distDir: process.env.NEXT_DIST_DIR ?? ".next",
  typedRoutes: true,
  transpilePackages: ["@profilecore/profile-schema"],
};

export default nextConfig;
