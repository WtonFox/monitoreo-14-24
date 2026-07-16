import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
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
          secure: false, // To prevent SSL certificate issues
          configure: (proxy, _options) => {
            proxy.on('proxyReq', (proxyReq, req, _res) => {
              // Log para debugging
              console.log(
                `[Proxy] ${req.method} ${req.url} -> ${proxyReq.getHeader('host')}`,
              );
            });
            proxy.on('error', (err, _req, _res) => {
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
