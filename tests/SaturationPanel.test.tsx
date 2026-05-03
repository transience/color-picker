import { useState } from 'react';

import SaturationPanel from '~/SaturationPanel';
import { fireEvent, firePointerDrag, mockRAFSync, mockRect, render, screen } from '~/test-utils';

const mockOnChange = vi.fn();

function Controlled(props: {
  initialSaturation?: number;
  initialValue?: number;
  onChangeEnd?: (s: number, v: number) => void;
  onChangeStart?: (s: number, v: number) => void;
}) {
  const { initialSaturation = 0.5, initialValue = 0.5, onChangeEnd, onChangeStart } = props;
  const [saturation, setSaturation] = useState(initialSaturation);
  const [value, setValue] = useState(initialValue);

  return (
    <SaturationPanel
      hue={0}
      onChange={(s, v) => {
        mockOnChange(s, v);
        setSaturation(s);
        setValue(v);
      }}
      onChangeEnd={onChangeEnd}
      onChangeStart={onChangeStart}
      saturation={saturation}
      value={value}
    />
  );
}

describe('SaturationPanel', () => {
  let restoreRAF: () => void;

  beforeEach(() => {
    vi.clearAllMocks();
    restoreRAF = mockRAFSync();
  });

  afterEach(() => {
    restoreRAF();
  });

  describe('Render', () => {
    it('renders correctly', () => {
      render(<SaturationPanel />);

      expect(screen.getByTestId('SaturationPanel')).toMatchSnapshot();
    });
  });

  describe('Pointer interaction', () => {
    it('pointerDown at top-left emits (0, 1)', () => {
      render(<SaturationPanel hue={0} onChange={mockOnChange} saturation={0.5} value={0.5} />);
      const panel = screen.getByTestId('SaturationPanel');

      mockRect(panel, { left: 0, top: 0, width: 200, height: 100 });
      fireEvent.pointerDown(panel, { clientX: 0, clientY: 0, pointerId: 1 });

      expect(mockOnChange).toHaveBeenCalledWith(0, 1);
    });

    it('pointerDown at bottom-right emits (1, 0)', () => {
      render(<SaturationPanel hue={0} onChange={mockOnChange} saturation={0.5} value={0.5} />);
      const panel = screen.getByTestId('SaturationPanel');

      mockRect(panel, { left: 0, top: 0, width: 200, height: 100 });
      fireEvent.pointerDown(panel, { clientX: 200, clientY: 100, pointerId: 1 });

      expect(mockOnChange).toHaveBeenCalledWith(1, 0);
    });

    it('pointerDown at center emits (0.5, 0.5)', () => {
      render(<SaturationPanel hue={0} onChange={mockOnChange} saturation={0} value={0} />);
      const panel = screen.getByTestId('SaturationPanel');

      mockRect(panel, { left: 0, top: 0, width: 200, height: 100 });
      fireEvent.pointerDown(panel, { clientX: 100, clientY: 50, pointerId: 1 });

      expect(mockOnChange).toHaveBeenCalledWith(0.5, 0.5);
    });

    it('clamps out-of-bounds pointer to the panel edges', () => {
      render(<SaturationPanel hue={0} onChange={mockOnChange} saturation={0.5} value={0.5} />);
      const panel = screen.getByTestId('SaturationPanel');

      mockRect(panel, { left: 0, top: 0, width: 200, height: 100 });
      fireEvent.pointerDown(panel, { clientX: -100, clientY: 500, pointerId: 1 });

      expect(mockOnChange).toHaveBeenCalledWith(0, 0);
    });

    it('emits on pointerMove during active drag', () => {
      render(<SaturationPanel hue={0} onChange={mockOnChange} saturation={0} value={0} />);
      const panel = screen.getByTestId('SaturationPanel');

      mockRect(panel, { left: 0, top: 0, width: 200, height: 100 });

      firePointerDrag(panel, [
        { x: 0, y: 100 },
        { x: 100, y: 50 },
        { x: 200, y: 0 },
      ]);

      const { calls } = mockOnChange.mock;

      expect(calls).toContainEqual([0, 0]);
      expect(calls).toContainEqual([0.5, 0.5]);
      expect(calls).toContainEqual([1, 1]);
    });
  });

  describe('Lifecycle callbacks', () => {
    it('pointerDown fires onChangeStart with the values before drag', () => {
      const onChangeStart = vi.fn();

      render(
        <SaturationPanel
          hue={0}
          onChange={mockOnChange}
          onChangeStart={onChangeStart}
          saturation={0.3}
          value={0.7}
        />,
      );
      const panel = screen.getByTestId('SaturationPanel');

      mockRect(panel, { left: 0, top: 0, width: 200, height: 100 });
      fireEvent.pointerDown(panel, { clientX: 50, clientY: 50, pointerId: 1 });

      expect(onChangeStart).toHaveBeenCalledTimes(1);
      expect(onChangeStart).toHaveBeenCalledWith(0.3, 0.7);
    });

    it('lostPointerCapture fires onChangeEnd with the final dragged position', () => {
      const onChangeEnd = vi.fn();

      render(
        <SaturationPanel
          hue={0}
          onChange={mockOnChange}
          onChangeEnd={onChangeEnd}
          saturation={0.5}
          value={0.5}
        />,
      );
      const panel = screen.getByTestId('SaturationPanel');

      mockRect(panel, { left: 0, top: 0, width: 200, height: 100 });
      firePointerDrag(panel, [
        { x: 50, y: 50 },
        { x: 150, y: 80 },
      ]);
      fireEvent.lostPointerCapture(panel, { pointerId: 1 });

      expect(onChangeEnd).toHaveBeenCalledTimes(1);
      expect(onChangeEnd).toHaveBeenCalledWith(150 / 200, 1 - 80 / 100);
    });

    it('onChangeEnd receives the click position when pointerDown is followed by immediate release', () => {
      const onChangeEnd = vi.fn();

      render(
        <SaturationPanel
          hue={0}
          onChange={mockOnChange}
          onChangeEnd={onChangeEnd}
          saturation={0.5}
          value={0.5}
        />,
      );
      const panel = screen.getByTestId('SaturationPanel');

      mockRect(panel, { left: 0, top: 0, width: 200, height: 100 });
      fireEvent.pointerDown(panel, { clientX: 40, clientY: 90, pointerId: 1 });
      fireEvent.lostPointerCapture(panel, { pointerId: 1 });

      expect(onChangeEnd).toHaveBeenCalledTimes(1);
      expect(onChangeEnd).toHaveBeenCalledWith(40 / 200, 1 - 90 / 100);
    });
  });

  describe('Controlled flow', () => {
    it('drag fires Start with pre-mutation values, Change per move, End with last value', () => {
      const onChangeStart = vi.fn();
      const onChangeEnd = vi.fn();

      render(
        <Controlled
          initialSaturation={0.3}
          initialValue={0.7}
          onChangeEnd={onChangeEnd}
          onChangeStart={onChangeStart}
        />,
      );
      const panel = screen.getByTestId('SaturationPanel');

      mockRect(panel, { left: 0, top: 0, width: 200, height: 100 });
      firePointerDrag(panel, [
        { x: 50, y: 50 },
        { x: 150, y: 80 },
      ]);
      fireEvent.lostPointerCapture(panel, { pointerId: 1 });

      expect(onChangeStart).toHaveBeenCalledWith(0.3, 0.7);
      expect(onChangeEnd).toHaveBeenCalledWith(150 / 200, 1 - 80 / 100);
      expect(mockOnChange).toHaveBeenCalled();
    });

    it('click on current thumb position fires Start + Change + End with same value', () => {
      const onChangeStart = vi.fn();
      const onChangeEnd = vi.fn();

      render(
        <Controlled
          initialSaturation={0.5}
          initialValue={0.5}
          onChangeEnd={onChangeEnd}
          onChangeStart={onChangeStart}
        />,
      );
      const panel = screen.getByTestId('SaturationPanel');

      mockRect(panel, { left: 0, top: 0, width: 200, height: 100 });
      // x=100/200=0.5, y=50/100=0.5 → (0.5, 0.5) = current
      fireEvent.pointerDown(panel, { clientX: 100, clientY: 50, pointerId: 1 });
      fireEvent.lostPointerCapture(panel, { pointerId: 1 });

      expect(onChangeStart).toHaveBeenCalledWith(0.5, 0.5);
      expect(mockOnChange).toHaveBeenCalledWith(0.5, 0.5);
      expect(onChangeEnd).toHaveBeenCalledWith(0.5, 0.5);
    });
  });

  describe('Native attribute forwarding', () => {
    it('forwards native HTML attrs to the root', () => {
      render(
        <SaturationPanel
          data-foo="bar"
          hue={0}
          id="custom-sat"
          onChange={mockOnChange}
          saturation={0.5}
          value={0.5}
        />,
      );
      const root = screen.getByTestId('SaturationPanel');

      expect(root).toHaveAttribute('data-foo', 'bar');
      expect(root).toHaveAttribute('id', 'custom-sat');
    });

    it('merges consumer style and force-sets touchAction', () => {
      render(
        <SaturationPanel
          hue={0}
          onChange={mockOnChange}
          saturation={0.5}
          style={{ marginTop: 8, touchAction: 'auto' }}
          value={0.5}
        />,
      );
      const root = screen.getByTestId('SaturationPanel');

      expect(root).toHaveStyle({ marginTop: '8px' });
      expect(root).toHaveStyle({ touchAction: 'none' });
    });
  });
});
