import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import solid from "vite-plugin-solid";

// The core bundles its Solid runtime, so host applications need no Solid install.
// Event delegation registers on `window` at import time, which breaks server imports of the wrappers.
export default defineConfig({
  plugins: [solid({ solid: { delegateEvents: false } })],
  resolve: { alias: { src: fileURLToPath(new URL("./src", import.meta.url)) } },
  build: {
    lib: {
      entry: fileURLToPath(new URL("./src/index.ts", import.meta.url)),
      formats: ["es"],
      fileName: "index",
    },
    rollupOptions: { external: ["simulcast", "zod"] },
    target: "es2022",
    sourcemap: true,
    minify: false,
  },
});
