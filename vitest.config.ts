import { fileURLToPath } from 'node:url';
import { defineConfig, defineProject } from 'vitest/config';

/**
 * Vitest 4.1.10 configuration for M3 (verification-foundation).
 *
 * - `envDir: false` keeps Vitest from loading any `.env` files; tests never
 *   see credentials. Spec: R-verify-1, R-verify-9.
 * - `resolve.alias` mirrors the `tsconfig.json` `"@/*": ["./*"]` paths mapping
 *   because Vitest 4 does not expose a top-level `resolve.tsconfigPaths`
 *   option (verified against the installed `vitest@4.1.10` type surface).
 * - `setupFiles` registers `tests/setup.ts`, which is created in WU4. Until
 *   that commit lands, `npm run test` exits 0 with no tests (R-verify-1).
 * - Two projects: `unit` (pure-fn characterizations in `utils/**`) under Node,
 *   and `integration` (hook characterizations in `hooks/**`) under jsdom.
 *   M3a only authors the `utils/**` suites; the `hooks/**` suites belong to
 *   M3b but the project is declared here so it exists from day one. Each
 *   project inherits the root `test` config (setupFiles, passWithNoTests,
 *   clearMocks, restoreMocks) by virtue of the projects not overriding those
 *   keys.
 */

export default defineConfig({
    envDir: false,
    resolve: {
        alias: {
            '@': fileURLToPath(new URL('./', import.meta.url))
        }
    },
    test: {
        setupFiles: ['tests/setup.ts'],
        passWithNoTests: true,
        clearMocks: true,
        restoreMocks: true,
        projects: [
            defineProject({
                test: {
                    name: 'unit',
                    include: ['utils/**/*.char.test.ts'],
                    environment: 'node'
                }
            }),
            defineProject({
                test: {
                    name: 'integration',
                    include: ['hooks/**/*.char.test.ts'],
                    environment: 'jsdom'
                }
            })
        ]
    }
});
