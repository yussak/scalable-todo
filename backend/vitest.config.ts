import { defineConfig } from "vitest/config";
import { loadEnv } from "vite";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    setupFiles: "./tests/setup.ts",
    env: {
      NODE_ENV: "test",
      ...loadEnv("test", process.cwd(), ""),
    },
  },
});
