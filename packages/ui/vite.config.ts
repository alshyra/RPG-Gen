import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import vueDevTools from 'vite-plugin-vue-devtools';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  plugins: [vue(), vueDevTools()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@rpg-gen/ui': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    lib: {
      entry: fileURLToPath(new URL('./src/index.ts', import.meta.url)),
      name: 'RpgGenUi',
      fileName: 'index',
    },
    rollupOptions: {
      external: ['vue', 'lucide-vue-next', 'marked'],
      output: {
        globals: {
          vue: 'Vue',
          'lucide-vue-next': 'LucideVueNext',
          marked: 'marked',
        },
      },
    },
  },
});
