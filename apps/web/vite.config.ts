import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: { port: 5173, proxy: { '/api': 'http://127.0.0.1:8787' } },
  // `pnpm preview` serves the production build (no React dev checks, so it is much smoother) with the same API proxy.
  preview: { port: 4173, proxy: { '/api': 'http://127.0.0.1:8787' } },
});
