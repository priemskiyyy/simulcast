import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/**/*.test.ts"],
    globals: false,
    environment: "node",
    testTimeout: 20_000,
    hookTimeout: 20_000,
    expect: { poll: { timeout: 10_000, interval: 20 } },
  },
});
