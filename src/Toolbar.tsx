import { type ReactNode } from 'react';

import { cn } from './modules/helpers';

interface ToolbarProps {
  /** Alpha bar rendered in the stacked right-hand column, beneath the hue bar. */
  alphaBar?: ReactNode;
  /** Extra classes appended to the row wrapper. */
  className?: string;
  /** Hue bar rendered in the stacked right-hand column, above the alpha bar. */
  hueBar?: ReactNode;
}

export default function Toolbar(props: ToolbarProps) {
  const { alphaBar, className, hueBar } = props;

  return (
    <div className={cn('w-full flex flex-col gap-1', className)} data-testid="Toolbar">
      {hueBar}
      {alphaBar}
    </div>
  );
}
