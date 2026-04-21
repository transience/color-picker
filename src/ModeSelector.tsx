import { cn } from '~/modules/helpers';

import Button from './components/Button';
import type { ColorMode } from './types';

interface ModeSelectorProps {
  /** Extra classes appended to the button row wrapper. */
  className?: string;
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
  const { className, mode, modes = ['oklch', 'hsl', 'rgb'], onClick } = props;

  return (
    <div className={cn('flex items-center', className)} data-testid="ModeSelector">
      {modes.map(m => (
        <Button
          key={m}
          aria-label={`Switch to ${m.toLocaleUpperCase()}`}
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
