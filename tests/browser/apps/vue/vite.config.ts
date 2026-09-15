import { fileURLToPath } from "node:url";
import vue from "@vitejs/plugin-vue";
import { createFixtureConfig } from "../../createFixtureConfig";

export default createFixtureConfig({
  root: fileURLToPath(new URL(".", import.meta.url)),
  port: 4176,
  plugins: [vue()],
  aliases: { "@priemskiyyy/simulcast-vue": "packages/vue/dist/index.js" },
});
