import './preview.css';

import { FC, useEffect } from 'react';
import type { Preview } from '@storybook/react-vite';

import { cn } from '../src/modules/helpers';

const prefersDark =
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches;
const defaultTheme = prefersDark ? 'dark' : 'light';

// eslint-disable-next-line react-refresh/only-export-components
function PreviewDecorator(StoryFn: FC, context: Record<any, any>) {
  const {
    globals: { theme = defaultTheme },
    parameters: { className },
  } = context;

  useEffect(() => {
    if (theme === 'dark') {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
  }, [theme]);

  const baseClassName = 'flex items-center justify-center p-6';
  const lightClassNames = 'bg-neutral-100 text-neutral-900';
  const darkClassNames = 'dark bg-neutral-900 text-neutral-50';

  if (theme === 'side') {
    return (
      <div className="grid flex-1 grid-cols-2">
        <div className={cn(baseClassName, lightClassNames, className)}>
          <StoryFn />
        </div>
        <div className={cn(baseClassName, darkClassNames, className)}>
          <StoryFn />
        </div>
      </div>
    );
  }

  const wrapper =
    theme === 'dark'
      ? cn('flex-1', baseClassName, darkClassNames, className)
      : cn('flex-1', baseClassName, lightClassNames, className);

  return (
    <div className={wrapper}>
      <StoryFn />
    </div>
  );
}

const preview: Preview = {
  decorators: [PreviewDecorator],
  globalTypes: {
    theme: {
      description: 'Theme',
      defaultValue: defaultTheme,
      toolbar: {
        title: 'Theme',
        icon: 'paintbrush',
        items: [
          { value: 'light', title: 'Light', icon: 'circlehollow' },
          { value: 'dark', title: 'Dark', icon: 'circle' },
          { value: 'side', title: 'Side-by-side', icon: 'sidebar' },
        ],
        dynamicTitle: true,
      },
    },
  },
  parameters: {
    a11y: { test: 'error' },
    backgrounds: { disable: true },
    controls: {
      disableSaveFromUI: true,
      expanded: true,
      matchers: {
        color: /^(background|color)$/i,
        date: /^date$/i,
      },
      sort: 'alpha',
    },
    docs: {
      codePanel: true,
    },
    layout: 'fullscreen',
    options: {
      storySort: {
        order: ['ColorPicker', 'useColorPicker', '*'],
      },
    },
  },
};

export default preview;
