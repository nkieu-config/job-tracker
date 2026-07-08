import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@job-tracker/db", "@job-tracker/shared"],
};

export default nextConfig;
