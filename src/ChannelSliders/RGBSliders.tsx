import { useEffect, useRef, useState } from 'react';
import { formatCSS, parseCSS, type RGB } from 'colorizr';

import GradientSlider from '../components/GradientSlider';
import NumericInput from '../components/NumericInput';
import type { ChannelsConfig, GradientSliderClassNames, NumericInputClassNames } from '../types';

interface RGBSlidersProps {
  /** Per-channel overrides for `r`, `g`, and `b` (label, hidden, disabled). */
  channels?: ChannelsConfig;
  /** Per-part className overrides forwarded to each channel's `GradientSlider`. */
  channelSliderClassNames?: GradientSliderClassNames;
  /** Current color as any CSS string parseable by `colorizr`. */
  color: string;
  /** Per-part className overrides forwarded to each channel's `NumericInput`. */
  numericInputClassNames?: NumericInputClassNames;
  /** Called with an OKLCH CSS string whenever any of R/G/B changes. */
  onChangeColor: (value: string) => void;
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
    color,
    numericInputClassNames,
    onChangeColor,
    showInputs = true,
  } = props;

  const lastEmittedRef = useRef<string>('');
  const [rgb, setRgb] = useState<RGB>(() => parseCSS(color, 'rgb'));

  // Re-derive RGB only from external changes (not our own round-trip)
  useEffect(() => {
    if (color !== lastEmittedRef.current) {
      setRgb(parseCSS(color, 'rgb'));
    }
  }, [color]);

  const { b, g, r } = rgb;
  const redConfig = channels?.r;
  const greenConfig = channels?.g;
  const blueConfig = channels?.b;

  const update = (newRgb: RGB) => {
    setRgb(newRgb);

    const oklch = formatCSS(newRgb, { format: 'oklch' });

    lastEmittedRef.current = oklch;
    onChangeColor(oklch);
  };

  return (
    <>
      {!redConfig?.hidden && (
        <GradientSlider
          aria-label="Red"
          classNames={channelSliderClassNames}
          endContent={
            showInputs ? (
              <NumericInput
                aria-label="Red"
                classNames={numericInputClassNames}
                isDisabled={redConfig?.disabled}
                max={255}
                min={0}
                onChange={v => update({ r: v, g, b })}
                suffix=" "
                value={`${Math.round(r)}`}
              />
            ) : undefined
          }
          gradient="linear-gradient(to right, rgb(0 0 0), rgb(255 0 0))"
          isDisabled={redConfig?.disabled}
          maxValue={255}
          onValueChange={v => update({ r: v, g, b })}
          startContent={redConfig?.label ?? 'R'}
          step={1}
          value={r}
        />
      )}
      {!greenConfig?.hidden && (
        <GradientSlider
          aria-label="Green"
          classNames={channelSliderClassNames}
          endContent={
            showInputs ? (
              <NumericInput
                aria-label="Green"
                classNames={numericInputClassNames}
                isDisabled={greenConfig?.disabled}
                max={255}
                min={0}
                onChange={v => update({ r, g: v, b })}
                suffix=" "
                value={`${Math.round(g)}`}
              />
            ) : undefined
          }
          gradient="linear-gradient(to right, rgb(0 0 0), rgb(0 255 0))"
          isDisabled={greenConfig?.disabled}
          maxValue={255}
          onValueChange={v => update({ r, g: v, b })}
          startContent={greenConfig?.label ?? 'G'}
          step={1}
          value={g}
        />
      )}
      {!blueConfig?.hidden && (
        <GradientSlider
          aria-label="Blue"
          classNames={channelSliderClassNames}
          endContent={
            showInputs ? (
              <NumericInput
                aria-label="Blue"
                classNames={numericInputClassNames}
                isDisabled={blueConfig?.disabled}
                max={255}
                min={0}
                onChange={v => update({ r, g, b: v })}
                suffix=" "
                value={`${Math.round(b)}`}
              />
            ) : undefined
          }
          gradient="linear-gradient(to right, rgb(0 0 0), rgb(0 0 255))"
          isDisabled={blueConfig?.disabled}
          maxValue={255}
          onValueChange={v => update({ r, g, b: v })}
          startContent={blueConfig?.label ?? 'B'}
          step={1}
          value={b}
        />
      )}
    </>
  );
}
