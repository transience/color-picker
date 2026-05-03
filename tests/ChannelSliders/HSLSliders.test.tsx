import { useState } from 'react';
import { formatCSS, parseCSS } from 'colorizr';

import HSLSliders from '~/ChannelSliders/HSLSliders';
import { DEFAULT_COLOR } from '~/constants';
import { fireEvent, mockRAFSync, mockRect, render, screen } from '~/test-utils';

const mockOnChange = vi.fn();

function Controlled(props: {
  channels?: Parameters<typeof HSLSliders>[0]['channels'];
  labels?: Parameters<typeof HSLSliders>[0]['labels'];
}) {
  const { channels, labels } = props;
  const [color, setColor] = useState(DEFAULT_COLOR);

  return (
    <HSLSliders
      channels={channels}
      color={color}
      labels={labels}
      onChange={next => {
        mockOnChange(next);
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
      const { container } = render(<HSLSliders />);

      expect(container).toMatchSnapshot();
    });

    it('hides hue when channels.h.hidden is true', () => {
      render(<HSLSliders channels={{ h: { hidden: true } }} />);

      expect(screen.queryByRole('slider', { name: /hue/i })).not.toBeInTheDocument();
      expect(screen.getByRole('slider', { name: /saturation/i })).toBeInTheDocument();
    });

    it('hides saturation when channels.s.hidden is true', () => {
      render(<HSLSliders channels={{ s: { hidden: true } }} />);

      expect(screen.queryByRole('slider', { name: /saturation/i })).not.toBeInTheDocument();
    });

    it('disables lightness when channels.l.disabled is true', () => {
      render(<HSLSliders channels={{ l: { disabled: true } }} />);

      expect(screen.getByRole('slider', { name: /lightness/i })).toHaveAttribute(
        'aria-disabled',
        'true',
      );
    });

    it('renders default labels H, S, L', () => {
      render(<HSLSliders />);

      expect(screen.getByText('H')).toBeInTheDocument();
      expect(screen.getByText('S')).toBeInTheDocument();
      expect(screen.getByText('L')).toBeInTheDocument();
    });

    it('uses custom label when provided', () => {
      render(<HSLSliders labels={{ s: { label: <span data-testid="custom-s">Sat</span> } }} />);

      expect(screen.getByTestId('custom-s')).toBeInTheDocument();
    });

    it('omits NumericInputs when showInputs is false', () => {
      render(<HSLSliders color={DEFAULT_COLOR} onChange={mockOnChange} showInputs={false} />);

      expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    });
  });

  describe('Emission', () => {
    it('emits OKLCH string when hue changes', () => {
      render(<Controlled />);
      const hue = screen.getByRole('slider', { name: /hue/i });

      fireEvent.keyDown(hue, { key: 'ArrowRight' });

      expect(mockOnChange).toHaveBeenCalled();
      expect(mockOnChange.mock.calls[0][0]).toMatch(/^oklch\(/);
    });

    it('emits OKLCH when saturation changes', () => {
      render(<Controlled />);
      const sat = screen.getByRole('slider', { name: /saturation/i });

      // DEFAULT_COLOR is fully saturated in HSL (s=100); step left to change.
      fireEvent.keyDown(sat, { key: 'ArrowLeft' });

      expect(mockOnChange.mock.calls[0][0]).toMatch(/^oklch\(/);
    });

    it('emits OKLCH when lightness changes', () => {
      render(<Controlled />);
      const light = screen.getByRole('slider', { name: /lightness/i });

      fireEvent.keyDown(light, { key: 'ArrowRight' });

      expect(mockOnChange.mock.calls[0][0]).toMatch(/^oklch\(/);
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

      expect(mockOnChange).toHaveBeenCalled();
      expect(mockOnChange.mock.calls.at(-1)?.[0]).toMatch(/^oklch\(/);
    });
  });

  describe('External color updates', () => {
    it('reflects external color prop in slider values', () => {
      const redHsl = parseCSS('#ff0000', 'hsl');
      const oklchRed = formatCSS(redHsl, { format: 'oklch' });

      const { rerender } = render(<HSLSliders color={oklchRed} onChange={mockOnChange} />);

      const blueHsl = parseCSS('#0000ff', 'hsl');
      const oklchBlue = formatCSS(blueHsl, { format: 'oklch' });

      rerender(<HSLSliders color={oklchBlue} onChange={mockOnChange} />);

      const hue = screen.getByRole('slider', { name: /hue/i });

      expect(Number(hue.getAttribute('aria-valuenow'))).toBeCloseTo(blueHsl.h, 0);
    });
  });

  describe('Lifecycle callbacks', () => {
    it('onChangeStart fires with the current color (not a stale value) on a drag after an external color change', () => {
      const onChangeStart = vi.fn();
      const onChangeEnd = vi.fn();
      const redOklch = formatCSS(parseCSS('#ff0000', 'hsl'), { format: 'oklch' });
      const blueOklch = formatCSS(parseCSS('#0000ff', 'hsl'), { format: 'oklch' });

      const { rerender } = render(
        <HSLSliders
          color={redOklch}
          onChange={mockOnChange}
          onChangeEnd={onChangeEnd}
          onChangeStart={onChangeStart}
        />,
      );
      const hueTrack = screen.getByRole('slider', { name: /hue/i }).parentElement!;

      // First drag emits a value into the session.
      hueTrack.getBoundingClientRect = () =>
        ({
          left: 0,
          top: 0,
          width: 200,
          height: 12,
          right: 200,
          bottom: 12,
          x: 0,
          y: 0,
        }) as DOMRect;
      fireEvent.pointerDown(hueTrack, { clientX: 100, clientY: 6, pointerId: 1 });
      fireEvent.lostPointerCapture(hueTrack, { pointerId: 1 });

      onChangeStart.mockClear();
      onChangeEnd.mockClear();

      // Parent updates color externally.
      rerender(
        <HSLSliders
          color={blueOklch}
          onChange={mockOnChange}
          onChangeEnd={onChangeEnd}
          onChangeStart={onChangeStart}
        />,
      );

      // Second interaction: pointerdown then immediate release without movement.
      // RAF mocked sync; pointerDown still calls update via handleMove. Skip handleMove
      // by going straight to lostPointerCapture after a no-op pointerdown by setting
      // pointerCapture only on a non-track element. Instead — simulate the boundary
      // events directly to assert handleStart / handleEnd contract.
      // Here we just call the start/end via a fresh pointerDown at exact same x with
      // no movement — handleMove will emit, and the post-Start reset clears any
      // prior session state so this interaction is observed in isolation.
      fireEvent.pointerDown(hueTrack, { clientX: 100, clientY: 6, pointerId: 1 });
      fireEvent.lostPointerCapture(hueTrack, { pointerId: 1 });

      // Start should fire with the *current* color (blue), not the prior red.
      expect(onChangeStart).toHaveBeenCalledTimes(1);
      expect(onChangeStart.mock.calls[0][0]).toBe(blueOklch);
    });

    it('multi-channel sequence emits independent, non-overlapping Start/End pairs per touched channel', () => {
      const onChangeStart = vi.fn();
      const onChangeEnd = vi.fn();

      function Wrapper() {
        const [color, setColor] = useState(DEFAULT_COLOR);

        return (
          <HSLSliders
            color={color}
            onChange={setColor}
            onChangeEnd={onChangeEnd}
            onChangeStart={onChangeStart}
          />
        );
      }

      render(<Wrapper />);

      const hueTrack = screen.getByRole('slider', { name: /hue/i }).parentElement!;
      const saturationTrack = screen.getByRole('slider', { name: /saturation/i }).parentElement!;

      mockRect(hueTrack, { width: 200, height: 12 });
      mockRect(saturationTrack, { width: 200, height: 12 });

      fireEvent.pointerDown(hueTrack, { clientX: 60, clientY: 6, pointerId: 1 });
      fireEvent.lostPointerCapture(hueTrack, { pointerId: 1 });

      fireEvent.pointerDown(saturationTrack, { clientX: 140, clientY: 6, pointerId: 1 });
      fireEvent.lostPointerCapture(saturationTrack, { pointerId: 1 });

      expect(onChangeStart).toHaveBeenCalledTimes(2);
      expect(onChangeEnd).toHaveBeenCalledTimes(2);

      const startOrder = onChangeStart.mock.invocationCallOrder;
      const endOrder = onChangeEnd.mock.invocationCallOrder;

      expect(startOrder[0]).toBeLessThan(endOrder[0]);
      expect(endOrder[0]).toBeLessThan(startOrder[1]);
      expect(startOrder[1]).toBeLessThan(endOrder[1]);

      expect(onChangeStart.mock.calls[1][0]).toBe(onChangeEnd.mock.calls[0][0]);
    });
  });
});
