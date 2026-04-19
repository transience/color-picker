import { cn } from '~/modules/helpers';

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
    <div className={cn('flex overflow-hidden rounded-sm', className)}>
      {modes.map(m => (
        <button
          key={m}
          aria-label={`Switch to ${m.toLocaleUpperCase()}`}
          className={cn(
            'px-3 py-2 bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-50 text-xs leading-none',
            {
              'bg-neutral-200 dark:bg-neutral-700': mode === m,
            },
          )}
          onClick={() => onClick(m)}
          type="button"
        >
          {m.toLocaleUpperCase()}
        </button>
      ))}
    </div>
  );
}
