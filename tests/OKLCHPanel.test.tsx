import { useState } from 'react';
import { getP3MaxChroma } from 'colorizr';

import { pointerToLC } from '~/modules/oklchCanvas';
import OKLCHPanel from '~/OKLCHPanel';
import { fireEvent, render, screen } from '~/test-utils';

import {
  firePointerDrag,
  mockCanvasContext,
  mockRAFSync,
  mockRect,
} from './__setup__/test-helpers';

const mockOnChange = vi.fn();
const maxChromaFn = (l: number, h: number) => getP3MaxChroma({ l, c: 0, h });

function Controlled(props: {
  hue?: number;
  initialChroma?: number;
  initialLightness?: number;
  onChangeEnd?: (l: number, c: number) => void;
  onChangeStart?: (l: number, c: number) => void;
}) {
  const {
    hue = 30,
    initialChroma = 0.1,
    initialLightness = 0.6,
    onChangeEnd,
    onChangeStart,
  } = props;
  const [lightness, setLightness] = useState(initialLightness);
  const [chroma, setChroma] = useState(initialChroma);

  return (
    <OKLCHPanel
      chroma={chroma}
      hue={hue}
      lightness={lightness}
      onChange={(l, c) => {
        mockOnChange(l, c);
        setLightness(l);
        setChroma(c);
      }}
      onChangeEnd={onChangeEnd}
      onChangeStart={onChangeStart}
    />
  );
}

describe('OKLCHPanel', () => {
  let restoreRAF: () => void;
  let canvas: ReturnType<typeof mockCanvasContext>;

  beforeEach(() => {
    vi.clearAllMocks();
    restoreRAF = mockRAFSync();
    canvas = mockCanvasContext();
  });

  afterEach(() => {
    restoreRAF();
    canvas.restore();
  });

  describe('Render', () => {
    it('renders correctly', () => {
      render(<OKLCHPanel />);

      expect(screen.getByTestId('OKLCHPanel')).toMatchSnapshot();
      expect(canvas.spy).toHaveBeenCalled();
    });

    it('calls renderOKLCHCanvas on mount via getContext', () => {
      render(<OKLCHPanel chroma={0.1} hue={30} lightness={0.6} onChange={mockOnChange} />);

      expect(canvas.spy).toHaveBeenCalled();
    });

    it('re-renders canvas when hue changes', () => {
      const { rerender } = render(
        <OKLCHPanel chroma={0.1} hue={30} lightness={0.6} onChange={mockOnChange} />,
      );
      const callsBefore = canvas.spy.mock.calls.length;

      rerender(<OKLCHPanel chroma={0.1} hue={180} lightness={0.6} onChange={mockOnChange} />);

      expect(canvas.spy.mock.calls.length).toBeGreaterThan(callsBefore);
    });
  });

  describe('Pointer interaction', () => {
    it('pointerDown emits (l, c) matching pointerToLC at the clicked position', () => {
      const hue = 30;

      render(<OKLCHPanel chroma={0.1} hue={hue} lightness={0.6} onChange={mockOnChange} />);
      const panel = screen.getByTestId('OKLCHPanel');

      mockRect(panel, { left: 0, top: 0, width: 256, height: 128 });
      fireEvent.pointerDown(panel, { clientX: 128, clientY: 64, pointerId: 1 });

      const { c: expectedC, l: expectedL } = pointerToLC(hue, 0.5, 0.5);
      const [l, c] = mockOnChange.mock.calls[0];

      expect(l).toBeCloseTo(expectedL, 5);
      expect(c).toBeCloseTo(Math.max(0, expectedC), 5);
    });

    it('pointerDown at bottom emits lightness near 0', () => {
      render(<OKLCHPanel chroma={0.1} hue={30} lightness={0.6} onChange={mockOnChange} />);
      const panel = screen.getByTestId('OKLCHPanel');

      mockRect(panel, { left: 0, top: 0, width: 256, height: 128 });
      fireEvent.pointerDown(panel, { clientX: 128, clientY: 128, pointerId: 1 });

      const [l] = mockOnChange.mock.calls[0];

      expect(l).toBeCloseTo(0, 5);
    });

    it('pointerDown at left emits zero chroma', () => {
      render(<OKLCHPanel chroma={0.1} hue={30} lightness={0.6} onChange={mockOnChange} />);
      const panel = screen.getByTestId('OKLCHPanel');

      mockRect(panel, { left: 0, top: 0, width: 256, height: 128 });
      fireEvent.pointerDown(panel, { clientX: 0, clientY: 64, pointerId: 1 });

      const [, c] = mockOnChange.mock.calls[0];

      expect(c).toBeCloseTo(0, 5);
    });

    it('emits multiple values during pointerMove drag', () => {
      render(<OKLCHPanel chroma={0.1} hue={30} lightness={0.6} onChange={mockOnChange} />);
      const panel = screen.getByTestId('OKLCHPanel');

      mockRect(panel, { left: 0, top: 0, width: 256, height: 128 });

      firePointerDrag(panel, [
        { x: 10, y: 10 },
        { x: 100, y: 50 },
        { x: 200, y: 100 },
      ]);

      expect(mockOnChange.mock.calls.length).toBeGreaterThanOrEqual(3);
    });

    it('clamps lightness to [0, 1] and chroma to [0, maxC] when pointer is out of bounds', () => {
      const hue = 30;

      render(<OKLCHPanel chroma={0.1} hue={hue} lightness={0.6} onChange={mockOnChange} />);
      const panel = screen.getByTestId('OKLCHPanel');

      mockRect(panel, { left: 0, top: 0, width: 256, height: 128 });
      fireEvent.pointerDown(panel, { clientX: 500, clientY: -100, pointerId: 1 });

      const [l, c] = mockOnChange.mock.calls[0];

      expect(l).toBeGreaterThanOrEqual(0);
      expect(l).toBeLessThanOrEqual(1);
      expect(c).toBeGreaterThanOrEqual(0);
      expect(c).toBeLessThanOrEqual(maxChromaFn(l, hue) + 0.01);
    });
  });

  describe('Lifecycle callbacks', () => {
    it('pointerDown fires onChangeStart with the values before drag', () => {
      const onChangeStart = vi.fn();

      render(
        <OKLCHPanel
          chroma={0.1}
          hue={30}
          lightness={0.6}
          onChange={mockOnChange}
          onChangeStart={onChangeStart}
        />,
      );
      const root = screen.getByTestId('OKLCHPanel');

      mockRect(root, { left: 0, top: 0, width: 256, height: 128 });
      fireEvent.pointerDown(root, { clientX: 50, clientY: 50, pointerId: 1 });

      expect(onChangeStart).toHaveBeenCalledTimes(1);
      expect(onChangeStart).toHaveBeenCalledWith(0.6, 0.1);
    });

    it('lostPointerCapture fires onChangeEnd with the final dragged position', () => {
      const onChangeEnd = vi.fn();

      render(
        <OKLCHPanel
          chroma={0.1}
          hue={30}
          lightness={0.6}
          onChange={mockOnChange}
          onChangeEnd={onChangeEnd}
        />,
      );
      const root = screen.getByTestId('OKLCHPanel');

      mockRect(root, { left: 0, top: 0, width: 256, height: 128 });
      firePointerDrag(root, [
        { x: 50, y: 50 },
        { x: 100, y: 60 },
      ]);
      fireEvent.lostPointerCapture(root, { pointerId: 1 });

      const lastOnChange = mockOnChange.mock.calls.at(-1);

      expect(onChangeEnd).toHaveBeenCalledTimes(1);
      expect(onChangeEnd).toHaveBeenCalledWith(lastOnChange?.[0], lastOnChange?.[1]);
    });

    it('onChangeEnd receives the click position when pointerDown is followed by immediate release', () => {
      const onChangeEnd = vi.fn();

      render(
        <OKLCHPanel
          chroma={0.1}
          hue={30}
          lightness={0.6}
          onChange={mockOnChange}
          onChangeEnd={onChangeEnd}
        />,
      );
      const root = screen.getByTestId('OKLCHPanel');

      mockRect(root, { left: 0, top: 0, width: 256, height: 128 });
      fireEvent.pointerDown(root, { clientX: 80, clientY: 40, pointerId: 1 });
      fireEvent.lostPointerCapture(root, { pointerId: 1 });

      const lastOnChange = mockOnChange.mock.calls.at(-1);

      expect(onChangeEnd).toHaveBeenCalledTimes(1);
      expect(onChangeEnd).toHaveBeenCalledWith(lastOnChange?.[0], lastOnChange?.[1]);
    });
  });

  describe('Controlled flow', () => {
    it('drag fires Start with pre-mutation values, Change per move, End with last value', () => {
      const onChangeStart = vi.fn();
      const onChangeEnd = vi.fn();

      render(
        <Controlled
          hue={30}
          initialChroma={0.1}
          initialLightness={0.6}
          onChangeEnd={onChangeEnd}
          onChangeStart={onChangeStart}
        />,
      );
      const root = screen.getByTestId('OKLCHPanel');

      mockRect(root, { left: 0, top: 0, width: 256, height: 128 });
      firePointerDrag(root, [
        { x: 80, y: 40 },
        { x: 160, y: 80 },
      ]);
      fireEvent.lostPointerCapture(root, { pointerId: 1 });

      expect(onChangeStart).toHaveBeenCalledWith(0.6, 0.1);
      expect(onChangeEnd).toHaveBeenCalledTimes(1);
      const lastChange = mockOnChange.mock.calls.at(-1);

      expect(onChangeEnd).toHaveBeenCalledWith(lastChange?.[0], lastChange?.[1]);
    });

    it('click on current thumb position fires Start + Change + End', () => {
      const onChangeStart = vi.fn();
      const onChangeEnd = vi.fn();
      const lightness = 0.6;
      const chroma = 0.1;
      const hue = 30;
      // Compute the panel coords that map back to (lightness, chroma) so the
      // pointerdown lands on the current thumb position.
      // Use the inverse mapping driven by pointerToLC for reference.
      const { thumb } = (() => {
        // Reuse pointerToLC inversion via a simple search across the panel.
        // For the (l=0.6, c=0.1, h=30) defaults, x≈0.6 and y≈0.5 land close.
        const xNorm = lightness;
        const yNorm = 1 - chroma / Math.max(0.001, getP3MaxChroma({ l: lightness, c: 0, h: hue }));

        return { thumb: { x: xNorm, y: yNorm } };
      })();

      render(
        <Controlled
          hue={hue}
          initialChroma={chroma}
          initialLightness={lightness}
          onChangeEnd={onChangeEnd}
          onChangeStart={onChangeStart}
        />,
      );
      const root = screen.getByTestId('OKLCHPanel');

      mockRect(root, { left: 0, top: 0, width: 256, height: 128 });
      fireEvent.pointerDown(root, {
        clientX: thumb.x * 256,
        clientY: thumb.y * 128,
        pointerId: 1,
      });
      fireEvent.lostPointerCapture(root, { pointerId: 1 });

      expect(onChangeStart).toHaveBeenCalledWith(lightness, chroma);
      expect(mockOnChange).toHaveBeenCalled();
      expect(onChangeEnd).toHaveBeenCalledTimes(1);
    });
  });

  describe('Keyboard interaction', () => {
    it('exposes role=slider, tabIndex=0, ariaLabel, ariaValueText', () => {
      render(<OKLCHPanel chroma={0.1} hue={30} lightness={0.6} />);
      const panel = screen.getByTestId('OKLCHPanel');

      expect(panel).toHaveAttribute('role', 'slider');
      expect(panel).toHaveAttribute('tabindex', '0');
      expect(panel).toHaveAttribute('aria-label', 'OKLCH color panel');
      expect(panel).toHaveAttribute('aria-valuetext', 'Lightness 60%, Chroma 0.100');
    });

    it('uses custom ariaLabel and valueText when provided', () => {
      render(
        <OKLCHPanel
          aria-label="Custom"
          chroma={0.15}
          hue={30}
          lightness={0.5}
          valueText={(l, c) => `l=${l} c=${c}`}
        />,
      );
      const panel = screen.getByTestId('OKLCHPanel');

      expect(panel).toHaveAttribute('aria-label', 'Custom');
      expect(panel).toHaveAttribute('aria-valuetext', 'l=0.5 c=0.15');
    });

    it('ArrowUp nudges lightness up by KEYBOARD_STEP', () => {
      render(<Controlled hue={30} initialChroma={0.1} initialLightness={0.5} />);
      const panel = screen.getByTestId('OKLCHPanel');

      fireEvent.keyDown(panel, { key: 'ArrowUp' });

      const [l] = mockOnChange.mock.calls[0];

      expect(l).toBeCloseTo(0.51, 5);
    });

    it('ArrowDown nudges lightness down by KEYBOARD_STEP', () => {
      render(<Controlled hue={30} initialChroma={0.1} initialLightness={0.5} />);
      const panel = screen.getByTestId('OKLCHPanel');

      fireEvent.keyDown(panel, { key: 'ArrowDown' });

      const [l] = mockOnChange.mock.calls[0];

      expect(l).toBeCloseTo(0.49, 5);
    });

    it('ArrowRight nudges chroma up by 1% of maxC', () => {
      const hue = 30;
      const lightness = 0.5;
      const maxC = maxChromaFn(lightness, hue);

      render(<Controlled hue={hue} initialChroma={0.1} initialLightness={lightness} />);
      const panel = screen.getByTestId('OKLCHPanel');

      fireEvent.keyDown(panel, { key: 'ArrowRight' });

      const [, c] = mockOnChange.mock.calls[0];

      expect(c).toBeCloseTo(0.1 + maxC * 0.01, 5);
    });

    it('ArrowLeft nudges chroma down by 1% of maxC', () => {
      const hue = 30;
      const lightness = 0.5;
      const maxC = maxChromaFn(lightness, hue);

      render(<Controlled hue={hue} initialChroma={0.1} initialLightness={lightness} />);
      const panel = screen.getByTestId('OKLCHPanel');

      fireEvent.keyDown(panel, { key: 'ArrowLeft' });

      const [, c] = mockOnChange.mock.calls[0];

      expect(c).toBeCloseTo(0.1 - maxC * 0.01, 5);
    });

    it('Shift+ArrowRight on chroma uses 10% of maxC', () => {
      const hue = 30;
      const lightness = 0.5;
      const maxC = maxChromaFn(lightness, hue);

      render(<Controlled hue={hue} initialChroma={0.05} initialLightness={lightness} />);
      const panel = screen.getByTestId('OKLCHPanel');

      fireEvent.keyDown(panel, { key: 'ArrowRight', shiftKey: true });

      const [, c] = mockOnChange.mock.calls[0];

      expect(c).toBeCloseTo(0.05 + maxC * 0.1, 5);
    });

    it('Shift+arrow uses KEYBOARD_LARGE_STEP', () => {
      render(<Controlled hue={30} initialChroma={0.1} initialLightness={0.5} />);
      const panel = screen.getByTestId('OKLCHPanel');

      fireEvent.keyDown(panel, { key: 'ArrowUp', shiftKey: true });

      const [l] = mockOnChange.mock.calls[0];

      expect(l).toBeCloseTo(0.6, 5);
    });

    it('Home snaps chroma to 0', () => {
      render(<Controlled hue={30} initialChroma={0.15} initialLightness={0.5} />);
      const panel = screen.getByTestId('OKLCHPanel');

      fireEvent.keyDown(panel, { key: 'Home' });

      const [, c] = mockOnChange.mock.calls[0];

      expect(c).toBe(0);
    });

    it('End snaps chroma to per-hue maxC (P3 cusp for given lightness)', () => {
      const hue = 30;
      const lightness = 0.5;

      render(<Controlled hue={hue} initialChroma={0.05} initialLightness={lightness} />);
      const panel = screen.getByTestId('OKLCHPanel');

      fireEvent.keyDown(panel, { key: 'End' });

      const [, c] = mockOnChange.mock.calls[0];

      expect(c).toBeCloseTo(maxChromaFn(lightness, hue), 5);
    });

    it('clamps chroma at the upper bound to maxC, never above', () => {
      const hue = 30;
      const lightness = 0.5;
      const maxC = maxChromaFn(lightness, hue);

      render(<Controlled hue={hue} initialChroma={maxC} initialLightness={lightness} />);
      const panel = screen.getByTestId('OKLCHPanel');

      fireEvent.keyDown(panel, { key: 'ArrowRight' });

      const [, c] = mockOnChange.mock.calls[0];

      expect(c).toBeCloseTo(maxC, 5);
    });

    it('clamps lightness to [0, 1] at the upper bound', () => {
      render(<Controlled hue={30} initialChroma={0.1} initialLightness={1} />);
      const panel = screen.getByTestId('OKLCHPanel');

      fireEvent.keyDown(panel, { key: 'ArrowUp' });

      const [l] = mockOnChange.mock.calls[0];

      expect(l).toBe(1);
    });

    it('ignores unrelated keys', () => {
      render(<Controlled hue={30} initialChroma={0.1} initialLightness={0.5} />);
      const panel = screen.getByTestId('OKLCHPanel');

      fireEvent.keyDown(panel, { key: 'a' });

      expect(mockOnChange).not.toHaveBeenCalled();
    });

    it('re-clamps chroma to gamut after lightness changes via keyboard', () => {
      const hue = 30;
      const lightness = 0.65;
      const maxC = maxChromaFn(lightness, hue);

      render(<Controlled hue={hue} initialChroma={maxC} initialLightness={lightness} />);
      const panel = screen.getByTestId('OKLCHPanel');

      // ArrowUp on a near-edge red color: nextL > lightness shrinks the gamut
      // ceiling. Pre-fix code emitted chroma at the old maxC, exceeding the
      // ceiling at the new lightness.
      fireEvent.keyDown(panel, { key: 'ArrowUp' });

      const [l, c] = mockOnChange.mock.calls[0];
      const nextMaxC = maxChromaFn(l, hue);

      expect(c).toBeLessThanOrEqual(nextMaxC + 1e-9);
    });
  });

  describe('Native attribute forwarding', () => {
    it('forwards native HTML attrs to the root', () => {
      render(
        <OKLCHPanel
          chroma={0.1}
          data-foo="bar"
          hue={30}
          id="custom-panel"
          lightness={0.6}
          onChange={mockOnChange}
        />,
      );
      const root = screen.getByTestId('OKLCHPanel');

      expect(root).toHaveAttribute('data-foo', 'bar');
      expect(root).toHaveAttribute('id', 'custom-panel');
    });

    it('merges consumer style and force-sets touchAction', () => {
      render(
        <OKLCHPanel
          chroma={0.1}
          hue={30}
          lightness={0.6}
          onChange={mockOnChange}
          style={{ marginTop: 8, touchAction: 'auto' }}
        />,
      );
      const root = screen.getByTestId('OKLCHPanel');

      expect(root).toHaveStyle({ marginTop: '8px' });
      expect(root).toHaveStyle({ touchAction: 'none' });
    });
  });
});
