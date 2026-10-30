import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Local-only in-process Postgres; loads its WASM from node_modules at runtime.
  serverExternalPackages: ["@electric-sql/pglite"],
};

export default nextConfig;
