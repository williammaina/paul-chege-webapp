import type { NextConfig } from "next";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  // The API router lives one level up, outside this app, so file tracing
  // has to be told where the real project root is or the build ships a
  // route handler whose import is missing.
  outputFileTracingRoot: resolve(here, ".."),
  // Next writes AGENTS.md and CLAUDE.md into the app on every build. They
  // are generated, not authored, so they are not tracked here.
  agentRules: false,
};

export default nextConfig;
