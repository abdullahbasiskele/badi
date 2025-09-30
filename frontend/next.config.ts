import { config } from "dotenv";
import { resolve } from "path";
import type { NextConfig } from "next";

config({ path: resolve(__dirname, "../.env"), override: true });
config({ path: resolve(__dirname, "../.env.local"), override: true });

const nextConfig: NextConfig = {};

export default nextConfig;