import path from "node:path";
import type { NextConfig } from "next";

const defaultAllowedDevOrigins = ["localhost", "127.0.0.1"];

const allowedDevOrigins = Array.from(
  new Set([
    ...defaultAllowedDevOrigins,
    ...(process.env.ALLOWED_DEV_ORIGINS ?? "")
      .split(",")
      .map((origin) => origin.trim())
      .filter(Boolean),
  ]),
);

const nextConfig: NextConfig = {
  ...(allowedDevOrigins.length > 0 ? { allowedDevOrigins } : {}),
  turbopack: {
    root: path.join(__dirname),
  },
};

export default nextConfig;
