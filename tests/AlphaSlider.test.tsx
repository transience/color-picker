import { useState } from 'react';

import AlphaSlider from '~/AlphaSlider';
import { fireEvent, firePointerDrag, mockRAFSync, mockRect, render, screen } from '~/test-utils';

const mockOnChange = vi.fn();

function Controlled(props: { initial?: number; isDisabled?: boolean }) {
  const { initial = 0.5, isDisabled } = props;
  const [value, setValue] = useState(initial);

  return (
    <AlphaSlider
      color="#ff0044"
      isDisabled={isDisabled}
      onChange={next => {
        mockOnChange(next);
        setValue(next);
      }}
      value={value}
    />
  );
}

describe('AlphaSlider', () => {
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
      render(<AlphaSlider color="#ff0044" onChange={() => {}} value={0.5} />);
      const track = screen.getByRole('slider', { name: 'Alpha' }).parentElement!;

      expect(track).toMatchSnapshot();
    });

    it('exposes ARIA slider attributes with [0, 1] bounds', () => {
      render(<AlphaSlider color="#ff0044" onChange={() => {}} value={0.35} />);
      const slider = screen.getByRole('slider', { name: 'Alpha' });

      expect(slider).toHaveAttribute('aria-valuemin', '0');
      expect(slider).toHaveAttribute('aria-valuemax', '1');
      expect(slider).toHaveAttribute('aria-valuenow', '0.35');
    });
  });

  describe('Keyboard interaction', () => {
    it('ArrowRight increases value by step (0.01)', () => {
      render(<Controlled initial={0.5} />);

      fireEvent.keyDown(screen.getByRole('slider', { name: 'Alpha' }), { key: 'ArrowRight' });

      expect(mockOnChange).toHaveBeenCalledWith(0.51);
    });

    it('ArrowLeft decreases value by step (0.01)', () => {
      render(<Controlled initial={0.5} />);

      fireEvent.keyDown(screen.getByRole('slider', { name: 'Alpha' }), { key: 'ArrowLeft' });

      expect(mockOnChange).toHaveBeenCalledWith(0.49);
    });

    it('Home jumps to 0', () => {
      render(<Controlled initial={0.5} />);

      fireEvent.keyDown(screen.getByRole('slider', { name: 'Alpha' }), { key: 'Home' });

      expect(mockOnChange).toHaveBeenCalledWith(0);
    });

    it('End jumps to 1', () => {
      render(<Controlled initial={0.5} />);

      fireEvent.keyDown(screen.getByRole('slider', { name: 'Alpha' }), { key: 'End' });

      expect(mockOnChange).toHaveBeenCalledWith(1);
    });

    it('clamps to 1 when ArrowRight near max', () => {
      render(<Controlled initial={0.995} />);

      fireEvent.keyDown(screen.getByRole('slider', { name: 'Alpha' }), { key: 'ArrowRight' });

      expect(mockOnChange).toHaveBeenCalledWith(1);
    });

    it('clamps to 0 when ArrowLeft near min', () => {
      render(<Controlled initial={0.005} />);

      fireEvent.keyDown(screen.getByRole('slider', { name: 'Alpha' }), { key: 'ArrowLeft' });

      expect(mockOnChange).toHaveBeenCalledWith(0);
    });
  });

  describe('Pointer interaction', () => {
    it('pointerDown at midpoint emits 0.5', () => {
      render(<Controlled initial={0} />);
      const track = screen.getByRole('slider').parentElement!;

      mockRect(track, { left: 0, top: 0, width: 200, height: 12 });
      fireEvent.pointerDown(track, { clientX: 100, clientY: 6, pointerId: 1 });

      expect(mockOnChange).toHaveBeenLastCalledWith(0.5);
    });

    it('pointerDown at left edge emits 0', () => {
      render(<Controlled initial={0.5} />);
      const track = screen.getByRole('slider').parentElement!;

      mockRect(track, { left: 0, top: 0, width: 200, height: 12 });
      fireEvent.pointerDown(track, { clientX: 0, clientY: 6, pointerId: 1 });

      expect(mockOnChange).toHaveBeenLastCalledWith(0);
    });

    it('pointerDown at right edge emits 1', () => {
      render(<Controlled initial={0.5} />);
      const track = screen.getByRole('slider').parentElement!;

      mockRect(track, { left: 0, top: 0, width: 200, height: 12 });
      fireEvent.pointerDown(track, { clientX: 200, clientY: 6, pointerId: 1 });

      expect(mockOnChange).toHaveBeenLastCalledWith(1);
    });

    it('drag emits intermediate values', () => {
      render(<Controlled initial={0} />);
      const track = screen.getByRole('slider').parentElement!;

      mockRect(track, { left: 0, top: 0, width: 200, height: 12 });

      firePointerDrag(track, [
        { x: 0, y: 6 },
        { x: 50, y: 6 },
        { x: 150, y: 6 },
      ]);

      const values = mockOnChange.mock.calls.map(call => call[0]);

      expect(values).toContain(0);
      expect(values).toContain(0.25);
      expect(values).toContain(0.75);
    });
  });

  describe('Disabled state', () => {
    it('sets aria-disabled and tabindex -1', () => {
      render(<AlphaSlider color="#ff0044" isDisabled onChange={() => {}} value={0.5} />);
      const slider = screen.getByRole('slider', { name: 'Alpha' });

      expect(slider).toHaveAttribute('aria-disabled', 'true');
      expect(slider).toHaveAttribute('tabindex', '-1');
    });

    it('ignores keyboard input when disabled', () => {
      render(<Controlled initial={0.5} isDisabled />);

      fireEvent.keyDown(screen.getByRole('slider', { name: 'Alpha' }), { key: 'ArrowRight' });

      expect(mockOnChange).not.toHaveBeenCalled();
    });

    it('ignores pointer input when disabled', () => {
      render(<Controlled initial={0.5} isDisabled />);
      const track = screen.getByRole('slider').parentElement!;

      mockRect(track, { left: 0, top: 0, width: 200, height: 12 });
      fireEvent.pointerDown(track, { clientX: 100, clientY: 6, pointerId: 1 });

      expect(mockOnChange).not.toHaveBeenCalled();
    });
  });
});
