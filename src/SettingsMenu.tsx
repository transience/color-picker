import { type ButtonHTMLAttributes, useRef, useState } from 'react';

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
    labels,
    onChangeDisplayFormat,
    onChangeOutputFormat,
    outputFormat = 'auto',
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

  // Returning focus to the trigger keeps ancestor focus-within popovers
  // (HeroUI / React Aria hosts) from treating an option click as focus
  // leaving the picker.
  const refocusTrigger = () => {
    triggerRef.current?.focus();
  };

  const panel = (
    <div className={cn(PANEL_CLASSES, classNames?.menu)} data-testid="SettingsMenu">
      <div className="flex flex-col gap-3 p-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold">{titleLabel}</p>
          <button
            aria-label={closeLabel}
            className="px-2 py-1 rounded-sm text-sm leading-none hover:bg-neutral-200 dark:hover:bg-neutral-700"
            onClick={() => setIsOpen(false)}
            type="button"
          >
            {doneLabel}
          </button>
        </div>
        <div className="flex flex-row justify-center flex-1 gap-6">
          <RadioGroup
            onChange={onChangeDisplayFormat}
            onInteractionEnd={refocusTrigger}
            options={OPTIONS}
            title={displayFormatLabel}
            value={displayFormat}
          />
          <RadioGroup
            onChange={onChangeOutputFormat}
            onInteractionEnd={refocusTrigger}
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
