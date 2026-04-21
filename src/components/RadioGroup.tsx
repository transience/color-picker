import { cn } from '~/modules/helpers';

import type { ColorFormat, SettingsOption } from '~/types';

interface RadioGroupProps {
  onChange: (format: ColorFormat) => void;
  onInteractionEnd: () => void;
  options: SettingsOption[];
  title: string;
  value: ColorFormat;
}

export default function RadioGroup(props: RadioGroupProps) {
  const { onChange, onInteractionEnd, options, title, value } = props;

  return (
    <div className="flex flex-col flex-1" data-testid="RadioGroup">
      <div className="text-xs font-semibold uppercase text-neutral-600 dark:text-neutral-500">
        {title}
      </div>
      {options.map(option => {
        const isSelected = option.value === value;

        return (
          <button
            key={option.value}
            className={cn(
              'flex items-center justify-between py-1.5 text-sm text-left leading-none',
              'text-neutral-700 dark:text-neutral-300',
              'hover:text-neutral-900 dark:hover:text-neutral-50',
              {
                'text-neutral-900 dark:text-neutral-50': isSelected,
              },
            )}
            onClick={() => {
              onChange(option.value);
              onInteractionEnd();
            }}
            // Prevent the click from stealing focus so ancestor popovers
            // (HeroUI / React Aria) don't treat it as focus moving outside.
            onMouseDown={event => event.preventDefault()}
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
