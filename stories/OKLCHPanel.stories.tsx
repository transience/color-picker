import { ComponentProps, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { getP3MaxChroma } from 'colorizr';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';

import OKLCHPanel from '../src/OKLCHPanel';

type Story = StoryObj<OKLCHPanelWrapperProps>;

interface OKLCHPanelWrapperProps extends ComponentProps<typeof OKLCHPanel> {
  width?: string | number;
}

export default {
  title: 'OKLCHPanel',
  component: OKLCHPanel,
  args: {
    onChange: fn(),
  },
} satisfies Meta<typeof OKLCHPanel>;

function OKLCHPanelWrapper(props: OKLCHPanelWrapperProps) {
  const { chroma, lightness, onChange, width = 320, ...rest } = props;
  const [state, setState] = useState({ l: lightness, c: chroma });

  return (
    <div style={{ width }}>
      <OKLCHPanel
        chroma={state.c}
        lightness={state.l}
        onChange={(l, c) => {
          setState({ l, c });
          onChange(l, c);
        }}
        {...rest}
      />
    </div>
  );
}

export const Default: Story = {
  args: { hue: 250, chroma: 0.194, lightness: 0.54 },
  render: props => <OKLCHPanelWrapper {...props} />,
};

export const Customized: Story = {
  args: {
    classNames: {
      root: 'h-dvh',
      thumb: 'size-6 ring-6',
    },
    hue: 19.9,
    chroma: 0.28,
    lightness: 0.63,
    width: '100vw',
  },
  parameters: {
    className: 'p-0',
  },
  render: props => <OKLCHPanelWrapper {...props} />,
};

/**
 * Click at a specific position inside the panel and verify that the emitted
 * chroma stays inside the P3 gamut for the emitted lightness.
 *
 * Runs in a real browser so the canvas paints and pointer capture works
 * natively — two things the jsdom unit test has to mock.
 */
export const ClickStaysInGamut: Story = {
  args: { hue: 30, chroma: 0.1, lightness: 0.6 },
  tags: ['!dev'],
  render: props => <OKLCHPanelWrapper {...props} />,
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const panel = await canvas.findByTestId('OKLCHPanel');
    const rect = panel.getBoundingClientRect();
    const clickX = rect.left + rect.width / 2;
    const clickY = rect.top + rect.height / 2;

    await userEvent.pointer([
      { keys: '[MouseLeft>]', target: panel, coords: { x: clickX, y: clickY } },
      { keys: '[/MouseLeft]', target: panel, coords: { x: clickX, y: clickY } },
    ]);

    await waitFor(() => expect(args.onChange).toHaveBeenCalled());

    const mock = args.onChange as unknown as { mock: { calls: Array<[number, number]> } };
    const [l, c] = mock.mock.calls[mock.mock.calls.length - 1];
    const maxC = getP3MaxChroma({ l, c: 0, h: args.hue });

    // Invariant: panel must never emit chroma above the P3 ceiling at this
    // (l, h). This is the contract pointerToLC's clamp is supposed to uphold.
    await expect(c).toBeLessThanOrEqual(maxC + 1e-6);
    await expect(l).toBeGreaterThanOrEqual(0);
    await expect(l).toBeLessThanOrEqual(1);
  },
};
