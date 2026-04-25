import { ComponentProps, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';

import ColorPicker from '../src/ColorPicker';
import { defaultProps } from '../src/hooks/useColorPicker';

import Preview from './components/Preview';

type Story = StoryObj<ColorPickerWrapperProps>;

interface ColorPickerWrapperProps extends ComponentProps<typeof ColorPicker> {
  showPreview?: boolean;
}

export default {
  title: 'ColorPicker',
  component: ColorPicker,
  args: {
    classNames: {
      root: 'bg-white dark:bg-black',
    },
    ...defaultProps,
  },
  argTypes: {
    precision: {
      control: { type: 'number', min: 1, max: 10, step: 1 },
      description: 'Decimal digits for non-hex output.',
    },
  },
} satisfies Meta<typeof ColorPicker>;

function ColorPickerWrapper(props: ColorPickerWrapperProps) {
  const { color: defaultColor, onChange, showPreview } = props;
  const [color, setColor] = useState(defaultColor ?? 'oklch(54% 0.194 250)');

  return (
    <>
      <ColorPicker
        {...props}
        color={color}
        onChange={next => {
          setColor(next);
          onChange?.(next);
        }}
      />
      {showPreview && <Preview color={color} />}
    </>
  );
}

export const Default: Story = {
  args: {},
  render: props => <ColorPickerWrapper {...props} />,
};

export const withHueAndInputs: Story = {
  name: 'With Hue, Alpha and Inputs',
  args: {
    defaultMode: 'hsl',
    showAlpha: true,
    showGlobalHue: true,
    showSliders: false,
    showSettings: true,
  },
  render: props => <ColorPickerWrapper {...props} />,
};

export const Customized: Story = {
  args: {
    classNames: {
      channelSliders: 'bg-zinc-300 dark:bg-zinc-700 p-3',
      channelSlider: { track: 'h-4 rounded-lg' },
      colorInput: {
        root: 'border-zinc-500 rounded-full h-10',
        input: 'font-mono tracking-wider px-3',
      },
      colorValue: 'p-3',
      eyeDropper: 'rounded-full',
      modeSelector: {
        root: 'rounded-full',
      },
      numericInput: { input: 'w-14' },
      options: 'p-3',
      panel: { thumb: 'size-5 border-4 border-zinc-700' },
      root: 'max-w-sm bg-zinc-200 dark:bg-zinc-800 gap-0 rounded-2xl overflow-hidden shadow-lg p-0',
      settingsMenu: { trigger: 'rounded-full' },
      swatch: {
        root: 'rounded-md overflow-hidden size-10',
        color: 'rounded-none',
      },
    },
    showSettings: true,
  },
  render: props => <ColorPickerWrapper {...props} />,
};

export const Toolbar: Story = {
  args: {
    channels: {
      l: {
        hidden: true,
      },
    },
    classNames: {
      channelSlider: {
        root: 'w-full',
      },
      channelSliders: 'flex-row w-full max-w-xl',
      colorInput: {
        root: 'dark:bg-neutral-700',
      },
      colorValue: 'shrink-0 min-w-64',
      eyeDropper: 'dark:bg-neutral-700 hover:bg-neutral-300 dark:hover:bg-neutral-600',
      root: 'flex-row max-w-5xl mx-auto bg-neutral-200 dark:bg-neutral-800 rounded-b-lg',
      settingsMenu: {
        menu: 'dark:bg-neutral-700',
        trigger: 'dark:bg-neutral-700 hover:bg-neutral-300 dark:hover:bg-neutral-600',
      },
      swatch: {
        root: 'rounded-lg',
      },
    },
    labels: {
      hslSliders: {
        h: { label: null },
        s: { label: null },
        l: { label: null },
      },
      oklchSliders: {
        l: { label: null },
        c: { label: null },
        h: { label: null },
      },
    },
    modes: ['oklch', 'hsl'],
    showInputs: false,
    showPanel: false,
    showPreview: true,
    showSettings: true,
  },
  parameters: {
    className: 'flex-col justify-start p-0',
  },
  render: props => <ColorPickerWrapper {...props} />,
};

export const KeyboardE2E: Story = {
  args: {
    color: 'oklch(0.7 0.15 250)',
    defaultMode: 'hsl',
    showSliders: true,
    onChange: fn(),
  },
  tags: ['!dev'],
  render: props => <ColorPickerWrapper {...props} />,
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    // With showGlobalHue=false and mode=hsl, there's exactly one Hue slider
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
