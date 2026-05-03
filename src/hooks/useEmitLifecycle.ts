import { useCallback, useEffect, useRef } from 'react';

import { KEYBOARD_IDLE_MS } from '~/constants';

interface EmitLifecycle<V> {
  /**
   * Commit a new value. First emit of a session always fires (treats
   * `pointerdown` as a discrete commit even when the click lands on the
   * current value). Subsequent emits are deduped against the last-known value.
   */
  emit: (next: V) => void;
  notifyBlur: () => void;
  notifyEnd: () => void;
  notifyKeyboardActivity: () => void;
  notifyStart: () => void;
}

export interface UseEmitLifecycleOptions<V> {
  /** Equality predicate used to dedup mid-session emits. Defaults to `Object.is`. */
  equals?: (a: V, b: V) => boolean;
  /** Pauses lifecycle callbacks. Caller is responsible for short-circuiting `emit` itself. */
  isDisabled?: boolean;
  /** Called once per change emitted during a session. */
  onChange?: (next: V) => void;
  /**
   * Called once when the session ends. Receives the last value emitted via
   * `emit` during this session, or the current `value` prop if no emit ran.
   */
  onChangeEnd?: (value: V) => void;
  /**
   * Called once when the session starts. Receives the value before any change
   * (the current `value` prop at session-start time).
   */
  onChangeStart?: (value: V) => void;
  /** Current value driven by the consumer. Read at session-start (pre-mutation). */
  value: V;
}

/**
 * Single source of truth for the value a session settles on, plus the
 * pointer/keyboard mux that decides when a session starts and ends.
 *
 * - `onChangeStart` reads the `value` prop at session-start (pre-mutation).
 * - `onChange` fires synchronously inside `emit`, writing `lastEmittedRef`.
 * - `onChangeEnd` reads `lastEmittedRef` (or the current `value` prop if the
 *   session emitted nothing).
 *
 * Pointer takes precedence over keyboard: starting a pointer drag mid-keyboard
 * cancels the keyboard idle timer and fires the keyboard's pending end before
 * the pointer's start.
 *
 * Caller contract:
 * - Call `notifyStart` / `notifyKeyboardActivity` BEFORE mutating
 *   `value`, so a snapshot taken in `onChangeStart` reflects pre-interaction state.
 * - Filter `notifyKeyboardActivity` to value-changing keydowns only —
 *   forwarding non-value keys would still fire Start/End for a no-op session.
 */
export default function useEmitLifecycle<V>({
  equals = Object.is,
  isDisabled,
  onChange,
  onChangeEnd,
  onChangeStart,
  value,
}: UseEmitLifecycleOptions<V>): EmitLifecycle<V> {
  const propRef = useRef(value);
  const lastEmittedRef = useRef<V | null>(null);
  const sessionEmittedRef = useRef(false);
  const sessionActiveRef = useRef(false);

  const keyboardActiveRef = useRef(false);
  const keyboardTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const onChangeRef = useRef(onChange);
  const onChangeStartRef = useRef(onChangeStart);
  const onChangeEndRef = useRef(onChangeEnd);

  propRef.current = value;
  onChangeRef.current = onChange;
  onChangeStartRef.current = onChangeStart;
  onChangeEndRef.current = onChangeEnd;

  const clearKeyboardTimer = () => {
    if (keyboardTimerRef.current !== null) {
      clearTimeout(keyboardTimerRef.current);
      keyboardTimerRef.current = null;
    }
  };

  const fireStart = () => {
    lastEmittedRef.current = null;
    sessionEmittedRef.current = false;
    onChangeStartRef.current?.(propRef.current);
  };

  const fireEnd = () => {
    onChangeEndRef.current?.(lastEmittedRef.current ?? propRef.current);
  };

  useEffect(() => () => clearKeyboardTimer(), []);

  const notifyStart = useCallback(() => {
    if (isDisabled) return;

    if (keyboardActiveRef.current) {
      clearKeyboardTimer();
      keyboardActiveRef.current = false;
      fireEnd();
    }

    if (sessionActiveRef.current) return;
    sessionActiveRef.current = true;
    fireStart();
  }, [isDisabled]);

  const notifyEnd = useCallback(() => {
    if (!sessionActiveRef.current) return;
    sessionActiveRef.current = false;
    fireEnd();
  }, []);

  const notifyKeyboardActivity = useCallback(() => {
    if (isDisabled || sessionActiveRef.current) return;

    clearKeyboardTimer();

    if (!keyboardActiveRef.current) {
      keyboardActiveRef.current = true;
      fireStart();
    }

    keyboardTimerRef.current = setTimeout(() => {
      keyboardTimerRef.current = null;
      keyboardActiveRef.current = false;
      fireEnd();
    }, KEYBOARD_IDLE_MS);
  }, [isDisabled]);

  const notifyBlur = useCallback(() => {
    if (!keyboardActiveRef.current) return;
    clearKeyboardTimer();
    keyboardActiveRef.current = false;
    fireEnd();
  }, []);

  const emit = useCallback(
    (next: V) => {
      const current = lastEmittedRef.current ?? propRef.current;

      if (sessionEmittedRef.current && equals(next, current)) return;
      sessionEmittedRef.current = true;
      lastEmittedRef.current = next;
      onChangeRef.current?.(next);
    },
    [equals],
  );

  return { emit, notifyBlur, notifyKeyboardActivity, notifyEnd, notifyStart };
}
