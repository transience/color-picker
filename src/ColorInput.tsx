import {
  type ChangeEvent,
  type HTMLAttributes,
  type KeyboardEvent,
  type ReactNode,
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
   * Displayed color string when the input is not being edited (unfocused, or
   * right after a paste or Enter commits). The caller supplies
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

  // While editing, the input shows the typed text. A commit (whole-value
  // paste, Enter) ends editing so it shows `value` — the parent's canonical
  // form — and the next keystroke resumes editing from there.
  const displayValue = isEditing ? editValue : value;

  const handleFocus = () => {
    setIsEditing(true);
    setEditValue(value);
  };

  const handleBlur = () => {
    setIsEditing(false);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    // After a commit, editValue is the already-emitted text, not an edit.
    if (event.key !== 'Enter' || !isEditing) return;

    // `#rgba` is held while typing; Enter commits it. Anything else valid was
    // already emitted during typing.
    const hex = completeHex(editValue.trim(), true);

    if (hex?.length === 5) {
      onChange?.(hex);
    }

    setIsEditing(false);
  };

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const text = event.target.value;
    const trimmed = text.trim();
    // Per event, so it can't outlive the paste. Drops don't count.
    const isPaste = (event.nativeEvent as InputEvent).inputType === 'insertFromPaste';
    let emitted: string | null = null;

    if (HEX_PATTERN.test(trimmed)) {
      // Bare hex (e.g. "ff008e") is shown and emitted prefixed once complete;
      // incomplete hex waits for more input.
      emitted = completeHex(trimmed, isPaste);
      setEditValue(emitted ?? text);
    } else {
      emitted = isValidColor(trimmed) ? trimmed : null;
      setEditValue(text);
    }

    if (emitted) {
      onChange?.(emitted);
    }

    setIsEditing(!(isPaste && emitted));
  };

  return (
    <div
      className={cn(
        'flex items-center gap-2 w-full h-8 bg-black/10 dark:bg-white/10 rounded-lg px-2',
        'focus-within:ring-1 focus-within:ring-neutral-300 dark:focus-within:ring-neutral-600',
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
        onChange={handleChange}
        onFocus={handleFocus}
        onKeyDown={handleKeyDown}
        value={displayValue}
      />
      {endContent}
    </div>
  );
}
