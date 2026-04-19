import { useState } from 'react';
import { getP3MaxChroma, parseCSS } from 'colorizr';

import OKLCHSliders from '~/ChannelSliders/OKLCHSliders';
import { fireEvent, mockRAFSync, render, screen } from '~/test-utils';

const mockOnChangeColor = vi.fn();

const DEFAULT_COLOR = 'oklch(0.6 0.15 30)';

function Controlled(props: {
  channels?: Parameters<typeof OKLCHSliders>[0]['channels'];
  initial?: string;
}) {
  const { channels, initial } = props;
  const [color, setColor] = useState(initial ?? DEFAULT_COLOR);

  return (
    <OKLCHSliders
      channels={channels}
      color={color}
      onChangeColor={next => {
        mockOnChangeColor(next);
        setColor(next);
      }}
    />
  );
}

describe('OKLCHSliders', () => {
  let restoreRAF: () => void;

  beforeEach(() => {
    vi.clearAllMocks();
    restoreRAF = mockRAFSync();
  });

  afterEach(() => {
    restoreRAF();
  });

  describe('Render', () => {
    it('renders L, C, H sliders', () => {
      render(<Controlled />);

      expect(screen.getByRole('slider', { name: /lightness/i })).toBeInTheDocument();
      expect(screen.getByRole('slider', { name: /chroma/i })).toBeInTheDocument();
      expect(screen.getByRole('slider', { name: /hue/i })).toBeInTheDocument();
    });

    it('lightness slider uses 0-1 range (not 0-100)', () => {
      render(<Controlled />);
      const lightness = screen.getByRole('slider', { name: /lightness/i });

      expect(lightness).toHaveAttribute('aria-valuemin', '0');
      expect(lightness).toHaveAttribute('aria-valuemax', '1');
    });

    it('hue slider uses 0-360 range', () => {
      render(<Controlled />);
      const hue = screen.getByRole('slider', { name: /hue/i });

      expect(hue).toHaveAttribute('aria-valuemin', '0');
      expect(hue).toHaveAttribute('aria-valuemax', '360');
    });

    it('chroma slider uses 0-maxChroma range', () => {
      render(<Controlled initial="oklch(0.5 0.1 180)" />);
      const chroma = screen.getByRole('slider', { name: /chroma/i });
      const expectedMax = getP3MaxChroma({ l: 0.5, c: 0, h: 180 });

      expect(Number(chroma.getAttribute('aria-valuemax'))).toBeCloseTo(expectedMax, 3);
    });

    it('renders default labels L, C, H', () => {
      render(<Controlled />);

      expect(screen.getByText('L')).toBeInTheDocument();
      expect(screen.getByText('C')).toBeInTheDocument();
      expect(screen.getByText('H')).toBeInTheDocument();
    });

    it('hides hue when channels.h.hidden is true', () => {
      render(<Controlled channels={{ h: { hidden: true } }} />);

      expect(screen.queryByRole('slider', { name: /hue/i })).not.toBeInTheDocument();
    });

    it('disables chroma via channels.c.disabled', () => {
      render(<Controlled channels={{ c: { disabled: true } }} />);

      expect(screen.getByRole('slider', { name: /chroma/i })).toHaveAttribute(
        'aria-disabled',
        'true',
      );
    });
  });

  describe('Emission', () => {
    it('emits OKLCH when lightness changes', () => {
      render(<Controlled />);

      fireEvent.keyDown(screen.getByRole('slider', { name: /lightness/i }), { key: 'ArrowRight' });

      expect(mockOnChangeColor.mock.calls[0][0]).toMatch(/^oklch\(/);
    });

    it('emits OKLCH when chroma changes', () => {
      render(<Controlled />);

      fireEvent.keyDown(screen.getByRole('slider', { name: /chroma/i }), { key: 'ArrowRight' });

      expect(mockOnChangeColor.mock.calls[0][0]).toMatch(/^oklch\(/);
    });

    it('emits OKLCH when hue changes', () => {
      render(<Controlled />);

      fireEvent.keyDown(screen.getByRole('slider', { name: /hue/i }), { key: 'ArrowRight' });

      expect(mockOnChangeColor.mock.calls[0][0]).toMatch(/^oklch\(/);
    });
  });

  describe('Relative chroma preservation', () => {
    it('scales chroma to new max when lightness changes', () => {
      // Start with chroma at 50% of max at current l, h
      const initialL = 0.5;
      const initialH = 180;
      const initialMaxC = getP3MaxChroma({ l: initialL, c: 0, h: initialH });
      const initialC = initialMaxC * 0.5;
      const initialColor = `oklch(${initialL} ${initialC} ${initialH})`;

      render(<Controlled initial={initialColor} />);

      // Bump lightness up — chroma should scale to new max while preserving the 50% ratio
      fireEvent.keyDown(screen.getByRole('slider', { name: /lightness/i }), { key: 'ArrowRight' });

      const emitted = mockOnChangeColor.mock.calls[0][0];
      const { c: newC, h: newH, l: newL } = parseCSS(emitted, 'oklch');
      const newMaxC = getP3MaxChroma({ l: newL, c: 0, h: newH });
      const newRelative = newMaxC > 0 ? newC / newMaxC : 0;

      expect(newRelative).toBeCloseTo(0.5, 1);
    });

    it('scales chroma to new max when hue changes', () => {
      const initialL = 0.7;
      const initialH = 30;
      const initialMaxC = getP3MaxChroma({ l: initialL, c: 0, h: initialH });
      const initialC = initialMaxC * 0.3;
      const initialColor = `oklch(${initialL} ${initialC} ${initialH})`;

      render(<Controlled initial={initialColor} />);

      fireEvent.keyDown(screen.getByRole('slider', { name: /hue/i }), {
        key: 'ArrowRight',
        shiftKey: true,
      });

      const emitted = mockOnChangeColor.mock.calls[0][0];
      const { c: newC, h: newH, l: newL } = parseCSS(emitted, 'oklch');
      const newMaxC = getP3MaxChroma({ l: newL, c: 0, h: newH });
      const newRelative = newMaxC > 0 ? newC / newMaxC : 0;

      expect(newRelative).toBeCloseTo(0.3, 1);
    });

    it('chroma change does NOT rescale (direct update)', () => {
      render(<Controlled initial="oklch(0.6 0.1 180)" />);

      fireEvent.keyDown(screen.getByRole('slider', { name: /chroma/i }), { key: 'ArrowRight' });

      const emitted = mockOnChangeColor.mock.calls[0][0];
      const { c, h, l } = parseCSS(emitted, 'oklch');

      expect(l).toBeCloseTo(0.6, 2);
      expect(h).toBeCloseTo(180, 0);
      expect(c).toBeCloseTo(0.101, 3); // 0.1 + step 0.001
    });
  });
});
