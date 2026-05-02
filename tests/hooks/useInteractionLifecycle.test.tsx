import { act, renderHook } from '@testing-library/react';

import { KEYBOARD_IDLE_MS } from '~/constants';
import useInteractionLifecycle from '~/hooks/useInteractionLifecycle';

describe('useInteractionLifecycle', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('pointer', () => {
    it('notifyPointerStart fires onStart once', () => {
      const onStart = vi.fn();
      const onEnd = vi.fn();
      const { result } = renderHook(() => useInteractionLifecycle({ onStart, onEnd }));

      act(() => result.current.notifyPointerStart());

      expect(onStart).toHaveBeenCalledTimes(1);
      expect(onEnd).not.toHaveBeenCalled();
    });

    it('notifyPointerEnd fires onEnd once after a pointer session', () => {
      const onStart = vi.fn();
      const onEnd = vi.fn();
      const { result } = renderHook(() => useInteractionLifecycle({ onStart, onEnd }));

      act(() => result.current.notifyPointerStart());
      act(() => result.current.notifyPointerEnd());

      expect(onStart).toHaveBeenCalledTimes(1);
      expect(onEnd).toHaveBeenCalledTimes(1);
    });

    it('repeat notifyPointerStart while active is a no-op', () => {
      const onStart = vi.fn();
      const { result } = renderHook(() => useInteractionLifecycle({ onStart }));

      act(() => result.current.notifyPointerStart());
      act(() => result.current.notifyPointerStart());

      expect(onStart).toHaveBeenCalledTimes(1);
    });

    it('notifyPointerEnd without prior Start is a no-op', () => {
      const onEnd = vi.fn();
      const { result } = renderHook(() => useInteractionLifecycle({ onEnd }));

      act(() => result.current.notifyPointerEnd());

      expect(onEnd).not.toHaveBeenCalled();
    });
  });

  describe('keyboard', () => {
    it('first notifyKeyboardActivity fires onStart', () => {
      const onStart = vi.fn();
      const { result } = renderHook(() => useInteractionLifecycle({ onStart }));

      act(() => result.current.notifyKeyboardActivity());

      expect(onStart).toHaveBeenCalledTimes(1);
    });

    it('subsequent activity within idle window does not re-fire onStart', () => {
      const onStart = vi.fn();
      const { result } = renderHook(() => useInteractionLifecycle({ onStart }));

      act(() => result.current.notifyKeyboardActivity());
      act(() => {
        vi.advanceTimersByTime(KEYBOARD_IDLE_MS - 1);
      });
      act(() => result.current.notifyKeyboardActivity());

      expect(onStart).toHaveBeenCalledTimes(1);
    });

    it('idle expiry fires onEnd at +KEYBOARD_IDLE_MS from last activity', () => {
      const onEnd = vi.fn();
      const { result } = renderHook(() => useInteractionLifecycle({ onEnd }));

      act(() => result.current.notifyKeyboardActivity());

      act(() => {
        vi.advanceTimersByTime(KEYBOARD_IDLE_MS - 1);
      });
      expect(onEnd).not.toHaveBeenCalled();

      act(() => {
        vi.advanceTimersByTime(1);
      });
      expect(onEnd).toHaveBeenCalledTimes(1);
    });

    it('subsequent activity extends the idle deadline', () => {
      const onEnd = vi.fn();
      const { result } = renderHook(() => useInteractionLifecycle({ onEnd }));

      act(() => result.current.notifyKeyboardActivity());
      act(() => {
        vi.advanceTimersByTime(KEYBOARD_IDLE_MS - 50);
      });
      act(() => result.current.notifyKeyboardActivity());
      act(() => {
        vi.advanceTimersByTime(KEYBOARD_IDLE_MS - 1);
      });
      expect(onEnd).not.toHaveBeenCalled();

      act(() => {
        vi.advanceTimersByTime(1);
      });
      expect(onEnd).toHaveBeenCalledTimes(1);
    });
  });

  describe('pointer-during-keyboard transition', () => {
    it('fires keyboard onEnd before pointer onStart', () => {
      const order: string[] = [];
      const onStart = vi.fn(() => order.push('start'));
      const onEnd = vi.fn(() => order.push('end'));
      const { result } = renderHook(() => useInteractionLifecycle({ onStart, onEnd }));

      act(() => result.current.notifyKeyboardActivity());
      act(() => result.current.notifyPointerStart());

      expect(order).toEqual(['start', 'end', 'start']);
      expect(onStart).toHaveBeenCalledTimes(2);
      expect(onEnd).toHaveBeenCalledTimes(1);
    });

    it('cancels the keyboard idle timer when pointer takes over', () => {
      const onEnd = vi.fn();
      const { result } = renderHook(() => useInteractionLifecycle({ onEnd }));

      act(() => result.current.notifyKeyboardActivity());
      act(() => result.current.notifyPointerStart());

      expect(onEnd).toHaveBeenCalledTimes(1);

      act(() => {
        vi.advanceTimersByTime(KEYBOARD_IDLE_MS * 2);
      });

      expect(onEnd).toHaveBeenCalledTimes(1);
    });
  });

  describe('blur', () => {
    it('fires onEnd and clears timer while keyboard active', () => {
      const onEnd = vi.fn();
      const { result } = renderHook(() => useInteractionLifecycle({ onEnd }));

      act(() => result.current.notifyKeyboardActivity());
      act(() => result.current.notifyBlur());

      expect(onEnd).toHaveBeenCalledTimes(1);

      act(() => {
        vi.advanceTimersByTime(KEYBOARD_IDLE_MS * 2);
      });

      expect(onEnd).toHaveBeenCalledTimes(1);
    });

    it('is a no-op when keyboard inactive', () => {
      const onEnd = vi.fn();
      const { result } = renderHook(() => useInteractionLifecycle({ onEnd }));

      act(() => result.current.notifyBlur());

      expect(onEnd).not.toHaveBeenCalled();
    });
  });

  describe('isDisabled', () => {
    it('short-circuits notifyPointerStart', () => {
      const onStart = vi.fn();
      const { result } = renderHook(() => useInteractionLifecycle({ isDisabled: true, onStart }));

      act(() => result.current.notifyPointerStart());

      expect(onStart).not.toHaveBeenCalled();
    });

    it('short-circuits notifyKeyboardActivity', () => {
      const onStart = vi.fn();
      const { result } = renderHook(() => useInteractionLifecycle({ isDisabled: true, onStart }));

      act(() => result.current.notifyKeyboardActivity());

      expect(onStart).not.toHaveBeenCalled();
    });
  });

  describe('cleanup', () => {
    it('clears pending idle timer on unmount', () => {
      const onEnd = vi.fn();
      const { result, unmount } = renderHook(() => useInteractionLifecycle({ onEnd }));

      act(() => result.current.notifyKeyboardActivity());
      unmount();
      act(() => {
        vi.advanceTimersByTime(KEYBOARD_IDLE_MS * 2);
      });

      expect(onEnd).not.toHaveBeenCalled();
    });
  });

  describe('stale callback guard', () => {
    it('uses the latest onStart/onEnd between renders', () => {
      const firstStart = vi.fn();
      const firstEnd = vi.fn();
      const secondStart = vi.fn();
      const secondEnd = vi.fn();

      const { rerender, result } = renderHook(
        (props: { onEnd: () => void; onStart: () => void }) => useInteractionLifecycle(props),
        { initialProps: { onEnd: firstEnd, onStart: firstStart } },
      );

      rerender({ onEnd: secondEnd, onStart: secondStart });

      act(() => result.current.notifyPointerStart());
      act(() => result.current.notifyPointerEnd());

      expect(firstStart).not.toHaveBeenCalled();
      expect(firstEnd).not.toHaveBeenCalled();
      expect(secondStart).toHaveBeenCalledTimes(1);
      expect(secondEnd).toHaveBeenCalledTimes(1);
    });
  });
});
