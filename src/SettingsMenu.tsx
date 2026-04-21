import { RefObject, useEffect, useLayoutEffect, useRef, useState } from 'react';

import { cn } from '~/modules/helpers';

import GearIcon from '~/components/GearIcon';

import Button from './components/Button';
import RadioGroup from './components/RadioGroup';
import type { ColorFormat, SettingsMenuClassNames, SettingsOption } from './types';

interface SettingsMenuProps {
  /** Per-part className overrides (`trigger` = button, `menu` = popover panel). */
  classNames?: SettingsMenuClassNames;
  containerRef: RefObject<HTMLDivElement | null>;
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

const GAP = 8;
const ITEM_WIDTH = 144;
const MIN_HORIZONTAL_WIDTH = ITEM_WIDTH * 2 + GAP * 3;
// Paired with the `duration-200` class on the panel — keep these in sync.
const CLOSE_DURATION_MS = 200;
const CLOSE_UNMOUNT_SLACK_MS = 50;

export default function SettingsMenu(props: SettingsMenuProps) {
  const {
    classNames,
    containerRef,
    displayFormat,
    onChangeDisplayFormat,
    onChangeOutputFormat,
    outputFormat,
  } = props;
  const [isOpen, setIsOpen] = useState(false);
  const [isRendered, setIsRendered] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [layout, setLayout] = useState('column');
  const [height, setHeight] = useState<string | number>('auto');
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const el = containerRef.current;

    if (!el) {
      return undefined;
    }

    const measure = () => {
      setHeight(el.clientHeight * 0.8);
      setLayout(el.clientWidth >= MIN_HORIZONTAL_WIDTH ? 'row' : 'column');
    };

    measure();

    if (typeof ResizeObserver === 'undefined') {
      return undefined;
    }

    const observer = new ResizeObserver(measure);

    observer.observe(el);

    return () => observer.disconnect();
  }, [containerRef, isOpen]);

  useEffect(() => {
    if (isOpen) {
      setIsRendered(true);
      const frame = requestAnimationFrame(() => setIsVisible(true));

      return () => cancelAnimationFrame(frame);
    }

    setIsVisible(false);
    const timer = setTimeout(
      () => setIsRendered(false),
      CLOSE_DURATION_MS + CLOSE_UNMOUNT_SLACK_MS,
    );

    return () => clearTimeout(timer);
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
    <div data-testid="SettingsMenuWrapper">
      <Button
        ref={triggerRef}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-label="Color format settings"
        className={classNames?.trigger}
        data-testid="SettingsTrigger"
        onClick={() => setIsOpen(open => !open)}
      >
        <GearIcon />
      </Button>
      {isRendered && (
        <>
          <div className="absolute inset-0" onClick={() => setIsOpen(false)} role="presentation" />
          <div
            ref={panelRef}
            aria-hidden={!isOpen}
            className={cn(
              'absolute z-50 left-0 right-0 bottom-0',
              'overflow-hidden rounded-t-lg shadow-lg',
              'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200',
              'transition-transform duration-200 ease-out',
              isVisible ? 'translate-y-0' : 'translate-y-full',
              classNames?.menu,
            )}
            data-testid="SettingsMenu"
          >
            <div className="flex flex-col overflow-y-auto" style={{ maxHeight: height }}>
              <div className="sticky top-0 flex items-center justify-between p-3 bg-neutral-100 dark:bg-neutral-800">
                <p className="text-sm font-semibold">Settings</p>
                <button
                  aria-label="Close settings"
                  className="px-2 py-1 rounded-sm text-sm leading-none hover:bg-neutral-200 dark:hover:bg-neutral-700"
                  onClick={() => setIsOpen(false)}
                  type="button"
                >
                  Done
                </button>
              </div>
              <div
                className={cn('flex flex-col flex-1 gap-3 pb-3 px-3', {
                  'flex-row justify-center': layout === 'row',
                })}
              >
                <RadioGroup
                  onChange={onChangeDisplayFormat}
                  onInteractionEnd={refocusTrigger}
                  options={OPTIONS}
                  title="Display format"
                  value={displayFormat}
                />
                {layout === 'column' && <div className="h-px bg-neutral-300 dark:bg-neutral-600" />}
                <RadioGroup
                  onChange={onChangeOutputFormat}
                  onInteractionEnd={refocusTrigger}
                  options={OPTIONS}
                  title="Output format"
                  value={outputFormat}
                />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
