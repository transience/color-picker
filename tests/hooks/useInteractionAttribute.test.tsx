import { fireEvent, render, screen } from 'tests/__setup__/test-utils';

import { KEYBOARD_IDLE_MS } from '../../src/constants';
import useInteractionAttribute from '../../src/hooks/useInteractionAttribute';

function Harness() {
  const ref = useInteractionAttribute();

  return (
    <div ref={ref} data-testid="root">
      {/* eslint-disable-next-line jsx-a11y/role-has-required-aria-props,jsx-a11y/control-has-associated-label */}
      <div data-testid="slider" role="slider" tabIndex={0} />
      <input data-testid="input" />
      {/* eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex */}
      <span data-testid="non-interactive" tabIndex={0}>
        text
      </span>
    </div>
  );
}

describe('useInteractionAttribute', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('starts without data-interacting attribute', () => {
    render(<Harness />);

    expect(screen.getByTestId('root')).not.toHaveAttribute('data-interacting');
  });

  describe('pointer', () => {
    it('sets attribute on pointerdown', () => {
      render(<Harness />);
      const root = screen.getByTestId('root');
      const slider = screen.getByTestId('slider');

      fireEvent.pointerDown(slider);

      expect(root).toHaveAttribute('data-interacting', 'true');
    });

    it('clears attribute on pointerup', () => {
      render(<Harness />);
      const root = screen.getByTestId('root');
      const slider = screen.getByTestId('slider');

      fireEvent.pointerDown(slider);
      fireEvent.pointerUp(slider);

      expect(root).not.toHaveAttribute('data-interacting');
    });

    it('clears attribute on pointercancel', () => {
      render(<Harness />);
      const root = screen.getByTestId('root');
      const slider = screen.getByTestId('slider');

      fireEvent.pointerDown(slider);
      fireEvent.pointerCancel(slider);

      expect(root).not.toHaveAttribute('data-interacting');
    });
  });

  describe('keyboard', () => {
    it('sets on keydown on interactive target', () => {
      render(<Harness />);
      const root = screen.getByTestId('root');
      const slider = screen.getByTestId('slider');

      fireEvent.keyDown(slider, { key: 'ArrowRight' });

      expect(root).toHaveAttribute('data-interacting', 'true');
    });

    it('sets on keydown on input element', () => {
      render(<Harness />);
      const root = screen.getByTestId('root');
      const input = screen.getByTestId('input');

      fireEvent.keyDown(input, { key: 'a' });

      expect(root).toHaveAttribute('data-interacting', 'true');
    });

    it('ignores keydown on non-interactive targets', () => {
      render(<Harness />);
      const root = screen.getByTestId('root');
      const span = screen.getByTestId('non-interactive');

      fireEvent.keyDown(span, { key: 'ArrowRight' });

      expect(root).not.toHaveAttribute('data-interacting');
    });

    it('holds flag during keyup and clears after idle window', () => {
      render(<Harness />);
      const root = screen.getByTestId('root');
      const slider = screen.getByTestId('slider');

      fireEvent.keyDown(slider, { key: 'ArrowRight' });
      fireEvent.keyUp(slider, { key: 'ArrowRight' });

      expect(root).toHaveAttribute('data-interacting', 'true');

      vi.advanceTimersByTime(KEYBOARD_IDLE_MS - 1);
      expect(root).toHaveAttribute('data-interacting', 'true');

      vi.advanceTimersByTime(1);
      expect(root).not.toHaveAttribute('data-interacting');
    });

    it('resets idle timer on repeated keydown', () => {
      render(<Harness />);
      const root = screen.getByTestId('root');
      const slider = screen.getByTestId('slider');

      fireEvent.keyDown(slider, { key: 'ArrowRight' });
      fireEvent.keyUp(slider, { key: 'ArrowRight' });

      vi.advanceTimersByTime(KEYBOARD_IDLE_MS - 50);

      fireEvent.keyDown(slider, { key: 'ArrowRight' });
      fireEvent.keyUp(slider, { key: 'ArrowRight' });

      vi.advanceTimersByTime(KEYBOARD_IDLE_MS - 50);

      expect(root).toHaveAttribute('data-interacting', 'true');

      vi.advanceTimersByTime(50);
      expect(root).not.toHaveAttribute('data-interacting');
    });
  });

  describe('pointer-keyboard priority', () => {
    it('pointerdown clears pending keyboard idle timer', () => {
      render(<Harness />);
      const root = screen.getByTestId('root');
      const slider = screen.getByTestId('slider');

      fireEvent.keyDown(slider, { key: 'ArrowRight' });
      fireEvent.keyUp(slider, { key: 'ArrowRight' });

      fireEvent.pointerDown(slider);
      // Advance past keyboard idle — attribute must remain true because pointer is active
      vi.advanceTimersByTime(500);

      expect(root).toHaveAttribute('data-interacting', 'true');
    });

    it('keydown during active pointer does not interfere', () => {
      render(<Harness />);
      const root = screen.getByTestId('root');
      const slider = screen.getByTestId('slider');

      fireEvent.pointerDown(slider);
      fireEvent.keyDown(slider, { key: 'ArrowRight' });
      fireEvent.keyUp(slider, { key: 'ArrowRight' });

      // Pointer still down — must stay true
      vi.advanceTimersByTime(500);
      expect(root).toHaveAttribute('data-interacting', 'true');

      fireEvent.pointerUp(slider);
      expect(root).not.toHaveAttribute('data-interacting');
    });
  });

  describe('focusout', () => {
    it('clears attribute when focus leaves the root', () => {
      render(
        <>
          <Harness />
          <button data-testid="outside" type="button">
            outside
          </button>
        </>,
      );
      const root = screen.getByTestId('root');
      const slider = screen.getByTestId('slider');
      const outside = screen.getByTestId('outside');

      fireEvent.keyDown(slider, { key: 'ArrowRight' });
      fireEvent.focusOut(slider, { relatedTarget: outside });

      expect(root).not.toHaveAttribute('data-interacting');
    });

    it('does not clear when focus moves within the root', () => {
      render(<Harness />);
      const root = screen.getByTestId('root');
      const slider = screen.getByTestId('slider');
      const input = screen.getByTestId('input');

      fireEvent.keyDown(slider, { key: 'ArrowRight' });
      fireEvent.focusOut(slider, { relatedTarget: input });

      expect(root).toHaveAttribute('data-interacting', 'true');
    });

    it('does not clear while pointer is active', () => {
      render(
        <>
          <Harness />
          <button data-testid="outside" type="button">
            outside
          </button>
        </>,
      );
      const root = screen.getByTestId('root');
      const slider = screen.getByTestId('slider');
      const outside = screen.getByTestId('outside');

      fireEvent.pointerDown(slider);
      fireEvent.focusOut(slider, { relatedTarget: outside });

      expect(root).toHaveAttribute('data-interacting', 'true');
    });
  });

  describe('cleanup', () => {
    it('removes listeners and clears flag on unmount', () => {
      const { unmount } = render(<Harness />);
      const root = screen.getByTestId('root');
      const slider = screen.getByTestId('slider');

      fireEvent.keyDown(slider, { key: 'ArrowRight' });
      expect(root).toHaveAttribute('data-interacting', 'true');

      unmount();
      // After unmount, element is detached; cleanup should have cleared attribute
      // and removed timers. Advancing time should not throw or schedule callbacks.
      vi.advanceTimersByTime(1000);
    });
  });
});
