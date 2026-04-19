import { ComponentProps, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';

import ChannelSliders from '../src/ChannelSliders';

const meta: Meta<typeof ChannelSliders> = {
  title: 'ChannelSliders',
  component: ChannelSliders,
  args: {
    color: '#ff0044',
    mode: 'oklch',
    onChangeColor: fn(),
    showInputs: true,
  },
  argTypes: {
    mode: {
      control: 'inline-radio',
      options: ['oklch', 'hsl', 'rgb'],
    },
  },
};

export default meta;

type Story = StoryObj<typeof ChannelSliders>;

function Controlled(props: ComponentProps<typeof ChannelSliders>) {
  const { color: initial, onChangeColor, ...rest } = props;
  const [color, setColor] = useState(initial);

  return (
    <div style={{ width: 320 }}>
      <ChannelSliders
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
