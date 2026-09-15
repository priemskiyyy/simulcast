import { fileURLToPath } from "node:url";
import solid from "vite-plugin-solid";
import { createFixtureConfig } from "../../createFixtureConfig";

export default createFixtureConfig({
  root: fileURLToPath(new URL(".", import.meta.url)),
  port: 4177,
  plugins: [solid()],
  aliases: { "@priemskiyyy/simulcast-solid": "packages/solid/dist/index.js" },
});
