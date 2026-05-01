import SaturationPanel from '~/SaturationPanel';
import { fireEvent, firePointerDrag, mockRAFSync, mockRect, render, screen } from '~/test-utils';

const mockOnChange = vi.fn();

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

    it('lostPointerCapture fires onChangeEnd', () => {
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
