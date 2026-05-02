import type { Meta, StoryObj } from '@storybook/react-vite';

import EyeDropper from '../src/EyeDropper';

type Story = StoryObj<typeof EyeDropper>;

export default {
  title: 'EyeDropper',
  component: EyeDropper,
} satisfies Meta<typeof EyeDropper>;

export const Default: Story = {};

export const Customized: Story = {
  args: {
    className:
      'size-12 bg-blue-100 dark:bg-blue-900 hover:bg-blue-200 dark:hover:bg-blue-800 text-xl rounded-full',
  },
};
