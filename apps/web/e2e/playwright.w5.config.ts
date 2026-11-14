import { defineConfig } from '@playwright/test';

/** W5 smoke specs only. Run: pnpm --filter @fire/web exec playwright test -c e2e/playwright.w5.config.ts */
export default defineConfig({
  testDir: '.',
  testMatch: 'w5-*.spec.ts',
  timeout: 30_000,
  retries: 0,
  reporter: [['list']],
  use: { baseURL: 'http://127.0.0.1:5199', trace: 'off' },
  webServer: {
    command: 'pnpm exec vite --port 5199 --strictPort --host 127.0.0.1',
    cwd: '..',
    url: 'http://127.0.0.1:5199',
    reuseExistingServer: true,
    timeout: 60_000,
  },
});
