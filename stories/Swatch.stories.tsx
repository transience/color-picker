import type { Meta, StoryObj } from '@storybook/react-vite';

import EyeDropperIcon from '../src/components/EyeDropperIcon';
import { DEFAULT_COLOR } from '../src/constants';
import Swatch from '../src/Swatch';

type Story = StoryObj<typeof Swatch>;

export default {
  title: 'Swatch',
  component: Swatch,
  args: {
    color: DEFAULT_COLOR,
  },
} satisfies Meta<typeof Swatch>;

export const Default: Story = {};

export const Button: Story = {
  args: {
    as: 'button',
    'aria-label': 'Pick color',
    classNames: {
      root: 'focus-visible:outline-2 focus-visible:outline-black dark:focus-visible:outline-white',
    },
  },
};

export const Anchor: Story = {
  args: {
    as: 'a',
    'aria-label': 'View color details',
    classNames: {
      root: 'h-8 w-32 text-white border-none focus-visible:outline-2 focus-visible:outline-black dark:focus-visible:outline-white',
    },
    children: 'Color Picker',
    href: 'https://github.com/transience/color-picker',
    rel: 'noopener noreferrer',
    target: '_blank',
  },
};

export const Customized: Story = {
  args: {
    color: DEFAULT_COLOR.replace(')', ' /0.5)'),
    children: <EyeDropperIcon className="size-12 text-neutral-600" />,
    classNames: {
      root: 'rounded-lg size-24',
    },
  },
};
