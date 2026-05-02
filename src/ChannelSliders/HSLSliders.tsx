import { useEffect, useMemo, useState } from 'react';
import { formatCSS, type HSL, parseCSS } from 'colorizr';

import { resolveLabel } from '~/modules/helpers';

import GradientSlider from '../components/GradientSlider';
import NumericInput from '../components/NumericInput';
import { DEFAULT_LABELS, hslHueGradient } from '../constants';
import type {
  ChannelsConfig,
  ColorPickerLabels,
  GradientSliderClassNames,
  NumericInputClassNames,
} from '../types';

import useChannelLifecycle from './useChannelLifecycle';

interface HSLSlidersProps {
  /** Per-channel toggles for `h`, `s`, and `l` (`disabled`, `hidden`). */
  channels?: ChannelsConfig;
  /** Per-part className overrides forwarded to each channel's `GradientSlider`. */
  channelSliderClassNames?: GradientSliderClassNames;
  /** Current color as any CSS string parseable by `colorizr`. */
  color: string;
  /** Per-channel label/aria overrides. Falls back to `DEFAULT_LABELS.hslSliders`. */
  labels?: ColorPickerLabels['hslSliders'];
  /** Per-part className overrides forwarded to each channel's `NumericInput`. */
  numericInputClassNames?: NumericInputClassNames;
  /** Called with an OKLCH CSS string whenever any of H/S/L changes. */
  onChange: (value: string) => void;
  /**
   * Called once when an interaction on any of H/S/L ends. Receives the most
   * recently emitted OKLCH CSS string (or the incoming `color` if no value
   * was emitted during the interaction).
   */
  onChangeEnd?: (value: string) => void;
  /**
   * Called once when an interaction on any of H/S/L begins. Receives the
   * incoming `color` (the value before any change).
   */
  onChangeStart?: (value: string) => void;
  /**
   * Render a `NumericInput` as each slider's `endContent`.
   * @default true
   */
  showInputs?: boolean;
}

export default function HSLSliders(props: HSLSlidersProps) {
  const {
    channels,
    channelSliderClassNames,
    color,
    labels,
    numericInputClassNames,
    onChange,
    onChangeEnd,
    onChangeStart,
    showInputs = true,
  } = props;

  const { handleEnd, handleStart, lastEmittedRef, recordEmit } = useChannelLifecycle(
    color,
    onChangeStart,
    onChangeEnd,
  );
  const [hsl, setHsl] = useState<HSL>(() => parseCSS(color, 'hsl'));

  // Re-derive HSL only from external changes (not our own round-trip)
  useEffect(() => {
    if (color !== lastEmittedRef.current) {
      setHsl(parseCSS(color, 'hsl'));
    }
  }, [color, lastEmittedRef]);

  const { h, l, s } = hsl;
  const hueConfig = channels?.h;
  const saturationConfig = channels?.s;
  const lightnessConfig = channels?.l;

  const slot = (key: 'h' | 'l' | 's') => {
    const fallback = DEFAULT_LABELS.hslSliders[key];

    return {
      label: resolveLabel(fallback.label, labels?.[key]?.label),
      ariaLabel: labels?.[key]?.ariaLabel ?? fallback.ariaLabel,
    };
  };

  const hueSlot = slot('h');
  const saturationSlot = slot('s');
  const lightnessSlot = slot('l');

  const saturationGradient = useMemo(
    () => `linear-gradient(to right, hsl(${h} 0% ${l}%), hsl(${h} 100% ${l}%))`,
    [h, l],
  );

  const lightnessGradient = useMemo(
    () =>
      `linear-gradient(to right, hsl(${h} ${s}% 0%), hsl(${h} ${s}% 50%), hsl(${h} ${s}% 100%))`,
    [h, s],
  );

  const update = (newHsl: HSL) => {
    setHsl(newHsl);

    const oklch = formatCSS(newHsl, { format: 'oklch' });

    recordEmit(oklch);
    onChange(oklch);
  };

  return (
    <>
      {!hueConfig?.hidden && (
        <GradientSlider
          aria-label={hueSlot.ariaLabel}
          classNames={channelSliderClassNames}
          endContent={
            showInputs ? (
              <NumericInput
                aria-label={hueSlot.ariaLabel}
                classNames={numericInputClassNames}
                isDisabled={hueConfig?.disabled}
                max={360}
                min={0}
                onChange={v => update({ h: v, s, l })}
                suffix="°"
                value={`${Math.round(h)}`}
              />
            ) : undefined
          }
          gradient={hslHueGradient}
          isDisabled={hueConfig?.disabled}
          maxValue={359.9}
          onChange={(v: number) => update({ h: v, s, l })}
          onChangeEnd={handleEnd}
          onChangeStart={handleStart}
          startContent={hueSlot.label}
          step={1}
          value={h}
        />
      )}
      {!saturationConfig?.hidden && (
        <GradientSlider
          aria-label={saturationSlot.ariaLabel}
          classNames={channelSliderClassNames}
          endContent={
            showInputs ? (
              <NumericInput
                aria-label={saturationSlot.ariaLabel}
                classNames={numericInputClassNames}
                isDisabled={saturationConfig?.disabled}
                max={100}
                min={0}
                onChange={v => update({ h, s: v, l })}
                suffix="%"
                value={`${Math.round(s)}`}
              />
            ) : undefined
          }
          gradient={saturationGradient}
          isDisabled={saturationConfig?.disabled}
          maxValue={100}
          onChange={(v: number) => update({ h, s: v, l })}
          onChangeEnd={handleEnd}
          onChangeStart={handleStart}
          startContent={saturationSlot.label}
          step={1}
          value={s}
        />
      )}
      {!lightnessConfig?.hidden && (
        <GradientSlider
          aria-label={lightnessSlot.ariaLabel}
          classNames={channelSliderClassNames}
          endContent={
            showInputs ? (
              <NumericInput
                aria-label={lightnessSlot.ariaLabel}
                classNames={numericInputClassNames}
                isDisabled={lightnessConfig?.disabled}
                max={100}
                min={0}
                onChange={v => update({ h, s, l: v })}
                suffix="%"
                value={`${Math.round(l)}`}
              />
            ) : undefined
          }
          gradient={lightnessGradient}
          isDisabled={lightnessConfig?.disabled}
          maxValue={100}
          onChange={(v: number) => update({ h, s, l: v })}
          onChangeEnd={handleEnd}
          onChangeStart={handleStart}
          startContent={lightnessSlot.label}
          step={1}
          value={l}
        />
      )}
    </>
  );
}
