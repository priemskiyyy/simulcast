import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import type { PluginOption } from "vite";

const dist = (file: string) =>
  fileURLToPath(new URL(`../../${file}`, import.meta.url));

/** Serves one framework fixture against the built packages behind the shared test server and Centrifugo proxies. */
export const createFixtureConfig = ({
  root,
  port,
  aliases,
  plugins = [],
}: {
  root: string;
  port: number;
  /** Binding entry points, keyed by package name. A subpath alias must precede its package alias. */
  aliases: Record<string, string>;
  plugins?: PluginOption[];
}) =>
  defineConfig({
    root,
    // Each Vite server optimizes a different framework dependency graph.
    cacheDir: dist(`node_modules/.vite/browser-${port}`),
    plugins,
    resolve: {
      alias: {
        ...Object.fromEntries(
          Object.entries(aliases).map(([name, file]) => [name, dist(file)]),
        ),
        "simulcast-centrifugo": dist(
          "packages/adapters/centrifugo/dist/index.js",
        ),
        simulcast: dist("packages/core/dist/index.js"),
      },
    },
    server: {
      host: "127.0.0.1",
      port,
      strictPort: true,
      proxy: {
        "/connection": { target: "http://127.0.0.1:4175", ws: true },
        "/test-api": {
          target: "http://127.0.0.1:4174",
          rewrite: (url) => url.replace(/^\/test-api/, ""),
        },
      },
    },
  });
