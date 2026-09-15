import { fileURLToPath } from "node:url";
import { createFixtureConfig } from "../../createFixtureConfig";

export default createFixtureConfig({
  root: fileURLToPath(new URL(".", import.meta.url)),
  port: 4173,
  aliases: {
    "@priemskiyyy/simulcast-centrifugo/react":
      "packages/adapters/centrifugo/dist/react.js",
    "@priemskiyyy/simulcast-devtools/react": "packages/devtools/dist/react.js",
    "@priemskiyyy/simulcast-devtools": "packages/devtools/dist/index.js",
    "@priemskiyyy/simulcast-react": "packages/react/dist/index.js",
  },
});
