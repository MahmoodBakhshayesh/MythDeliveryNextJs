import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  /** Slim runtime image when using `deploy/docker` Dockerfile (standalone server). */
  output: "standalone",
};

export default nextConfig;
