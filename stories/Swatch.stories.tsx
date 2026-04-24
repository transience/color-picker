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

export const Customized: Story = {
  args: {
    color: DEFAULT_COLOR.replace(')', ' /0.5)'),
    children: <EyeDropperIcon className="size-12 text-neutral-600" />,
    classNames: {
      root: 'rounded-lg size-24',
    },
  },
};

export const Button: Story = {
  args: {
    as: 'button',
    'aria-label': 'Pick color',
    classNames: {
      root: 'cursor-pointer focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500',
    },
    // eslint-disable-next-line no-console
    onClick: () => console.log('Swatch clicked'),
  },
};

export const Anchor: Story = {
  args: {
    as: 'a',
    'aria-label': 'View color details',
    classNames: {
      root: 'cursor-pointer focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500',
    },
    href: 'https://github.com/transience/color-picker',
    rel: 'noopener noreferrer',
    target: '_blank',
  },
};
