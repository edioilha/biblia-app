import { defineConfig, devices } from '@playwright/test';

const PORTA = 4173;
const CI = !!process.env['CI'];

// O Firefox do Playwright não inicia no macOS 27 ("Could not find profile folder");
// localmente no Mac ele é pulado e roda apenas no CI (Linux).
const incluirFirefox = CI || process.platform !== 'darwin';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: CI,
  retries: CI ? 2 : 0,
  reporter: CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: `http://localhost:${PORTA}/biblia-app/`,
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    ...(incluirFirefox ? [{ name: 'firefox', use: { ...devices['Desktop Firefox'] } }] : []),
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
    { name: 'mobile', use: { ...devices['iPhone 15'] } },
  ],
  webServer: {
    command: `npm run build && npm run preview -- --port ${PORTA} --strictPort`,
    url: `http://localhost:${PORTA}/biblia-app/`,
    reuseExistingServer: !CI,
    timeout: 120_000,
  },
});
