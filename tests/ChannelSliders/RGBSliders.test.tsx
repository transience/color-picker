import { useState } from 'react';
import { formatCSS, parseCSS } from 'colorizr';

import RGBSliders from '~/ChannelSliders/RGBSliders';
import { DEFAULT_COLOR } from '~/constants';
import { fireEvent, mockRAFSync, render, screen } from '~/test-utils';

const mockOnChange = vi.fn();

function Controlled(props: { channels?: Parameters<typeof RGBSliders>[0]['channels'] }) {
  const [color, setColor] = useState(DEFAULT_COLOR);
  const { channels } = props;

  return (
    <RGBSliders
      channels={channels}
      color={color}
      onChange={next => {
        mockOnChange(next);
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
      const { container } = render(<RGBSliders />);

      expect(container).toMatchSnapshot();
    });

    it('exposes 0-255 range on every slider', () => {
      render(<RGBSliders />);

      for (const name of [/red/i, /green/i, /blue/i]) {
        const slider = screen.getByRole('slider', { name });

        expect(slider).toHaveAttribute('aria-valuemin', '0');
        expect(slider).toHaveAttribute('aria-valuemax', '255');
      }
    });

    it('renders default labels R, G, B', () => {
      render(<RGBSliders />);

      expect(screen.getByText('R')).toBeInTheDocument();
      expect(screen.getByText('G')).toBeInTheDocument();
      expect(screen.getByText('B')).toBeInTheDocument();
    });

    it('hides a channel via channels.r.hidden', () => {
      render(<RGBSliders channels={{ r: { hidden: true } }} />);

      expect(screen.queryByRole('slider', { name: /red/i })).not.toBeInTheDocument();
    });

    it('disables a channel via channels.g.disabled', () => {
      render(<RGBSliders channels={{ g: { disabled: true } }} />);

      expect(screen.getByRole('slider', { name: /green/i })).toHaveAttribute(
        'aria-disabled',
        'true',
      );
    });

    it('omits NumericInputs when showInputs is false', () => {
      render(<RGBSliders showInputs={false} />);

      expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    });
  });

  describe('Emission', () => {
    it('emits OKLCH when red changes', () => {
      render(<Controlled />);

      fireEvent.keyDown(screen.getByRole('slider', { name: /red/i }), { key: 'ArrowRight' });

      expect(mockOnChange.mock.calls[0][0]).toMatch(/^oklch\(/);
    });

    it('emits OKLCH when green changes', () => {
      render(<Controlled />);

      fireEvent.keyDown(screen.getByRole('slider', { name: /green/i }), { key: 'ArrowRight' });

      expect(mockOnChange.mock.calls[0][0]).toMatch(/^oklch\(/);
    });

    it('emits OKLCH when blue changes', () => {
      render(<Controlled />);

      fireEvent.keyDown(screen.getByRole('slider', { name: /blue/i }), { key: 'ArrowRight' });

      expect(mockOnChange.mock.calls[0][0]).toMatch(/^oklch\(/);
    });

    it.each([
      ['Red', '200'],
      ['Green', '150'],
      ['Blue', '50'],
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
    it('re-parses external color to slider values', () => {
      const greenRgb = parseCSS('#00ff00', 'rgb');
      const oklchGreen = formatCSS(greenRgb, { format: 'oklch' });

      const { rerender } = render(<RGBSliders color={DEFAULT_COLOR} onChange={mockOnChange} />);

      rerender(<RGBSliders color={oklchGreen} onChange={mockOnChange} />);

      const red = screen.getByRole('slider', { name: /red/i });
      const green = screen.getByRole('slider', { name: /green/i });
      const blue = screen.getByRole('slider', { name: /blue/i });

      expect(Number(red.getAttribute('aria-valuenow'))).toBeCloseTo(0, 0);
      expect(Number(green.getAttribute('aria-valuenow'))).toBeCloseTo(255, 0);
      expect(Number(blue.getAttribute('aria-valuenow'))).toBeCloseTo(0, 0);
    });
  });

  describe('Lifecycle callbacks', () => {
    it('onChangeStart fires with the current color (not a stale value) on a drag after an external color change', () => {
      const onChangeStart = vi.fn();
      const onChangeEnd = vi.fn();
      const redOklch = formatCSS(parseCSS('#ff0000', 'rgb'), { format: 'oklch' });
      const blueOklch = formatCSS(parseCSS('#0000ff', 'rgb'), { format: 'oklch' });

      const { rerender } = render(
        <RGBSliders
          color={redOklch}
          onChange={mockOnChange}
          onChangeEnd={onChangeEnd}
          onChangeStart={onChangeStart}
        />,
      );
      const redTrack = screen.getByRole('slider', { name: /red/i }).parentElement!;

      redTrack.getBoundingClientRect = () =>
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
      fireEvent.pointerDown(redTrack, { clientX: 100, clientY: 6, pointerId: 1 });
      fireEvent.lostPointerCapture(redTrack, { pointerId: 1 });

      onChangeStart.mockClear();
      onChangeEnd.mockClear();

      rerender(
        <RGBSliders
          color={blueOklch}
          onChange={mockOnChange}
          onChangeEnd={onChangeEnd}
          onChangeStart={onChangeStart}
        />,
      );

      fireEvent.pointerDown(redTrack, { clientX: 100, clientY: 6, pointerId: 1 });
      fireEvent.lostPointerCapture(redTrack, { pointerId: 1 });

      expect(onChangeStart).toHaveBeenCalledTimes(1);
      expect(onChangeStart.mock.calls[0][0]).toBe(blueOklch);
    });
  });
});
