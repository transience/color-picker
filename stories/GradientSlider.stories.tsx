import { ComponentProps, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';

import GradientSlider from '../src/components/GradientSlider';

type Story = StoryObj<GradientSliderWrapperProps>;

interface GradientSliderWrapperProps extends ComponentProps<typeof GradientSlider> {
  width?: string | number;
}

export default {
  title: 'GradientSlider',
  component: GradientSlider,
  args: {
    onChange: fn(),
    'aria-label': 'Test slider',
    gradient: 'linear-gradient(to right, black, white)',
    minValue: 0,
    maxValue: 100,
    step: 1,
  },
} satisfies Meta<typeof GradientSlider>;

function GradientSliderWrapper(props: GradientSliderWrapperProps) {
  const { onChange, value: initial, width = 240, ...rest } = props;
  const [value, setValue] = useState(initial ?? 50);

  return (
    <div style={{ width }}>
      <GradientSlider
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
  args: { value: 50 },
  render: props => <GradientSliderWrapper {...props} />,
};

export const Customized: Story = {
  args: {
    gradient: [
      'repeating-linear-gradient(45deg, transparent 0 8px, rgba(255,255,255,0.18) 8px 16px)',
      'conic-gradient(from 180deg at 50% 120%, oklch(75% 0.28 30), oklch(90% 0.2 120), oklch(55% 0.32 220), oklch(40% 0.28 320), oklch(75% 0.28 30))',
      'linear-gradient(90deg, oklch(70% 0.3 0), oklch(85% 0.2 90), oklch(60% 0.35 180), oklch(40% 0.3 270), oklch(70% 0.3 360))',
    ].join(', '),
    classNames: {
      root: 'p-2 rounded-full bg-neutral-900 dark:bg-neutral-100',
      track: 'h-6 rounded-full shadow-inner',
      thumb: 'size-6 border-4 border-red-500! bg-transparent! shadow-lg',
    },
    startContent: <span className="text-white dark:text-black text-xs font-mono px-2">Custom</span>,
    endContent: <span className="text-white dark:text-black text-xs font-mono px-2">❖</span>,
    value: 42,
    width: 520,
  },
  render: props => <GradientSliderWrapper {...props} />,
};

/**
 * Verifies that the slider is fully keyboard-operable and that keyboard
 * increments clamp at `maxValue` / `minValue`. Runs in a real browser so the
 * focus ring, native key handling, and ARIA reading all work as users see
 * them (jsdom approximates each of these).
 */
export const KeyboardClampsAtBounds: Story = {
  args: { value: 95, step: 5, minValue: 0, maxValue: 100 },
  tags: ['!dev'],
  render: props => <GradientSliderWrapper {...props} />,
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const thumb = await canvas.findByRole('slider', { name: /test slider/i });

    thumb.focus();
    await expect(thumb).toHaveFocus();

    // Two ArrowRight presses would push past 100; value must clamp.
    await userEvent.keyboard('{ArrowRight}');
    await userEvent.keyboard('{ArrowRight}');

    await waitFor(() => expect(thumb.getAttribute('aria-valuenow')).toBe('100'));
    await expect(args.onChange).toHaveBeenLastCalledWith(100);

    // Home jumps to minValue from clamped max.
    await userEvent.keyboard('{Home}');
    await waitFor(() => expect(thumb.getAttribute('aria-valuenow')).toBe('0'));
    await expect(args.onChange).toHaveBeenLastCalledWith(0);
  },
};
