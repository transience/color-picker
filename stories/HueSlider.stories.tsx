import { ComponentProps, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';

import HueSlider from '../src/HueSlider';

type Story = StoryObj<HueSliderWrapperProps>;

interface HueSliderWrapperProps extends ComponentProps<typeof HueSlider> {
  width?: string | number;
}

export default {
  title: 'HueSlider',
  component: HueSlider,
  args: {
    mode: 'oklch',
    onChange: fn(),
    value: 180,
  },
  argTypes: {
    mode: {
      control: { type: 'inline-radio' },
      options: ['oklch', 'hsl', 'rgb'],
    },
    value: {
      control: { type: 'range', min: 0, max: 360, step: 1 },
    },
  },
} satisfies Meta<typeof HueSlider>;

function HueSliderWrapper(props: HueSliderWrapperProps) {
  const { onChange, value: initial, width = 240, ...rest } = props;
  const [value, setValue] = useState(initial);

  return (
    <div style={{ width }}>
      <HueSlider
        {...rest}
        onChange={next => {
          setValue(next);
          onChange(next);
        }}
        value={value}
      />
    </div>
  );
}

export const Default: Story = {
  render: props => <HueSliderWrapper {...props} />,
};

export const Customized: Story = {
  args: {
    classNames: {
      track: 'h-12',
      thumb: 'size-12 border-8 bg-transparent!',
    },
    gradient:
      'linear-gradient(to right, oklch(0.9 0.4 0), oklch(0.9 0.4 60), oklch(0.9 0.4 120), oklch(0.9 0.4 180), oklch(0.9 0.4 240), oklch(0.9 0.4 300), oklch(0.9 0.4 360))',
    width: 480,
  },
  render: props => <HueSliderWrapper {...props} />,
};
