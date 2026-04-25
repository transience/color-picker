import { fileURLToPath } from 'node:url';

import type { StorybookConfig } from '@storybook/react-vite';
import tailwindcss from '@tailwindcss/vite';

const srcPath = fileURLToPath(new URL('../src', import.meta.url));

const config: StorybookConfig = {
  stories: ['../stories/*.stories.@(ts|tsx|mdx)'],
  addons: ['@storybook/addon-docs', '@storybook/addon-a11y', '@storybook/addon-vitest'],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  typescript: {
    reactDocgen: 'react-docgen-typescript',
  },
  async viteFinal(viteConfig, { configType }) {
    return {
      ...viteConfig,
      base: configType === 'PRODUCTION' ? '/color-picker/' : viteConfig.base,
      plugins: [...(viteConfig.plugins ?? []), tailwindcss()],
      resolve: {
        ...viteConfig.resolve,
        alias: {
          ...(viteConfig.resolve?.alias as Record<string, string> | undefined),
          '~': srcPath,
        },
      },
    };
  },
};

export default config;
