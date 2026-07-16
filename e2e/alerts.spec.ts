import { test, expect } from '@playwright/test';
import { ADMIN_TOKEN, injectToken } from './helpers';
import { mockParticipantApi } from './mockData';

test.describe('Alerts page', () => {
  test.beforeEach(async ({ page }) => {
    await mockParticipantApi(page, 100);
    await injectToken(page, ADMIN_TOKEN);
    await page.goto('/#/alertas');
  });

  test('alert cards render on the page', async ({ page }) => {
    // Wait for the page heading and data to load. The alerts page shows
    // "Alertas del Sistema" in an h1. After data loads, AlertCard components
    // appear with an h3 per card. Wait for the first h3 (AlertCard title)
    // to confirm data is loaded and alerts are computed.
    const alertTitle = page.locator('h3').first();
    await expect(alertTitle).toBeVisible({ timeout: 15_000 });

    // Confirm the card count is >= 1 (at least one alert computed from mock data)
    const cardCount = await page.locator('h3').count();
    expect(cardCount).toBeGreaterThanOrEqual(1);

    // Check that at least one severity badge is visible (Crítica, Advertencia, or Informativa).
    // The AlertCard renders severity badges as <span> children.
    await expect(
      page.locator('span').filter({ hasText: /Crítica|Advertencia|Informativa/ }).first(),
    ).toBeVisible({ timeout: 5_000 });
  });
});
