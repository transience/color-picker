import { type ButtonHTMLAttributes, forwardRef } from 'react';

import { cn } from '~/modules/helpers';

type Variant = 'icon' | 'segmented';

interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'type'> {
  /**
   * Class name applied to the active button.
   */
  activeClassName?: string;
  /** Applies the selected background. */
  isActive?: boolean;
  /**
   * Shape preset. `icon` is a fixed square for icon-only triggers; `segmented`
   * is a text-padded cell that rounds only at the group's first/last child.
   * @default 'icon'
   */
  variant?: Variant;
}

const ACTIVE_CLASSNAME = 'bg-black/20 dark:bg-white/20';

const BASE =
  'flex items-center justify-center outline-none bg-black/10 dark:bg-white/10 hover:bg-black/15 dark:hover:bg-white/15 focus-visible:ring-2 focus:ring-black/30 dark:focus:ring-white/30';

const VARIANTS: Record<Variant, string> = {
  icon: 'size-8 shrink-0 rounded-sm text-neutral-800 dark:text-neutral-200 ',
  segmented:
    'h-8 px-3 text-xs leading-none first:rounded-l-sm last:rounded-r-sm text-neutral-900 dark:text-neutral-50 focus-visible:relative focus-visible:z-10',
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { activeClassName = ACTIVE_CLASSNAME, className, isActive, variant = 'icon', ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      className={cn(BASE, VARIANTS[variant], className, isActive && activeClassName)}
      type="button"
      {...rest}
    />
  );
});

export default Button;
