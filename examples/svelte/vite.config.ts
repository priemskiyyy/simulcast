import { fileURLToPath } from "node:url";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [svelte({ configFile: false }), tailwindcss()],
  resolve: { alias: { src: fileURLToPath(new URL("./src", import.meta.url)) } },
});
