import { ComponentProps, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';

import ChannelInputs from '../src/ChannelInputs';
import { DEFAULT_COLOR } from '../src/constants';

type Story = StoryObj<ChannelInputsWrapperProps>;

interface ChannelInputsWrapperProps extends ComponentProps<typeof ChannelInputs> {
  width?: string | number;
}

export default {
  title: 'ChannelInputs',
  component: ChannelInputs,
  parameters: {
    className: 'bg-white dark:bg-black',
  },
  args: {
    color: DEFAULT_COLOR,
    mode: 'oklch',
    onChangeColor: fn(),
  },
  argTypes: {
    mode: {
      control: 'inline-radio',
      options: ['oklch', 'hsl', 'rgb'],
    },
  },
} satisfies Meta<typeof ChannelInputs>;

function ChannelInputsWrapper(props: ChannelInputsWrapperProps) {
  const { color: initial, onChangeColor, width = 240, ...rest } = props;
  const [color, setColor] = useState(initial);

  return (
    <div style={{ width }}>
      <ChannelInputs
        {...rest}
        color={color}
        onChangeColor={next => {
          setColor(next);
          onChangeColor(next);
        }}
      />
    </div>
  );
}

export const Default: Story = {
  render: props => <ChannelInputsWrapper {...props} />,
};

export const Customized: Story = {
  args: {
    classNames: {
      root: 'bg-red-100 dark:bg-red-900 p-3 rounded-lg',
      label: 'text-base text-red-500! leading-none',
    },
    numericInputClassNames: {
      input: 'h-6 bg-red-50 dark:bg-red-950 text-base focus:ring-2 focus:ring-blue-500!',
    },
    alpha: 0.6,
    showAlpha: true,
    width: 320,
  },
  render: props => <ChannelInputsWrapper {...props} />,
};
