/// <reference types="vitest/config" />
import { readFileSync } from 'node:fs';
import { fileURLToPath, URL } from 'node:url';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig, type Plugin } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

// GitHub Pages publica em https://edioilha.github.io/biblia-app/ (ADR 0008)
const base = '/biblia-app/';
const { version } = JSON.parse(
  readFileSync(new URL('./package.json', import.meta.url), 'utf-8'),
) as {
  version: string;
};

/**
 * BL-16 — Content-Security-Policy (por `<meta>`: o GitHub Pages não deixa definir cabeçalhos).
 * Só no build: o servidor de desenvolvimento injeta estilos inline para o HMR.
 * - scripts, worker da busca, estilos, imagens e fontes: só do próprio site;
 * - conexões: o próprio site e o biblia.data (instalação de versões, UC09);
 * - sem plugins, sem `<base>` externo, formulários só para o próprio site.
 */
export const CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "worker-src 'self'",
  "style-src 'self'",
  "img-src 'self' data:",
  "font-src 'self'",
  "connect-src 'self' https://raw.githubusercontent.com",
  "manifest-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join('; ');

function contentSecurityPolicy(): Plugin {
  return {
    name: 'biblia-app:csp',
    apply: 'build',
    // Logo depois do charset: a política vale para tudo o que vem depois na página.
    transformIndexHtml: (html) =>
      html.replace(
        /(<meta charset="UTF-8" \/>)/u,
        `$1\n    <meta http-equiv="Content-Security-Policy" content="${CSP}" />`,
      ),
  };
}

export default defineConfig({
  base,
  define: { __APP_VERSION__: JSON.stringify(version) },
  plugins: [
    contentSecurityPolicy(),
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'Bíblia App',
        short_name: 'Bíblia',
        description: 'Leitura e estudo da Bíblia, offline.',
        lang: 'pt-BR',
        start_url: base,
        scope: base,
        display: 'standalone',
        background_color: '#fbf8f0',
        theme_color: '#2c5282',
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2,json}'],
      },
    }),
  ],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}', 'scripts/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/dominio/**', 'src/aplicacao/**'],
      exclude: ['**/*.test.ts', '**/index.ts'],
      thresholds: { lines: 80, functions: 80, branches: 80, statements: 80 },
      reporter: ['text', 'html', 'lcov'],
    },
  },
});
