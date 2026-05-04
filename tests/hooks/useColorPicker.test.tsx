import { act, renderHook } from '@testing-library/react';

import useColorPicker, { defaultProps } from '~/hooks/useColorPicker';

describe('useColorPicker', () => {
  describe('defaultProps', () => {
    it('exports the resolved default configuration', () => {
      expect(defaultProps).toEqual({
        defaultMode: 'oklch',
        displayFormat: 'auto',
        modes: ['oklch', 'hsl', 'rgb'],
        outputFormat: 'auto',
        showAlpha: false,
        showColorInput: true,
        showEyeDropper: true,
        showGlobalHue: false,
        showInputs: true,
        showModeSelector: true,
        showPanel: true,
        showSettings: false,
        showSliders: true,
        showSwatch: true,
      });
    });

    it('drops undefined prop overrides so defaults win', () => {
      const { result } = renderHook(() =>
        useColorPicker({ color: '#ff0044', defaultMode: undefined }),
      );

      expect(result.current.mode).toBe('oklch');
    });
  });

  describe('initial state', () => {
    it('falls back to DEFAULT_COLOR when color is undefined', () => {
      const { result } = renderHook(() => useColorPicker({}));

      expect(result.current.displayValue).toMatch(/^oklch\(/);
      expect(result.current.alpha).toBe(1);
    });

    it('reads alpha from the color prop when showAlpha is true', () => {
      const { result } = renderHook(() =>
        useColorPicker({ color: 'rgb(255 0 68 / 0.4)', showAlpha: true }),
      );

      expect(result.current.alpha).toBeCloseTo(0.4, 5);
    });

    it('ignores alpha on the color prop when showAlpha is false', () => {
      const { result } = renderHook(() =>
        useColorPicker({ color: 'rgb(255 0 68 / 0.4)', showAlpha: false }),
      );

      expect(result.current.alpha).toBe(1);
    });
  });

  describe('ref stability across renders', () => {
    it('keeps all handlers referentially stable across renders', () => {
      const { rerender, result } = renderHook((props: { color: string }) => useColorPicker(props), {
        initialProps: { color: '#ff0044' },
      });

      const first = { ...result.current };

      rerender({ color: '#ff0044' });

      expect(result.current.handleChangeAlpha).toBe(first.handleChangeAlpha);
      expect(result.current.handleChangeColorInput).toBe(first.handleChangeColorInput);
      expect(result.current.handleChangeDisplayFormat).toBe(first.handleChangeDisplayFormat);
      expect(result.current.handleChangeHsvHue).toBe(first.handleChangeHsvHue);
      expect(result.current.handleChangeOklchHue).toBe(first.handleChangeOklchHue);
      expect(result.current.handleChangeOklchPanel).toBe(first.handleChangeOklchPanel);
      expect(result.current.handleChangeOutputFormat).toBe(first.handleChangeOutputFormat);
      expect(result.current.handleChangeSaturationPanel).toBe(first.handleChangeSaturationPanel);
      expect(result.current.handleClickMode).toBe(first.handleClickMode);
      expect(result.current.rootRef).toBe(first.rootRef);
    });
  });

  describe('derived memoization', () => {
    it('keeps derived values referentially stable when state does not change', () => {
      const { rerender, result } = renderHook(() => useColorPicker({ color: '#ff0044' }));

      const first = {
        solidColor: result.current.solidColor,
        displayValue: result.current.displayValue,
      };

      rerender();

      expect(result.current.solidColor).toBe(first.solidColor);
      expect(result.current.displayValue).toBe(first.displayValue);
    });

    it('recomputes derived values when hsv state changes', () => {
      const { result } = renderHook(() => useColorPicker({ color: '#ff0044', defaultMode: 'hsl' }));
      const before = result.current.solidColor;

      act(() => {
        result.current.handleChangeHsvHue(200);
      });

      expect(result.current.solidColor).not.toBe(before);
    });
  });

  describe('color input sync with alpha', () => {
    it('updates alpha when the color input value carries an alpha channel', () => {
      const onChange = vi.fn();
      const { result } = renderHook(() =>
        useColorPicker({ color: '#ff0044', onChange, showAlpha: true }),
      );

      act(() => {
        result.current.handleChangeColorInput('rgb(0 128 255 / 0.25)');
      });

      expect(result.current.alpha).toBeCloseTo(0.25, 5);
      expect(onChange).toHaveBeenCalled();
    });
  });

  describe('onChange output: format × alpha matrix', () => {
    it('emits 8-digit hex when outputFormat=hex and alpha<1', () => {
      const onChange = vi.fn();
      const { result } = renderHook(() =>
        useColorPicker({
          color: 'rgb(255 0 68 / 0.5)',
          onChange,
          outputFormat: 'hex',
          showAlpha: true,
        }),
      );

      act(() => {
        result.current.handleChangeOklchHue(150);
      });

      const emitted = onChange.mock.lastCall?.[0] as string;

      expect(emitted).toMatch(/^#[\da-f]{8}$/);
    });

    it('emits 6-digit hex when outputFormat=hex and showAlpha is false', () => {
      const onChange = vi.fn();
      const { result } = renderHook(() =>
        useColorPicker({
          color: 'rgb(255 0 68 / 0.5)',
          onChange,
          outputFormat: 'hex',
          showAlpha: false,
        }),
      );

      act(() => {
        result.current.handleChangeOklchHue(150);
      });

      const emitted = onChange.mock.lastCall?.[0] as string;

      expect(emitted).toMatch(/^#[\da-f]{6}$/);
    });

    it('emits CSS function with alpha component when outputFormat=rgb and alpha<1', () => {
      const onChange = vi.fn();
      const { result } = renderHook(() =>
        useColorPicker({
          color: 'rgb(255 0 68 / 0.4)',
          onChange,
          outputFormat: 'rgb',
          showAlpha: true,
        }),
      );

      act(() => {
        result.current.handleChangeOklchHue(80);
      });

      const emitted = onChange.mock.lastCall?.[0] as string;

      expect(emitted).toMatch(/^rgb\(/);
      expect(emitted).toMatch(/\//);
    });

    it('emits oklch with alpha component when outputFormat=oklch and alpha<1', () => {
      const onChange = vi.fn();
      const { result } = renderHook(() =>
        useColorPicker({
          color: 'oklch(0.6 0.15 200 / 0.3)',
          onChange,
          outputFormat: 'oklch',
          showAlpha: true,
        }),
      );

      act(() => {
        result.current.handleChangeOklchHue(120);
      });

      const emitted = onChange.mock.lastCall?.[0] as string;

      expect(emitted).toMatch(/^oklch\(/);
      expect(emitted).toMatch(/\//);
    });

    it('omits alpha component when alpha is 1 even with showAlpha=true', () => {
      const onChange = vi.fn();
      const { result } = renderHook(() =>
        useColorPicker({
          color: '#ff0044',
          onChange,
          outputFormat: 'rgb',
          showAlpha: true,
        }),
      );

      act(() => {
        result.current.handleChangeOklchHue(180);
      });

      const emitted = onChange.mock.lastCall?.[0] as string;

      expect(emitted).not.toMatch(/\//);
    });

    it('forwards precision to formatColor for oklch output', () => {
      const onChangeLow = vi.fn();
      const { result: lowResult } = renderHook(() =>
        useColorPicker({
          color: '#ff0044',
          onChange: onChangeLow,
          outputFormat: 'oklch',
          precision: 1,
        }),
      );

      act(() => {
        lowResult.current.handleChangeOklchHue(123);
      });

      const onChangeHigh = vi.fn();
      const { result: highResult } = renderHook(() =>
        useColorPicker({
          color: '#ff0044',
          onChange: onChangeHigh,
          outputFormat: 'oklch',
          precision: 5,
        }),
      );

      act(() => {
        highResult.current.handleChangeOklchHue(123);
      });

      const lowEmitted = onChangeLow.mock.lastCall?.[0] as string;
      const highEmitted = onChangeHigh.mock.lastCall?.[0] as string;

      expect(lowEmitted).not.toBe(highEmitted);
      expect(lowEmitted.length).toBeLessThan(highEmitted.length);
    });

    it('preserves alpha across mode switches and continues emitting it', () => {
      const onChange = vi.fn();
      const { result } = renderHook(() =>
        useColorPicker({
          color: 'rgb(255 0 68 / 0.5)',
          onChange,
          outputFormat: 'auto',
          showAlpha: true,
        }),
      );

      expect(result.current.alpha).toBeCloseTo(0.5, 5);

      act(() => {
        result.current.handleClickMode('hsl');
      });

      expect(result.current.alpha).toBeCloseTo(0.5, 5);

      act(() => {
        result.current.handleChangeHsvHue(120);
      });

      const emitted = onChange.mock.lastCall?.[0] as string;

      expect(emitted).toMatch(/^#[\da-f]{8}$/);
    });
  });

  describe('controlled re-render dedup (lastEmittedRef)', () => {
    it('skips state reset when parent re-passes the same just-emitted value', () => {
      const onChange = vi.fn();
      const { rerender, result } = renderHook(
        (props: { color: string }) => useColorPicker({ ...props, onChange, outputFormat: 'oklch' }),
        { initialProps: { color: '#ff0044' } },
      );

      act(() => {
        result.current.handleChangeOklchHue(150);
      });

      const emitted = onChange.mock.lastCall?.[0] as string;
      const oklchAfterInteraction = result.current.oklch;

      rerender({ color: emitted });

      expect(result.current.oklch).toEqual(oklchAfterInteraction);
    });

    it('resets state when parent passes an unrelated color (not the emitted one)', () => {
      const { rerender, result } = renderHook((props: { color: string }) => useColorPicker(props), {
        initialProps: { color: '#ff0044' },
      });

      const before = result.current.oklch;

      rerender({ color: '#00aaff' });

      expect(result.current.oklch).not.toEqual(before);
    });
  });
});
