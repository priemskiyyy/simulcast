import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/**/*.test.ts"],
    globalSetup: ["src/setup.ts"],
    globals: false,
    environment: "node",
    testTimeout: 15_000,
    hookTimeout: 120_000,
    expect: { poll: { timeout: 10_000, interval: 20 } },
  },
});
