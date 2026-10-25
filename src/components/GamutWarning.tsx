import { type ButtonHTMLAttributes } from 'react';

import Floater from '~/components/Floater';

import { DEFAULT_LABELS } from '../constants';
import { cn } from '../modules/helpers';

import WarningIcon from './WarningIcon';

interface GamutWarningProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'type' | 'children'
> {
  /**
   * Tooltip text, also used as the button's aria-label.
   * @default DEFAULT_LABELS.gamutWarning
   */
  label?: string;
}

const TOOLTIP_CONTENT_CLASSES =
  'pointer-events-none max-w-48 px-2.5 py-1.5 text-sm rounded-md shadow-lg bg-neutral-300 text-neutral-900 dark:bg-neutral-700 dark:text-neutral-100';

export default function GamutWarning(props: GamutWarningProps) {
  const { className, label = DEFAULT_LABELS.gamutWarning, ...rest } = props;

  return (
    <Floater
      content={<span role="tooltip">{label}</span>}
      contentClassName={TOOLTIP_CONTENT_CLASSES}
    >
      <button
        aria-label={label}
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
