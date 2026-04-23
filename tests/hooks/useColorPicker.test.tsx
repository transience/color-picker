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
        showHueBar: false,
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
});
