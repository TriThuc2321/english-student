import { defineConfig, devices } from '@playwright/test';

// Not 3000, so a local run never reuses a `pnpm dev` that points at the real API.
const PORT = Number(process.env.E2E_PORT) || 3100;
const MOCK_API_PORT = Number(process.env.MOCK_API_PORT) || 4010;
const MOCK_API_URL = `http://localhost:${MOCK_API_PORT}`;
const BASE_URL = `http://localhost:${PORT}`;
const CI = !!process.env.CI;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: CI,
  retries: CI ? 2 : 0,
  workers: CI ? 1 : undefined,
  reporter: CI ? [['github'], ['html', { open: 'never' }]] : 'html',
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: [
    {
      command: 'node e2e/mock-api/server.ts',
      url: `${MOCK_API_URL}/health`,
      reuseExistingServer: !CI,
    },
    {
      // CI tests the production build (built in a prior step); locally reuse `pnpm dev`.
      command: CI ? `pnpm start -p ${PORT}` : `pnpm dev -p ${PORT}`,
      url: `${BASE_URL}/login`,
      reuseExistingServer: !CI,
      timeout: 120_000,
      // Process env wins over .env.local, so Next talks to the mock API.
      env: { NEXT_PUBLIC_API_URL: MOCK_API_URL },
    },
  ],
});
