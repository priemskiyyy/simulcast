import { defineConfig } from "tsdown";
import type { UserConfig } from "tsdown";

const shared = {
  format: ["esm"],
  target: "es2022",
  platform: "neutral",
  dts: true,
  sourcemap: true,
} satisfies UserConfig;

export default defineConfig([
  { ...shared, entry: ["src/index.ts"], clean: true },
  { ...shared, entry: ["src/react.ts"], clean: false, banner: '"use client";' },
]);
