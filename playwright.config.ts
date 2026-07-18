import { defineConfig } from "@playwright/test";
import { config as loadEnv } from "dotenv";
import { BASE_URL, CONTEXT_OPTIONS } from "./e2e/helpers";

loadEnv({ path: ".env", quiet: true });

// No `webServer`: the app shares port 3000 with other local work, so the suite
// runs against an already-running instance (like the screenshots script) rather
// than starting — and possibly colliding with — its own. Start the app first
// (npm run dev, or build && start), then `npm run test:e2e`. Point BASE_URL at a
// deployed URL to smoke-test production.
export default defineConfig({
  testDir: "./e2e",
  testMatch: "**/*.spec.ts",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: "list",
  use: {
    baseURL: BASE_URL,
    viewport: { ...CONTEXT_OPTIONS.viewport },
    colorScheme: "light",
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium" }],
});
