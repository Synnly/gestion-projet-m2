import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
// https://vite.dev/config/
export default defineConfig({
    plugins: [react(), tailwindcss()],
    server: {
        watch: {
            usePolling: true,
        },
        proxy: {
            '/api-nominatim': {
                target: 'https://nominatim.openstreetmap.org',
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/api-nominatim/, ''),
                configure: (proxy, _options) => {
                    proxy.on('proxyReq', (proxyReq, req, _res) => {
                        proxyReq.setHeader('User-Agent', 'MonApplicationTest (contact@votre-email.com)');
                        proxyReq.setHeader('Referer', 'http://localhost:5173');
                    });
                },
            },
        },
    },
    test: {
        environment: 'jsdom',
        globals: true,
        setupFiles: './vitest.setup.ts',
        passWithNoTests: true,
    },
});
