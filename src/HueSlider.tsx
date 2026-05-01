import { type HTMLAttributes, ReactNode } from 'react';
import { parseCSS } from 'colorizr';

import GradientSlider from './components/GradientSlider';
import { DEFAULT_COLOR, hslHueGradient, oklchHueGradient } from './constants';
import type { ColorMode, GradientSliderClassNames } from './types';

const DEFAULT_HUE = parseCSS(DEFAULT_COLOR, 'oklch').h;

interface HueSliderProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onChange'> {
  /**
   * Accessible label for the slider thumb.
   * @default 'GlobalHue'
   */
  'aria-label'?: string;
  /** Per-part className overrides forwarded to the inner `GradientSlider`. */
  classNames?: GradientSliderClassNames;
  /** Custom CSS `background` value. */
  gradient?: string;
  /**
   * Disables pointer and keyboard interaction and dims the track.
   * @default false
   */
  isDisabled?: boolean;
  /** Optional label rendered to the left of the track (e.g. "H"). */
  label?: ReactNode;
  /**
   * Active color mode. Selects the gradient: `oklchHueGradient` for OKLCH,
   * `hslHueGradient` for HSL/RGB.
   * @default 'oklch'
   */
  mode?: ColorMode;
  /**
   * Called on every drag/keyboard change with the new hue in `[0, 360]`.
   */
  onChange?: (hue: number) => void;
  /**
   * Called once when an interaction ends — pointer release, or 200 ms after
   * the last keyboard step. Receives the final hue value.
   */
  onChangeEnd?: (hue: number) => void;
  /**
   * Called once when an interaction begins — `pointerdown` or first
   * value-changing keydown after idle. Receives the hue value at the start of
   * the interaction.
   */
  onChangeStart?: (hue: number) => void;
  /**
   * Current hue in `[0, 360]`.
   * @default DEFAULT_COLOR's OKLCH hue (~250)
   */
  value?: number;
}

export default function HueSlider(props: HueSliderProps) {
  const {
    'aria-label': ariaLabel = 'GlobalHue',
    classNames,
    gradient,
    isDisabled,
    label,
    mode = 'oklch',
    onChange,
    onChangeEnd,
    onChangeStart,
    value = DEFAULT_HUE,
    ...rest
  } = props;

  let currentGradient = mode === 'oklch' ? oklchHueGradient : hslHueGradient;

  if (gradient) {
    currentGradient = gradient;
  }

  return (
    <GradientSlider
      aria-label={ariaLabel}
      classNames={classNames}
      gradient={currentGradient}
      isDisabled={isDisabled}
      maxValue={360}
      onChange={onChange}
      onChangeEnd={onChangeEnd}
      onChangeStart={onChangeStart}
      startContent={label}
      value={value}
      {...rest}
    />
  );
}
