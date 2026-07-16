import { test, expect } from '@playwright/test';
import { ADMIN_TOKEN, CONSULTOR_TOKEN, injectToken } from './helpers';

test.describe('Login / Auth', () => {
  test('valid admin token renders dashboard (estadisticas)', async ({ page }) => {
    await injectToken(page, ADMIN_TOKEN);
    await page.goto('/');

    // HashRouter redirects / → /#/estadisticas
    await page.waitForURL('**/estadisticas');
    await expect(page.locator('text=Estadísticas').first()).toBeVisible({ timeout: 10_000 });
  });

  test('insufficient role (consultor) on protected route shows forbidden', async ({ page }) => {
    await injectToken(page, CONSULTOR_TOKEN);

    // Navigate directly to /participantes — requires admin or supervisor
    await page.goto('/#/participantes');

    // The page loads, HashRouter processes #/participantes, ProtectedRoute
    // checks permission → consultor not allowed → redirect to /forbidden
    await expect(page).toHaveURL(/forbidden/);
    await expect(page.locator('text=Acceso denegado').or(page.locator('text=Forbidden'))).toBeVisible({ timeout: 10_000 });
  });
});
