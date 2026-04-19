/* eslint-disable testing-library/no-container */
import { getP3MaxChroma } from 'colorizr';

import { oklchHueToHsvHue } from '~/modules/colorSpace';
import { pointerToLC } from '~/modules/oklchCanvas';
import OKLCHPanel from '~/OKLCHPanel';
import { fireEvent, render } from '~/test-utils';

import {
  firePointerDrag,
  mockCanvasContext,
  mockRAFSync,
  mockRect,
} from './__setup__/test-helpers';

const mockOnChange = vi.fn();
const maxChromaFn = (l: number, h: number) => getP3MaxChroma({ l, c: 0, h });

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
      const { container } = render(
        <OKLCHPanel chroma={0.1} hue={30} lightness={0.6} onChange={mockOnChange} />,
      );

      expect(container).toMatchSnapshot();
    });

    it('renders a canvas element', () => {
      const { container } = render(
        <OKLCHPanel chroma={0.1} hue={30} lightness={0.6} onChange={mockOnChange} />,
      );

      expect(container.querySelector('canvas')).toBeInTheDocument();
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

    it('renders an SVG boundary path starting with a moveto command', () => {
      const { container } = render(
        <OKLCHPanel chroma={0.1} hue={30} lightness={0.6} onChange={mockOnChange} />,
      );
      const path = container.querySelector('svg path');

      expect(path).not.toBeNull();
      expect(path!.getAttribute('d')).toMatch(/^M/);
    });

    it('positions thumb based on lightness and chroma', () => {
      const { container } = render(
        <OKLCHPanel chroma={0.1} hue={30} lightness={0.6} onChange={mockOnChange} />,
      );
      const thumb = container.querySelector('[class*="border-white"]') as HTMLElement;

      expect(thumb.style.left).toMatch(/%$/);
      expect(thumb.style.top).toMatch(/%$/);
    });

    it('sets touch-action: none on the panel', () => {
      const { container } = render(
        <OKLCHPanel chroma={0.1} hue={30} lightness={0.6} onChange={mockOnChange} />,
      );
      const panel = container.querySelector('.cursor-crosshair') as HTMLElement;

      expect(panel.style.touchAction).toBe('none');
    });
  });

  describe('Pointer interaction', () => {
    it('pointerDown emits (l, c) matching pointerToLC at the clicked position', () => {
      const hue = 30;
      const { container } = render(
        <OKLCHPanel chroma={0.1} hue={hue} lightness={0.6} onChange={mockOnChange} />,
      );
      const panel = container.querySelector('.cursor-crosshair') as HTMLElement;

      mockRect(panel, { left: 0, top: 0, width: 256, height: 128 });
      fireEvent.pointerDown(panel, { clientX: 128, clientY: 64, pointerId: 1 });

      const { c: expectedC, l: expectedL } = pointerToLC(
        oklchHueToHsvHue(hue),
        hue,
        0.5,
        0.5,
        maxChromaFn,
      );
      const [l, c] = mockOnChange.mock.calls[0];

      expect(l).toBeCloseTo(expectedL, 5);
      expect(c).toBeCloseTo(Math.max(0, expectedC), 5);
    });

    it('pointerDown at bottom emits lightness near 0', () => {
      const { container } = render(
        <OKLCHPanel chroma={0.1} hue={30} lightness={0.6} onChange={mockOnChange} />,
      );
      const panel = container.querySelector('.cursor-crosshair') as HTMLElement;

      mockRect(panel, { left: 0, top: 0, width: 256, height: 128 });
      fireEvent.pointerDown(panel, { clientX: 128, clientY: 128, pointerId: 1 });

      const [l] = mockOnChange.mock.calls[0];

      expect(l).toBeCloseTo(0, 5);
    });

    it('pointerDown at left emits zero chroma', () => {
      const { container } = render(
        <OKLCHPanel chroma={0.1} hue={30} lightness={0.6} onChange={mockOnChange} />,
      );
      const panel = container.querySelector('.cursor-crosshair') as HTMLElement;

      mockRect(panel, { left: 0, top: 0, width: 256, height: 128 });
      fireEvent.pointerDown(panel, { clientX: 0, clientY: 64, pointerId: 1 });

      const [, c] = mockOnChange.mock.calls[0];

      expect(c).toBeCloseTo(0, 5);
    });

    it('emits multiple values during pointerMove drag', () => {
      const { container } = render(
        <OKLCHPanel chroma={0.1} hue={30} lightness={0.6} onChange={mockOnChange} />,
      );
      const panel = container.querySelector('.cursor-crosshair') as HTMLElement;

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
      const { container } = render(
        <OKLCHPanel chroma={0.1} hue={hue} lightness={0.6} onChange={mockOnChange} />,
      );
      const panel = container.querySelector('.cursor-crosshair') as HTMLElement;

      mockRect(panel, { left: 0, top: 0, width: 256, height: 128 });
      fireEvent.pointerDown(panel, { clientX: 500, clientY: -100, pointerId: 1 });

      const [l, c] = mockOnChange.mock.calls[0];

      expect(l).toBeGreaterThanOrEqual(0);
      expect(l).toBeLessThanOrEqual(1);
      expect(c).toBeGreaterThanOrEqual(0);
      expect(c).toBeLessThanOrEqual(maxChromaFn(l, hue));
    });
  });
});
