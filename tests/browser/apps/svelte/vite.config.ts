import { fileURLToPath } from "node:url";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import { createFixtureConfig } from "../../createFixtureConfig";

export default createFixtureConfig({
  root: fileURLToPath(new URL(".", import.meta.url)),
  port: 4178,
  plugins: [svelte({ configFile: false })],
  aliases: { "@priemskiyyy/simulcast-svelte": "packages/svelte/dist/index.js" },
});
