import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import https from 'https';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  const basePath = env.VITE_BASE_PATH || '/';
  return {
    base: basePath,
    server: {
      port: 3000,
      host: '0.0.0.0',
      proxy: {
        '/api': {
          target: 'https://presidenciamonitoreo1424api.gabsocial.gob.do',
          changeOrigin: true,
          secure: false,
          timeout: 30000,
          agent: new https.Agent({ keepAlive: true, maxSockets: 4 }),
          configure: (proxy, _options) => {
            proxy.on('proxyReq', (proxyReq, req, _res) => {
              console.log(`[Proxy] ${req.method} ${req.url} -> ${proxyReq.getHeader('host')}`);
            });
            proxy.on('proxyRes', (proxyRes, req) => {
              if (proxyRes.statusCode === 502 || proxyRes.statusCode === 504) {
                console.warn(`[Proxy] ${req.url} -> ${proxyRes.statusCode} (API timeout)`);
              }
            });
            proxy.on('error', (err, req, res) => {
              if ((err as NodeJS.ErrnoException).code === 'ECONNRESET') {
                return; // Silencioso — el retry en useDashboardData lo maneja
              }
              console.error('[Proxy Error]', err.message);
            });
          },
        },
      },
    },
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        workbox: {
          globPatterns: ['**/*.{js,css,html,svg,png,jpg,woff2}'],
        },
        manifest: {
          name: 'Monitor Oportunidad 14-24',
          short_name: 'Monitoreo 14-24',
          description: 'Panel GPS de monitoreo de la Oportunidad 14-24',
          theme_color: '#1e3a5f',
          background_color: '#f3f4f6',
          display: 'standalone',
          icons: [
            { src: '/icons/icon-192x192.svg', sizes: '192x192', type: 'image/svg+xml' },
            { src: '/icons/icon-512x512.svg', sizes: '512x512', type: 'image/svg+xml' },
          ],
        },
      }),
    ],
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
  };
});
