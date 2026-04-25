import { ComponentProps, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { convertCSS } from 'colorizr';
import { expect, fn, userEvent, within } from 'storybook/test';

import { Swatch } from '../src';
import ColorInput from '../src/ColorInput';
import { DEFAULT_COLOR } from '../src/constants';

type Story = StoryObj<ColorInputWrapperProps>;

interface ColorInputWrapperProps extends ComponentProps<typeof ColorInput> {
  onChangeFormat?: (value: string) => string;
  showSwatch?: boolean;
  width?: string | number;
}

export default {
  title: 'ColorInput',
  component: ColorInput,
  args: {
    onChange: fn(),
    value: DEFAULT_COLOR,
  },
} satisfies Meta<typeof ColorInput>;

function ColorInputWrapper(props: ColorInputWrapperProps) {
  const { onChange, onChangeFormat, showSwatch, value: initial, width = 240, ...rest } = props;
  const [value, setValue] = useState(initial);

  return (
    <div style={{ width }}>
      <ColorInput
        onChange={changedValue => {
          const next = onChangeFormat ? onChangeFormat(changedValue) : changedValue;

          setValue(next);

          if (onChangeFormat) {
            onChange(`${changedValue} -> ${next}`);
          } else {
            onChange(next);
          }
        }}
        startContent={showSwatch && <Swatch color={value} />}
        value={value}
        {...rest}
      />
    </div>
  );
}

export const Default: Story = {
  render: props => <ColorInputWrapper {...props} />,
};

export const Customized: Story = {
  name: 'Customized with format',
  args: {
    classNames: {
      root: 'h-12 bg-transparent! border-2 border-neutral-200 dark:border-neutral-700',
      input: 'text-lg',
    },
    onChangeFormat: (value: string) => convertCSS(value, 'oklch'),
    showSwatch: true,
    width: 320,
  },
  render: props => <ColorInputWrapper {...props} />,
};

/**
 * Type a bare hex value, blur, and verify the input shows the normalized
 * (prefixed) value. This exercises the focus → edit → blur chain that jsdom
 * approximates only loosely.
 */
export const PasteBareHexAndBlur: Story = {
  args: { value: '' },
  tags: ['!dev'],
  render: props => <ColorInputWrapper {...props} />,
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const input = await canvas.findByLabelText('Color value');

    await userEvent.click(input);
    await userEvent.keyboard('ff00ff');
    await userEvent.tab();

    await expect(args.onChange).toHaveBeenCalledWith('#ff00ff');
    await expect(input).toHaveValue('#ff00ff');
  },
};
