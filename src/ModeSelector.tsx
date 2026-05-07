import { type HTMLAttributes } from 'react';

import { cn, mergeProps, resolveLabel } from '~/modules/helpers';

import Button from './components/Button';
import { DEFAULT_LABELS } from './constants';
import type { ColorMode, ColorPickerLabels, ModeSelectorClassNames } from './types';

interface ModeSelectorProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onClick'> {
  /** Per-part className overrides. */
  classNames?: ModeSelectorClassNames;
  /** Per-mode label/aria overrides. */
  labels?: ColorPickerLabels['modeSelector'];
  /**
   * Currently selected mode; its button gets the active background class.
   * @default 'oklch'
   */
  mode?: ColorMode;
  /**
   * Modes to render as buttons, in display order.
   * @default ['oklch', 'hsl', 'rgb']
   */
  modes?: ColorMode[];
  /**
   * Called with the clicked mode. The caller decides whether to switch.
   */
  onClick?: (value: ColorMode) => void;
}

export const defaultProps = {
  mode: 'oklch',
  modes: ['oklch', 'hsl', 'rgb'],
} satisfies ModeSelectorProps;

export default function ModeSelector(props: ModeSelectorProps) {
  const { className, classNames, labels, mode, modes, onClick, ...rest } = mergeProps(
    defaultProps,
    props,
  );

  return (
    <div
      className={cn('flex items-center', className, classNames?.root)}
      data-testid="ModeSelector"
      {...rest}
    >
      {modes.map(m => {
        const ariaLabel = labels?.[m]?.ariaLabel ?? DEFAULT_LABELS.modeSelector.ariaLabel(m);
        const visible = resolveLabel(DEFAULT_LABELS.modeSelector.visible(m), labels?.[m]?.label);

        return (
          <Button
            key={m}
            activeClassName={classNames?.activeButton}
            aria-label={ariaLabel}
            aria-pressed={mode === m}
            className={classNames?.button}
            isActive={mode === m}
            onClick={() => onClick?.(m)}
            variant="segmented"
          >
            {visible}
          </Button>
        );
      })}
    </div>
  );
}
