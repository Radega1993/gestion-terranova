import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './playwright',
  timeout: 90_000,
  expect: { timeout: 10_000 },
  retries: 0,
  use: {
    baseURL: 'http://localhost:5173',
    headless: true,
    viewport: { width: 1280, height: 720 },
  },
  reporter: [['list']],
});

