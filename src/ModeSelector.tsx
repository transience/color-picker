import { type HTMLAttributes } from 'react';

import { cn } from '~/modules/helpers';

import Button from './components/Button';
import type { ColorMode, ModeSelectorClassNames } from './types';

interface ModeSelectorProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onClick'> {
  /** Per-part className overrides. */
  classNames?: ModeSelectorClassNames;
  /** Currently selected mode; its button gets the active background class. */
  mode: ColorMode;
  /**
   * Modes to render as buttons, in display order.
   * @default ['oklch', 'hsl', 'rgb']
   */
  modes?: ColorMode[];
  /** Called with the clicked mode. The caller decides whether to switch. */
  onClick: (value: ColorMode) => void;
}

export default function ModeSelector(props: ModeSelectorProps) {
  const { className, classNames, mode, modes = ['oklch', 'hsl', 'rgb'], onClick, ...rest } = props;

  return (
    <div
      className={cn('flex items-center', className, classNames?.root)}
      data-testid="ModeSelector"
      {...rest}
    >
      {modes.map(m => (
        <Button
          key={m}
          activeClassName={classNames?.activeButton}
          aria-label={`Switch to ${m.toLocaleUpperCase()}`}
          className={classNames?.button}
          isActive={mode === m}
          onClick={() => onClick(m)}
          variant="segmented"
        >
          {m.toLocaleUpperCase()}
        </Button>
      ))}
    </div>
  );
}
