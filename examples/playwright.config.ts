import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: ".",
  testMatch: "dashboard.spec.ts",
  outputDir: "../.artifacts/example-results",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  timeout: 30_000,
  use: { trace: "retain-on-failure", screenshot: "only-on-failure" },
  projects: ["react", "vue", "solid", "svelte", "expo"].map((name, index) => ({
    name,
    use: {
      ...devices["Desktop Chrome"],
      baseURL: `http://127.0.0.1:${4190 + index}`,
    },
  })),
  webServer: {
    command: "node scripts/serve-examples.mjs",
    cwd: "..",
    url: "http://127.0.0.1:4194",
    reuseExistingServer: !process.env.CI,
  },
});
