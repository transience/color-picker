import {
  type AnchorHTMLAttributes,
  type ButtonHTMLAttributes,
  type ElementType,
  type HTMLAttributes,
  type ReactNode,
} from 'react';

import transparentBg from './images/transparent-bg.gif';
import { cn } from './modules/helpers';
import type { SwatchClassNames } from './types';

type SwatchAnchorProps = SwatchBaseProps & { as: 'a'; href: string } & Omit<
    AnchorHTMLAttributes<HTMLAnchorElement>,
    'color' | 'children' | 'href'
  >;

type SwatchButtonProps = SwatchBaseProps & { as: 'button' } & Omit<
    ButtonHTMLAttributes<HTMLButtonElement>,
    'color' | 'children' | 'type'
  >;

type SwatchProps = SwatchSpanProps | SwatchButtonProps | SwatchAnchorProps;

type SwatchSpanProps = SwatchBaseProps & { as?: 'span' } & Omit<
    HTMLAttributes<HTMLSpanElement>,
    'color' | 'children'
  >;

interface SwatchBaseProps {
  children?: ReactNode;
  /** Per-part className overrides (`root` = outer checkerboard, `color` = inner color fill). */
  classNames?: SwatchClassNames;
  /**
   * CSS color rendered on top of the checkerboard. When the color has alpha
   * `< 1`, the checkerboard shows through as translucency.
   */
  color: string;
}

export default function Swatch(props: SwatchProps) {
  const { as = 'span', children, className, classNames, color, style, ...rest } = props;
  const Root = as as ElementType;
  const extraProps = as === 'button' ? { type: 'button' as const } : {};

  return (
    <Root
      className={cn(
        'inline-flex shrink-0 size-8 rounded-full overflow-hidden border border-neutral-300 dark:border-neutral-600',
        {
          'cursor-pointer': as === 'button' || as === 'a',
        },
        className,
        classNames?.root,
      )}
      data-testid="Swatch"
      style={{ ...style, backgroundImage: `url(${transparentBg})` }}
      {...rest}
      {...extraProps}
    >
      <span
        className={cn('flex items-center justify-center size-full', classNames?.color)}
        style={{ backgroundColor: color }}
      >
        {children}
      </span>
    </Root>
  );
}
