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
      render(<OKLCHPanel chroma={0.1} hue={30} lightness={0.6} onChange={mockOnChange} />);

      expect(screen.getByTestId('OKLCHPanel')).toMatchSnapshot();
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

    it('lostPointerCapture fires onChangeEnd', () => {
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

      expect(onChangeEnd).toHaveBeenCalledTimes(1);
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
