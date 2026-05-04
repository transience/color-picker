import { act, renderHook } from '@testing-library/react';

import useRafCommit from '~/hooks/useRafCommit';

interface RafQueue {
  flushAll: () => void;
  restore: () => void;
}

/**
 * Manual rAF queue that defers callbacks until `flushAll()`. Honors
 * `cancelAnimationFrame` by id so we can verify cleanup behavior.
 */
function mockRAFQueue(): RafQueue {
  const original = globalThis.requestAnimationFrame;
  const originalCancel = globalThis.cancelAnimationFrame;
  const callbacks = new Map<number, FrameRequestCallback>();
  let nextId = 1;

  globalThis.requestAnimationFrame = (callback: FrameRequestCallback) => {
    const id = nextId++;

    callbacks.set(id, callback);

    return id;
  };

  globalThis.cancelAnimationFrame = (id: number) => {
    callbacks.delete(id);
  };

  return {
    flushAll: () => {
      const pending = [...callbacks.values()];

      callbacks.clear();
      pending.forEach(callback => callback(0));
    },
    restore: () => {
      globalThis.requestAnimationFrame = original;
      globalThis.cancelAnimationFrame = originalCancel;
    },
  };
}

describe('useRafCommit', () => {
  let raf: RafQueue;

  beforeEach(() => {
    raf = mockRAFQueue();
  });

  afterEach(() => {
    raf.restore();
  });

  it('schedule coalesces multiple calls into one commit per frame', () => {
    const commit = vi.fn();
    const { result } = renderHook(() => useRafCommit<number>(commit));

    act(() => {
      result.current.schedule(1);
      result.current.schedule(2);
      result.current.schedule(3);
    });

    expect(commit).not.toHaveBeenCalled();

    act(() => raf.flushAll());

    expect(commit).toHaveBeenCalledTimes(1);
    expect(commit).toHaveBeenCalledWith(3);
  });

  it('flush commits the pending value synchronously when rAF has not fired', () => {
    const commit = vi.fn();
    const { result } = renderHook(() => useRafCommit<number>(commit));

    act(() => result.current.schedule(7));
    act(() => result.current.flush());

    expect(commit).toHaveBeenCalledWith(7);

    // The original rAF entry should be cancelled, so flushing the queue
    // must not produce a second commit.
    act(() => raf.flushAll());
    expect(commit).toHaveBeenCalledTimes(1);
  });

  it('flush is a no-op when nothing is pending', () => {
    const commit = vi.fn();
    const { result } = renderHook(() => useRafCommit<number>(commit));

    act(() => result.current.flush());

    expect(commit).not.toHaveBeenCalled();
  });

  it('flush after an already-flushed rAF does not re-emit', () => {
    const commit = vi.fn();
    const { result } = renderHook(() => useRafCommit<number>(commit));

    act(() => result.current.schedule(5));
    act(() => raf.flushAll());

    expect(commit).toHaveBeenCalledTimes(1);

    act(() => result.current.flush());

    expect(commit).toHaveBeenCalledTimes(1);
  });

  it('schedule after rAF fired commits the new value on next frame', () => {
    const commit = vi.fn();
    const { result } = renderHook(() => useRafCommit<number>(commit));

    act(() => result.current.schedule(1));
    act(() => raf.flushAll());

    expect(commit).toHaveBeenLastCalledWith(1);

    act(() => result.current.schedule(2));
    act(() => raf.flushAll());

    expect(commit).toHaveBeenCalledTimes(2);
    expect(commit).toHaveBeenLastCalledWith(2);
  });

  it('schedule then flush then schedule then flush emits both values in order', () => {
    const commit = vi.fn();
    const { result } = renderHook(() => useRafCommit<number>(commit));

    act(() => result.current.schedule(11));
    act(() => result.current.flush());

    act(() => result.current.schedule(22));
    act(() => result.current.flush());

    expect(commit.mock.calls).toEqual([[11], [22]]);
  });

  it('cancels pending rAF on unmount', () => {
    const commit = vi.fn();
    const { result, unmount } = renderHook(() => useRafCommit<number>(commit));

    act(() => result.current.schedule(9));
    unmount();
    act(() => raf.flushAll());

    expect(commit).not.toHaveBeenCalled();
  });
});
