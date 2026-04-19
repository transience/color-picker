import { type ReactNode } from 'react';

import { cn } from './modules/helpers';

interface ControlsProps {
  /** Alpha bar rendered in the stacked right-hand column, beneath the hue bar. */
  alphaBar?: ReactNode;
  /** Extra classes appended to the row wrapper. */
  className?: string;
  /** EyeDropper button rendered at the far left of the row. */
  eyeDropper?: ReactNode;
  /** Hue bar rendered in the stacked right-hand column, above the alpha bar. */
  hueBar?: ReactNode;
  /** Color swatch rendered between the eyedropper and the bars column. */
  swatch?: ReactNode;
}

export default function Controls(props: ControlsProps) {
  const { alphaBar, className, eyeDropper, hueBar, swatch } = props;

  if (!alphaBar && !eyeDropper && !hueBar && !swatch) {
    return null;
  }

  const hasBars = Boolean(hueBar || alphaBar);

  return (
    <div className={cn('flex items-center gap-3 px-3', className)} data-testid="Controls">
      {eyeDropper}
      {swatch}
      {hasBars && (
        <div className="flex flex-1 flex-col justify-center gap-2">
          {hueBar}
          {alphaBar}
        </div>
      )}
    </div>
  );
}
