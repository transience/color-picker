import { type KeyboardEvent, type ReactNode, useRef } from 'react';

import useId from '~/hooks/useId';
import { cn } from '~/modules/helpers';

import type { ColorFormat, SettingsOption } from '~/types';

interface RadioGroupProps {
  onChange?: (format: ColorFormat) => void;
  options: SettingsOption[];
  title: ReactNode;
  value: ColorFormat;
}

export default function RadioGroup(props: RadioGroupProps) {
  const { onChange, options, title, value } = props;
  const titleId = useId('radiogroup-title');
  const buttonsRef = useRef<(HTMLButtonElement | null)[]>([]);

  const selectedIndex = options.findIndex(option => option.value === value);
  const tabStopIndex = selectedIndex === -1 ? 0 : selectedIndex;

  const focusAndSelect = (index: number) => {
    const option = options[index];

    if (!option) return;
    buttonsRef.current[index]?.focus();
    onChange?.(option.value);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const last = options.length - 1;
    const current = selectedIndex === -1 ? 0 : selectedIndex;

    switch (event.key) {
      case 'ArrowDown':
      case 'ArrowRight':
        event.preventDefault();
        focusAndSelect(current === last ? 0 : current + 1);
        break;
      case 'ArrowUp':
      case 'ArrowLeft':
        event.preventDefault();
        focusAndSelect(current === 0 ? last : current - 1);
        break;
      case 'Home':
        event.preventDefault();
        focusAndSelect(0);
        break;
      case 'End':
        event.preventDefault();
        focusAndSelect(last);
        break;
      default:
        break;
    }
  };

  return (
    // The radiogroup itself is not focusable — focus is managed via roving
    // tabindex on the radio children per WAI-ARIA radio-group pattern.
    // eslint-disable-next-line jsx-a11y/interactive-supports-focus
    <div
      aria-labelledby={titleId}
      className="flex flex-col flex-1"
      data-testid="RadioGroup"
      onKeyDown={handleKeyDown}
      role="radiogroup"
    >
      <div
        className="text-xs font-semibold uppercase text-neutral-600 dark:text-neutral-500"
        id={titleId}
      >
        {title}
      </div>
      {options.map((option, index) => {
        const isSelected = option.value === value;

        return (
          <button
            key={option.value}
            ref={node => {
              buttonsRef.current[index] = node;
            }}
            aria-checked={isSelected}
            className={cn(
              'flex items-center justify-between h-6 text-sm text-left leading-none',
              'text-neutral-700 dark:text-neutral-300',
              'hover:text-neutral-900 dark:hover:text-neutral-50',
              'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-black/40 dark:focus-visible:ring-white/40 rounded',
              {
                'text-neutral-900 dark:text-neutral-50': isSelected,
              },
            )}
            onClick={() => onChange?.(option.value)}
            role="radio"
            tabIndex={index === tabStopIndex ? 0 : -1}
            type="button"
          >
            <span>{option.label}</span>
            <span
              aria-hidden
              className={cn(
                'size-2.5 rounded-full border border-neutral-400 dark:border-neutral-500',
                isSelected &&
                  'bg-neutral-900 dark:bg-neutral-50 border-neutral-900 dark:border-neutral-50',
              )}
            />
          </button>
        );
      })}
    </div>
  );
}
