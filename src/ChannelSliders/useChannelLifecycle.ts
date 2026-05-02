import { type RefObject, useCallback, useRef } from 'react';

interface ChannelLifecycle {
  handleEnd: () => void;
  handleStart: () => void;
  /** Read-only ref to the last value passed to `recordEmit`. Sliders use this
   * to detect their own round-trip and skip re-deriving local state from a
   * `color` prop that came from their own emission. */
  lastEmittedRef: RefObject<string>;
  recordEmit: (value: string) => void;
}

/**
 * Tracks the last emitted OKLCH value across an interaction so `onChangeEnd`
 * can fall back to the incoming `color` when no value was emitted (e.g. a
 * pointerdown with no movement). `handleStart` resets the buffer; `recordEmit`
 * stores each emission; `handleEnd` reads it.
 */
export default function useChannelLifecycle(
  color: string,
  onChangeStart?: (value: string) => void,
  onChangeEnd?: (value: string) => void,
): ChannelLifecycle {
  const lastEmittedRef = useRef<string>('');
  const colorRef = useRef(color);
  const onChangeStartRef = useRef(onChangeStart);
  const onChangeEndRef = useRef(onChangeEnd);

  colorRef.current = color;
  onChangeStartRef.current = onChangeStart;
  onChangeEndRef.current = onChangeEnd;

  const recordEmit = useCallback((value: string) => {
    lastEmittedRef.current = value;
  }, []);

  const handleStart = useCallback(() => {
    lastEmittedRef.current = '';
    onChangeStartRef.current?.(colorRef.current);
  }, []);

  const handleEnd = useCallback(() => {
    onChangeEndRef.current?.(lastEmittedRef.current || colorRef.current);
  }, []);

  return { handleEnd, handleStart, lastEmittedRef, recordEmit };
}
