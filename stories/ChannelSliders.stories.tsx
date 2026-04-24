import { ComponentProps, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';

import ChannelSliders from '../src/ChannelSliders';

type Story = StoryObj<ControlledProps>;

interface ControlledProps extends ComponentProps<typeof ChannelSliders> {
  width?: number;
}

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

function Controlled(props: ControlledProps) {
  const { color: initial, onChangeColor, width = 320, ...rest } = props;
  const [color, setColor] = useState(initial);

  return (
    <div style={{ width }}>
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

export const Customized: Story = {
  args: {
    channels: {
      l: {
        label: <span className="w-28 text-right font-semibold">Lightness</span>,
      },
      c: {
        label: <span className="w-28 text-right font-semibold">Chroma</span>,
      },
      h: {
        disabled: true,
        label: <span className="w-28 text-right opacity-70 font-semibold">Hue</span>,
      },
    },
    className: 'bg-white p-3 rounded-lg',
    channelSliderClassNames: {
      track: 'h-6 rounded-lg',
      thumb: 'size-6 rounded-lg',
    },
    numericInputClassNames: {
      input: 'w-14 h-6 text-base font-bold disabled:opacity-70 focus:ring-2 focus:ring-blue-500!',
    },
    width: 480,
  },
  render: props => <Controlled {...props} />,
};
