import { type ReactNode, useState } from 'react';
import { isValidColor } from 'colorizr';

import { cn } from './modules/helpers';
import type { ColorInputClassNames } from './types';

interface ColorInputProps {
  /** Per-part className overrides (`root` = bordered wrapper, `input` = inner `<input>`). */
  classNames?: ColorInputClassNames;
  /** Content rendered at the right edge of the input. */
  endContent?: ReactNode;
  /**
   * Called with the typed value each time it becomes a valid CSS color.
   * Bare hex strings (e.g. `ff0044`) are auto-prefixed with `#` before emit.
   * Incomplete hex input is held until valid — no partial emissions.
   */
  onChange: (value: string) => void;
  /** Content rendered at the left edge of the input. */
  startContent?: ReactNode;
  /**
   * Displayed color string when the input is not focused. The caller supplies
   * this in its preferred format (hex, `oklch(...)`, etc.).
   */
  value: string;
}

export default function ColorInput(props: ColorInputProps) {
  const { classNames, endContent, onChange, startContent, value } = props;
  const [editValue, setEditValue] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  const displayValue = isEditing ? editValue : value;

  const handleFocus = () => {
    setIsEditing(true);
    setEditValue(value);
  };

  const handleBlur = () => {
    setIsEditing(false);
  };

  const handleChange = (text: string) => {
    const trimmed = text.trim();
    const bareHexPattern = /^(?:[\da-f]{3}){1,2}$/i;

    // Bare hex without # (e.g. "ff008e")
    if (bareHexPattern.test(trimmed)) {
      const prefixed = `#${trimmed}`;

      setEditValue(prefixed);
      onChange(prefixed);

      return;
    }

    setEditValue(text);

    // Incomplete hex — wait for more input
    if (/^#[\da-f]+$/i.test(trimmed) && trimmed.length !== 4 && trimmed.length !== 7) {
      return;
    }

    if (isValidColor(trimmed)) {
      onChange(trimmed);
    }
  };

  return (
    <div
      className={cn(
        'flex items-center gap-2 w-full h-8 bg-black/10 dark:bg-white/10 rounded-lg px-2',
        {
          'ring-1 ring-neutral-300 dark:ring-neutral-600': isEditing,
        },
        classNames?.root,
      )}
      data-testid="ColorInput"
    >
      {startContent}
      <input
        aria-label="Color value"
        className={cn('w-full bg-transparent text-sm outline-none', classNames?.input)}
        onBlur={handleBlur}
        onChange={event => handleChange(event.target.value)}
        onFocus={handleFocus}
        value={displayValue}
      />
      {endContent}
    </div>
  );
}
