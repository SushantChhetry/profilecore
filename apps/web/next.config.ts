import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typedRoutes: true,
  transpilePackages: ["@profilecore/profile-schema"],
};

export default nextConfig;
