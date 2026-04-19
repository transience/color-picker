import { type KeyboardEvent, useState } from 'react';

import { cn, quantize } from '../modules/helpers';
import type { NumericInputClassNames } from '../types';

interface NumericInputProps {
  /** Accessible label for the input. */
  'aria-label'?: string;
  /** Per-part className overrides (`root`, `input`, `suffix`). */
  classNames?: NumericInputClassNames;
  /** Maximum allowed value. Typed and blurred values are clamped to this. */
  max: number;
  /** Minimum allowed value. Typed and blurred values are clamped to this. */
  min: number;
  /** Called with the committed numeric value on typing, arrow keys, and blur. */
  onChange: (value: number) => void;
  /**
   * Increment used by `ArrowUp` / `ArrowDown` (and `10x` with `Shift`). Also
   * determines the decimal precision when quantizing keyboard steps.
   * @default 1
   */
  step?: number;
  /**
   * Text shown to the right of the input (e.g. `%`, `°`). Pass a single space
   * to reserve width for alignment without rendering a visible suffix.
   */
  suffix?: string;
  /** Displayed value as a string so callers can control precision and formatting. */
  value: string;
}

export default function NumericInput(props: NumericInputProps) {
  const {
    'aria-label': ariaLabel,
    classNames,
    max,
    min,
    onChange,
    step = 1,
    suffix,
    value,
  } = props;
  const [editValue, setEditValue] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  const displayValue = isEditing ? editValue : value;

  const clamp = (n: number) => Math.min(max, Math.max(min, n));

  const commit = (raw: string) => {
    if (raw.endsWith('.') || raw.endsWith(',')) return;

    const parsed = Number.parseFloat(raw.replace(',', '.'));

    if (!Number.isNaN(parsed)) {
      onChange(clamp(parsed));
    }
  };

  const handleFocus = () => {
    setIsEditing(true);
    setEditValue(value);
  };

  const handleChange = (newValue: string) => {
    const filtered = newValue.replace(/[^\d,.]/g, '').replace(',', '.');

    setEditValue(filtered);
    commit(filtered);
  };

  const handleBlur = () => {
    const parsed = Number.parseFloat(editValue.replace(',', '.'));

    if (!Number.isNaN(parsed)) {
      onChange(clamp(parsed));
    }

    setIsEditing(false);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
      event.preventDefault();

      const current = Number.parseFloat((isEditing ? editValue : value).replace(',', '.')) || 0;
      const increment = event.shiftKey ? step * 10 : step;
      const raw = event.key === 'ArrowUp' ? current + increment : current - increment;
      const next = clamp(quantize(raw, step));

      setEditValue(String(next));
      onChange(next);
    }
  };

  return (
    <div className={cn('flex items-center', classNames?.root)} data-testid="NumericInput">
      <input
        aria-label={ariaLabel}
        className={cn(
          'w-11 bg-neutral-100 dark:bg-neutral-800 text-right text-sm text-neutral-600 dark:text-neutral-300 outline-none focus:ring-1 focus:ring-neutral-300 dark:focus:ring-neutral-600 rounded px-0.5',
          classNames?.input,
        )}
        onBlur={handleBlur}
        onChange={event => handleChange(event.target.value)}
        onFocus={handleFocus}
        onKeyDown={handleKeyDown}
        type="text"
        value={displayValue}
      />
      {suffix && (
        <span
          className={cn('w-2 text-xs text-neutral-500 dark:text-neutral-400', classNames?.suffix)}
          style={suffix === ' ' ? { visibility: 'hidden' } : undefined}
        >
          {suffix === ' ' ? '°' : suffix}
        </span>
      )}
    </div>
  );
}
