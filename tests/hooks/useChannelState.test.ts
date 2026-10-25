import { act, renderHook } from '@testing-library/react';

import useChannelState from '~/hooks/useChannelState';

describe('useChannelState', () => {
  const derive = vi.fn((color: string, previous?: { count: number; value: string }) => ({
    value: color,
    count: (previous?.count ?? 0) + 1,
  }));

  beforeEach(() => {
    derive.mockClear();
  });

  it('derives the initial channels from the color', () => {
    const { result } = renderHook(() => useChannelState('red', derive));

    expect(result.current[0]).toEqual({ value: 'red', count: 1 });
    expect(derive).toHaveBeenCalledWith('red');
  });

  it('re-derives with the previous channels when the color changes', () => {
    const { rerender, result } = renderHook(({ color }) => useChannelState(color, derive), {
      initialProps: { color: 'red' },
    });

    rerender({ color: 'blue' });

    expect(result.current[0]).toEqual({ value: 'blue', count: 2 });
    expect(derive).toHaveBeenLastCalledWith('blue', { value: 'red', count: 1 });
  });

  it('does not re-derive when the color is unchanged', () => {
    const { rerender } = renderHook(({ color }) => useChannelState(color, derive), {
      initialProps: { color: 'red' },
    });

    rerender({ color: 'red' });

    expect(derive).toHaveBeenCalledTimes(1);
  });

  it('keeps set channels until the color changes', () => {
    const { rerender, result } = renderHook(({ color }) => useChannelState(color, derive), {
      initialProps: { color: 'red' },
    });

    act(() => {
      result.current[1]({ value: 'local', count: 10 });
    });

    rerender({ color: 'red' });

    expect(result.current[0]).toEqual({ value: 'local', count: 10 });

    rerender({ color: 'green' });

    expect(derive).toHaveBeenLastCalledWith('green', { value: 'local', count: 10 });
  });
});
