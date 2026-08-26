import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  allowedDevOrigins: ["192.168.0.102"],
  serverExternalPackages: ["exceljs"],
};

export default nextConfig;
