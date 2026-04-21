import { ComponentProps, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';

import ChannelInputs from '../src/ChannelInputs';

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

type Story = StoryObj<typeof ChannelInputs>;

function Controlled(props: ComponentProps<typeof ChannelInputs>) {
  const { color: initial, onChangeColor, ...rest } = props;
  const [color, setColor] = useState(initial);

  return (
    <div style={{ width: 240 }}>
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
