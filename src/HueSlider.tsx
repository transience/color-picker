import { type HTMLAttributes, ReactNode } from 'react';

import GradientSlider from './components/GradientSlider';
import { hslHueGradient, oklchHueGradient } from './constants';
import type { ColorMode, GradientSliderClassNames } from './types';

interface HueSliderProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onChange'> {
  /** Accessible label for the slider thumb.
   * @default 'GlobalHue'
   */
  'aria-label'?: string;
  /** Per-part className overrides forwarded to the inner `GradientSlider`. */
  classNames?: GradientSliderClassNames;
  /**
   * Custom CSS `background` value.
   */
  gradient?: string;
  /**
   * Disables pointer and keyboard interaction and dims the track.
   * @default false
   */
  isDisabled?: boolean;
  /**
   * Optional label rendered to the left of the track (e.g. "H").
   */
  label?: ReactNode;
  /**
   * Active color mode. Selects the gradient: `oklchHueGradient` for OKLCH,
   * `hslHueGradient` for HSL/RGB.
   */
  mode: ColorMode;
  /** Called on every drag/keyboard change with the new hue in `[0, 360]`. */
  onChange: (hue: number) => void;
  /** Current hue in `[0, 360]`. */
  value: number;
}

export default function HueSlider(props: HueSliderProps) {
  const {
    'aria-label': ariaLabel = 'GlobalHue',
    classNames,
    gradient,
    isDisabled,
    label,
    mode,
    onChange,
    value,
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
      startContent={label}
      value={value}
      {...rest}
    />
  );
}
