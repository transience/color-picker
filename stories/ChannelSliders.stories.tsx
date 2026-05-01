import { ComponentProps, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';

import ChannelSliders from '../src/ChannelSliders';

type Story = StoryObj<ChannelSlidersWrapperProps>;

interface ChannelSlidersWrapperProps extends ComponentProps<typeof ChannelSliders> {
  width?: string | number;
}

export default {
  title: 'ChannelSliders',
  component: ChannelSliders,
  args: {
    color: '#ff0044',
    mode: 'oklch',
    showInputs: true,
  },
  argTypes: {
    mode: {
      control: 'inline-radio',
      options: ['oklch', 'hsl', 'rgb'],
    },
  },
} satisfies Meta<typeof ChannelSliders>;

function ChannelSlidersWrapper(props: ChannelSlidersWrapperProps) {
  const { color: initial, onChange, width = 320, ...rest } = props;
  const [color, setColor] = useState(initial);

  return (
    <div style={{ width }}>
      <ChannelSliders
        {...rest}
        color={color}
        onChange={next => {
          setColor(next);
          onChange?.(next);
        }}
      />
    </div>
  );
}

export const Default: Story = {
  render: props => <ChannelSlidersWrapper {...props} />,
};

export const Customized: Story = {
  args: {
    channels: {
      h: { disabled: true },
    },
    labels: {
      oklchSliders: {
        l: { label: <span className="w-28 text-right font-semibold">Lightness</span> },
        c: { label: <span className="w-28 text-right font-semibold">Chroma</span> },
        h: { label: <span className="w-28 text-right opacity-70 font-semibold">Hue</span> },
      },
    },
    className: 'bg-white dark:bg-black p-3 rounded-lg',
    channelSliderClassNames: {
      track: 'h-6 rounded-lg',
      thumb: 'size-6 rounded-lg',
    },
    numericInputClassNames: {
      input: 'w-14 h-6 text-base font-bold disabled:opacity-70 focus:ring-2 focus:ring-blue-500!',
    },
    width: 480,
  },
  render: props => <ChannelSlidersWrapper {...props} />,
};
