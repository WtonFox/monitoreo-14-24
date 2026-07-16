import { test, expect } from '@playwright/test';
import { ADMIN_TOKEN, injectToken } from './helpers';

/**
 * All hash routes from router.tsx excluding redirect-only entries.
 *
 * - `hash`: the route to navigate to
 * - `assertUrl`: optional final URL pattern after redirects (e.g. /impacto-social → /indicadores/impacto)
 * - `title`: text to assert visible on the rendered page
 *
 * Redirect-only entries (calidad-nd → calidad-dato) are omitted.
 */
const ROUTES: { hash: string; assertUrl?: RegExp; title: string }[] = [
  { hash: '/estadisticas', title: 'Estadísticas' },
  { hash: '/impacto-social', assertUrl: /indicadores\/impacto/, title: 'Impacto Compuesto' },
  { hash: '/mapa-interactivo', title: 'Mapa Interactivo' },
  { hash: '/participantes', title: 'Participantes' },
  { hash: '/diagnostico', title: 'Diagnóstico' },
  { hash: '/indicadores', title: 'Indicadores del Programa' },
  { hash: '/indicadores/demograficos', title: 'Demográficos' },
  { hash: '/indicadores/territoriales', title: 'Territoriales' },
  { hash: '/indicadores/programa', title: 'Programa' },
  { hash: '/indicadores/impacto', title: 'Impacto Compuesto' },
  { hash: '/indicadores/calidad-dato', title: 'Calidad del Dato' },
  { hash: '/indicadores/vulnerabilidad', title: 'Vulnerabilidad' },
  { hash: '/indicadores/cobertura-temporal', title: 'Cobertura' },
  { hash: '/indicadores/nivel-educativo', title: 'Nivel Educativo' },
  { hash: '/indicadores/desempeno-centro', title: 'Desempeño' },
  { hash: '/indicadores/centros-sin-menores', title: 'Centros Sin Menores' },
  { hash: '/indicadores/desercion', title: 'Deserción' },
  { hash: '/indicadores/registro-diario', title: 'Registro Diario' },
  { hash: '/alertas', title: 'Alertas del Sistema' },
  { hash: '/forbidden', title: 'Acceso Denegado' },
];

test.describe('Navigation — all routes render', () => {
  test.beforeEach(async ({ page }) => {
    await injectToken(page, ADMIN_TOKEN);
  });

  for (const { hash, assertUrl, title } of ROUTES) {
    test(`${hash} renders`, async ({ page }) => {
      await page.goto(`/#${hash}`);

      // Use domcontentloaded instead of networkidle because pages with
      // data-fetching (participantes, alertas) may have pending API calls
      // that never resolve in the test environment.
      await page.waitForLoadState('domcontentloaded');

      // If the route redirects (e.g. impacto-social → indicadores/impacto),
      // wait for the final URL.
      if (assertUrl) {
        await expect(page).toHaveURL(assertUrl, { timeout: 10_000 });
      }

      // Wait for the expected title text to appear
      await expect(
        page.getByText(title, { exact: false }).first(),
      ).toBeVisible({ timeout: 15_000 });
    });
  }
});
