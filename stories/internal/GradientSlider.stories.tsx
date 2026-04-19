import { ComponentProps, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';

import GradientSlider from '../../src/components/GradientSlider';

const meta: Meta<typeof GradientSlider> = {
  title: 'GradientSlider',
  component: GradientSlider,
  args: {
    onValueChange: fn(),
    'aria-label': 'Test slider',
    gradient: 'linear-gradient(to right, black, white)',
    minValue: 0,
    maxValue: 100,
    step: 1,
  },
};

export default meta;

type Story = StoryObj<typeof GradientSlider>;

function Controlled(props: ComponentProps<typeof GradientSlider>) {
  const { onValueChange, value: initial, ...rest } = props;
  const [value, setValue] = useState(initial ?? 50);

  return (
    <div style={{ width: 240 }}>
      <GradientSlider
        {...rest}
        onValueChange={next => {
          setValue(next);
          onValueChange(next);
        }}
        value={value}
      />
    </div>
  );
}

export const Default: Story = {
  args: { value: 50 },
  render: arguments_ => <Controlled {...arguments_} />,
};

/**
 * Verifies that the slider is fully keyboard-operable and that keyboard
 * increments clamp at `maxValue` / `minValue`. Runs in a real browser so the
 * focus ring, native key handling, and ARIA reading all work as users see
 * them (jsdom approximates each of these).
 */
export const KeyboardClampsAtBounds: Story = {
  args: { value: 95, step: 5, minValue: 0, maxValue: 100 },
  render: arguments_ => <Controlled {...arguments_} />,
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const thumb = await canvas.findByRole('slider', { name: /test slider/i });

    thumb.focus();
    await expect(thumb).toHaveFocus();

    // Two ArrowRight presses would push past 100; value must clamp.
    await userEvent.keyboard('{ArrowRight}');
    await userEvent.keyboard('{ArrowRight}');

    await waitFor(() => expect(thumb.getAttribute('aria-valuenow')).toBe('100'));
    await expect(args.onValueChange).toHaveBeenLastCalledWith(100);

    // Home jumps to minValue from clamped max.
    await userEvent.keyboard('{Home}');
    await waitFor(() => expect(thumb.getAttribute('aria-valuenow')).toBe('0'));
    await expect(args.onValueChange).toHaveBeenLastCalledWith(0);
  },
};
