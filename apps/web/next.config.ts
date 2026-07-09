import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@av-crm/shared-types"],
};

export default nextConfig;
