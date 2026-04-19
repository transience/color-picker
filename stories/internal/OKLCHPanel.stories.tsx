import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { getP3MaxChroma } from 'colorizr';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';

import OKLCHPanel from '../../src/OKLCHPanel';

const meta: Meta<typeof OKLCHPanel> = {
  title: 'OKLCHPanel',
  component: OKLCHPanel,
  args: {
    onChange: fn(),
  },
};

export default meta;

type Story = StoryObj<typeof OKLCHPanel>;

function Controlled(props: {
  hue: number;
  initialChroma: number;
  initialLightness: number;
  onChange: (l: number, c: number) => void;
}) {
  const { hue, initialChroma, initialLightness, onChange } = props;
  const [state, setState] = useState({ l: initialLightness, c: initialChroma });

  return (
    <div style={{ width: 320, height: 180 }}>
      <OKLCHPanel
        chroma={state.c}
        hue={hue}
        lightness={state.l}
        onChange={(l, c) => {
          setState({ l, c });
          onChange(l, c);
        }}
      />
    </div>
  );
}

export const Default: Story = {
  args: { hue: 30, chroma: 0.1, lightness: 0.6 },
  render: ({ chroma, hue, lightness, onChange }) => (
    <Controlled hue={hue} initialChroma={chroma} initialLightness={lightness} onChange={onChange} />
  ),
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
  render: ({ chroma, hue, lightness, onChange }) => (
    <Controlled hue={hue} initialChroma={chroma} initialLightness={lightness} onChange={onChange} />
  ),
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
