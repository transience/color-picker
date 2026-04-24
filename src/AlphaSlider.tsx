import { type HTMLAttributes, ReactNode, useMemo } from 'react';

import GradientSlider from './components/GradientSlider';
import transparentBg from './images/transparent-bg.gif';
import type { GradientSliderClassNames } from './types';

interface AlphaSliderProps extends Omit<HTMLAttributes<HTMLDivElement>, 'color' | 'onChange'> {
  /** Accessible label for the slider thumb.
   * @default 'Alpha'
   */
  'aria-label'?: string;
  /** Per-part className overrides forwarded to the inner `GradientSlider`. */
  classNames?: GradientSliderClassNames;
  /**
   * CSS color (fully opaque) used as the right-hand endpoint of the gradient
   * track. A checkerboard is layered behind it so lower alpha values show
   * through as translucency.
   */
  color: string;
  /**
   * Disables pointer and keyboard interaction and dims the track.
   * @default false
   */
  isDisabled?: boolean;
  /**
   * Optional label rendered to the left of the track (e.g. "A").
   */
  label?: ReactNode;
  /** Called on every drag/keyboard change with the new alpha in `[0, 1]`. */
  onChange: (alpha: number) => void;
  /** Current alpha value as a float in `[0, 1]`. */
  value: number;
}

export default function AlphaSlider(props: AlphaSliderProps) {
  const {
    'aria-label': ariaLabel = 'Alpha',
    classNames,
    color,
    isDisabled,
    label,
    onChange,
    value,
    ...rest
  } = props;

  const gradient = useMemo(
    () => `linear-gradient(to right, transparent, ${color}), url(${transparentBg})`,
    [color],
  );

  return (
    <GradientSlider
      aria-label={ariaLabel}
      classNames={classNames}
      gradient={gradient}
      isDisabled={isDisabled}
      maxValue={1}
      minValue={0}
      onValueChange={onChange}
      startContent={label}
      step={0.01}
      value={value}
      {...rest}
    />
  );
}
