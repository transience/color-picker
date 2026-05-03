import { useEffect, useRef, useState } from 'react';
import { formatCSS, parseCSS, type RGB } from 'colorizr';

import useEmitLifecycle from '~/hooks/useEmitLifecycle';
import { resolveLabel } from '~/modules/helpers';

import GradientSlider from '../components/GradientSlider';
import NumericInput from '../components/NumericInput';
import { DEFAULT_COLOR, DEFAULT_LABELS } from '../constants';
import type {
  ChannelsConfig,
  ColorPickerLabels,
  GradientSliderClassNames,
  NumericInputClassNames,
} from '../types';

interface RGBSlidersProps {
  /** Per-channel toggles for `r`, `g`, and `b` (`disabled`, `hidden`). */
  channels?: ChannelsConfig;
  /** Per-part className overrides forwarded to each channel's `GradientSlider`. */
  channelSliderClassNames?: GradientSliderClassNames;
  /** Current color as any CSS string parseable by `colorizr`. */
  color?: string;
  /** Per-channel label/aria overrides. Falls back to `DEFAULT_LABELS.rgbSliders`. */
  labels?: ColorPickerLabels['rgbSliders'];
  /** Per-part className overrides forwarded to each channel's `NumericInput`. */
  numericInputClassNames?: NumericInputClassNames;
  /** Called with an OKLCH CSS string whenever any of R/G/B changes. */
  onChange?: (value: string) => void;
  /**
   * Called once when an interaction on any of R/G/B ends. Receives the most
   * recently emitted OKLCH CSS string (or the incoming `color` if no value
   * was emitted during the interaction).
   */
  onChangeEnd?: (value: string) => void;
  /**
   * Called once when an interaction on any of R/G/B begins. Receives the
   * incoming `color` (the value before any change).
   */
  onChangeStart?: (value: string) => void;
  /**
   * Render a `NumericInput` as each slider's `endContent`.
   * @default true
   */
  showInputs?: boolean;
}

export default function RGBSliders(props: RGBSlidersProps) {
  const {
    channels,
    channelSliderClassNames,
    color = DEFAULT_COLOR,
    labels,
    numericInputClassNames,
    onChange,
    onChangeEnd,
    onChangeStart,
    showInputs = true,
  } = props;

  const { emit, notifyEnd, notifyStart } = useEmitLifecycle<string>({
    onChange,
    onChangeEnd,
    onChangeStart,
    value: color,
  });
  // Skip re-derive when the [color] prop is our own echo — keeps the slider
  // pinned to user-input values across the parent's hex round-trip.
  const selfEchoRef = useRef(false);
  const [rgb, setRgb] = useState<RGB>(() => parseCSS(color, 'rgb'));

  useEffect(() => {
    if (selfEchoRef.current) {
      selfEchoRef.current = false;

      return;
    }

    setRgb(parseCSS(color, 'rgb'));
  }, [color]);

  const { b, g, r } = rgb;
  const redConfig = channels?.r;
  const greenConfig = channels?.g;
  const blueConfig = channels?.b;

  const slot = (key: 'b' | 'g' | 'r') => {
    const fallback = DEFAULT_LABELS.rgbSliders[key];

    return {
      label: resolveLabel(fallback.label, labels?.[key]?.label),
      ariaLabel: labels?.[key]?.ariaLabel ?? fallback.ariaLabel,
    };
  };

  const redSlot = slot('r');
  const greenSlot = slot('g');
  const blueSlot = slot('b');

  const update = (newRgb: RGB) => {
    setRgb(newRgb);
    selfEchoRef.current = true;
    emit(formatCSS(newRgb, { format: 'oklch' }));
  };

  return (
    <>
      {!redConfig?.hidden && (
        <GradientSlider
          aria-label={redSlot.ariaLabel}
          classNames={channelSliderClassNames}
          data-testid="RedSlider"
          endContent={
            showInputs ? (
              <NumericInput
                aria-label={redSlot.ariaLabel}
                classNames={numericInputClassNames}
                isDisabled={redConfig?.disabled}
                max={255}
                min={0}
                onChange={v => update({ r: v, g, b })}
                onChangeEnd={notifyEnd}
                onChangeStart={notifyStart}
                suffix=" "
                value={`${Math.round(r)}`}
              />
            ) : undefined
          }
          gradient="linear-gradient(to right, rgb(0 0 0), rgb(255 0 0))"
          isDisabled={redConfig?.disabled}
          maxValue={255}
          onChange={(v: number) => update({ r: v, g, b })}
          onChangeEnd={notifyEnd}
          onChangeStart={notifyStart}
          startContent={redSlot.label}
          step={1}
          value={r}
        />
      )}
      {!greenConfig?.hidden && (
        <GradientSlider
          aria-label={greenSlot.ariaLabel}
          classNames={channelSliderClassNames}
          data-testid="GreenSlider"
          endContent={
            showInputs ? (
              <NumericInput
                aria-label={greenSlot.ariaLabel}
                classNames={numericInputClassNames}
                isDisabled={greenConfig?.disabled}
                max={255}
                min={0}
                onChange={v => update({ r, g: v, b })}
                onChangeEnd={notifyEnd}
                onChangeStart={notifyStart}
                suffix=" "
                value={`${Math.round(g)}`}
              />
            ) : undefined
          }
          gradient="linear-gradient(to right, rgb(0 0 0), rgb(0 255 0))"
          isDisabled={greenConfig?.disabled}
          maxValue={255}
          onChange={(v: number) => update({ r, g: v, b })}
          onChangeEnd={notifyEnd}
          onChangeStart={notifyStart}
          startContent={greenSlot.label}
          step={1}
          value={g}
        />
      )}
      {!blueConfig?.hidden && (
        <GradientSlider
          aria-label={blueSlot.ariaLabel}
          classNames={channelSliderClassNames}
          data-testid="BlueSlider"
          endContent={
            showInputs ? (
              <NumericInput
                aria-label={blueSlot.ariaLabel}
                classNames={numericInputClassNames}
                isDisabled={blueConfig?.disabled}
                max={255}
                min={0}
                onChange={v => update({ r, g, b: v })}
                onChangeEnd={notifyEnd}
                onChangeStart={notifyStart}
                suffix=" "
                value={`${Math.round(b)}`}
              />
            ) : undefined
          }
          gradient="linear-gradient(to right, rgb(0 0 0), rgb(0 0 255))"
          isDisabled={blueConfig?.disabled}
          maxValue={255}
          onChange={(v: number) => update({ r, g, b: v })}
          onChangeEnd={notifyEnd}
          onChangeStart={notifyStart}
          startContent={blueSlot.label}
          step={1}
          value={b}
        />
      )}
    </>
  );
}
