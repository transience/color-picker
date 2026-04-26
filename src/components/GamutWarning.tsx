import { type ButtonHTMLAttributes } from 'react';

import Floater from '~/components/Floater';

import { cn } from '../modules/helpers';

import WarningIcon from './WarningIcon';

type GamutWarningProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'type' | 'children'>;

const TOOLTIP_CONTENT_CLASSES =
  'pointer-events-none max-w-48 px-2.5 py-1.5 text-sm rounded-md shadow-lg bg-neutral-300 text-neutral-900 dark:bg-neutral-700 dark:text-neutral-100';

export default function GamutWarning(props: GamutWarningProps) {
  const { className, ...rest } = props;

  const content = 'Color is outside the sRGB gamut and clipped for hex/rgb/hsl display.';

  return (
    <Floater
      content={<span role="tooltip">{content}</span>}
      contentClassName={TOOLTIP_CONTENT_CLASSES}
    >
      <button
        aria-label={content}
        className={cn('inline-flex shrink-0 text-orange-400 cursor-pointer', className)}
        data-testid="GamutWarning"
        {...rest}
        type="button"
      >
        <WarningIcon />
      </button>
    </Floater>
  );
}
