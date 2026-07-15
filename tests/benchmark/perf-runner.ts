/**
 * Tier 2 browser benchmark runner (Playwright).
 *
 * Serves the production build and captures browser-level metrics:
 * commit-to-paint, long tasks (>50ms), JS heap memory.
 *
 * Run on demand: `npm run bench:browser`
 *
 * NOTE: Requires Playwright to be installed separately (`npx playwright install chromium`).
 * This is an informational tier; Tier 1 (vitest bench) is the actionable gate.
 */

// Stub — implement when Playwright is available in the project.
async function main() {
  console.log('');
  console.log('╔══════════════════════════════════════════════╗');
  console.log('║  Tier 2 browser benchmark (Playwright)       ║');
  console.log('║                                              ║');
  console.log('║  Install Playwright:                         ║');
  console.log('║    npx playwright install chromium            ║');
  console.log('║                                              ║');
  console.log('║  Then implement perf-runner.ts to:            ║');
  console.log('║  1. Start vite preview on dist/               ║');
  console.log('║  2. Navigate to /indicadores                  ║');
  console.log('║  3. Capture performance.getEntriesByType      ║');
  console.log('║  4. Measure long tasks, heap, commit-to-paint ║');
  console.log('╚══════════════════════════════════════════════╝');
  console.log('');
}

main().catch(console.error);
