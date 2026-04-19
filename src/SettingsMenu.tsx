import { useEffect, useLayoutEffect, useRef, useState } from 'react';

import { cn } from '~/modules/helpers';

import RadioGroup from './components/RadioGroup';
import ThreeDotsVerticalIcon from './components/ThreeDotsVerticalIcon';
import type { ColorFormat, SettingsMenuClassNames, SettingsOption } from './types';

interface SettingsMenuProps {
  /** Per-part className overrides (`trigger` = ⋮ button, `menu` = popover panel). */
  classNames?: SettingsMenuClassNames;
  /** Current display format selection. */
  displayFormat: ColorFormat;
  /** Fired when the user picks a new display format in the menu. */
  onChangeDisplayFormat: (format: ColorFormat) => void;
  /** Fired when the user picks a new output format in the menu. */
  onChangeOutputFormat: (format: ColorFormat) => void;
  /** Current output format selection. */
  outputFormat: ColorFormat;
}

const OPTIONS: SettingsOption[] = [
  { label: 'Auto', value: 'auto' },
  { label: 'Hex', value: 'hex' },
  { label: 'RGB', value: 'rgb' },
  { label: 'HSL', value: 'hsl' },
  { label: 'OkLCH', value: 'oklch' },
  { label: 'OkLab', value: 'oklab' },
];

type PanelPlacement = { maxHeight: number | null; side: 'top' | 'bottom' };

const DEFAULT_PLACEMENT: PanelPlacement = { maxHeight: null, side: 'bottom' };
const GAP = 8;

export default function SettingsMenu(props: SettingsMenuProps) {
  const { classNames, displayFormat, onChangeDisplayFormat, onChangeOutputFormat, outputFormat } =
    props;
  const [isOpen, setIsOpen] = useState(false);
  const [placement, setPlacement] = useState<PanelPlacement>(DEFAULT_PLACEMENT);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!isOpen) {
      setPlacement(DEFAULT_PLACEMENT);

      return;
    }

    if (!triggerRef.current || !panelRef.current) {
      return;
    }

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const panelHeight = panelRef.current.scrollHeight;
    const viewportHeight = window.innerHeight;

    const spaceBelow = viewportHeight - triggerRect.bottom - GAP;
    const spaceAbove = triggerRect.top - GAP;

    if (panelHeight <= spaceBelow) {
      setPlacement({ maxHeight: null, side: 'bottom' });
    } else if (panelHeight <= spaceAbove) {
      setPlacement({ maxHeight: null, side: 'top' });
    } else {
      const side = spaceAbove > spaceBelow ? 'top' : 'bottom';
      const maxHeight = Math.max(spaceAbove, spaceBelow);

      setPlacement({ maxHeight, side });
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const handleMouseDown = (event: MouseEvent) => {
      const target = event.target as Node;

      if (triggerRef.current?.contains(target) || panelRef.current?.contains(target)) {
        return;
      }

      setIsOpen(false);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const refocusTrigger = () => {
    // Put focus back on the trigger (which lives inside the ColorPicker DOM)
    // so ancestor popovers using focus-within dismissal do not fire when a
    // menu option is clicked.
    triggerRef.current?.focus();
  };

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-label="Color format settings"
        className={cn(
          'flex size-6 shrink-0 items-center justify-center rounded-sm text-neutral-500 dark:text-neutral-400 hover:bg-neutral-200/60 dark:hover:bg-neutral-700/60 focus-visible:outline-2 focus-visible:outline-blue-500',
          classNames?.trigger,
        )}
        data-testid="SettingsTrigger"
        onClick={() => setIsOpen(open => !open)}
        type="button"
      >
        <ThreeDotsVerticalIcon />
      </button>
      {isOpen && (
        <div
          ref={panelRef}
          className={cn(
            'absolute z-50 right-0 w-40 flex flex-col gap-3 rounded-lg border border-neutral-300 dark:border-neutral-600 bg-neutral-100 dark:bg-neutral-800 p-2 shadow-lg',
            'text-neutral-700 dark:text-neutral-200',
            placement.side === 'bottom' ? 'top-full mt-1' : 'bottom-full mb-1',
            placement.maxHeight !== null && 'overflow-y-auto',
            classNames?.menu,
          )}
          data-testid="SettingsMenu"
          style={placement.maxHeight !== null ? { maxHeight: placement.maxHeight } : undefined}
        >
          <RadioGroup
            onChange={onChangeDisplayFormat}
            onInteractionEnd={refocusTrigger}
            options={OPTIONS}
            title="Display format"
            value={displayFormat}
          />
          <div className="h-px bg-neutral-300 dark:bg-neutral-600" />
          <RadioGroup
            onChange={onChangeOutputFormat}
            onInteractionEnd={refocusTrigger}
            options={OPTIONS}
            title="Output format"
            value={outputFormat}
          />
        </div>
      )}
    </div>
  );
}
