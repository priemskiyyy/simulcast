import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/**/*.test.ts"],
    globalSetup: ["src/setup.ts"],
    environment: "node",
    testTimeout: 15_000,
    hookTimeout: 15_000,
    expect: { poll: { timeout: 8_000, interval: 20 } },
  },
});
