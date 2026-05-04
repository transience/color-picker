import SettingsMenu from '~/SettingsMenu';
import { fireEvent, render, screen, within } from '~/test-utils';

let mockIdCounter = 0;

vi.mock('~/hooks/useId', () => ({
  default: (prefix: string) => {
    mockIdCounter += 1;

    return `${prefix}-${mockIdCounter}`;
  },
}));

beforeEach(() => {
  mockIdCounter = 0;
});

type Props = Parameters<typeof SettingsMenu>[0];

function getGroup(title: 'Display format' | 'Output format'): HTMLElement {
  const titleEl = screen.getByText(title);
  const group = titleEl.closest('[data-testid="RadioGroup"]');

  if (!(group instanceof HTMLElement)) {
    throw new TypeError(`Could not find RadioGroup containing title "${title}"`);
  }

  return group;
}

function renderMenu(props: Partial<Props> = {}) {
  return render(<SettingsMenu {...props} />);
}

describe('SettingsMenu', () => {
  it('renders only the trigger when closed', () => {
    renderMenu();

    expect(screen.getByTestId('SettingsMenuWrapper')).toMatchSnapshot();
  });

  it('opens the panel and flips aria-expanded on trigger click', () => {
    renderMenu();

    fireEvent.click(screen.getByTestId('SettingsTrigger'));

    expect(screen.getByTestId('SettingsMenu')).toMatchSnapshot();
  });

  it('fires onChangeDisplayFormat with the selected value', () => {
    const onChangeDisplayFormat = vi.fn();

    renderMenu({ onChangeDisplayFormat });

    fireEvent.click(screen.getByTestId('SettingsTrigger'));
    fireEvent.click(within(getGroup('Display format')).getByRole('radio', { name: 'Hex' }));

    expect(onChangeDisplayFormat).toHaveBeenCalledWith('hex');
  });

  it('fires onChangeOutputFormat with the selected value', () => {
    const onChangeOutputFormat = vi.fn();

    renderMenu({ onChangeOutputFormat });

    fireEvent.click(screen.getByTestId('SettingsTrigger'));
    fireEvent.click(within(getGroup('Output format')).getByRole('radio', { name: 'RGB' }));

    expect(onChangeOutputFormat).toHaveBeenCalledWith('rgb');
  });

  it('does not cross the two groups (Hex in Display ≠ Hex in Output)', () => {
    const onChangeDisplayFormat = vi.fn();
    const onChangeOutputFormat = vi.fn();

    renderMenu({ onChangeDisplayFormat, onChangeOutputFormat });

    fireEvent.click(screen.getByTestId('SettingsTrigger'));
    fireEvent.click(within(getGroup('Output format')).getByRole('radio', { name: 'Hex' }));

    expect(onChangeOutputFormat).toHaveBeenCalledWith('hex');
    expect(onChangeDisplayFormat).not.toHaveBeenCalled();
  });

  it('keeps focus on the clicked radio (does not steal focus to trigger)', () => {
    renderMenu();

    const trigger = screen.getByTestId('SettingsTrigger');

    fireEvent.click(trigger);
    const hexRadio = within(getGroup('Display format')).getByRole('radio', { name: 'Hex' });

    fireEvent.click(hexRadio);

    expect(trigger).not.toHaveFocus();
  });

  it('returns focus to the trigger when the Done button closes the panel', () => {
    renderMenu();

    const trigger = screen.getByTestId('SettingsTrigger');

    fireEvent.click(trigger);
    fireEvent.click(screen.getByRole('button', { name: 'Close settings' }));

    expect(trigger).toHaveFocus();
  });

  it('closes on Escape and returns focus to the trigger', () => {
    renderMenu();

    fireEvent.click(screen.getByTestId('SettingsTrigger'));
    expect(screen.getByTestId('SettingsMenu')).toBeInTheDocument();

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(screen.queryByTestId('SettingsMenu')).not.toBeInTheDocument();
    expect(screen.getByTestId('SettingsTrigger')).toHaveAttribute('aria-expanded', 'false');
    expect(screen.getByTestId('SettingsTrigger')).toHaveFocus();
  });

  it('closes on outside mousedown', () => {
    render(
      <>
        <button data-testid="outside" type="button">
          outside
        </button>
        <SettingsMenu />
      </>,
    );

    fireEvent.click(screen.getByTestId('SettingsTrigger'));
    expect(screen.getByTestId('SettingsMenu')).toBeInTheDocument();

    fireEvent.mouseDown(screen.getByTestId('outside'));

    expect(screen.queryByTestId('SettingsMenu')).not.toBeInTheDocument();
  });

  it('closes when the Done button is clicked', () => {
    renderMenu();

    fireEvent.click(screen.getByTestId('SettingsTrigger'));
    fireEvent.click(screen.getByRole('button', { name: 'Close settings' }));

    expect(screen.queryByTestId('SettingsMenu')).not.toBeInTheDocument();
  });

  it('stays open when clicking inside the panel (but outside a button)', () => {
    renderMenu();

    fireEvent.click(screen.getByTestId('SettingsTrigger'));
    fireEvent.mouseDown(screen.getByTestId('SettingsMenu'));

    expect(screen.getByTestId('SettingsMenu')).toBeInTheDocument();
  });

  it('marks the current selection in each group', () => {
    renderMenu({ displayFormat: 'hex', outputFormat: 'rgb' });

    fireEvent.click(screen.getByTestId('SettingsTrigger'));

    const displayHex = within(getGroup('Display format')).getByRole('radio', { name: 'Hex' });
    const outputRgb = within(getGroup('Output format')).getByRole('radio', { name: 'RGB' });
    const outputHex = within(getGroup('Output format')).getByRole('radio', { name: 'Hex' });

    expect(displayHex).toHaveClass(/text-neutral-900|text-neutral-50/);
    expect(outputRgb).toHaveClass(/text-neutral-900|text-neutral-50/);
    expect(outputHex).not.toHaveClass('text-neutral-900');
  });

  it('renders both groups side-by-side (row layout)', () => {
    renderMenu();

    fireEvent.click(screen.getByTestId('SettingsTrigger'));

    const groups = getGroup('Display format').parentElement as HTMLElement;

    expect(groups).toHaveClass('flex-row');
    expect(groups).toHaveClass('justify-center');
  });

  describe('triggerProps', () => {
    it('forwards native HTML attrs to the trigger button', () => {
      renderMenu({ triggerProps: { id: 'custom-trigger', title: 'Settings' } });
      const trigger = screen.getByTestId('SettingsTrigger');

      expect(trigger).toHaveAttribute('id', 'custom-trigger');
      expect(trigger).toHaveAttribute('title', 'Settings');
    });
  });

  describe('placement', () => {
    it('accepts a custom placement', () => {
      renderMenu({ placement: 'top-start' });

      // Just verifies the prop is accepted without runtime errors.
      // Floater coords behavior is covered in tests/components/Floater.test.tsx.
      fireEvent.click(screen.getByTestId('SettingsTrigger'));

      expect(screen.getByTestId('SettingsMenu')).toBeInTheDocument();
    });
  });
});
