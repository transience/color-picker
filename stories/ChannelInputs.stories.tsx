import { ComponentProps, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';

import ChannelInputs from '../src/ChannelInputs';

type Story = StoryObj<ControlledProps>;

interface ControlledProps extends ComponentProps<typeof ChannelInputs> {
  width?: number;
}

const meta: Meta<typeof ChannelInputs> = {
  title: 'ChannelInputs',
  component: ChannelInputs,
  args: {
    color: '#ff0044',
    mode: 'oklch',
    onChangeColor: fn(),
  },
  argTypes: {
    mode: {
      control: 'inline-radio',
      options: ['oklch', 'hsl', 'rgb'],
    },
  },
};

export default meta;

function Controlled(props: ControlledProps) {
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
  render: props => <Controlled {...props} />,
};

export const Customized: Story = {
  args: {
    classNames: {
      root: 'bg-red-200 dark:bg-red-800 p-3 rounded-lg',
      label: 'text-base text-red-500! leading-none',
    },
    numericInputClassNames: {
      input: 'h-6 bg-red-50 dark:bg-red-950 text-base focus:ring-2 focus:ring-blue-500!',
    },
    alpha: 0.6,
    showAlpha: true,
    width: 320,
  },
  render: props => <Controlled {...props} />,
};
