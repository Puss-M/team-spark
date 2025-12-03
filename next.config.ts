import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  // Externalize transformers library to prevent client-side bundling
  serverExternalPackages: ['@xenova/transformers'],
};

export default nextConfig;
