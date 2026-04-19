import { useMemo } from 'react';
import { formatCSS, getP3MaxChroma, type LCH, parseCSS } from 'colorizr';

import GradientSlider from '../components/GradientSlider';
import NumericInput from '../components/NumericInput';
import { oklchHueGradient } from '../constants';
import type { ChannelsConfig, GradientSliderClassNames, NumericInputClassNames } from '../types';

interface OKLCHSlidersProps {
  /**
   * Per-channel overrides for `l`, `c`, and `h` (label, hidden, disabled).
   * The chroma slider's max range updates dynamically with the current
   * lightness/hue via `getP3MaxChroma`.
   */
  channels?: ChannelsConfig;
  /** Per-part className overrides forwarded to each channel's `GradientSlider`. */
  channelSliderClassNames?: GradientSliderClassNames;
  /** Current color as any CSS string parseable by `colorizr`. */
  color: string;
  /** Per-part className overrides forwarded to each channel's `NumericInput`. */
  numericInputClassNames?: NumericInputClassNames;
  /** Called with an OKLCH CSS string whenever any of L/C/H changes. */
  onChangeColor: (value: string) => void;
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
    numericInputClassNames,
    onChangeColor,
    showInputs = true,
  } = props;

  const { c, h, l } = useMemo(() => parseCSS(color, 'oklch'), [color]);
  const lightnessConfig = channels?.l;
  const chromaConfig = channels?.c;
  const hueConfig = channels?.h;

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
    onChangeColor(formatCSS(okLCH, { format: 'oklch' }));
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
          aria-label="Lightness"
          classNames={channelSliderClassNames}
          endContent={
            showInputs ? (
              <NumericInput
                aria-label="Lightness"
                classNames={numericInputClassNames}
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
          onValueChange={handleChangeLightness}
          startContent={lightnessConfig?.label ?? 'L'}
          step={0.001}
          value={l}
        />
      )}
      {!chromaConfig?.hidden && (
        <GradientSlider
          aria-label="Chroma"
          classNames={channelSliderClassNames}
          endContent={
            showInputs ? (
              <NumericInput
                aria-label="Chroma"
                classNames={numericInputClassNames}
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
          onValueChange={handleChangeChroma}
          startContent={chromaConfig?.label ?? 'C'}
          step={0.001}
          value={c}
        />
      )}
      {!hueConfig?.hidden && (
        <GradientSlider
          aria-label="Hue"
          classNames={channelSliderClassNames}
          endContent={
            showInputs ? (
              <NumericInput
                aria-label="Hue"
                classNames={numericInputClassNames}
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
          onValueChange={handleChangeHue}
          startContent={hueConfig?.label ?? 'H'}
          step={0.01}
          value={h}
        />
      )}
    </>
  );
}
