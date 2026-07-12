import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    sourcemap: false,
  },
  server: {
    watch: {
      ignored: ['**/node_modules/**'],
      aggregateTimeout: 3000,
    },
  },
});