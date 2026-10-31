import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  server: { host: '127.0.0.1', port: 5173, strictPort: true, watch: { ignored: ['**/.local-data/**', '**/.npm-cache/**', '**/.electron-cache/**', '**/release/**', '**/artifacts/**'] } },
  build: { outDir: 'dist', sourcemap: false },
});
