# Tasks: E2E Playwright Tests

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~260 |
| 400-line budget risk | Low |
| Chained PRs recommended | No |
| Suggested split | Single PR |
| Delivery strategy | single-pr |
| Chain strategy | size-exception |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: size-exception
400-line budget risk: Low

### Suggested Work Units

| Unit | Goal | Likely PR | Focused test command | Runtime harness | Rollback boundary |
|------|------|-----------|----------------------|-----------------|-------------------|
| 1 | Full E2E setup + 4 specs | single PR | `npm run test:e2e` | `npm run dev` (or webServer auto-start) | revert package.json, delete playwright.config.ts + e2e/ |

## Phase 1: Infrastructure

- [x] 1.1 Install `@playwright/test` as devDependency
- [x] 1.2 Install Chromium browser via `npx playwright install chromium`
- [x] 1.3 Create `playwright.config.ts` with `webServer` pointing to Vite, `baseURL: 'http://localhost:3000'`, hash-based route patterns
- [x] 1.4 Add `"test:e2e": "playwright test"` to `package.json` scripts

## Phase 2: Test Setup

- [x] 2.1 Create `e2e/auth.setup.ts` — global setup that injects `window.__AUTH_TOKEN` via `page.addInitScript`

## Phase 3: Test Specs

- [x] 3.1 Create `e2e/login.spec.ts` — valid token redirects to `/estadisticas`, invalid/insufficient token shows forbidden
- [x] 3.2 Create `e2e/navigation.spec.ts` — visit all hash routes from `router.tsx` under auth (estadisticas, impacto-social, mapa-interactivo, participantes, diagnostico, indicadores + sub-boards, alertas, forbidden)
- [x] 3.3 Create `e2e/participants.spec.ts` — table renders rows, detail modal opens/closes
- [x] 3.4 Create `e2e/alerts.spec.ts` — alert cards render on the alertas page

## Phase 4: Verify

- [x] 4.1 Run `npm run test:e2e` — all specs green, no flakes (25/25 passed)
