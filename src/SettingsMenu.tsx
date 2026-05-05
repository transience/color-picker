import { type ButtonHTMLAttributes, useEffect, useRef, useState } from 'react';

import { cn, resolveLabel } from '~/modules/helpers';

import GearIcon from '~/components/GearIcon';

import Button from './components/Button';
import Floater, { type FloaterPlacement } from './components/Floater';
import RadioGroup from './components/RadioGroup';
import { DEFAULT_LABELS } from './constants';
import type {
  ColorFormat,
  ColorPickerLabels,
  SettingsMenuClassNames,
  SettingsOption,
} from './types';

interface SettingsMenuProps {
  /** Per-part className overrides (`trigger` = button, `menu` = popover panel). */
  classNames?: SettingsMenuClassNames;
  /**
   * Current display format selection.
   * @default 'auto'
   */
  displayFormat?: ColorFormat;
  /**
   * Disables the display-format radio (set when `displayFormat` is consumer-controlled).
   */
  displayFormatDisabled?: boolean;
  /** Label/aria overrides. */
  labels?: ColorPickerLabels['settingsMenu'];
  /**
   * Fired when the user picks a new display format in the menu.
   */
  onChangeDisplayFormat?: (format: ColorFormat) => void;
  /**
   * Fired when the user picks a new output format in the menu.
   */
  onChangeOutputFormat?: (format: ColorFormat) => void;
  /**
   * Current output format selection.
   * @default 'auto'
   */
  outputFormat?: ColorFormat;
  /**
   * Disables the output-format radio (set when `outputFormat` is consumer-controlled).
   */
  outputFormatDisabled?: boolean;
  /**
   * Floater placement relative to the trigger.
   * @default 'bottom-end'
   */
  placement?: FloaterPlacement;
  /** Native HTML attributes forwarded to the trigger `<button>`. Internal a11y/handler attrs win. */
  triggerProps?: Omit<
    ButtonHTMLAttributes<HTMLButtonElement>,
    'aria-expanded' | 'aria-haspopup' | 'onClick' | 'type' | 'children'
  >;
}

const OPTIONS: SettingsOption[] = [
  { label: 'Auto', value: 'auto' },
  { label: 'Hex', value: 'hex' },
  { label: 'RGB', value: 'rgb' },
  { label: 'HSL', value: 'hsl' },
  { label: 'OkLCH', value: 'oklch' },
  { label: 'OkLab', value: 'oklab' },
];

const PANEL_CLASSES =
  'min-w-70 overflow-hidden rounded-lg shadow-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200';

export default function SettingsMenu(props: SettingsMenuProps) {
  const {
    classNames,
    displayFormat = 'auto',
    displayFormatDisabled = false,
    labels,
    onChangeDisplayFormat,
    onChangeOutputFormat,
    outputFormat = 'auto',
    outputFormatDisabled = false,
    placement = 'bottom-end',
    triggerProps,
  } = props;
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const triggerLabel = labels?.trigger ?? DEFAULT_LABELS.settingsMenu.trigger;
  const titleLabel = resolveLabel(DEFAULT_LABELS.settingsMenu.title, labels?.title);
  const closeLabel = labels?.close ?? DEFAULT_LABELS.settingsMenu.close;
  const doneLabel = resolveLabel(DEFAULT_LABELS.settingsMenu.done, labels?.done);
  const displayFormatLabel = resolveLabel(
    DEFAULT_LABELS.settingsMenu.displayFormat,
    labels?.displayFormat,
  );
  const outputFormatLabel = resolveLabel(
    DEFAULT_LABELS.settingsMenu.outputFormat,
    labels?.outputFormat,
  );

  // Explicit dismiss (Done button, Esc) restores focus to the trigger so
  // ancestor focus-within popovers (HeroUI / React Aria hosts) keep treating
  // the picker as focused, and to satisfy the WAI-ARIA menu pattern. Passive
  // dismiss (outside click) leaves focus where the user moved it —
  // restoring would steal focus from the element they just clicked.
  const closeAndReturnFocus = () => {
    setIsOpen(false);
    triggerRef.current?.focus();
  };

  useEffect(() => {
    if (!isOpen) return undefined;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        triggerRef.current?.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  let header = null;

  if (titleLabel || doneLabel) {
    header = (
      <div className="flex items-center justify-between">
        {!!titleLabel && <p className="text-sm font-semibold">{titleLabel}</p>}
        {!!doneLabel && (
          <button
            aria-label={closeLabel}
            className="px-2 py-1 rounded-sm text-sm leading-none hover:bg-neutral-200 dark:hover:bg-neutral-700"
            onClick={closeAndReturnFocus}
            type="button"
          >
            {doneLabel}
          </button>
        )}
      </div>
    );
  }

  const panel = (
    <div className={cn(PANEL_CLASSES, classNames?.menu)} data-testid="SettingsMenu">
      <div className="flex flex-col gap-3 p-3">
        {header}
        <div className="flex flex-row justify-center flex-1 gap-6">
          <RadioGroup
            disabled={displayFormatDisabled}
            onChange={onChangeDisplayFormat}
            options={OPTIONS}
            title={displayFormatLabel}
            value={displayFormat}
          />
          <RadioGroup
            disabled={outputFormatDisabled}
            onChange={onChangeOutputFormat}
            options={OPTIONS}
            title={outputFormatLabel}
            value={outputFormat}
          />
        </div>
      </div>
    </div>
  );

  return (
    <div data-testid="SettingsMenuWrapper">
      <Floater
        content={panel}
        eventType="click"
        onOpenChange={setIsOpen}
        open={isOpen}
        placement={placement}
      >
        <Button
          aria-label={triggerLabel}
          {...triggerProps}
          ref={triggerRef}
          aria-expanded={isOpen}
          aria-haspopup="menu"
          className={cn(triggerProps?.className, classNames?.trigger)}
          data-testid="SettingsTrigger"
        >
          <GearIcon />
        </Button>
      </Floater>
    </div>
  );
}
