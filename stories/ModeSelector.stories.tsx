import { ComponentProps, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';

import ModeSelector from '../src/ModeSelector';
import type { ColorMode } from '../src/types';

const meta: Meta<typeof ModeSelector> = {
  title: 'ModeSelector',
  component: ModeSelector,
  args: {
    mode: 'oklch',
    onClick: fn(),
  },
  argTypes: {
    mode: {
      control: 'inline-radio',
      options: ['oklch', 'hsl', 'rgb'],
    },
  },
};

export default meta;

type Story = StoryObj<typeof ModeSelector>;

function Controlled(props: ComponentProps<typeof ModeSelector>) {
  const { mode: initial, onClick, ...rest } = props;
  const [mode, setMode] = useState<ColorMode>(initial);

  return (
    <ModeSelector
      {...rest}
      mode={mode}
      onClick={next => {
        setMode(next);
        onClick(next);
      }}
    />
  );
}

export const Default: Story = {
  render: props => <Controlled {...props} />,
};
