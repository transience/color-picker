import { useMemo } from 'react';
import { formatCSS, getP3MaxChroma, type LCH, parseCSS } from 'colorizr';

import { resolveLabel } from '~/modules/helpers';

import GradientSlider from '../components/GradientSlider';
import NumericInput from '../components/NumericInput';
import { DEFAULT_LABELS, oklchHueGradient } from '../constants';
import type {
  ChannelsConfig,
  ColorPickerLabels,
  GradientSliderClassNames,
  NumericInputClassNames,
} from '../types';

import useChannelLifecycle from './useChannelLifecycle';

interface OKLCHSlidersProps {
  /**
   * Per-channel toggles for `l`, `c`, and `h` (`disabled`, `hidden`).
   * The chroma slider's max range updates dynamically with the current
   * lightness/hue via `getP3MaxChroma`.
   */
  channels?: ChannelsConfig;
  /** Per-part className overrides forwarded to each channel's `GradientSlider`. */
  channelSliderClassNames?: GradientSliderClassNames;
  /** Current color as any CSS string parseable by `colorizr`. */
  color: string;
  /** Per-channel label/aria overrides. Falls back to `DEFAULT_LABELS.oklchSliders`. */
  labels?: ColorPickerLabels['oklchSliders'];
  /** Per-part className overrides forwarded to each channel's `NumericInput`. */
  numericInputClassNames?: NumericInputClassNames;
  /** Called with an OKLCH CSS string whenever any of L/C/H changes. */
  onChange: (value: string) => void;
  /**
   * Called once when an interaction on any of L/C/H ends. Receives the most
   * recently emitted OKLCH CSS string (or the incoming `color` if no value
   * was emitted during the interaction).
   */
  onChangeEnd?: (value: string) => void;
  /**
   * Called once when an interaction on any of L/C/H begins. Receives the
   * incoming `color` (the value before any change).
   */
  onChangeStart?: (value: string) => void;
  /**
   * Render a `NumericInput` as each slider's `endContent`.
   * @default true
   */
  showInputs?: boolean;
}

export default function OKLCHSliders(props: OKLCHSlidersProps) {
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

  const { handleEnd, handleStart, recordEmit } = useChannelLifecycle(
    color,
    onChangeStart,
    onChangeEnd,
  );

  const { c, h, l } = useMemo(() => parseCSS(color, 'oklch'), [color]);
  const lightnessConfig = channels?.l;
  const chromaConfig = channels?.c;
  const hueConfig = channels?.h;

  const slot = (key: 'c' | 'h' | 'l') => {
    const fallback = DEFAULT_LABELS.oklchSliders[key];

    return {
      label: resolveLabel(fallback.label, labels?.[key]?.label),
      ariaLabel: labels?.[key]?.ariaLabel ?? fallback.ariaLabel,
    };
  };

  const lightnessSlot = slot('l');
  const chromaSlot = slot('c');
  const hueSlot = slot('h');

  const maxChroma = useMemo(() => getP3MaxChroma({ l, c: 0, h }), [l, h]);

  const lightnessGradient = useMemo(
    () =>
      `linear-gradient(to right, oklch(0 ${c} ${h}), oklch(${l} ${c} ${h}), oklch(1 ${c} ${h}))`,
    [c, h, l],
  );

  const chromaGradient = useMemo(
    () => `linear-gradient(to right, oklch(${l} 0 ${h}), oklch(${l} ${maxChroma} ${h}))`,
    [l, h, maxChroma],
  );

  const update = (okLCH: LCH) => {
    const oklch = formatCSS(okLCH, { format: 'oklch' });

    recordEmit(oklch);
    onChange(oklch);
  };

  const handleChangeLightness = (lightness: number) => {
    const relativeChroma = maxChroma > 0 ? c / maxChroma : 0;
    const newMaxChroma = getP3MaxChroma({ l: lightness, c: 0, h });

    update({ l: lightness, c: relativeChroma * newMaxChroma, h });
  };

  const handleChangeChroma = (chroma: number) => {
    update({ l, c: Number.isNaN(chroma) ? 0 : chroma, h });
  };

  const handleChangeHue = (hue: number) => {
    const relativeChroma = maxChroma > 0 ? c / maxChroma : 0;
    const newMaxChroma = getP3MaxChroma({ l, c: 0, h: hue });

    update({ l, c: relativeChroma * newMaxChroma, h: hue });
  };

  return (
    <>
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
                onChange={v => handleChangeLightness(v / 100)}
                step={0.1}
                suffix="%"
                value={(l * 100).toFixed(1)}
              />
            ) : undefined
          }
          gradient={lightnessGradient}
          isDisabled={lightnessConfig?.disabled}
          maxValue={1}
          onChange={handleChangeLightness}
          onChangeEnd={handleEnd}
          onChangeStart={handleStart}
          startContent={lightnessSlot.label}
          step={0.001}
          value={l}
        />
      )}
      {!chromaConfig?.hidden && (
        <GradientSlider
          aria-label={chromaSlot.ariaLabel}
          classNames={channelSliderClassNames}
          endContent={
            showInputs ? (
              <NumericInput
                aria-label={chromaSlot.ariaLabel}
                classNames={numericInputClassNames}
                isDisabled={chromaConfig?.disabled}
                max={maxChroma}
                min={0}
                onChange={handleChangeChroma}
                step={0.001}
                suffix=" "
                value={c.toFixed(3)}
              />
            ) : undefined
          }
          gradient={chromaGradient}
          isDisabled={chromaConfig?.disabled}
          maxValue={maxChroma}
          onChange={handleChangeChroma}
          onChangeEnd={handleEnd}
          onChangeStart={handleStart}
          startContent={chromaSlot.label}
          step={0.001}
          value={c}
        />
      )}
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
                onChange={handleChangeHue}
                step={0.1}
                suffix="°"
                value={h.toFixed(1)}
              />
            ) : undefined
          }
          gradient={oklchHueGradient}
          isDisabled={hueConfig?.disabled}
          maxValue={360}
          onChange={handleChangeHue}
          onChangeEnd={handleEnd}
          onChangeStart={handleStart}
          startContent={hueSlot.label}
          step={0.01}
          value={h}
        />
      )}
    </>
  );
}
