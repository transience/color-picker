/* eslint-disable testing-library/no-container */
import SaturationPanel from '~/SaturationPanel';
import { fireEvent, firePointerDrag, mockRAFSync, mockRect, render } from '~/test-utils';

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
      const { container } = render(
        <SaturationPanel hue={240} onChange={mockOnChange} saturation={0.5} value={0.5} />,
      );

      expect(container).toMatchSnapshot();
    });

    it('reflects hue in backgroundColor', () => {
      // jsdom normalizes hsl() to rgb(); verify different hues produce different rgb values.
      const { container: containerRed } = render(
        <SaturationPanel hue={0} onChange={mockOnChange} saturation={0.5} value={0.5} />,
      );
      const { container: containerGreen } = render(
        <SaturationPanel hue={120} onChange={mockOnChange} saturation={0.5} value={0.5} />,
      );
      const red = containerRed.querySelector('.cursor-crosshair') as HTMLElement;
      const green = containerGreen.querySelector('.cursor-crosshair') as HTMLElement;

      expect(red.style.backgroundColor).toBe('rgb(255, 0, 0)');
      expect(green.style.backgroundColor).toBe('rgb(0, 255, 0)');
    });

    it('positions thumb based on saturation and value', () => {
      const { container } = render(
        <SaturationPanel hue={0} onChange={mockOnChange} saturation={0.25} value={0.75} />,
      );
      const thumb = container.querySelector('.pointer-events-none') as HTMLElement;

      expect(thumb.style.left).toBe('25%');
      // value 0.75 → top = (1 - 0.75) * 100 = 25%
      expect(thumb.style.top).toBe('25%');
    });

    it('places thumb at top-left when s=0, v=1', () => {
      const { container } = render(
        <SaturationPanel hue={0} onChange={mockOnChange} saturation={0} value={1} />,
      );
      const thumb = container.querySelector('.pointer-events-none') as HTMLElement;

      expect(thumb.style.left).toBe('0%');
      expect(thumb.style.top).toBe('0%');
    });

    it('places thumb at bottom-right when s=1, v=0', () => {
      const { container } = render(
        <SaturationPanel hue={0} onChange={mockOnChange} saturation={1} value={0} />,
      );
      const thumb = container.querySelector('.pointer-events-none') as HTMLElement;

      expect(thumb.style.left).toBe('100%');
      expect(thumb.style.top).toBe('100%');
    });

    it('sets touch-action: none to prevent scroll', () => {
      const { container } = render(
        <SaturationPanel hue={0} onChange={mockOnChange} saturation={0.5} value={0.5} />,
      );
      const panel = container.querySelector('.cursor-crosshair') as HTMLElement;

      expect(panel.style.touchAction).toBe('none');
    });
  });

  describe('Pointer interaction', () => {
    it('pointerDown at top-left emits (0, 1)', () => {
      const { container } = render(
        <SaturationPanel hue={0} onChange={mockOnChange} saturation={0.5} value={0.5} />,
      );
      const panel = container.querySelector('.cursor-crosshair') as HTMLElement;

      mockRect(panel, { left: 0, top: 0, width: 200, height: 100 });
      fireEvent.pointerDown(panel, { clientX: 0, clientY: 0, pointerId: 1 });

      expect(mockOnChange).toHaveBeenCalledWith(0, 1);
    });

    it('pointerDown at bottom-right emits (1, 0)', () => {
      const { container } = render(
        <SaturationPanel hue={0} onChange={mockOnChange} saturation={0.5} value={0.5} />,
      );
      const panel = container.querySelector('.cursor-crosshair') as HTMLElement;

      mockRect(panel, { left: 0, top: 0, width: 200, height: 100 });
      fireEvent.pointerDown(panel, { clientX: 200, clientY: 100, pointerId: 1 });

      expect(mockOnChange).toHaveBeenCalledWith(1, 0);
    });

    it('pointerDown at center emits (0.5, 0.5)', () => {
      const { container } = render(
        <SaturationPanel hue={0} onChange={mockOnChange} saturation={0} value={0} />,
      );
      const panel = container.querySelector('.cursor-crosshair') as HTMLElement;

      mockRect(panel, { left: 0, top: 0, width: 200, height: 100 });
      fireEvent.pointerDown(panel, { clientX: 100, clientY: 50, pointerId: 1 });

      expect(mockOnChange).toHaveBeenCalledWith(0.5, 0.5);
    });

    it('clamps out-of-bounds pointer to the panel edges', () => {
      const { container } = render(
        <SaturationPanel hue={0} onChange={mockOnChange} saturation={0.5} value={0.5} />,
      );
      const panel = container.querySelector('.cursor-crosshair') as HTMLElement;

      mockRect(panel, { left: 0, top: 0, width: 200, height: 100 });
      fireEvent.pointerDown(panel, { clientX: -100, clientY: 500, pointerId: 1 });

      expect(mockOnChange).toHaveBeenCalledWith(0, 0);
    });

    it('emits on pointerMove during active drag', () => {
      const { container } = render(
        <SaturationPanel hue={0} onChange={mockOnChange} saturation={0} value={0} />,
      );
      const panel = container.querySelector('.cursor-crosshair') as HTMLElement;

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
});
