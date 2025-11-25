import { defineConfig } from 'vitest/config';
import config from './vite.config';

export default defineConfig({
  ...config,
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './test/setup.ts',
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
  },
});
