import { renderHook } from '@testing-library/react';

import useId from '~/hooks/useId';

describe('useId', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns a string starting with the given prefix', () => {
    const { result } = renderHook(() => useId('gamut'));

    expect(result.current).toMatch(/^gamut-[\dA-Za-z-]+$/);
  });

  it('generates unique ids across calls', () => {
    const ids = new Set(
      Array.from({ length: 20 }, () => renderHook(() => useId('gamut')).result.current),
    );

    expect(ids.size).toBe(20);
  });

  it('uses crypto.randomUUID when available', () => {
    const uuidSpy = vi
      .spyOn(globalThis.crypto, 'randomUUID')
      .mockReturnValue('deadbeef-0000-4000-8000-000000000000');

    const { result } = renderHook(() => useId('id'));

    expect(result.current).toBe('id-deadbeef');
    expect(uuidSpy).toHaveBeenCalled();
  });

  it('falls back to Math.random when crypto.randomUUID is unavailable', () => {
    const original = globalThis.crypto.randomUUID;

    Object.defineProperty(globalThis.crypto, 'randomUUID', {
      configurable: true,
      value: undefined,
    });

    try {
      vi.spyOn(Math, 'random').mockReturnValue(0.5);

      const { result } = renderHook(() => useId('id'));

      expect(result.current).toMatch(/^id-[\da-z]+$/);
    } finally {
      Object.defineProperty(globalThis.crypto, 'randomUUID', {
        configurable: true,
        value: original,
      });
    }
  });
});
