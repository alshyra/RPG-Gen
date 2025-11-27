import tailwindcss from '@tailwindcss/vite';
import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'cypress';
import { fileURLToPath, URL } from 'node:url';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

export default defineConfig({
  e2e: {
    baseUrl: process.env.CYPRESS_BASE_URL || 'http://localhost:80',
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    supportFile: 'cypress/support/e2e.ts',
    video: process.env.CI ? true : false,
    screenshotOnRunFailure: true,
    viewportWidth: 1280,
    viewportHeight: 720,
    // Performance optimizations - reasonable timeouts
    defaultCommandTimeout: 10000,
    pageLoadTimeout: 30000,
    requestTimeout: 10000,
    responseTimeout: 10000,
    // Disable retries - fail fast
    retries: {
      runMode: 0,
      openMode: 0,
    },
    setupNodeEvents(on, config) {
      // provide tasks to call the repository's e2e DB helper script
      const execFileAsync = promisify(execFile);

      on('task', {
        async prepareE2EDb(opts) {
          const args: string[] = [];
          if (opts?.count) {
            args.push('--count', String(opts.count));
          }
          if (opts?.url) {
            args.push('--url', opts.url);
          }
          try {
            const { stdout } = await execFileAsync('node', [
              '../../scripts/prepare-e2e-db.mjs',
              ...args,
            ], { cwd: config.projectRoot });
            return { ok: true, output: stdout };
          } catch (err) {
            return { ok: false, error: String(err) };
          }
        },

        async cleanupE2EDb(opts) {
          const args: string[] = ['--cleanup'];
          if (opts?.url) {
            args.push('--url', opts.url);
          }
          try {
            const { stdout } = await execFileAsync('node', [
              '../../scripts/prepare-e2e-db.mjs',
              ...args,
            ], { cwd: config.projectRoot });
            return { ok: true, output: stdout };
          } catch (err) {
            return { ok: false, error: String(err) };
          }
        },
      });

      return config;
    },
  },
  component: {
    devServer: {
      framework: 'vue',
      bundler: 'vite',
      viteConfig: {
        plugins: [
          tailwindcss(),
          vue(),
        ],
        server: {
          port: 5173,
        },
        resolve: {
          alias: {
            '@': fileURLToPath(new URL('./src', import.meta.url)),
          },
        },
      },
    },
    specPattern: 'cypress/component/**/*.cy.{js,jsx,ts,tsx}',
    supportFile: 'cypress/support/component.ts',
  },
});
