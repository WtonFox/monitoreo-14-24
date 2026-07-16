# Tasks: PWA + Service Worker

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 200-300 |
| 400-line budget risk | Low |
| Chained PRs recommended | No |
| Suggested split | Single PR |
| Delivery strategy | single-pr |
| Chain strategy | pending |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: Low

### Suggested Work Units

| Unit | Goal | Likely PR | Focused test command | Runtime harness | Rollback boundary |
|------|------|-----------|----------------------|-----------------|-------------------|
| 1 | Full PWA: install dep + config + icons + meta + InstallPWA component | PR 1 | `npm run build` — verify `dist/sw.js` && `dist/manifest.webmanifest` exist | `npm run dev` — DevTools > Application > Manifest + Service Workers | Revert commit; SW unregisters on next redeploy |

## Phase 1: Foundation

- [x] 1.1 Install `vite-plugin-pwa` as devDependency
- [x] 1.2 Add `VitePWA({ registerType: 'autoUpdate', workbox: { globPatterns: ['**/*.{js,css,html,svg,png,jpg,woff2}'] }, manifest: { name, short_name, theme_color '#1e3a5f', icons: [192x192, 512x512] } })` to `vite.config.ts` plugins array
- [x] 1.3 Create `public/icons/icon-192x192.svg` and `public/icons/icon-512x512.svg` (placeholder SVGs)

## Phase 2: Core Implementation

- [x] 2.1 Update `index.html`: `<meta name="theme-color" content="#1e3a5f">`, `<meta name="apple-mobile-web-app-capable" content="yes">`, `<link rel="apple-touch-icon" href="/icons/icon-192x192.svg">`; add `worker-src 'self'` to CSP
- [x] 2.2 Create `components/InstallPWA.tsx` — `beforeinstallprompt` listener, state toggle, install button with `deferredPrompt.prompt()`, hide after install or dismissed
- [x] 2.3 Wire `<InstallPWA />` into `App.tsx` (persistent bottom-corner badge or header button)
