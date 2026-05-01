import { ComponentProps, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { action } from 'storybook/actions';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';

import SaturationPanel from '../src/SaturationPanel';

type Story = StoryObj<SaturationPanelWrapperProps>;

interface SaturationPanelWrapperProps extends ComponentProps<typeof SaturationPanel> {
  width?: string | number;
}

export default {
  title: 'SaturationPanel',
  component: SaturationPanel,
  args: {
    onChange: action('onChange'),
    onChangeEnd: action('onChangeEnd'),
    onChangeStart: action('onChangeStart'),
  },
} satisfies Meta<typeof SaturationPanel>;

function SaturationPanelWrapper(props: SaturationPanelWrapperProps) {
  const { onChange, saturation, value, width = 320, ...rest } = props;
  const [state, setState] = useState({ v: value, s: saturation });

  return (
    <div style={{ width }}>
      <SaturationPanel
        onChange={(s, v) => {
          setState({ s, v });
          onChange?.(s, v);
        }}
        saturation={state.s}
        value={state.v}
        {...rest}
      />
    </div>
  );
}

export const Default: Story = {
  args: { hue: 30, saturation: 0.1, value: 0.6 },
  render: props => <SaturationPanelWrapper {...props} />,
};

export const Customized: Story = {
  args: {
    classNames: {
      root: 'h-dvh',
      thumb: 'size-6 ring-6',
    },
    hue: 344,
    saturation: 0.9,
    value: 0.9,
    width: '100vw',
  },
  parameters: {
    className: 'p-0',
  },
  render: props => <SaturationPanelWrapper {...props} />,
};

/**
 * Click at a specific position inside the panel and verify that the emitted
 * values match.
 */
export const ClickReturnsValidValues: Story = {
  args: { onChange: fn(), hue: 30, saturation: 0.1, value: 0.6 },
  tags: ['!dev'],
  render: props => <SaturationPanelWrapper {...props} />,
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const panel = await canvas.findByTestId('SaturationPanel');
    const rect = panel.getBoundingClientRect();
    const clickX = rect.left + rect.width / 2;
    const clickY = rect.top + rect.height / 2;

    await userEvent.pointer([
      { keys: '[MouseLeft>]', target: panel, coords: { x: clickX, y: clickY } },
      { keys: '[/MouseLeft]', target: panel, coords: { x: clickX, y: clickY } },
    ]);

    await waitFor(() => expect(args.onChange).toHaveBeenCalled());

    const mock = args.onChange as unknown as { mock: { calls: Array<[number, number]> } };
    const [l, s] = mock.mock.calls[mock.mock.calls.length - 1];

    await expect(s).toEqual(0.5);
    await expect(l).toEqual(0.5);
  },
};
