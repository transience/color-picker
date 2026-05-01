import { ComponentProps, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';

import ModeSelector from '../src/ModeSelector';
import type { ColorMode } from '../src/types';

type Story = StoryObj<ModeSelectorWrapperProps>;

interface ModeSelectorWrapperProps extends ComponentProps<typeof ModeSelector> {}

export default {
  title: 'ModeSelector',
  component: ModeSelector,
  args: {
    mode: 'oklch',
  },
  argTypes: {
    mode: {
      control: 'inline-radio',
      options: ['oklch', 'hsl', 'rgb'],
    },
  },
} satisfies Meta<typeof ModeSelector>;

function ModeSelectorWrapper(props: ModeSelectorWrapperProps) {
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
  render: props => <ModeSelectorWrapper {...props} />,
};

export const Customized: Story = {
  args: {
    classNames: {
      root: 'gap-2',
      button: 'h-12 rounded-full! text-lg px-6',
    },
  },
  render: props => <ModeSelectorWrapper {...props} />,
};
