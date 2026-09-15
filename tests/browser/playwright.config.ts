import { defineConfig, devices } from "@playwright/test";
import type { PlaywrightTestConfig } from "@playwright/test";

type WebServer = Exclude<
  NonNullable<PlaywrightTestConfig["webServer"]>,
  unknown[]
>;

// One Vite server per framework fixture; bindings.spec.ts visits each origin.
const fixtures = [
  { name: "react", port: 4173 },
  { name: "vue", port: 4176 },
  { name: "solid", port: 4177 },
  { name: "svelte", port: 4178 },
];
const fixtureServer = ({
  name,
  port,
}: {
  name: string;
  port: number;
}): WebServer => ({
  command: `pnpm exec vite --config tests/browser/apps/${name}/vite.config.ts`,
  cwd: "../..",
  url: `http://127.0.0.1:${port}`,
  reuseExistingServer: !process.env.CI,
  gracefulShutdown: { signal: "SIGTERM", timeout: 5_000 },
});

export default defineConfig({
  testDir: ".",
  testMatch: "*.spec.ts",
  outputDir: "../../.artifacts/browser-results",
  fullyParallel: false,
  workers: 1,
  forbidOnly: Boolean(process.env.CI),
  timeout: 30_000,
  expect: { timeout: 10_000 },
  reporter: [
    ["list"],
    [
      "html",
      { outputFolder: "../../.artifacts/browser-report", open: "never" },
    ],
  ],
  use: {
    baseURL: "http://127.0.0.1:4173",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "firefox", use: { ...devices["Desktop Firefox"] } },
    { name: "webkit", use: { ...devices["Desktop Safari"] } },
  ],
  webServer: [
    {
      command: "node tests/browser/server.mjs",
      cwd: "../..",
      url: "http://127.0.0.1:4174/health",
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
      gracefulShutdown: { signal: "SIGTERM", timeout: 10_000 },
    },
    ...fixtures.map(fixtureServer),
  ],
});
