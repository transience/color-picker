import SettingsMenu from '~/SettingsMenu';
import { fireEvent, render, screen, within } from '~/test-utils';

function getGroup(title: 'Display format' | 'Output format'): HTMLElement {
  const titleEl = screen.getByText(title);
  const group = titleEl.closest('[data-testid="RadioGroup"]');

  if (!(group instanceof HTMLElement)) {
    throw new TypeError(`Could not find RadioGroup containing title "${title}"`);
  }

  return group;
}

describe('SettingsMenu', () => {
  it('renders only the trigger when closed', () => {
    render(
      <SettingsMenu
        displayFormat="auto"
        onChangeDisplayFormat={() => {}}
        onChangeOutputFormat={() => {}}
        outputFormat="auto"
      />,
    );

    expect(screen.getByTestId('SettingsTrigger')).toBeInTheDocument();
    expect(screen.queryByTestId('SettingsMenu')).not.toBeInTheDocument();
  });

  it('sets aria-expanded=false on the trigger when closed', () => {
    render(
      <SettingsMenu
        displayFormat="auto"
        onChangeDisplayFormat={() => {}}
        onChangeOutputFormat={() => {}}
        outputFormat="auto"
      />,
    );

    expect(screen.getByTestId('SettingsTrigger')).toHaveAttribute('aria-expanded', 'false');
  });

  it('opens the panel and flips aria-expanded on trigger click', () => {
    render(
      <SettingsMenu
        displayFormat="auto"
        onChangeDisplayFormat={() => {}}
        onChangeOutputFormat={() => {}}
        outputFormat="auto"
      />,
    );

    fireEvent.click(screen.getByTestId('SettingsTrigger'));

    expect(screen.getByTestId('SettingsMenu')).toBeInTheDocument();
    expect(screen.getByTestId('SettingsTrigger')).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('Display format')).toBeInTheDocument();
    expect(screen.getByText('Output format')).toBeInTheDocument();
  });

  it('fires onChangeDisplayFormat with the selected value', () => {
    const onChangeDisplayFormat = vi.fn();

    render(
      <SettingsMenu
        displayFormat="auto"
        onChangeDisplayFormat={onChangeDisplayFormat}
        onChangeOutputFormat={() => {}}
        outputFormat="auto"
      />,
    );

    fireEvent.click(screen.getByTestId('SettingsTrigger'));
    fireEvent.click(within(getGroup('Display format')).getByRole('button', { name: 'Hex' }));

    expect(onChangeDisplayFormat).toHaveBeenCalledWith('hex');
  });

  it('fires onChangeOutputFormat with the selected value', () => {
    const onChangeOutputFormat = vi.fn();

    render(
      <SettingsMenu
        displayFormat="auto"
        onChangeDisplayFormat={() => {}}
        onChangeOutputFormat={onChangeOutputFormat}
        outputFormat="auto"
      />,
    );

    fireEvent.click(screen.getByTestId('SettingsTrigger'));
    fireEvent.click(within(getGroup('Output format')).getByRole('button', { name: 'RGB' }));

    expect(onChangeOutputFormat).toHaveBeenCalledWith('rgb');
  });

  it('does not cross the two groups (Hex in Display ≠ Hex in Output)', () => {
    const onChangeDisplayFormat = vi.fn();
    const onChangeOutputFormat = vi.fn();

    render(
      <SettingsMenu
        displayFormat="auto"
        onChangeDisplayFormat={onChangeDisplayFormat}
        onChangeOutputFormat={onChangeOutputFormat}
        outputFormat="auto"
      />,
    );

    fireEvent.click(screen.getByTestId('SettingsTrigger'));
    fireEvent.click(within(getGroup('Output format')).getByRole('button', { name: 'Hex' }));

    expect(onChangeOutputFormat).toHaveBeenCalledWith('hex');
    expect(onChangeDisplayFormat).not.toHaveBeenCalled();
  });

  it('returns focus to the trigger after a selection', () => {
    render(
      <SettingsMenu
        displayFormat="auto"
        onChangeDisplayFormat={() => {}}
        onChangeOutputFormat={() => {}}
        outputFormat="auto"
      />,
    );

    const trigger = screen.getByTestId('SettingsTrigger');

    fireEvent.click(trigger);
    fireEvent.click(within(getGroup('Display format')).getByRole('button', { name: 'Hex' }));

    expect(trigger).toHaveFocus();
  });

  it('closes on Escape', () => {
    render(
      <SettingsMenu
        displayFormat="auto"
        onChangeDisplayFormat={() => {}}
        onChangeOutputFormat={() => {}}
        outputFormat="auto"
      />,
    );

    fireEvent.click(screen.getByTestId('SettingsTrigger'));
    expect(screen.getByTestId('SettingsMenu')).toBeInTheDocument();

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByTestId('SettingsMenu')).not.toBeInTheDocument();
  });

  it('closes on outside mousedown', () => {
    render(
      <>
        <button data-testid="outside" type="button">
          outside
        </button>
        <SettingsMenu
          displayFormat="auto"
          onChangeDisplayFormat={() => {}}
          onChangeOutputFormat={() => {}}
          outputFormat="auto"
        />
      </>,
    );

    fireEvent.click(screen.getByTestId('SettingsTrigger'));
    expect(screen.getByTestId('SettingsMenu')).toBeInTheDocument();

    fireEvent.mouseDown(screen.getByTestId('outside'));
    expect(screen.queryByTestId('SettingsMenu')).not.toBeInTheDocument();
  });

  it('stays open when clicking inside the panel (but outside a button)', () => {
    render(
      <SettingsMenu
        displayFormat="auto"
        onChangeDisplayFormat={() => {}}
        onChangeOutputFormat={() => {}}
        outputFormat="auto"
      />,
    );

    fireEvent.click(screen.getByTestId('SettingsTrigger'));
    fireEvent.mouseDown(screen.getByTestId('SettingsMenu'));

    expect(screen.getByTestId('SettingsMenu')).toBeInTheDocument();
  });

  it('marks the current selection in each group', () => {
    render(
      <SettingsMenu
        displayFormat="hex"
        onChangeDisplayFormat={() => {}}
        onChangeOutputFormat={() => {}}
        outputFormat="rgb"
      />,
    );

    fireEvent.click(screen.getByTestId('SettingsTrigger'));

    const displayHex = within(getGroup('Display format')).getByRole('button', { name: 'Hex' });
    const outputRgb = within(getGroup('Output format')).getByRole('button', { name: 'RGB' });
    const outputHex = within(getGroup('Output format')).getByRole('button', { name: 'Hex' });

    expect(displayHex.className).toMatch(/text-neutral-900|text-neutral-50/);
    expect(outputRgb.className).toMatch(/text-neutral-900|text-neutral-50/);
    expect(outputHex.className).not.toMatch(/text-neutral-900 /);
  });
});
