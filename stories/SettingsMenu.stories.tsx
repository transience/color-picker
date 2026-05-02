import type { Meta, StoryObj } from '@storybook/react-vite';

import SettingsMenu from '../src/SettingsMenu';

type Story = StoryObj<typeof SettingsMenu>;

export default {
  title: 'SettingsMenu',
  component: SettingsMenu,
} satisfies Meta<typeof SettingsMenu>;

export const Default: Story = {};

export const Customized: Story = {
  args: {
    displayFormat: 'oklch',
    outputFormat: 'oklch',
    labels: {
      done: null,
      title: null,
    },
    classNames: {
      trigger:
        'size-12 bg-purple-100 dark:bg-purple-800 hover:bg-purple-200 dark:hover:bg-purple-700 text-3xl',
      menu: 'bg-purple-200!',
    },
  },
};
