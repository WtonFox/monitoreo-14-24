import { test, expect } from '@playwright/test';
import { ADMIN_TOKEN, injectToken } from './helpers';
import { mockParticipantApi } from './mockData';

test.describe('Participants page', () => {
  test.beforeEach(async ({ page }) => {
    await mockParticipantApi(page, 50);
    await injectToken(page, ADMIN_TOKEN);
    await page.goto('/#/participantes');
    // Page has loaded; data-fetching API calls are intercepted by the mock.
    // The table assertion below waits for data to populate.
  });

  test('table renders rows after data loads', async ({ page }) => {
    // Wait for the table body to have at least one row (data loaded)
    const rows = page.locator('table tbody tr');
    await expect(rows.first()).toBeVisible({ timeout: 15_000 });

    // Confirm data rows exist (not the loading indicator)
    await expect(rows.first()).not.toContainText('Cargando datos', { timeout: 10_000 });
    const count = await rows.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('detail modal opens and closes on row click', async ({ page }) => {
    // Wait for table data to finish loading
    const rows = page.locator('table tbody tr');
    await expect(rows.first()).toBeVisible({ timeout: 15_000 });
    await expect(rows.first()).not.toContainText('Cargando datos', { timeout: 10_000 });

    // Click the first real data row
    await rows.first().click();

    // The ParticipantDetailModal should appear — look for the detail header text
    const modalHeader = page.locator('text=Detalles del participante');
    await expect(modalHeader).toBeVisible({ timeout: 5_000 });

    // Close the modal by pressing Escape
    await page.keyboard.press('Escape');

    // Modal should close — the detail text should disappear
    await expect(modalHeader).not.toBeVisible({ timeout: 3_000 });
  });
});
