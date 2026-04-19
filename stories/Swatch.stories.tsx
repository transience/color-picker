import type { Meta, StoryObj } from '@storybook/react-vite';

import Swatch from '../src/Swatch';

const meta: Meta<typeof Swatch> = {
  title: 'Swatch',
  component: Swatch,
  args: {
    color: '#ff004480',
  },
};

export default meta;

type Story = StoryObj<typeof Swatch>;

export const Default: Story = {};
