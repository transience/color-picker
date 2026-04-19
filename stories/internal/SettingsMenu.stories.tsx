import { ComponentProps, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';

import SettingsMenu from '../../src/SettingsMenu';
import type { ColorFormat } from '../../src/types';

const meta: Meta<typeof SettingsMenu> = {
  title: 'SettingsMenu',
  component: SettingsMenu,
  args: {
    onChangeDisplayFormat: fn(),
    onChangeOutputFormat: fn(),
    displayFormat: 'auto',
    outputFormat: 'auto',
  },
};

export default meta;

type Story = StoryObj<typeof SettingsMenu>;

function Controlled(props: ComponentProps<typeof SettingsMenu>) {
  const { displayFormat: initialDisplay, outputFormat: initialOutput, ...rest } = props;
  const [displayFormat, setDisplayFormat] = useState<ColorFormat>(initialDisplay);
  const [outputFormat, setOutputFormat] = useState<ColorFormat>(initialOutput);

  return (
    <SettingsMenu
      {...rest}
      displayFormat={displayFormat}
      onChangeDisplayFormat={format => {
        setDisplayFormat(format);
        rest.onChangeDisplayFormat(format);
      }}
      onChangeOutputFormat={format => {
        setOutputFormat(format);
        rest.onChangeOutputFormat(format);
      }}
      outputFormat={outputFormat}
    />
  );
}

export const Default: Story = {
  render: arguments_ => <Controlled {...arguments_} />,
};

/**
 * Verifies that after picking an option, focus returns to the trigger button.
 * The component does this explicitly so that ancestor popovers relying on
 * focus-within dismissal don't close when a menu option is clicked. Hard to
 * test in jsdom where focus semantics are approximated.
 */
export const FocusReturnsToTriggerAfterSelection: Story = {
  render: arguments_ => <Controlled {...arguments_} />,
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = await canvas.findByTestId('SettingsTrigger');

    await userEvent.click(trigger);

    const menu = await canvas.findByTestId('SettingsMenu');
    const menuScope = within(menu);
    const displayGroupTitle = menuScope.getByText('Display format');
    const displayGroup = displayGroupTitle.closest('[data-testid="RadioGroup"]') as HTMLElement;
    const hexButton = within(displayGroup).getByRole('button', { name: 'Hex' });

    await userEvent.click(hexButton);

    await expect(args.onChangeDisplayFormat).toHaveBeenCalledWith('hex');
    await expect(trigger).toHaveFocus();
  },
};
