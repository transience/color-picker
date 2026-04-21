import { type ButtonHTMLAttributes, forwardRef } from 'react';

import { cn } from '~/modules/helpers';

type Variant = 'icon' | 'segmented';

interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'type'> {
  /** Applies the selected background. */
  isActive?: boolean;
  /**
   * Shape preset. `icon` is a fixed square for icon-only triggers; `segmented`
   * is a text-padded cell that rounds only at the group's first/last child.
   * @default 'icon'
   */
  variant?: Variant;
}

const BASE =
  'flex items-center justify-center outline-none bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 focus-visible:ring-2 focus:ring-neutral-300 dark:focus:ring-neutral-600';

const VARIANTS: Record<Variant, string> = {
  icon: 'size-8 shrink-0 rounded-sm text-neutral-600 dark:text-neutral-300 ',
  segmented:
    'h-8 px-3 text-xs leading-none first:rounded-l-sm last:rounded-r-sm text-neutral-900 dark:text-neutral-50 focus-visible:relative focus-visible:z-10',
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, isActive, variant = 'icon', ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      className={cn(
        BASE,
        VARIANTS[variant],
        {
          'bg-neutral-200 dark:bg-neutral-700': isActive,
        },
        className,
      )}
      type="button"
      {...rest}
    />
  );
});

export default Button;
