import { ComponentProps, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';

import AlphaSlider, { defaultProps } from '../src/AlphaSlider';

type Story = StoryObj<AlphaSliderWrapperProps>;

interface AlphaSliderWrapperProps extends ComponentProps<typeof AlphaSlider> {
  width?: string | number;
}

export default {
  title: 'AlphaSlider',
  component: AlphaSlider,
  args: defaultProps,
} satisfies Meta<typeof AlphaSlider>;

function AlphaSliderWrapper(props: AlphaSliderWrapperProps) {
  const { onChange, value: initial, width = 240, ...rest } = props;
  const [value, setValue] = useState(initial);

  return (
    <div style={{ width }}>
      <AlphaSlider
        {...rest}
        onChange={next => {
          setValue(next);
          onChange?.(next);
        }}
        value={value}
      />
    </div>
  );
}

export const Default: Story = {
  render: props => <AlphaSliderWrapper {...props} />,
};

export const Customized: Story = {
  args: {
    classNames: {
      track: 'h-6 rounded-lg',
      thumb: 'size-6',
    },
    value: 0.6,
    width: 320,
  },
  render: props => <AlphaSliderWrapper {...props} />,
};
