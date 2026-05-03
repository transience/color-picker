import { useCallback, useEffect, useRef } from 'react';

interface RafCommit<V> {
  /**
   * Synchronously commit any value queued by `schedule` and cancel the
   * pending frame. Use from `lostPointerCapture` so the final pointer value
   * isn't lost if release fires before the rAF callback runs.
   */
  flush: () => void;
  /**
   * Buffer `next` and schedule a single `requestAnimationFrame` to call
   * `commit` with it. Repeat calls coalesce — only the most recent value
   * is committed once per frame.
   */
  schedule: (next: V) => void;
}

/**
 * Per-frame coalescer for high-frequency value emissions. Owns the rAF id and
 * the in-flight value buffer. Pairs with `useEmitLifecycle` in pointer-driven
 * surfaces (`GradientSlider`, `SaturationPanel`, `OKLCHPanel`) to keep
 * `onChange` rate-bounded during drag while preserving zero-data-loss on
 * release via `flush`.
 */
export default function useRafCommit<V>(commit: (value: V) => void): RafCommit<V> {
  const rafRef = useRef(0);
  const pendingRef = useRef<V | null>(null);

  const schedule = useCallback(
    (next: V) => {
      pendingRef.current = next;
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        const value = pendingRef.current;

        pendingRef.current = null;
        if (value !== null) commit(value);
      });
    },
    [commit],
  );

  const flush = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    const value = pendingRef.current;

    pendingRef.current = null;
    if (value !== null) commit(value);
  }, [commit]);

  useEffect(() => () => cancelAnimationFrame(rafRef.current), []);

  return { flush, schedule };
}
