import { useRef } from 'react';

import { cn, createId } from '../modules/helpers';

import WarningIcon from './WarningIcon';

interface GamutWarningProps {
  /** Extra classes appended to the icon wrapper. */
  className?: string;
}

export default function GamutWarning(props: GamutWarningProps) {
  const { className } = props;
  const idRef = useRef<string | null>(null);

  idRef.current ??= createId('gamut');

  const id = idRef.current;
  const anchorName = `--${id}`;

  return (
    <>
      <button
        aria-describedby={id}
        className={cn('inline-flex shrink-0 text-orange-400 cursor-pointer', className)}
        data-testid="GamutWarning"
        popoverTarget={id}
        style={{ anchorName }}
        type="button"
      >
        <WarningIcon />
      </button>
      <div
        className="mb-1 px-3 py-2 max-w-48 rounded-md bg-neutral-300 text-neutral-900 dark:bg-neutral-700 dark:text-neutral-100 text-sm shadow-lg"
        id={id}
        popover="auto"
        role="tooltip"
        style={{ positionAnchor: anchorName, positionArea: 'top' }}
      >
        Color is outside the sRGB gamut and clipped for hex/rgb/hsl display.
      </div>
    </>
  );
}
