import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { convertCSS, formatCSS, opacity, parseCSS } from 'colorizr';

import { DEFAULT_COLOR, DEFAULT_MODES } from '~/constants';
import { colorToHsv, hsvToHex, isOklchInSRGB } from '~/modules/colorSpace';
import {
  formatColor,
  isNarrowFormat,
  resolveDisplayFormat,
  resolveOutputFormat,
} from '~/modules/format';
import { mergeProps } from '~/modules/helpers';

import type { ColorFormat, ColorMode, ColorPickerProps, HSV } from '~/types';

import useInteractionAttribute from './useInteractionAttribute';

interface OKLCHState {
  c: number;
  h: number;
  l: number;
}

export const defaultProps = {
  defaultMode: 'oklch',
  displayFormat: 'auto',
  modes: DEFAULT_MODES,
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
} satisfies Partial<ColorPickerProps>;

export default function useColorPicker(props: ColorPickerProps) {
  // `merged` is a new object every render because React hands the component a
  // fresh `props` ref per render. Wrapping in useMemo with [props] would invalidate
  // every render — fake stability. Derived memos below depend on primitives extracted
  // from `merged`, which React compares by value, so those memos are real.
  const merged = mergeProps(defaultProps, props);
  const {
    color,
    defaultMode,
    displayFormat: displayFormatProp,
    onChange,
    onChangeMode,
    outputFormat: outputFormatProp,
    precision,
    showAlpha,
  } = merged;

  const initialColor = color ?? DEFAULT_COLOR;

  const [alpha, setAlpha] = useState<number>(() => (showAlpha ? opacity(initialColor) : 1));
  const [displayFormat, setDisplayFormat] = useState<ColorFormat>(displayFormatProp);
  const [hsv, setHsv] = useState<HSV>(() => colorToHsv(initialColor));
  const [mode, setMode] = useState<ColorMode>(defaultMode);
  const [oklch, setOklch] = useState<OKLCHState>(() => parseCSS(initialColor, 'oklch'));
  const [outputFormat, setOutputFormat] = useState<ColorFormat>(outputFormatProp);
  const interactionRef = useInteractionAttribute();
  const containerRef = useRef<HTMLDivElement | null>(null);

  const lastEmittedRef = useRef(initialColor);

  const alphaRef = useRef(alpha);
  const displayFormatRef = useRef(displayFormat);
  const hsvRef = useRef(hsv);
  const modeRef = useRef(mode);
  const oklchRef = useRef(oklch);
  const onChangeRef = useRef(onChange);
  const onChangeModeRef = useRef(onChangeMode);
  const outputFormatRef = useRef(outputFormat);
  const precisionRef = useRef(precision);
  const showAlphaRef = useRef(showAlpha);

  alphaRef.current = alpha;
  displayFormatRef.current = displayFormat;
  hsvRef.current = hsv;
  modeRef.current = mode;
  oklchRef.current = oklch;
  onChangeRef.current = onChange;
  onChangeModeRef.current = onChangeMode;
  outputFormatRef.current = outputFormat;
  precisionRef.current = precision;
  showAlphaRef.current = showAlpha;

  const rootRef = useCallback(
    (node: HTMLDivElement | null) => {
      containerRef.current = node;
      interactionRef(node);
    },
    [interactionRef],
  );

  useEffect(() => {
    if (color !== undefined && color !== lastEmittedRef.current) {
      setHsv(colorToHsv(color));
      setOklch(parseCSS(color, 'oklch'));

      if (showAlphaRef.current) {
        setAlpha(opacity(color));
      }
    }
  }, [color]);

  const emit = useCallback((oklchValue: string) => {
    const resolved = resolveOutputFormat(
      outputFormatRef.current,
      displayFormatRef.current,
      modeRef.current,
    );
    const alphaForOutput =
      showAlphaRef.current && alphaRef.current < 1 ? alphaRef.current : undefined;
    const final = formatColor(oklchValue, resolved, alphaForOutput, precisionRef.current);

    lastEmittedRef.current = final;
    onChangeRef.current?.(final);

    return final;
  }, []);

  const handleChangeAlpha = useCallback(
    (next: number) => {
      setAlpha(next);
      alphaRef.current = next;

      const base =
        modeRef.current === 'oklch'
          ? formatCSS(oklchRef.current, 'oklch')
          : convertCSS(hsvToHex(hsvRef.current), 'oklch');

      emit(base);
    },
    [emit],
  );

  const handleChangeColorInput = useCallback(
    (value: string) => {
      const oklchValue = convertCSS(value, 'oklch');

      setHsv(colorToHsv(value));
      setOklch(parseCSS(value, 'oklch'));

      if (showAlphaRef.current) {
        const nextAlpha = opacity(value);

        setAlpha(nextAlpha);
        alphaRef.current = nextAlpha;
      }

      emit(oklchValue);
    },
    [emit],
  );

  const handleChangeDisplayFormat = useCallback((format: ColorFormat) => {
    setDisplayFormat(format);
    displayFormatRef.current = format;
  }, []);

  const handleChangeHsvHue = useCallback(
    (h: number) => {
      const next = { ...hsvRef.current, h };

      setHsv(next);
      emit(convertCSS(hsvToHex(next), 'oklch'));
    },
    [emit],
  );

  const handleChangeOklchHue = useCallback(
    (h: number) => {
      const next = { ...oklchRef.current, h };

      setOklch(next);
      emit(formatCSS(next, 'oklch'));
    },
    [emit],
  );

  const handleChangeOklchPanel = useCallback(
    (l: number, c: number) => {
      const next = { ...oklchRef.current, c, l };

      setOklch(next);
      emit(formatCSS(next, 'oklch'));
    },
    [emit],
  );

  const handleChangeOutputFormat = useCallback((format: ColorFormat) => {
    setOutputFormat(format);
    outputFormatRef.current = format;
  }, []);

  const handleChangeSaturationPanel = useCallback(
    (s: number, v: number) => {
      const next = { h: hsvRef.current.h, s, v };

      setHsv(next);
      emit(convertCSS(hsvToHex(next), 'oklch'));
    },
    [emit],
  );

  const handleClickMode = useCallback((value: ColorMode) => {
    if (value === modeRef.current) return;

    setMode(value);
    modeRef.current = value;
    onChangeModeRef.current?.(value);
  }, []);

  // Primitive derivations: un-memoized. Comparison / ternary cost is below the
  // useMemo call + dep-array overhead. React compares primitives by value in
  // downstream dep arrays, so stability is preserved.
  const isOklch = mode === 'oklch';
  const currentHue = isOklch ? oklch.h : hsv.h;
  const resolvedDisplayFormat = resolveDisplayFormat(displayFormat, mode);
  const alphaForDisplay = showAlpha && alpha < 1 ? alpha : undefined;

  // Colorizr-backed derivations: memoized — color-space conversions and gamut
  // math are worth skipping when inputs are unchanged.
  const solidColor = useMemo(
    () => (isOklch ? formatCSS(oklch, { format: 'oklch' }) : hsvToHex(hsv)),
    [isOklch, oklch, hsv],
  );
  const canonicalOklch = useMemo(
    () => (isOklch ? solidColor : convertCSS(solidColor, 'oklch')),
    [isOklch, solidColor],
  );
  const displayValue = useMemo(
    () => formatColor(canonicalOklch, resolvedDisplayFormat, alphaForDisplay, precision),
    [canonicalOklch, resolvedDisplayFormat, alphaForDisplay, precision],
  );
  const swatchColor = displayValue;
  const showGamutWarning = useMemo(
    () =>
      isOklch && isNarrowFormat(resolvedDisplayFormat) && !isOklchInSRGB(oklch.l, oklch.c, oklch.h),
    [isOklch, resolvedDisplayFormat, oklch.l, oklch.c, oklch.h],
  );

  return {
    rootRef,
    containerRef,
    mode,
    hsv,
    oklch,
    alpha,
    displayFormat,
    outputFormat,
    handleChangeAlpha,
    handleChangeColorInput,
    handleChangeDisplayFormat,
    handleChangeHsvHue,
    handleChangeOklchHue,
    handleChangeOklchPanel,
    handleChangeOutputFormat,
    handleChangeSaturationPanel,
    handleClickMode,
    isOklch,
    currentHue,
    solidColor,
    displayValue,
    swatchColor,
    showGamutWarning,
    props: merged,
  };
}
