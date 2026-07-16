import { test as setup } from '@playwright/test';

/**
 * Mock JWT payload: { role: "admin", name: "E2E Test", exp: 9999999999 }
 *
 * We construct a minimal three-part JWT because authStore.decodeToken()
 * splits on '.' and base64-decodes the payload. The header and signature
 * are never validated — only the payload's `role` and `exp` fields matter.
 */
const HEADER = btoa(JSON.stringify({ alg: 'HS256' }));
const PAYLOAD = btoa(JSON.stringify({ role: 'admin', name: 'E2E Test', exp: 9_999_999_999 }));
const MOCK_TOKEN = `${HEADER}.${PAYLOAD}.fake-signature`;

setup('authenticate as admin', async ({ page }) => {
  // Inject the mock token BEFORE any app code runs
  await page.addInitScript((token) => {
    (window as unknown as Record<string, unknown>).__AUTH_TOKEN = token;
  }, MOCK_TOKEN);

  // Navigate to a protected route to confirm auth works
  await page.goto('/');
  await page.waitForURL('**/estadisticas');
  // Confirm the page loads a non-forbidden, non-login view
  await page.waitForSelector('text=Estadísticas', { timeout: 10_000 });
});
