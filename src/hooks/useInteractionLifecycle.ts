import { useCallback, useEffect, useRef } from 'react';

import { KEYBOARD_IDLE_MS } from '~/constants';

interface InteractionLifecycle {
  notifyBlur: () => void;
  notifyKeyboardActivity: () => void;
  notifyPointerEnd: () => void;
  notifyPointerStart: () => void;
}

interface UseInteractionLifecycleOptions {
  isDisabled?: boolean;
  onEnd?: () => void;
  onStart?: () => void;
}

/**
 * Tracks pointer + keyboard interaction lifecycle, calling `onStart` once when
 * an interaction begins and `onEnd` once when it ends.
 *
 * Pointer: starts on `notifyPointerStart`, ends on `notifyPointerEnd`.
 * Keyboard: starts on first `notifyKeyboardActivity`, ends after
 * `KEYBOARD_IDLE_MS` (200 ms) idle or on `notifyBlur`. Pointer takes
 * precedence — starting a pointer drag cancels a pending keyboard end-timer
 * and fires `onEnd` for the keyboard session before the pointer's `onStart`.
 *
 * Caller contract:
 * - Call `notifyPointerStart` / `notifyKeyboardActivity` BEFORE mutating the
 *   value, so a snapshot taken in `onStart` reflects the pre-interaction
 *   state.
 * - Filter `notifyKeyboardActivity` to value-changing keydowns only —
 *   forwarding non-value keys would still emit Start/End for a no-op session.
 */
export default function useInteractionLifecycle({
  isDisabled,
  onEnd,
  onStart,
}: UseInteractionLifecycleOptions): InteractionLifecycle {
  const pointerActiveRef = useRef(false);
  const keyboardActiveRef = useRef(false);
  const keyboardTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onStartRef = useRef(onStart);
  const onEndRef = useRef(onEnd);

  onStartRef.current = onStart;
  onEndRef.current = onEnd;

  const clearKeyboardTimer = () => {
    if (keyboardTimerRef.current !== null) {
      clearTimeout(keyboardTimerRef.current);
      keyboardTimerRef.current = null;
    }
  };

  useEffect(() => () => clearKeyboardTimer(), []);

  const notifyPointerStart = useCallback(() => {
    if (isDisabled) return;

    if (keyboardActiveRef.current) {
      clearKeyboardTimer();
      keyboardActiveRef.current = false;
      onEndRef.current?.();
    }

    if (pointerActiveRef.current) return;
    pointerActiveRef.current = true;
    onStartRef.current?.();
  }, [isDisabled]);

  const notifyPointerEnd = useCallback(() => {
    if (!pointerActiveRef.current) return;
    pointerActiveRef.current = false;
    onEndRef.current?.();
  }, []);

  const notifyKeyboardActivity = useCallback(() => {
    if (isDisabled || pointerActiveRef.current) return;

    clearKeyboardTimer();

    if (!keyboardActiveRef.current) {
      keyboardActiveRef.current = true;
      onStartRef.current?.();
    }

    keyboardTimerRef.current = setTimeout(() => {
      keyboardTimerRef.current = null;
      keyboardActiveRef.current = false;
      onEndRef.current?.();
    }, KEYBOARD_IDLE_MS);
  }, [isDisabled]);

  const notifyBlur = useCallback(() => {
    if (!keyboardActiveRef.current) return;
    clearKeyboardTimer();
    keyboardActiveRef.current = false;
    onEndRef.current?.();
  }, []);

  return {
    notifyBlur,
    notifyKeyboardActivity,
    notifyPointerEnd,
    notifyPointerStart,
  };
}
