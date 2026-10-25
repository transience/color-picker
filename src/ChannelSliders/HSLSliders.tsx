import { useMemo } from 'react';
import { formatCSS, type HSL } from 'colorizr';

import useChannelState from '~/hooks/useChannelState';
import useEmitLifecycle from '~/hooks/useEmitLifecycle';
import { deriveHsl, isGrayColor, isGrayHsl, withHue } from '~/modules/channels';
import { resolveLabel } from '~/modules/helpers';

import GradientSlider from '../components/GradientSlider';
import NumericInput from '../components/NumericInput';
import { DEFAULT_COLOR, DEFAULT_LABELS, hslHueGradient } from '../constants';
import type {
  ChannelsConfig,
  ColorPickerLabels,
  GradientSliderClassNames,
  NumericInputClassNames,
} from '../types';

interface HSLSlidersProps {
  /** Per-channel toggles for `h`, `s`, and `l` (`disabled`, `hidden`). */
  channels?: ChannelsConfig;
  /** Per-part className overrides forwarded to each channel's `GradientSlider`. */
  channelSliderClassNames?: GradientSliderClassNames;
  /** Current color as any CSS string parseable by `colorizr`. */
  color?: string;
  /**
   * Hue to show while the color is gray (saturation 0, black or white), when
   * the string carries none. Pair with `onChangeHue` so the owner keeps a
   * single hue.
   */
  hue?: number;
  /** Per-channel label/aria overrides. Falls back to `DEFAULT_LABELS.hslSliders`. */
  labels?: ColorPickerLabels['hslSliders'];
  /** Per-part className overrides forwarded to each channel's `NumericInput`. */
  numericInputClassNames?: NumericInputClassNames;
  /** Called with an OKLCH CSS string whenever any of H/S/L changes. */
  onChange?: (value: string) => void;
  /**
   * Called once when an interaction on any of H/S/L ends. Receives the most
   * recently emitted OKLCH CSS string (or the incoming `color` if no value
   * was emitted during the interaction).
   */
  onChangeEnd?: (value: string) => void;
  /**
   * Called instead of `onChange` for hue edits while the color is gray, since
   * the emitted color would be unchanged.
   */
  onChangeHue?: (hue: number) => void;
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
    color = DEFAULT_COLOR,
    hue,
    labels,
    numericInputClassNames,
    onChange,
    onChangeEnd,
    onChangeHue,
    onChangeStart,
    showInputs = true,
  } = props;

  const { emit, notifyEnd, notifyStart } = useEmitLifecycle<string>({
    onChange,
    onChangeEnd,
    onChangeStart,
    value: color,
  });
  const [localHsl, setHsl] = useChannelState(color, deriveHsl);
  const isGrayIncoming = useMemo(() => isGrayColor(color), [color]);
  const isGray = isGrayHsl(localHsl) || isGrayIncoming;
  const { h, l, s } = withHue(localHsl, isGray, hue);
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
    const next = formatCSS(newHsl, { format: 'oklch' });

    setHsl(newHsl, next);
    emit(next);
  };

  const handleChangeHue = (nextHue: number) => {
    if (isGray && onChangeHue) {
      setHsl({ h: nextHue, s, l });
      onChangeHue(nextHue);

      return;
    }

    update({ h: nextHue, s, l });
  };

  return (
    <>
      {!hueConfig?.hidden && (
        <GradientSlider
          aria-label={hueSlot.ariaLabel}
          classNames={channelSliderClassNames}
          data-testid="HueSlider"
          endContent={
            showInputs ? (
              <NumericInput
                aria-label={hueSlot.ariaLabel}
                classNames={numericInputClassNames}
                isDisabled={hueConfig?.disabled}
                max={360}
                min={0}
                onChange={handleChangeHue}
                onChangeEnd={notifyEnd}
                onChangeStart={notifyStart}
                suffix="°"
                value={`${Math.round(h)}`}
              />
            ) : undefined
          }
          gradient={hslHueGradient}
          isDisabled={hueConfig?.disabled}
          maxValue={359.9}
          onChange={handleChangeHue}
          onChangeEnd={notifyEnd}
          onChangeStart={notifyStart}
          startContent={hueSlot.label}
          step={1}
          value={h}
        />
      )}
      {!saturationConfig?.hidden && (
        <GradientSlider
          aria-label={saturationSlot.ariaLabel}
          classNames={channelSliderClassNames}
          data-testid="SaturationSlider"
          endContent={
            showInputs ? (
              <NumericInput
                aria-label={saturationSlot.ariaLabel}
                classNames={numericInputClassNames}
                isDisabled={saturationConfig?.disabled}
                max={100}
                min={0}
                onChange={v => update({ h, s: v, l })}
                onChangeEnd={notifyEnd}
                onChangeStart={notifyStart}
                suffix="%"
                value={`${Math.round(s)}`}
              />
            ) : undefined
          }
          gradient={saturationGradient}
          isDisabled={saturationConfig?.disabled}
          maxValue={100}
          onChange={(v: number) => update({ h, s: v, l })}
          onChangeEnd={notifyEnd}
          onChangeStart={notifyStart}
          startContent={saturationSlot.label}
          step={1}
          value={s}
        />
      )}
      {!lightnessConfig?.hidden && (
        <GradientSlider
          aria-label={lightnessSlot.ariaLabel}
          classNames={channelSliderClassNames}
          data-testid="LightnessSlider"
          endContent={
            showInputs ? (
              <NumericInput
                aria-label={lightnessSlot.ariaLabel}
                classNames={numericInputClassNames}
                isDisabled={lightnessConfig?.disabled}
                max={100}
                min={0}
                onChange={v => update({ h, s, l: v })}
                onChangeEnd={notifyEnd}
                onChangeStart={notifyStart}
                suffix="%"
                value={`${Math.round(l)}`}
              />
            ) : undefined
          }
          gradient={lightnessGradient}
          isDisabled={lightnessConfig?.disabled}
          maxValue={100}
          onChange={(v: number) => update({ h, s, l: v })}
          onChangeEnd={notifyEnd}
          onChangeStart={notifyStart}
          startContent={lightnessSlot.label}
          step={1}
          value={l}
        />
      )}
    </>
  );
}
