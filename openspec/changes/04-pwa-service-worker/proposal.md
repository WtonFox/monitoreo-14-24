# Proposal: PWA + Service Worker

## Intent

Convert the SPA into an installable Progressive Web App with offline asset caching. Users on slow/unreliable networks (common in field deployments) should still navigate the app and see cached UI; data loads from IndexedDB when offline.

## Scope

### In Scope
- `vite-plugin-pwa` — install & configure in `vite.config.ts`
- Auto-generated manifest (name, icons, theme `#1e3a5f`)
- Service worker: App Shell pattern — precache all build assets (JS/CSS/HTML)
- `components/InstallPWA.tsx` — install prompt button (reacts to `beforeinstallprompt`)
- PWA meta tags in `index.html` (theme-color, apple-mobile-web-app-capable, etc.)
- Placeholder icons in `public/icons/` (192px, 512px, apple-touch-icon)
- Update CSP in `index.html` to allow SW scope

### Out of Scope
- Data caching in SW (IndexedDB already handles data offline)
- Background sync or push notifications
- Offline analytics or queuing
- Network-first strategies for API calls

## Capabilities

### New Capabilities
- `pwa-install`: PWA manifest, service worker registration, install prompt UX

### Modified Capabilities
- None

## Approach

1. `npm install vite-plugin-pwa` to `devDependencies`
2. Configure in `vite.config.ts`: `VitePWA({ registerType: 'autoUpdate', workbox: { globPatterns: ['**/*.{js,css,html,svg,png,jpg,woff2}'] }, manifest: { ... } })`
3. Generate icons from `public/op-1424.jpg` (or create SVG placeholders) at 192x192 and 512x512, place in `public/icons/`
4. Add PWA meta tags to `<head>` in `index.html`, update CSP to allow `self` SW scope
5. Create `components/InstallPWA.tsx` — hook into `beforeinstallprompt` event, render install button when prompt is available
6. Mount `InstallPWA` in `App.tsx` (persistent bottom-corner badge or header button)

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `package.json` | Modified | Add `vite-plugin-pwa` dep |
| `vite.config.ts` | Modified | Add `VitePWA()` plugin config |
| `index.html` | Modified | PWA meta tags, manifest link, CSP update |
| `public/icons/` | New | Generated icon assets (192, 512, apple-touch) |
| `components/InstallPWA.tsx` | New | Install prompt button component |
| `App.tsx` | Modified | Mount InstallPWA component |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| CSP blocks SW registration | Low | Test with `default-src 'self'` + add `worker-src 'self'` |
| Vercel serves SW with wrong MIME type | Low | SW is `.js` in `dist/`, Vite serves it as `text/javascript` |
| HashRouter + SW — offline navigation broken | Low | App Shell pattern caches `index.html`; HashRouter handles client-side routing after load |
| Icon generation unclear without image tooling | Medium | Use plugin's `includeAssets` or inline SVG favicon as fallback |

## Rollback Plan

- `git revert` the commit — SW unregisters when `vite-plugin-pwa` config is removed and build redeploys
- Or: clear `Application > Service Workers` in DevTools if testing locally

## Dependencies

- `vite-plugin-pwa` (npm)
- Existing `idb` lib for data (no change needed)

## Success Criteria

- [ ] Lighthouse PWA audit ≥ 90
- [ ] App installable via browser's "Install" / "Add to Home Screen" on Chrome desktop + mobile
- [ ] Full navigation works offline (UI renders from SW cache, data from IndexedDB)
- [ ] Install prompt button appears in supported browsers
