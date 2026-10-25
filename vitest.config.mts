import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
import { playwright } from '@vitest/browser-playwright';

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    coverage: {
      include: ['src/**'],
      exclude: ['src/images/*', 'src/index.ts', 'src/types.ts'],
      reporter: ['text', 'html', 'lcov'],
      provider: 'v8',
      thresholds: {
        statements: 90,
        branches: 90,
        functions: 90,
        lines: 90,
      },
    },
    projects: [
      {
        extends: true,
        test: {
          name: 'unit',
          environment: 'jsdom',
          globals: true,
          setupFiles: ['./tests/__setup__/vitest.setup.ts'],
        },
      },
      {
        extends: true,
        plugins: [
          storybookTest({ configDir: fileURLToPath(new URL('.storybook', import.meta.url)) }),
        ],
        test: {
          name: 'storybook',
          browser: {
            enabled: true,
            headless: true,
            provider: playwright({}),
            instances: [{ browser: 'chromium', name: 'stories' }],
          },
        },
      },
    ],
  },
});
