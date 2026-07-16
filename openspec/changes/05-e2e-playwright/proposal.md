# Proposal: E2E Tests with Playwright

## Intent

Current test coverage is limited to unit and integration tests (Vitest). Critical user paths — login, navigation, participants table, filters, alerts, export — have zero E2E coverage. This change adds Playwright to catch regressions across real browser interactions that unit/integration tests cannot reproduce.

## Scope

### In Scope
- Install `@playwright/test` (dev dependency)
- `playwright.config.ts` — base URL, global setup, webServer for Vite dev server
- `e2e/` directory with test files:
  - `login.spec.ts` — valid token → dashboard, invalid token → error
  - `navigation.spec.ts` — visit all protected routes
  - `participants.spec.ts` — table rows, detail modal open/close, provincia/search/year filters
  - `alerts.spec.ts` — alert cards render
  - `export.spec.ts` — mass export modal opens
- npm script: `test:e2e`
- Global setup: sets `window.__AUTH_TOKEN` since auth is server-injected

### Out of Scope
- CI workflow — deferred to a separate change (GitHub Actions)
- Visual regression tests (screenshots per route)
- Performance/E2E benchmarks (Lighthouse, Web Vitals)
- Authentication against real API endpoints (uses injected token only)

## Capabilities

### New Capabilities
- `e2e-testing`: Playwright-based E2E test suite covering critical user paths (login, navigation, participants CRUD, filters, alerts, export modal)

### Modified Capabilities
- None — E2E tests verify existing behavior from `participant-data`, `participant-detail-modal`, and `filter-persistence` specs without changing their requirements

## Approach

1. Install `@playwright/test` via npm
2. Create `playwright.config.ts` with base URL (`http://localhost:5173`), global setup that injects `window.__AUTH_TOKEN`, and webServer config to auto-start Vite
3. Auth is handled via `window.__AUTH_TOKEN` (set by .NET server) — tests use `page.addInitScript()` to set it before each test
4. Tests use hash-based routing (`/estadisticas`, `/participantes`, etc.) matching the app's `createHashRouter`
5. Each spec file covers one domain: login, navigation, participants, alerts, export
6. Add `"test:e2e": "playwright test"` to package.json

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `package.json` | Modified | Add `@playwright/test` devDependency + `test:e2e` script |
| `playwright.config.ts` | New | Playwright configuration (baseURL, webServer, globalSetup) |
| `e2e/global-setup.ts` | New | Sets auth token on `window.__AUTH_TOKEN` |
| `e2e/login.spec.ts` | New | Login with valid/invalid token |
| `e2e/navigation.spec.ts` | New | Route navigation coverage |
| `e2e/participants.spec.ts` | New | Table, detail modal, filters |
| `e2e/alerts.spec.ts` | New | Alert cards render |
| `e2e/export.spec.ts` | New | Export modal interaction |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Tests flaky due to IndexedDB async timing | Medium | Use `page.waitForSelector` + retry assertions with `expect.poll` |
| Auth token mechanism changes | Low | Global setup is single file; update token injection there |
| CI missing Playwright browsers | Low | No CI in this change; will add `npx playwright install --with-deps` when CI is added |

## Rollback Plan

Revert `package.json` (remove dep + script), delete `playwright.config.ts` and `e2e/` directory. One commit.

## Dependencies

- Playwright browsers must be installed on dev machine (`npx playwright install --with-deps chromium`)
- Vite dev server must be running (handled automatically by `webServer` config)

## Success Criteria

- [ ] `npm run test:e2e` passes locally with all tests green
- [ ] Login test covers both valid and invalid token paths
- [ ] Navigation test visits every route in `router.tsx`
- [ ] Participants test verifies table renders, modal opens/closes, and filters change results
- [ ] Alerts test verifies cards render
- [ ] Export test verifies modal opens
