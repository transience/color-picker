import {
  type HTMLAttributes,
  type KeyboardEvent,
  type ReactNode,
  useEffect,
  useRef,
  useState,
} from 'react';
import { isValidColor } from 'colorizr';

import { DEFAULT_COLOR, DEFAULT_LABELS } from './constants';
import { cn, mergeProps } from './modules/helpers';
import type { ColorInputClassNames } from './types';

interface ColorInputProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onChange'> {
  /**
   * Accessible label for the underlying `<input>`.
   * @default 'Color value'
   */
  'aria-label'?: string;
  /** Per-part className overrides (`root` = bordered wrapper, `input` = inner `<input>`). */
  classNames?: ColorInputClassNames;
  /** Content rendered at the right edge of the input. */
  endContent?: ReactNode;
  /**
   * Called with the typed value each time it becomes a valid CSS color.
   * Bare hex strings (e.g. `ff0044`) are auto-prefixed with `#` before emit.
   * Accepts 3, 6 and 8-digit hex as typed; 4-digit (`#rgba`) only on paste or
   * Enter, since it is also a partial 6-digit hex.
   *
   * Invalid input is held until valid — no partial emissions.
   */
  onChange?: (value: string) => void;
  /** Content rendered at the left edge of the input. */
  startContent?: ReactNode;
  /**
   * Displayed color string when the input is not focused. The caller supplies
   * this in its preferred format (hex, `oklch(...)`, etc.).
   * @default DEFAULT_COLOR
   */
  value?: string;
}

const HEX_PATTERN = /^#?([\da-f]+)$/i;

/**
 * Returns `#`-prefixed hex when `text` is complete enough to emit. 4 digits
 * (`#rgba`) is also the prefix of a 6-digit hex being typed, so it only
 * counts when the value arrived whole (paste, Enter).
 */
function completeHex(text: string, isWhole: boolean): string | null {
  const match = HEX_PATTERN.exec(text);

  if (!match) return null;

  const { length } = match[1];

  if (length === 3 || length === 6 || length === 8 || (length === 4 && isWhole)) {
    return `#${match[1]}`;
  }

  return null;
}

export const defaultProps = {
  'aria-label': DEFAULT_LABELS.colorInput,
  value: DEFAULT_COLOR,
} satisfies ColorInputProps;

export default function ColorInput(props: ColorInputProps) {
  const {
    'aria-label': ariaLabel,
    className,
    classNames,
    endContent,
    onChange,
    startContent,
    value,
    ...rest
  } = mergeProps(defaultProps, props);
  const [editValue, setEditValue] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const pendingSyncRef = useRef(false);

  const displayValue = isEditing ? editValue : value;

  // Sync editValue ← value after an explicit commit event (paste, Enter)
  // so the input reflects the parent's canonical/reformatted color.
  useEffect(() => {
    if (pendingSyncRef.current) {
      setEditValue(value);
      pendingSyncRef.current = false;
    }
  }, [value]);

  const handleFocus = () => {
    setIsEditing(true);
    setEditValue(value);
  };

  const handleBlur = () => {
    setIsEditing(false);
    pendingSyncRef.current = false;
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== 'Enter') return;

    // `#rgba` is held while typing; Enter commits it and syncs the display
    // once the parent echoes the canonical value.
    const hex = completeHex(editValue.trim(), true);

    if (hex?.length === 5) {
      pendingSyncRef.current = true;
      onChange?.(hex);

      return;
    }

    // Anything else was already emitted during typing; just sync the display.
    setEditValue(value);
  };

  const handlePaste = () => {
    pendingSyncRef.current = true;
  };

  const handleChange = (text: string) => {
    const trimmed = text.trim();

    if (HEX_PATTERN.test(trimmed)) {
      const hex = completeHex(trimmed, pendingSyncRef.current);

      // Bare hex (e.g. "ff008e") is shown prefixed once complete; incomplete
      // hex waits for more input.
      setEditValue(hex ?? text);

      if (hex) onChange?.(hex);

      return;
    }

    setEditValue(text);

    if (isValidColor(trimmed)) {
      onChange?.(trimmed);
    } else {
      pendingSyncRef.current = false;
    }
  };

  return (
    <div
      className={cn(
        'flex items-center gap-2 w-full h-8 bg-black/10 dark:bg-white/10 rounded-lg px-2',
        {
          'ring-1 ring-neutral-300 dark:ring-neutral-600': isEditing,
        },
        className,
        classNames?.root,
      )}
      data-testid="ColorInput"
      {...rest}
    >
      {startContent}
      <input
        aria-label={ariaLabel}
        className={cn('w-full bg-transparent text-sm outline-none', classNames?.input)}
        onBlur={handleBlur}
        onChange={event => handleChange(event.target.value)}
        onFocus={handleFocus}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        value={displayValue}
      />
      {endContent}
    </div>
  );
}
