// Builds the React Mission Control example into the documentation output so the
// site can host it at <base>/demo/ with no server or credentials.
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

// Mirror the base resolution in docs/.vitepress/config.ts so the demo and the
// site agree when only one of the variables is set.
const siteUrl = process.env.DOCS_SITE_URL;
const sitePath =
  process.env.DOCS_BASE_PATH ?? (siteUrl ? new URL(siteUrl).pathname : "/");
const base = `${sitePath.endsWith("/") ? sitePath : `${sitePath}/`}demo/`;
const outDir = fileURLToPath(
  new URL("../docs/.vitepress/dist/demo", import.meta.url),
);

execFileSync(
  "pnpm",
  [
    "--filter",
    "example-react",
    "exec",
    "vite",
    "build",
    "--base",
    base,
    "--outDir",
    outDir,
    "--emptyOutDir",
  ],
  { stdio: "inherit" },
);
