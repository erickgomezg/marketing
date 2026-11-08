import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  reporter: 'list',
  timeout: 30000,
  expect: { timeout: 5000 },
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1',
    browserName: 'chromium',
    headless: true,
    launchOptions: { args: ['--no-sandbox'] },
    trace: 'retain-on-failure',
  },
});
