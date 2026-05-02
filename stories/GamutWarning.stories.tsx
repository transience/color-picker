import type { Meta, StoryObj } from '@storybook/react-vite';

import GamutWarning from '../src/components/GamutWarning';

type Story = StoryObj<typeof GamutWarning>;

export default {
  title: 'GamutWarning',
  component: GamutWarning,
} satisfies Meta<typeof GamutWarning>;

export const Default: Story = {};

export const Customized: Story = {
  args: {
    className: 'text-4xl text-green-400',
  },
};
