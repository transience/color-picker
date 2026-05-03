import { act, renderHook } from '@testing-library/react';

import { KEYBOARD_IDLE_MS } from '~/constants';
import useEmitLifecycle, { type UseEmitLifecycleOptions } from '~/hooks/useEmitLifecycle';

function setup<V>(initial: UseEmitLifecycleOptions<V>) {
  return renderHook((props: UseEmitLifecycleOptions<V>) => useEmitLifecycle(props), {
    initialProps: initial,
  });
}

describe('useEmitLifecycle', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('pointer session', () => {
    it('Start fires with the value before any change', () => {
      const onChangeStart = vi.fn();
      const { result } = setup({ onChangeStart, value: 10 });

      act(() => result.current.notifyStart());

      expect(onChangeStart).toHaveBeenCalledWith(10);
    });

    it('first emit always fires, even when next equals current value', () => {
      const onChange = vi.fn();
      const { result } = setup({ onChange, value: 10 });

      act(() => result.current.notifyStart());
      act(() => result.current.emit(10));

      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onChange).toHaveBeenCalledWith(10);
    });

    it('subsequent emits dedup against the last-emitted value', () => {
      const onChange = vi.fn();
      const { result } = setup({ onChange, value: 10 });

      act(() => result.current.notifyStart());
      act(() => result.current.emit(20));
      act(() => result.current.emit(20));
      act(() => result.current.emit(20));

      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onChange).toHaveBeenCalledWith(20);
    });

    it('emits a new value after a duplicate, then dedups again', () => {
      const onChange = vi.fn();
      const { result } = setup({ onChange, value: 10 });

      act(() => result.current.notifyStart());
      act(() => result.current.emit(20));
      act(() => result.current.emit(20));
      act(() => result.current.emit(30));
      act(() => result.current.emit(30));

      expect(onChange.mock.calls).toEqual([[20], [30]]);
    });

    it('End fires with the last emitted value', () => {
      const onChangeEnd = vi.fn();
      const { result } = setup({ onChangeEnd, value: 10 });

      act(() => result.current.notifyStart());
      act(() => result.current.emit(20));
      act(() => result.current.emit(30));
      act(() => result.current.notifyEnd());

      expect(onChangeEnd).toHaveBeenCalledWith(30);
    });

    it('End falls back to current prop when no emit ran in the session', () => {
      const onChangeEnd = vi.fn();
      const { result } = setup({ onChangeEnd, value: 10 });

      act(() => result.current.notifyStart());
      act(() => result.current.notifyEnd());

      expect(onChangeEnd).toHaveBeenCalledWith(10);
    });

    it('click on current position fires Start + Change + End', () => {
      const onChangeStart = vi.fn();
      const onChange = vi.fn();
      const onChangeEnd = vi.fn();
      const { result } = setup({ onChange, onChangeEnd, onChangeStart, value: 50 });

      act(() => result.current.notifyStart());
      act(() => result.current.emit(50));
      act(() => result.current.notifyEnd());

      expect(onChangeStart).toHaveBeenCalledWith(50);
      expect(onChange).toHaveBeenCalledWith(50);
      expect(onChangeEnd).toHaveBeenCalledWith(50);
    });

    it('next session resets the first-emit guard', () => {
      const onChange = vi.fn();
      const { rerender, result } = setup({ onChange, value: 10 });

      act(() => result.current.notifyStart());
      act(() => result.current.emit(20));
      act(() => result.current.notifyEnd());

      rerender({ onChange, value: 20 });

      act(() => result.current.notifyStart());
      act(() => result.current.emit(20));
      act(() => result.current.notifyEnd());

      expect(onChange.mock.calls).toEqual([[20], [20]]);
    });
  });

  describe('keyboard session', () => {
    it('first activity fires Start with the pre-mutation value', () => {
      const onChangeStart = vi.fn();
      const { result } = setup({ onChangeStart, value: 50 });

      act(() => result.current.notifyKeyboardActivity());

      expect(onChangeStart).toHaveBeenCalledWith(50);
    });

    it('emit during keyboard session dedups like pointer session', () => {
      const onChange = vi.fn();
      const { result } = setup({ onChange, value: 50 });

      act(() => result.current.notifyKeyboardActivity());
      act(() => result.current.emit(51));
      act(() => result.current.emit(51));
      act(() => result.current.emit(52));

      expect(onChange.mock.calls).toEqual([[51], [52]]);
    });

    it('idle expiry fires End with last-emitted value', () => {
      const onChangeEnd = vi.fn();
      const { result } = setup({ onChangeEnd, value: 50 });

      act(() => result.current.notifyKeyboardActivity());
      act(() => result.current.emit(51));
      act(() => {
        vi.advanceTimersByTime(KEYBOARD_IDLE_MS);
      });

      expect(onChangeEnd).toHaveBeenCalledWith(51);
    });

    it('blur during active keyboard fires End immediately', () => {
      const onChangeEnd = vi.fn();
      const { result } = setup({ onChangeEnd, value: 50 });

      act(() => result.current.notifyKeyboardActivity());
      act(() => result.current.emit(53));
      act(() => result.current.notifyBlur());

      expect(onChangeEnd).toHaveBeenCalledWith(53);
    });

    it('blur without prior activity is a no-op', () => {
      const onChangeStart = vi.fn();
      const onChangeEnd = vi.fn();
      const { result } = setup({ onChangeEnd, onChangeStart, value: 50 });

      act(() => result.current.notifyBlur());

      expect(onChangeStart).not.toHaveBeenCalled();
      expect(onChangeEnd).not.toHaveBeenCalled();
    });
  });

  describe('value sync', () => {
    it('Start reads the latest prop value across rerenders', () => {
      const onChangeStart = vi.fn();
      const { rerender, result } = setup({ onChangeStart, value: 10 });

      rerender({ onChangeStart, value: 42 });

      act(() => result.current.notifyStart());

      expect(onChangeStart).toHaveBeenCalledWith(42);
    });

    it('End falls back to the latest prop value when no emit ran', () => {
      const onChangeEnd = vi.fn();
      const { rerender, result } = setup({ onChangeEnd, value: 10 });

      act(() => result.current.notifyStart());
      rerender({ onChangeEnd, value: 99 });
      act(() => result.current.notifyEnd());

      expect(onChangeEnd).toHaveBeenCalledWith(99);
    });
  });

  describe('equals customization', () => {
    it('uses the provided equals predicate for object values', () => {
      const onChange = vi.fn();
      const equals = (a: { x: number }, b: { x: number }) => a.x === b.x;
      const { result } = setup({ equals, onChange, value: { x: 0 } });

      act(() => result.current.notifyStart());
      act(() => result.current.emit({ x: 1 }));
      act(() => result.current.emit({ x: 1 })); // different ref, same `x` → dedup
      act(() => result.current.emit({ x: 2 }));

      expect(onChange.mock.calls).toEqual([[{ x: 1 }], [{ x: 2 }]]);
    });
  });

  describe('isDisabled', () => {
    it('blocks Start (pointer + keyboard) but emit still records', () => {
      const onChange = vi.fn();
      const onChangeStart = vi.fn();
      const onChangeEnd = vi.fn();
      const { result } = setup({
        isDisabled: true,
        onChange,
        onChangeEnd,
        onChangeStart,
        value: 10,
      });

      act(() => result.current.notifyStart());
      act(() => result.current.notifyKeyboardActivity());
      act(() => result.current.emit(20));
      act(() => result.current.notifyEnd());

      // Lifecycle gate keeps Start/End silent.
      expect(onChangeStart).not.toHaveBeenCalled();
      expect(onChangeEnd).not.toHaveBeenCalled();
      // emit is not gated by isDisabled directly — caller short-circuits at
      // the event handler when disabled.
      expect(onChange).toHaveBeenCalledWith(20);
    });
  });

  describe('pointer-during-keyboard transition', () => {
    it('fires keyboard End before pointer Start', () => {
      const order: string[] = [];
      const onChangeStart = vi.fn(() => order.push('start'));
      const onChangeEnd = vi.fn(() => order.push('end'));
      const { result } = setup({ onChangeEnd, onChangeStart, value: 10 });

      act(() => result.current.notifyKeyboardActivity());
      act(() => result.current.notifyStart());

      expect(order).toEqual(['start', 'end', 'start']);
      expect(onChangeStart).toHaveBeenCalledTimes(2);
      expect(onChangeEnd).toHaveBeenCalledTimes(1);
    });

    it('cancels the keyboard idle timer when pointer takes over', () => {
      const onChangeEnd = vi.fn();
      const { result } = setup({ onChangeEnd, value: 10 });

      act(() => result.current.notifyKeyboardActivity());
      act(() => result.current.notifyStart());

      expect(onChangeEnd).toHaveBeenCalledTimes(1);

      act(() => {
        vi.advanceTimersByTime(KEYBOARD_IDLE_MS * 2);
      });

      expect(onChangeEnd).toHaveBeenCalledTimes(1);
    });
  });

  describe('cleanup', () => {
    it('clears pending idle timer on unmount', () => {
      const onChangeEnd = vi.fn();
      const { result, unmount } = setup({ onChangeEnd, value: 10 });

      act(() => result.current.notifyKeyboardActivity());
      unmount();
      act(() => {
        vi.advanceTimersByTime(KEYBOARD_IDLE_MS * 2);
      });

      expect(onChangeEnd).not.toHaveBeenCalled();
    });
  });
});
