import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests/e2e',
  outputDir: './test-results',
  use: {
    baseURL: 'http://localhost:8080',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'retain-on-failure',
  },
  webServer: undefined,
});
