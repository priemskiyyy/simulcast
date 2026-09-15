import { defineConfig } from "tsdown";
import type { UserConfig } from "tsdown";

// Vite builds the core bundle first; tsdown adds its declarations and builds the wrappers.
const wrapper: UserConfig = {
  format: ["esm"],
  target: "es2022",
  platform: "neutral",
  dts: true,
  clean: false,
  sourcemap: true,
  external: ["@priemskiyyy/simulcast-devtools"],
};

export default defineConfig([
  {
    entry: { index: "src/index.ts" },
    platform: "neutral",
    dts: { emitDtsOnly: true },
    clean: false,
  },
  { ...wrapper, entry: { react: "src/react.ts" }, banner: '"use client";' },
  {
    ...wrapper,
    entry: {
      vue: "src/vue.ts",
      solid: "src/solid.ts",
      svelte: "src/svelte.ts",
    },
  },
]);
