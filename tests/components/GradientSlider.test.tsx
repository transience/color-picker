import { useState } from 'react';

import { fireEvent, firePointerDrag, mockRAFSync, mockRect, render, screen } from '~/test-utils';

import GradientSlider from '~/components/GradientSlider';

const mockOnChange = vi.fn();

const GRADIENT = 'linear-gradient(to right, red, blue)';

function Controlled(props: {
  initial?: number;
  isDisabled?: boolean;
  maxValue?: number;
  minValue?: number;
  step?: number;
}) {
  const { initial, isDisabled, maxValue, minValue, step } = props;
  const [value, setValue] = useState(initial ?? 50);

  return (
    <GradientSlider
      aria-label="Test slider"
      gradient={GRADIENT}
      isDisabled={isDisabled}
      maxValue={maxValue}
      minValue={minValue}
      onValueChange={next => {
        mockOnChange(next);
        setValue(next);
      }}
      step={step}
      value={value}
    />
  );
}

describe('GradientSlider', () => {
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
        <GradientSlider
          aria-label="Test slider"
          gradient={GRADIENT}
          onValueChange={mockOnChange}
          value={50}
        />,
      );

      expect(container).toMatchSnapshot();
    });

    it('renders startContent and endContent', () => {
      render(
        <GradientSlider
          aria-label="Test slider"
          endContent={<span data-testid="end">end</span>}
          gradient={GRADIENT}
          onValueChange={mockOnChange}
          startContent={<span data-testid="start">start</span>}
          value={50}
        />,
      );

      expect(screen.getByTestId('start')).toBeInTheDocument();
      expect(screen.getByTestId('end')).toBeInTheDocument();
    });

    it('exposes ARIA attributes', () => {
      render(
        <GradientSlider
          aria-label="Hue"
          gradient={GRADIENT}
          maxValue={360}
          minValue={0}
          onValueChange={mockOnChange}
          value={120}
        />,
      );
      const slider = screen.getByRole('slider', { name: /hue/i });

      expect(slider).toHaveAttribute('aria-valuenow', '120');
      expect(slider).toHaveAttribute('aria-valuemin', '0');
      expect(slider).toHaveAttribute('aria-valuemax', '360');
    });

    it('applies per-part classNames', () => {
      render(
        <GradientSlider
          aria-label="Test"
          classNames={{ root: 'slot-root', track: 'slot-track', thumb: 'slot-thumb' }}
          gradient={GRADIENT}
          onValueChange={mockOnChange}
          value={50}
        />,
      );

      const thumb = screen.getByRole('slider');
      const track = thumb.parentElement!;
      const root = track.parentElement!;

      expect(root.className).toMatch(/slot-root/);
      expect(track.className).toMatch(/slot-track/);
      expect(thumb.className).toMatch(/slot-thumb/);
    });

    it('positions thumb at percentage-based left', () => {
      render(
        <GradientSlider
          aria-label="Test slider"
          gradient={GRADIENT}
          maxValue={100}
          minValue={0}
          onValueChange={mockOnChange}
          value={25}
        />,
      );
      const slider = screen.getByRole('slider');

      expect(slider.style.left).toBe('calc(25% - 5px)');
    });
  });

  describe('Pointer interaction', () => {
    it('pointerDown at left edge emits minValue', () => {
      render(<Controlled initial={50} maxValue={100} minValue={0} />);
      const track = screen.getByRole('slider').parentElement!;

      mockRect(track, { left: 0, top: 0, width: 200, height: 12 });
      fireEvent.pointerDown(track, { clientX: 0, clientY: 6, pointerId: 1 });

      expect(mockOnChange).toHaveBeenLastCalledWith(0);
    });

    it('pointerDown at right edge emits maxValue', () => {
      render(<Controlled initial={50} maxValue={100} minValue={0} />);
      const track = screen.getByRole('slider').parentElement!;

      mockRect(track, { left: 0, top: 0, width: 200, height: 12 });
      fireEvent.pointerDown(track, { clientX: 200, clientY: 6, pointerId: 1 });

      expect(mockOnChange).toHaveBeenLastCalledWith(100);
    });

    it('pointerDown at midpoint emits 50', () => {
      render(<Controlled initial={0} maxValue={100} minValue={0} />);
      const track = screen.getByRole('slider').parentElement!;

      mockRect(track, { left: 0, top: 0, width: 200, height: 12 });
      fireEvent.pointerDown(track, { clientX: 100, clientY: 6, pointerId: 1 });

      expect(mockOnChange).toHaveBeenLastCalledWith(50);
    });

    it('pointerMove during drag emits intermediate values', () => {
      render(<Controlled initial={0} maxValue={100} minValue={0} />);
      const track = screen.getByRole('slider').parentElement!;

      mockRect(track, { left: 0, top: 0, width: 200, height: 12 });

      firePointerDrag(track, [
        { x: 0, y: 6 },
        { x: 50, y: 6 },
        { x: 150, y: 6 },
      ]);

      const values = mockOnChange.mock.calls.map(arguments_ => arguments_[0]);

      expect(values).toContain(0);
      expect(values).toContain(25);
      expect(values).toContain(75);
    });

    it('clamps to minValue when pointer goes beyond left edge', () => {
      render(<Controlled initial={50} maxValue={100} minValue={0} />);
      const track = screen.getByRole('slider').parentElement!;

      mockRect(track, { left: 0, top: 0, width: 200, height: 12 });
      fireEvent.pointerDown(track, { clientX: -100, clientY: 6, pointerId: 1 });

      expect(mockOnChange).toHaveBeenLastCalledWith(0);
    });

    it('clamps to maxValue when pointer goes beyond right edge', () => {
      render(<Controlled initial={50} maxValue={100} minValue={0} />);
      const track = screen.getByRole('slider').parentElement!;

      mockRect(track, { left: 0, top: 0, width: 200, height: 12 });
      fireEvent.pointerDown(track, { clientX: 1000, clientY: 6, pointerId: 1 });

      expect(mockOnChange).toHaveBeenLastCalledWith(100);
    });

    it('quantizes values to step', () => {
      render(<Controlled initial={0} maxValue={100} minValue={0} step={10} />);
      const track = screen.getByRole('slider').parentElement!;

      mockRect(track, { left: 0, top: 0, width: 200, height: 12 });
      fireEvent.pointerDown(track, { clientX: 47, clientY: 6, pointerId: 1 });

      // 47/200 = 23.5 → quantize to step 10 → 20
      expect(mockOnChange).toHaveBeenLastCalledWith(20);
    });
  });

  describe('Keyboard interaction', () => {
    it('ArrowRight adds step', () => {
      render(<Controlled initial={50} step={1} />);
      const slider = screen.getByRole('slider');

      fireEvent.keyDown(slider, { key: 'ArrowRight' });

      expect(mockOnChange).toHaveBeenCalledWith(51);
    });

    it('ArrowUp adds step', () => {
      render(<Controlled initial={50} step={1} />);
      const slider = screen.getByRole('slider');

      fireEvent.keyDown(slider, { key: 'ArrowUp' });

      expect(mockOnChange).toHaveBeenCalledWith(51);
    });

    it('ArrowLeft subtracts step', () => {
      render(<Controlled initial={50} step={1} />);
      const slider = screen.getByRole('slider');

      fireEvent.keyDown(slider, { key: 'ArrowLeft' });

      expect(mockOnChange).toHaveBeenCalledWith(49);
    });

    it('ArrowDown subtracts step', () => {
      render(<Controlled initial={50} step={1} />);
      const slider = screen.getByRole('slider');

      fireEvent.keyDown(slider, { key: 'ArrowDown' });

      expect(mockOnChange).toHaveBeenCalledWith(49);
    });

    it('Shift+ArrowRight multiplies step by 10', () => {
      render(<Controlled initial={50} step={1} />);
      const slider = screen.getByRole('slider');

      fireEvent.keyDown(slider, { key: 'ArrowRight', shiftKey: true });

      expect(mockOnChange).toHaveBeenCalledWith(60);
    });

    it('PageUp adds step*10', () => {
      render(<Controlled initial={50} step={1} />);
      const slider = screen.getByRole('slider');

      fireEvent.keyDown(slider, { key: 'PageUp' });

      expect(mockOnChange).toHaveBeenCalledWith(60);
    });

    it('PageDown subtracts step*10', () => {
      render(<Controlled initial={50} step={1} />);
      const slider = screen.getByRole('slider');

      fireEvent.keyDown(slider, { key: 'PageDown' });

      expect(mockOnChange).toHaveBeenCalledWith(40);
    });

    it('Home jumps to minValue', () => {
      render(<Controlled initial={50} maxValue={100} minValue={10} />);
      const slider = screen.getByRole('slider');

      fireEvent.keyDown(slider, { key: 'Home' });

      expect(mockOnChange).toHaveBeenCalledWith(10);
    });

    it('End jumps to maxValue', () => {
      render(<Controlled initial={50} maxValue={90} minValue={0} />);
      const slider = screen.getByRole('slider');

      fireEvent.keyDown(slider, { key: 'End' });

      expect(mockOnChange).toHaveBeenCalledWith(90);
    });

    it('clamps keyboard increments to maxValue', () => {
      render(<Controlled initial={99} maxValue={100} minValue={0} step={5} />);
      const slider = screen.getByRole('slider');

      fireEvent.keyDown(slider, { key: 'ArrowRight' });

      expect(mockOnChange).toHaveBeenCalledWith(100);
    });

    it('clamps keyboard decrements to minValue', () => {
      render(<Controlled initial={1} maxValue={100} minValue={0} step={5} />);
      const slider = screen.getByRole('slider');

      fireEvent.keyDown(slider, { key: 'ArrowLeft' });

      expect(mockOnChange).toHaveBeenCalledWith(0);
    });

    it('ignores unknown keys', () => {
      render(<Controlled initial={50} />);
      const slider = screen.getByRole('slider');

      fireEvent.keyDown(slider, { key: 'a' });

      expect(mockOnChange).not.toHaveBeenCalled();
    });

    it('quantizes keyboard values with fractional step', () => {
      render(<Controlled initial={0.5} maxValue={1} minValue={0} step={0.001} />);
      const slider = screen.getByRole('slider');

      fireEvent.keyDown(slider, { key: 'ArrowRight' });

      expect(mockOnChange).toHaveBeenCalledWith(0.501);
    });
  });

  describe('Disabled state', () => {
    it('sets aria-disabled on track and thumb', () => {
      render(
        <GradientSlider
          aria-label="Test"
          gradient={GRADIENT}
          isDisabled
          onValueChange={mockOnChange}
          value={50}
        />,
      );
      const slider = screen.getByRole('slider');

      expect(slider).toHaveAttribute('aria-disabled', 'true');
    });

    it('sets tabIndex -1 when disabled', () => {
      render(
        <GradientSlider
          aria-label="Test"
          gradient={GRADIENT}
          isDisabled
          onValueChange={mockOnChange}
          value={50}
        />,
      );
      const slider = screen.getByRole('slider');

      expect(slider).toHaveAttribute('tabindex', '-1');
    });

    it('ignores pointerDown when disabled', () => {
      render(<Controlled initial={50} isDisabled />);
      const track = screen.getByRole('slider').parentElement!;

      mockRect(track, { left: 0, top: 0, width: 200, height: 12 });
      fireEvent.pointerDown(track, { clientX: 100, clientY: 6, pointerId: 1 });

      expect(mockOnChange).not.toHaveBeenCalled();
    });

    it('ignores keydown when disabled', () => {
      render(<Controlled initial={50} isDisabled />);
      const slider = screen.getByRole('slider');

      fireEvent.keyDown(slider, { key: 'ArrowRight' });

      expect(mockOnChange).not.toHaveBeenCalled();
    });
  });
});
