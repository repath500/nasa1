import { defineConfig, devices } from '@playwright/test';

/** Smoke specs run against the Vite dev server. No API server is started: the app must degrade (offline, billing off). */
export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  reporter: [['list']],
  use: { baseURL: 'http://127.0.0.1:5173', trace: 'retain-on-failure', launchOptions: { executablePath: process.env.PW_CHROMIUM_PATH || undefined } },
  webServer: { command: 'pnpm exec vite --host 127.0.0.1 --port 5173', url: 'http://127.0.0.1:5173', reuseExistingServer: true, timeout: 60_000 },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }, { name: 'phone', use: { ...devices['Pixel 5'], browserName: 'chromium' }, grep: /@phone/ }],
});
