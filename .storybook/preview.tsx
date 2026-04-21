import './preview.css';

import type { Decorator, Preview } from '@storybook/react-vite';

type Theme = 'light' | 'dark' | 'side';

const withTheme: Decorator = (Story, context) => {
  const theme = (context.globals.theme ?? 'light') as Theme;

  if (theme === 'side') {
    return (
      <div className="grid flex-1 grid-cols-2">
        <div className="flex items-center justify-center bg-neutral-100 p-6 text-neutral-900">
          <Story />
        </div>
        <div className="dark flex items-center justify-center bg-neutral-800 p-6 text-neutral-50">
          <Story />
        </div>
      </div>
    );
  }

  const wrapper =
    theme === 'dark'
      ? 'dark flex flex-1 items-center justify-center bg-neutral-900 p-6 text-neutral-50'
      : 'flex flex-1 items-center justify-center bg-neutral-100 p-6 text-neutral-900';

  return (
    <div className={wrapper}>
      <Story />
    </div>
  );
};

const preview: Preview = {
  decorators: [withTheme],
  globalTypes: {
    theme: {
      description: 'Theme',
      defaultValue: 'light',
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
    layout: 'fullscreen',
    controls: {
      expanded: true,
      disableSaveFromUI: true,
      matchers: {
        color: /^(background|color)$/i,
        date: /^date$/i,
      },
      sort: 'alpha',
    },
    backgrounds: { disable: true },
    a11y: { test: 'error' },
    options: {
      storySort: {
        order: [
          'ColorPicker',
          'AlphaSlider',
          'ChannelInputs',
          'ChannelSliders',
          'ModeSelector',
          'Swatch',
          '*',
        ],
      },
    },
  },
};

export default preview;
