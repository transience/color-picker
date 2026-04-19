import { ComponentProps, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';

import AlphaSlider from '../src/AlphaSlider';

const meta: Meta<typeof AlphaSlider> = {
  title: 'AlphaSlider',
  component: AlphaSlider,
  args: {
    color: '#ff0044',
    onChange: fn(),
    value: 0.5,
  },
};

export default meta;

type Story = StoryObj<typeof AlphaSlider>;

function Controlled(props: ComponentProps<typeof AlphaSlider>) {
  const { onChange, value: initial, ...rest } = props;
  const [value, setValue] = useState(initial);

  return (
    <div style={{ width: 240 }}>
      <AlphaSlider
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
  render: props => <Controlled {...props} />,
};
