import { ComponentProps, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';

import ColorInput from '../../src/ColorInput';

const meta: Meta<typeof ColorInput> = {
  title: 'ColorInput',
  component: ColorInput,
  args: {
    onChange: fn(),
    value: '#ff0044',
  },
};

export default meta;

type Story = StoryObj<typeof ColorInput>;

function Controlled(props: ComponentProps<typeof ColorInput>) {
  const { onChange, value: initial, ...rest } = props;
  const [value, setValue] = useState(initial);

  return (
    <div style={{ width: 240 }}>
      <ColorInput
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
  render: arguments_ => <Controlled {...arguments_} />,
};

/**
 * Type a bare hex value, blur, and verify the input shows the normalized
 * (prefixed) value. This exercises the focus → edit → blur chain that jsdom
 * approximates only loosely.
 */
export const PasteBareHexAndBlur: Story = {
  args: { value: '' },
  render: arguments_ => <Controlled {...arguments_} />,
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
