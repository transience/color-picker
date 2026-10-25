import { type ButtonHTMLAttributes, useEffect, useRef, useState } from 'react';

import useId from '~/hooks/useId';
import { cn, mergeProps, resolveLabel } from '~/modules/helpers';

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
  'min-w-70 overflow-hidden outline-none rounded-lg shadow-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200';

export const defaultProps = {
  displayFormat: 'auto',
  displayFormatDisabled: false,
  outputFormat: 'auto',
  outputFormatDisabled: false,
  placement: 'bottom-end',
} satisfies SettingsMenuProps;

export default function SettingsMenu(props: SettingsMenuProps) {
  const {
    classNames,
    displayFormat,
    displayFormatDisabled,
    labels,
    onChangeDisplayFormat,
    onChangeOutputFormat,
    outputFormat,
    outputFormatDisabled,
    placement,
    triggerProps,
  } = mergeProps(defaultProps, props);
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId('settings-title');

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
  // the picker as focused, and to satisfy the WAI-ARIA dialog pattern. Passive
  // dismiss (outside click) leaves focus where the user moved it —
  // restoring would steal focus from the element they just clicked.
  const closeAndReturnFocus = () => {
    setIsOpen(false);
    triggerRef.current?.focus();
  };

  useEffect(() => {
    if (!isOpen) return undefined;

    // The panel is portal'd to the end of `document.body`, so Tab from the
    // trigger would reach it only after the rest of the page. Unchecked radios
    // are skipped (roving tabindex); the panel itself is the fallback when
    // every control is hidden or disabled.
    const panel = panelRef.current;
    const target =
      panel?.querySelector<HTMLElement>('button:not(:disabled):not([tabindex="-1"])') ?? panel;

    target?.focus({ preventScroll: true });

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        triggerRef.current?.focus();
      }
    };

    // Capture phase: Floater closes on the same Escape, and the re-render it
    // triggers removes this listener before a bubble-phase one would run.
    document.addEventListener('keydown', handleKeyDown, true);

    return () => document.removeEventListener('keydown', handleKeyDown, true);
  }, [isOpen]);

  let header = null;

  if (titleLabel || doneLabel) {
    header = (
      <div className="flex items-center justify-between">
        {!!titleLabel && (
          <p className="text-sm font-semibold" id={titleId}>
            {titleLabel}
          </p>
        )}
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
    <div
      ref={panelRef}
      aria-label={titleLabel ? undefined : triggerLabel}
      aria-labelledby={titleLabel ? titleId : undefined}
      className={cn(PANEL_CLASSES, classNames?.menu)}
      data-testid="SettingsMenu"
      role="dialog"
      tabIndex={-1}
    >
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
          aria-haspopup="dialog"
          className={cn(triggerProps?.className, classNames?.trigger)}
          data-testid="SettingsTrigger"
        >
          <GearIcon />
        </Button>
      </Floater>
    </div>
  );
}
