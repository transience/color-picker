import { useState } from 'react';

import {
  act,
  fireEvent,
  firePointerDrag,
  mockRAFSync,
  mockRect,
  render,
  screen,
} from '~/test-utils';

import GradientSlider from '~/components/GradientSlider';

const mockOnChange = vi.fn();

const GRADIENT = 'linear-gradient(to right, red, blue)';

function Controlled(props: {
  initial?: number;
  isDisabled?: boolean;
  maxValue?: number;
  minValue?: number;
  onChangeEnd?: (value: number) => void;
  onChangeStart?: (value: number) => void;
  step?: number;
}) {
  const { initial, isDisabled, maxValue, minValue, onChangeEnd, onChangeStart, step } = props;
  const [value, setValue] = useState(initial ?? 50);

  return (
    <GradientSlider
      aria-label="Test slider"
      gradient={GRADIENT}
      isDisabled={isDisabled}
      maxValue={maxValue}
      minValue={minValue}
      onChange={next => {
        mockOnChange(next);
        setValue(next);
      }}
      onChangeEnd={onChangeEnd}
      onChangeStart={onChangeStart}
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
      render(
        <GradientSlider
          aria-label="Test slider"
          gradient={GRADIENT}
          onChange={mockOnChange}
          value={50}
        />,
      );

      expect(screen.getByTestId('GradientSlider')).toMatchSnapshot();
    });

    it('renders startContent and endContent', () => {
      render(
        <GradientSlider
          aria-label="Test slider"
          endContent={<span data-testid="end">end</span>}
          gradient={GRADIENT}
          onChange={mockOnChange}
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
          onChange={mockOnChange}
          value={120}
        />,
      );
      const slider = screen.getByRole('slider', { name: /hue/i });

      expect(slider).toHaveAttribute('aria-valuenow', '120');
      expect(slider).toHaveAttribute('aria-valuemin', '0');
      expect(slider).toHaveAttribute('aria-valuemax', '360');
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

  describe('Lifecycle callbacks', () => {
    it('pointerDown fires onChangeStart with the value before drag', () => {
      const onChangeStart = vi.fn();

      render(<Controlled initial={50} onChangeStart={onChangeStart} />);
      const track = screen.getByRole('slider').parentElement!;

      mockRect(track, { left: 0, top: 0, width: 200, height: 12 });
      fireEvent.pointerDown(track, { clientX: 100, clientY: 6, pointerId: 1 });

      expect(onChangeStart).toHaveBeenCalledTimes(1);
      expect(onChangeStart).toHaveBeenCalledWith(50);
    });

    it('lostPointerCapture fires onChangeEnd with the final value', () => {
      const onChangeEnd = vi.fn();

      render(<Controlled initial={0} onChangeEnd={onChangeEnd} />);
      const track = screen.getByRole('slider').parentElement!;

      mockRect(track, { left: 0, top: 0, width: 200, height: 12 });

      firePointerDrag(track, [
        { x: 0, y: 6 },
        { x: 200, y: 6 },
      ]);
      fireEvent.lostPointerCapture(track, { pointerId: 1 });

      expect(onChangeEnd).toHaveBeenCalledTimes(1);
      expect(onChangeEnd).toHaveBeenCalledWith(100);
    });

    it('keyboard fires onChangeStart immediately and onChangeEnd after idle', () => {
      vi.useFakeTimers();

      try {
        const onChangeStart = vi.fn();
        const onChangeEnd = vi.fn();

        render(<Controlled initial={50} onChangeEnd={onChangeEnd} onChangeStart={onChangeStart} />);
        const slider = screen.getByRole('slider');

        fireEvent.keyDown(slider, { key: 'ArrowRight' });

        expect(onChangeStart).toHaveBeenCalledTimes(1);
        expect(onChangeStart).toHaveBeenCalledWith(50);
        expect(onChangeEnd).not.toHaveBeenCalled();

        act(() => {
          vi.advanceTimersByTime(200);
        });

        expect(onChangeEnd).toHaveBeenCalledTimes(1);
        expect(onChangeEnd).toHaveBeenCalledWith(51);
      } finally {
        vi.useRealTimers();
      }
    });

    it('multiple keydowns within idle window coalesce to a single Start/End pair', () => {
      vi.useFakeTimers();

      try {
        const onChangeStart = vi.fn();
        const onChangeEnd = vi.fn();

        render(<Controlled initial={50} onChangeEnd={onChangeEnd} onChangeStart={onChangeStart} />);
        const slider = screen.getByRole('slider');

        fireEvent.keyDown(slider, { key: 'ArrowRight' });
        act(() => {
          vi.advanceTimersByTime(50);
        });
        fireEvent.keyDown(slider, { key: 'ArrowRight' });
        act(() => {
          vi.advanceTimersByTime(50);
        });
        fireEvent.keyDown(slider, { key: 'ArrowRight' });
        act(() => {
          vi.advanceTimersByTime(199);
        });

        expect(onChangeStart).toHaveBeenCalledTimes(1);
        expect(onChangeEnd).not.toHaveBeenCalled();

        act(() => {
          vi.advanceTimersByTime(1);
        });

        expect(onChangeEnd).toHaveBeenCalledTimes(1);
        expect(onChangeEnd).toHaveBeenCalledWith(53);
      } finally {
        vi.useRealTimers();
      }
    });

    it('blur fires onChangeEnd immediately on an active keyboard interaction', () => {
      vi.useFakeTimers();

      try {
        const onChangeStart = vi.fn();
        const onChangeEnd = vi.fn();

        render(<Controlled initial={50} onChangeEnd={onChangeEnd} onChangeStart={onChangeStart} />);
        const slider = screen.getByRole('slider');

        fireEvent.keyDown(slider, { key: 'ArrowRight' });

        expect(onChangeStart).toHaveBeenCalledTimes(1);
        expect(onChangeEnd).not.toHaveBeenCalled();

        fireEvent.blur(slider);

        expect(onChangeEnd).toHaveBeenCalledTimes(1);
        expect(onChangeEnd).toHaveBeenCalledWith(51);

        // Idle timer that was pending must not double-fire End.
        act(() => {
          vi.advanceTimersByTime(200);
        });
        expect(onChangeEnd).toHaveBeenCalledTimes(1);
      } finally {
        vi.useRealTimers();
      }
    });

    it('pointer interrupting an active keyboard session ends keyboard before starting pointer', () => {
      vi.useFakeTimers();

      try {
        const onChangeStart = vi.fn();
        const onChangeEnd = vi.fn();

        render(<Controlled initial={50} onChangeEnd={onChangeEnd} onChangeStart={onChangeStart} />);
        const track = screen.getByRole('slider').parentElement!;
        const slider = screen.getByRole('slider');

        mockRect(track, { left: 0, top: 0, width: 200, height: 12 });

        fireEvent.keyDown(slider, { key: 'ArrowRight' });

        expect(onChangeStart).toHaveBeenCalledTimes(1);
        expect(onChangeStart).toHaveBeenLastCalledWith(50);
        expect(onChangeEnd).not.toHaveBeenCalled();

        // Pointer takes precedence — closes the keyboard session, then starts
        // pointer. Both Start/End fire with the post-keyboard value (51); the
        // pointer's `handleMove` (which clamps to 0) runs after `onStart`.
        fireEvent.pointerDown(track, { clientX: 0, clientY: 6, pointerId: 1 });

        expect(onChangeEnd).toHaveBeenCalledTimes(1);
        expect(onChangeEnd).toHaveBeenLastCalledWith(51);
        expect(onChangeStart).toHaveBeenCalledTimes(2);
        expect(onChangeStart).toHaveBeenLastCalledWith(51);

        // Pending keyboard idle timer was cancelled — no extra End.
        act(() => {
          vi.advanceTimersByTime(300);
        });
        expect(onChangeEnd).toHaveBeenCalledTimes(1);
      } finally {
        vi.useRealTimers();
      }
    });

    it('does not fire Start/End when disabled', () => {
      vi.useFakeTimers();

      try {
        const onChangeStart = vi.fn();
        const onChangeEnd = vi.fn();

        render(
          <Controlled
            initial={50}
            isDisabled
            onChangeEnd={onChangeEnd}
            onChangeStart={onChangeStart}
          />,
        );
        const track = screen.getByRole('slider').parentElement!;
        const slider = screen.getByRole('slider');

        mockRect(track, { left: 0, top: 0, width: 200, height: 12 });
        fireEvent.pointerDown(track, { clientX: 100, clientY: 6, pointerId: 1 });
        fireEvent.keyDown(slider, { key: 'ArrowRight' });
        act(() => {
          vi.advanceTimersByTime(300);
        });

        expect(onChangeStart).not.toHaveBeenCalled();
        expect(onChangeEnd).not.toHaveBeenCalled();
      } finally {
        vi.useRealTimers();
      }
    });
  });

  describe('Disabled state', () => {
    it('sets aria-disabled on track and thumb', () => {
      render(
        <GradientSlider
          aria-label="Test"
          gradient={GRADIENT}
          isDisabled
          onChange={mockOnChange}
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
          onChange={mockOnChange}
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
