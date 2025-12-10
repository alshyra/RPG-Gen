import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E configuration for RPG-Gen frontend
 * Centralized E2E tests with automatic webServer management
 */
export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : 1,
  reporter: process.env.CI ? 'github' : 'html',

  use: {
    baseURL: 'http://localhost',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // Playwright will use existing docker compose setup
  // Frontend is on http://localhost (port 80) via docker
  // Tests assume services are already running
  // To run tests: docker compose -f compose.dev.yml up -d && npm run test:e2e
});
