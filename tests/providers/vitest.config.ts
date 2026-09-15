import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/**/*.test.ts"],
    globals: false,
    environment: "node",
    testTimeout: 10_000,
    hookTimeout: 10_000,
    expect: { poll: { timeout: 5_000, interval: 10 } },
  },
});
