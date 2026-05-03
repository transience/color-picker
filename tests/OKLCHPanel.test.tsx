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
