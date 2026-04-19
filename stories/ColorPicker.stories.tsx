import { ComponentProps, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';

import ColorPicker from '../src/ColorPicker';

const meta: Meta<typeof ColorPicker> = {
  title: 'ColorPicker',
  component: ColorPicker,
  args: {
    classNames: {
      root: 'border border-neutral-200 dark:border-neutral-800',
    },
    defaultMode: 'oklch',
    showAlpha: false,
    showEyeDropper: true,
    showHueBar: true,
    showInputs: true,
    showPicker: true,
    showSettings: true,
    showSliders: false,
    showSwatch: true,
  },
  argTypes: {
    precision: {
      control: { type: 'number', min: 1, max: 10, step: 1 },
      description: 'Decimal digits for non-hex output. Unset → colorizr default (5).',
    },
  },
};

export default meta;

type Story = StoryObj<typeof ColorPicker>;

function Controlled(props: ComponentProps<typeof ColorPicker>) {
  const { color: defaultColor, onChange } = props;
  const [color, setColor] = useState(defaultColor ?? 'oklch(0.7 0.15 250)');

  return (
    <ColorPicker
      {...props}
      color={color}
      onChange={next => {
        setColor(next);
        onChange?.(next);
      }}
    />
  );
}

export const Default: Story = {
  render: props => <Controlled {...props} />,
};

export const WithAlpha: Story = {
  args: { showAlpha: true },
  render: props => <Controlled {...props} />,
};

export const WithSliders: Story = {
  args: { showSliders: true, showInputs: true },
  render: props => <Controlled {...props} />,
};

export const WithSettings: Story = {
  args: { showSettings: true, showAlpha: true, showEyeDropper: true },
  render: props => <Controlled {...props} />,
};

export const Customized: Story = {
  args: {
    showAlpha: true,
    showEyeDropper: true,
    showInputs: true,
    showSettings: true,
    showSliders: true,
    classNames: {
      alphaSlider: { track: 'h-4 rounded-md', thumb: 'size-6 border-pink-500' },
      channelSlider: { track: 'h-3 rounded-md', thumb: 'border-pink-500' },
      colorInput: {
        root: 'border-pink-400 dark:border-pink-500 rounded-xl',
        input: 'font-mono tracking-wider',
      },
      hueSlider: { track: 'h-4 rounded-md', thumb: 'size-6 border-pink-500' },
      modeSelector: 'rounded-lg',
      numericInput: { input: 'w-12 text-pink-700 dark:text-pink-400 dark:bg-neutral-700' },
      panel: { root: 'rounded-xl', thumb: 'size-5 border-4 border-neutral-700' },
      root: 'bg-neutral-200 dark:bg-neutral-800 rounded-2xl shadow-lg',
      settingsMenu: { menu: 'border-pink-400 dark:border-pink-500' },
      swatch: {
        root: 'rounded-md overflow-hidden size-12',
        color: 'rounded-none',
      },
    },
  },
  render: props => <Controlled {...props} />,
};

export const KeyboardE2E: Story = {
  args: {
    color: 'oklch(0.7 0.15 250)',
    defaultMode: 'hsl',
    showSliders: true,
    onChange: fn(),
  },
  tags: ['!dev'],
  render: props => <Controlled {...props} />,
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    // With showHueBar=false and mode=hsl, there's exactly one Hue slider
    // (the HSL ChannelSliders' hue track).
    const hueSlider = await canvas.findByRole('slider', { name: 'Hue' });

    hueSlider.focus();
    await expect(hueSlider).toHaveFocus();

    const initialValue = Number(hueSlider.getAttribute('aria-valuenow'));

    await userEvent.keyboard('{ArrowRight}');

    const nextValue = Number(hueSlider.getAttribute('aria-valuenow'));

    await expect(nextValue).toBeGreaterThan(initialValue);
    await expect(args.onChange).toHaveBeenCalled();
  },
};
