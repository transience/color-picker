import { ComponentProps, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';

import ColorPicker from '../src/ColorPicker';

const meta: Meta<typeof ColorPicker> = {
  title: 'ColorPicker',
  component: ColorPicker,
  args: {
    classNames: {
      root: 'bg-white dark:bg-black',
    },
    defaultMode: 'oklch',
    displayFormat: 'auto',
    outputFormat: 'auto',
    precision: 5,
    showAlpha: false,
    showEyeDropper: true,
    showHueBar: false,
    showInputs: true,
    showPanel: true,
    showSettings: false,
    showSliders: true,
    showSwatch: true,
  },
  argTypes: {
    precision: {
      control: { type: 'number', min: 1, max: 10, step: 1 },
      description: 'Decimal digits for non-hex output.',
    },
  },
};

export default meta;

type Story = StoryObj<typeof ColorPicker>;

function Controlled(props: ComponentProps<typeof ColorPicker>) {
  const { color: defaultColor, onChange } = props;
  const [color, setColor] = useState(defaultColor ?? 'oklch(54% 0.194 250)');

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
  args: {},
  render: props => <Controlled {...props} />,
};

export const WithToolbar: Story = {
  name: 'With Toolbar and Inputs',
  args: {
    defaultMode: 'hsl',
    showAlpha: true,
    showHueBar: true,
    showEyeDropper: false,
    showSliders: false,
  },
  render: props => <Controlled {...props} />,
};

export const WithSettings: Story = {
  name: 'With Alpha and Settings',
  args: { showSettings: true, showAlpha: true },
  render: props => <Controlled {...props} />,
};

export const Customized: Story = {
  args: {
    showSettings: true,
    classNames: {
      channelSliders: 'bg-neutral-300 dark:bg-neutral-800 p-3',
      channelSlider: { track: 'h-4 rounded-lg' },
      colorInput: {
        root: 'border-neutral-500 rounded-full h-10',
        input: 'font-mono tracking-wider px-3',
      },
      colorValue: 'p-3',
      eyeDropper: 'rounded-full',
      modeSelector: 'rounded-full ',
      numericInput: { input: 'w-14' },
      options: 'bg-neutral-200 bg-neutral-900 p-3',
      panel: { thumb: 'size-5 border-4 border-neutral-700' },
      root: 'max-w-sm bg-neutral-200 dark:bg-neutral-700 gap-0 rounded-2xl overflow-hidden shadow-lg p-0',
      settingsMenu: { trigger: 'rounded-full' },
      swatch: {
        root: 'rounded-md overflow-hidden size-10',
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
