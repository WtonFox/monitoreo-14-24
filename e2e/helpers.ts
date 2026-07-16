import { Page } from '@playwright/test';

/**
 * Build a minimal mock JWT that authStore.decodeToken() will accept.
 * Only the payload's `role` and `exp` fields are validated.
 */
function makeToken(role: string): string {
  const header = btoa(JSON.stringify({ alg: 'HS256' }));
  const payload = btoa(JSON.stringify({ role, name: 'E2E Test', exp: 9_999_999_999 }));
  return `${header}.${payload}.fake-signature`;
}

export const ADMIN_TOKEN = makeToken('admin');
export const CONSULTOR_TOKEN = makeToken('consultor');

/**
 * Inject __AUTH_TOKEN via addInitScript so it's present before any app code runs.
 */
export async function injectToken(page: Page, token: string): Promise<void> {
  await page.addInitScript((t: string) => {
    (window as unknown as Record<string, unknown>).__AUTH_TOKEN = t;
  }, token);
}

/**
 * Navigate to a hash route and wait for the page to settle.
 */
export async function gotoHash(page: Page, hashRoute: string): Promise<void> {
  await page.goto(`/#${hashRoute}`);
  // Wait for React to render
  await page.waitForLoadState('networkidle');
}
