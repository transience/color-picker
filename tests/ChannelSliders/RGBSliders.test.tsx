import { useState } from 'react';
import { formatCSS, parseCSS } from 'colorizr';

import RGBSliders from '~/ChannelSliders/RGBSliders';
import { fireEvent, mockRAFSync, render, screen } from '~/test-utils';

const mockOnChangeColor = vi.fn();

const DEFAULT_COLOR = formatCSS(parseCSS('#ff0044', 'rgb'), { format: 'oklch' });

function Controlled(props: { channels?: Parameters<typeof RGBSliders>[0]['channels'] }) {
  const [color, setColor] = useState(DEFAULT_COLOR);
  const { channels } = props;

  return (
    <RGBSliders
      channels={channels}
      color={color}
      onChangeColor={next => {
        mockOnChangeColor(next);
        setColor(next);
      }}
    />
  );
}

describe('RGBSliders', () => {
  let restoreRAF: () => void;

  beforeEach(() => {
    vi.clearAllMocks();
    restoreRAF = mockRAFSync();
  });

  afterEach(() => {
    restoreRAF();
  });

  describe('Render', () => {
    it('renders R, G, B sliders', () => {
      render(<Controlled />);

      expect(screen.getByRole('slider', { name: /red/i })).toBeInTheDocument();
      expect(screen.getByRole('slider', { name: /green/i })).toBeInTheDocument();
      expect(screen.getByRole('slider', { name: /blue/i })).toBeInTheDocument();
    });

    it('exposes 0-255 range on every slider', () => {
      render(<Controlled />);

      for (const name of [/red/i, /green/i, /blue/i]) {
        const slider = screen.getByRole('slider', { name });

        expect(slider).toHaveAttribute('aria-valuemin', '0');
        expect(slider).toHaveAttribute('aria-valuemax', '255');
      }
    });

    it('renders default labels R, G, B', () => {
      render(<Controlled />);

      expect(screen.getByText('R')).toBeInTheDocument();
      expect(screen.getByText('G')).toBeInTheDocument();
      expect(screen.getByText('B')).toBeInTheDocument();
    });

    it('hides a channel via channels.r.hidden', () => {
      render(<Controlled channels={{ r: { hidden: true } }} />);

      expect(screen.queryByRole('slider', { name: /red/i })).not.toBeInTheDocument();
    });

    it('disables a channel via channels.g.disabled', () => {
      render(<Controlled channels={{ g: { disabled: true } }} />);

      expect(screen.getByRole('slider', { name: /green/i })).toHaveAttribute(
        'aria-disabled',
        'true',
      );
    });
  });

  describe('Emission', () => {
    it('emits OKLCH when red changes', () => {
      render(<Controlled />);

      fireEvent.keyDown(screen.getByRole('slider', { name: /red/i }), { key: 'ArrowRight' });

      expect(mockOnChangeColor.mock.calls[0][0]).toMatch(/^oklch\(/);
    });

    it('emits OKLCH when green changes', () => {
      render(<Controlled />);

      fireEvent.keyDown(screen.getByRole('slider', { name: /green/i }), { key: 'ArrowRight' });

      expect(mockOnChangeColor.mock.calls[0][0]).toMatch(/^oklch\(/);
    });

    it('emits OKLCH when blue changes', () => {
      render(<Controlled />);

      fireEvent.keyDown(screen.getByRole('slider', { name: /blue/i }), { key: 'ArrowRight' });

      expect(mockOnChangeColor.mock.calls[0][0]).toMatch(/^oklch\(/);
    });
  });

  describe('External color updates', () => {
    it('re-parses external color to slider values', () => {
      const greenRgb = parseCSS('#00ff00', 'rgb');
      const oklchGreen = formatCSS(greenRgb, { format: 'oklch' });

      const { rerender } = render(
        <RGBSliders color={DEFAULT_COLOR} onChangeColor={mockOnChangeColor} />,
      );

      rerender(<RGBSliders color={oklchGreen} onChangeColor={mockOnChangeColor} />);

      const red = screen.getByRole('slider', { name: /red/i });
      const green = screen.getByRole('slider', { name: /green/i });
      const blue = screen.getByRole('slider', { name: /blue/i });

      expect(Number(red.getAttribute('aria-valuenow'))).toBeCloseTo(0, 0);
      expect(Number(green.getAttribute('aria-valuenow'))).toBeCloseTo(255, 0);
      expect(Number(blue.getAttribute('aria-valuenow'))).toBeCloseTo(0, 0);
    });
  });
});
