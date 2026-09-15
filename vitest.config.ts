import { fileURLToPath } from "node:url";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import solid from "vite-plugin-solid";
import type { PluginOption } from "vite";
import { defineConfig } from "vitest/config";
import type { TestProjectConfiguration } from "vitest/config";

const packages = ["core", "react", "vue", "codegen"];
const source = (path: string) => fileURLToPath(new URL(path, import.meta.url));
// Solid needs its Vite plugin and browser resolution so effects run in jsdom.
const solidProject = (
  name: string,
  options: { plugins?: PluginOption[]; alias?: Record<string, string> } = {},
): TestProjectConfiguration => ({
  extends: true,
  plugins: [solid(), ...(options.plugins ?? [])],
  resolve: {
    alias: { src: source(`./packages/${name}/src`), ...options.alias },
    conditions: ["development", "browser"],
  },
  test: {
    name,
    include: [`packages/${name}/src/**/*.test.{ts,tsx}`],
    environment: "jsdom",
    server: { deps: { inline: [/solid-js/, /@solidjs\/testing-library/] } },
  },
});
// The devtools core is Solid; its wrappers are tested against every binding, so the Svelte plugin joins in.
const devtoolsProject = solidProject("devtools", {
  plugins: [svelte({ configFile: false })],
  alias: { "simulcast-devtools": source("./packages/devtools/src/index.ts") },
});
// Svelte compiles components for the browser in jsdom, so server rendering
// gets its own node project without browser resolution.
const svelteProject: TestProjectConfiguration = {
  extends: true,
  plugins: [svelte({ configFile: false })],
  resolve: { conditions: ["browser"] },
  test: {
    name: "svelte",
    include: ["packages/svelte/src/**/*.test.ts"],
    exclude: ["**/*.server.test.ts"],
    environment: "jsdom",
  },
};
const svelteServerProject: TestProjectConfiguration = {
  extends: true,
  plugins: [svelte({ configFile: false })],
  test: {
    name: "svelte-ssr",
    include: ["packages/svelte/src/**/*.server.test.ts"],
  },
};
const adapters = [
  "centrifugo",
  "pusher",
  "ably",
  "supabase",
  "socketio",
  "phoenix",
  "mqtt",
  "websocket",
  "sse",
  "partykit",
  "broadcast-channel",
];

const project = (
  directory: string,
  name: string,
): TestProjectConfiguration => ({
  extends: true,
  resolve: {
    alias: {
      src: fileURLToPath(
        new URL(`./${directory}/${name}/src`, import.meta.url),
      ),
    },
  },
  test: { name, include: [`${directory}/${name}/src/**/*.test.{ts,tsx}`] },
});

export default defineConfig({
  // Workspace peers must use the same React instance as the renderer under test.
  resolve: { dedupe: ["react", "react-dom"] },
  test: {
    globals: false,
    environment: "node",
    restoreMocks: true,
    projects: [
      ...packages.map((name) => project("packages", name)),
      project("examples", "expo"),
      solidProject("solid"),
      devtoolsProject,
      svelteProject,
      svelteServerProject,
      ...adapters.map((name) => project("packages/adapters", name)),
      {
        extends: true,
        test: {
          name: "example-shared",
          include: ["examples/shared/src/**/*.test.ts"],
        },
      },
    ],
  },
});
