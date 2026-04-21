import { useState } from 'react';
import { formatCSS, parseCSS } from 'colorizr';

import HSLSliders from '~/ChannelSliders/HSLSliders';
import { fireEvent, mockRAFSync, render, screen } from '~/test-utils';

const mockOnChangeColor = vi.fn();

const DEFAULT_COLOR = formatCSS(parseCSS('#ff0044', 'hsl'), { format: 'oklch' });

function Controlled(props: { channels?: Parameters<typeof HSLSliders>[0]['channels'] }) {
  const { channels } = props;
  const [color, setColor] = useState(DEFAULT_COLOR);

  return (
    <HSLSliders
      channels={channels}
      color={color}
      onChangeColor={next => {
        mockOnChangeColor(next);
        setColor(next);
      }}
    />
  );
}

describe('HSLSliders', () => {
  let restoreRAF: () => void;

  beforeEach(() => {
    vi.clearAllMocks();
    restoreRAF = mockRAFSync();
  });

  afterEach(() => {
    restoreRAF();
  });

  describe('Render', () => {
    it('renders H, S, L sliders', () => {
      render(<Controlled />);

      expect(screen.getByRole('slider', { name: /hue/i })).toBeInTheDocument();
      expect(screen.getByRole('slider', { name: /saturation/i })).toBeInTheDocument();
      expect(screen.getByRole('slider', { name: /lightness/i })).toBeInTheDocument();
    });

    it('hides hue when channels.h.hidden is true', () => {
      render(<Controlled channels={{ h: { hidden: true } }} />);

      expect(screen.queryByRole('slider', { name: /hue/i })).not.toBeInTheDocument();
      expect(screen.getByRole('slider', { name: /saturation/i })).toBeInTheDocument();
    });

    it('hides saturation when channels.s.hidden is true', () => {
      render(<Controlled channels={{ s: { hidden: true } }} />);

      expect(screen.queryByRole('slider', { name: /saturation/i })).not.toBeInTheDocument();
    });

    it('disables lightness when channels.l.disabled is true', () => {
      render(<Controlled channels={{ l: { disabled: true } }} />);

      expect(screen.getByRole('slider', { name: /lightness/i })).toHaveAttribute(
        'aria-disabled',
        'true',
      );
    });

    it('renders default labels H, S, L', () => {
      render(<Controlled />);

      expect(screen.getByText('H')).toBeInTheDocument();
      expect(screen.getByText('S')).toBeInTheDocument();
      expect(screen.getByText('L')).toBeInTheDocument();
    });

    it('uses custom label when provided', () => {
      render(<Controlled channels={{ s: { label: <span data-testid="custom-s">Sat</span> } }} />);

      expect(screen.getByTestId('custom-s')).toBeInTheDocument();
    });

    it('omits NumericInputs when showInputs is false', () => {
      render(
        <HSLSliders color={DEFAULT_COLOR} onChangeColor={mockOnChangeColor} showInputs={false} />,
      );

      expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    });
  });

  describe('Emission', () => {
    it('emits OKLCH string when hue changes', () => {
      render(<Controlled />);
      const hue = screen.getByRole('slider', { name: /hue/i });

      fireEvent.keyDown(hue, { key: 'ArrowRight' });

      expect(mockOnChangeColor).toHaveBeenCalled();
      expect(mockOnChangeColor.mock.calls[0][0]).toMatch(/^oklch\(/);
    });

    it('emits OKLCH when saturation changes', () => {
      render(<Controlled />);
      const sat = screen.getByRole('slider', { name: /saturation/i });

      fireEvent.keyDown(sat, { key: 'ArrowRight' });

      expect(mockOnChangeColor.mock.calls[0][0]).toMatch(/^oklch\(/);
    });

    it('emits OKLCH when lightness changes', () => {
      render(<Controlled />);
      const light = screen.getByRole('slider', { name: /lightness/i });

      fireEvent.keyDown(light, { key: 'ArrowRight' });

      expect(mockOnChangeColor.mock.calls[0][0]).toMatch(/^oklch\(/);
    });

    it.each([
      ['Hue', '200'],
      ['Saturation', '60'],
      ['Lightness', '40'],
    ] as const)('emits OKLCH when the %s NumericInput changes', (label, typed) => {
      render(<Controlled />);
      const input = screen.getByRole('textbox', { name: label });

      fireEvent.focus(input);
      fireEvent.change(input, { target: { value: typed } });

      expect(mockOnChangeColor).toHaveBeenCalled();
      expect(mockOnChangeColor.mock.calls.at(-1)?.[0]).toMatch(/^oklch\(/);
    });
  });

  describe('External color updates', () => {
    it('reflects external color prop in slider values', () => {
      const redHsl = parseCSS('#ff0000', 'hsl');
      const oklchRed = formatCSS(redHsl, { format: 'oklch' });

      const { rerender } = render(
        <HSLSliders color={oklchRed} onChangeColor={mockOnChangeColor} />,
      );

      const blueHsl = parseCSS('#0000ff', 'hsl');
      const oklchBlue = formatCSS(blueHsl, { format: 'oklch' });

      rerender(<HSLSliders color={oklchBlue} onChangeColor={mockOnChangeColor} />);

      const hue = screen.getByRole('slider', { name: /hue/i });

      expect(Number(hue.getAttribute('aria-valuenow'))).toBeCloseTo(blueHsl.h, 0);
    });
  });
});
