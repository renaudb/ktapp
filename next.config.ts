import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === 'production';

const nextConfig: NextConfig = {
  assetPrefix: isProd ? "./" : undefined,
  output: isProd ? "export" : undefined,
};

export default nextConfig;
