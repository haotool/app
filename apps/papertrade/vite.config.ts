import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { APP_CONFIG } from './app.config.mjs';

export default defineConfig(({ mode }) => {
  const __dirname = dirname(fileURLToPath(import.meta.url));
  const base =
    mode === 'production'
      ? APP_CONFIG.basePath.production
      : process.env['CI']
        ? APP_CONFIG.basePath.ci
        : APP_CONFIG.basePath.development;
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@app/papertrade': resolve(__dirname, './src'),
      },
    },
    base,
  };
});
