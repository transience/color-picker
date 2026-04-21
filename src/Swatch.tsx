import transparentBg from './images/transparent-bg.gif';
import { cn } from './modules/helpers';
import type { SwatchClassNames } from './types';

interface SwatchProps {
  /** Per-part className overrides (`root` = outer checkerboard, `color` = inner color fill). */
  classNames?: SwatchClassNames;
  /**
   * CSS color rendered on top of the checkerboard. When the color has alpha
   * `< 1`, the checkerboard shows through as translucency.
   */
  color: string;
}

export default function Swatch(props: SwatchProps) {
  const { classNames, color } = props;

  return (
    <div
      aria-hidden
      className={cn(
        'size-8 rounded-full overflow-hidden border border-neutral-300 dark:border-neutral-600 shrink-0',
        classNames?.root,
      )}
      data-testid="Swatch"
      style={{ backgroundImage: `url(${transparentBg})` }}
    >
      <div
        className={cn('flex items-center justify-center size-full', classNames?.color)}
        style={{ backgroundColor: color }}
      />
    </div>
  );
}
