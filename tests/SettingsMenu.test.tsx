import { useRef } from 'react';

import SettingsMenu from '~/SettingsMenu';
import { act, fireEvent, render, screen, within } from '~/test-utils';

type Props = Parameters<typeof SettingsMenu>[0];

function getGroup(title: 'Display format' | 'Output format'): HTMLElement {
  const titleEl = screen.getByText(title);
  const group = titleEl.closest('[data-testid="RadioGroup"]');

  if (!(group instanceof HTMLElement)) {
    throw new TypeError(`Could not find RadioGroup containing title "${title}"`);
  }

  return group;
}

function Host(props: Omit<Partial<Props>, 'containerRef'>) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  return (
    <div ref={containerRef} data-testid="host">
      <SettingsMenu
        containerRef={containerRef}
        displayFormat="auto"
        onChangeDisplayFormat={() => {}}
        onChangeOutputFormat={() => {}}
        outputFormat="auto"
        {...props}
      />
    </div>
  );
}

function renderMenu(props: Omit<Partial<Props>, 'containerRef'> = {}) {
  return render(<Host {...props} />);
}

describe('SettingsMenu', () => {
  it('renders only the trigger when closed', () => {
    renderMenu();

    expect(screen.getByTestId('SettingsMenuWrapper')).toMatchSnapshot();
  });

  it('opens the panel and flips aria-expanded on trigger click', () => {
    renderMenu();

    fireEvent.click(screen.getByTestId('SettingsTrigger'));

    expect(screen.getByTestId('SettingsMenuWrapper')).toMatchSnapshot();
  });

  it('fires onChangeDisplayFormat with the selected value', () => {
    const onChangeDisplayFormat = vi.fn();

    renderMenu({ onChangeDisplayFormat });

    fireEvent.click(screen.getByTestId('SettingsTrigger'));
    fireEvent.click(within(getGroup('Display format')).getByRole('button', { name: 'Hex' }));

    expect(onChangeDisplayFormat).toHaveBeenCalledWith('hex');
  });

  it('fires onChangeOutputFormat with the selected value', () => {
    const onChangeOutputFormat = vi.fn();

    renderMenu({ onChangeOutputFormat });

    fireEvent.click(screen.getByTestId('SettingsTrigger'));
    fireEvent.click(within(getGroup('Output format')).getByRole('button', { name: 'RGB' }));

    expect(onChangeOutputFormat).toHaveBeenCalledWith('rgb');
  });

  it('does not cross the two groups (Hex in Display ≠ Hex in Output)', () => {
    const onChangeDisplayFormat = vi.fn();
    const onChangeOutputFormat = vi.fn();

    renderMenu({ onChangeDisplayFormat, onChangeOutputFormat });

    fireEvent.click(screen.getByTestId('SettingsTrigger'));
    fireEvent.click(within(getGroup('Output format')).getByRole('button', { name: 'Hex' }));

    expect(onChangeOutputFormat).toHaveBeenCalledWith('hex');
    expect(onChangeDisplayFormat).not.toHaveBeenCalled();
  });

  it('returns focus to the trigger after a selection', () => {
    renderMenu();

    const trigger = screen.getByTestId('SettingsTrigger');

    fireEvent.click(trigger);
    fireEvent.click(within(getGroup('Display format')).getByRole('button', { name: 'Hex' }));

    expect(trigger).toHaveFocus();
  });

  it('closes on Escape', () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });

    try {
      renderMenu();

      fireEvent.click(screen.getByTestId('SettingsTrigger'));
      const panel = screen.getByTestId('SettingsMenu');

      fireEvent.keyDown(document, { key: 'Escape' });

      expect(panel).toHaveAttribute('aria-hidden', 'true');

      act(() => {
        vi.advanceTimersByTime(250);
      });

      expect(screen.queryByTestId('SettingsMenu')).not.toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });

  it('closes on outside mousedown', () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });

    try {
      render(
        <>
          <button data-testid="outside" type="button">
            outside
          </button>
          <Host />
        </>,
      );

      fireEvent.click(screen.getByTestId('SettingsTrigger'));
      const panel = screen.getByTestId('SettingsMenu');

      fireEvent.mouseDown(screen.getByTestId('outside'));

      expect(panel).toHaveAttribute('aria-hidden', 'true');

      act(() => {
        vi.advanceTimersByTime(250);
      });

      expect(screen.queryByTestId('SettingsMenu')).not.toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });

  it('unmounts after timeout even when transitionend never fires', () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });

    try {
      renderMenu();

      fireEvent.click(screen.getByTestId('SettingsTrigger'));
      expect(screen.getByTestId('SettingsMenu')).toBeInTheDocument();

      fireEvent.keyDown(document, { key: 'Escape' });
      expect(screen.getByTestId('SettingsMenu')).toHaveAttribute('aria-hidden', 'true');

      act(() => {
        vi.advanceTimersByTime(249);
      });
      expect(screen.getByTestId('SettingsMenu')).toBeInTheDocument();

      act(() => {
        vi.advanceTimersByTime(1);
      });
      expect(screen.queryByTestId('SettingsMenu')).not.toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
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

    const displayHex = within(getGroup('Display format')).getByRole('button', { name: 'Hex' });
    const outputRgb = within(getGroup('Output format')).getByRole('button', { name: 'RGB' });
    const outputHex = within(getGroup('Output format')).getByRole('button', { name: 'Hex' });

    expect(displayHex).toHaveClass(/text-neutral-900|text-neutral-50/);
    expect(outputRgb).toHaveClass(/text-neutral-900|text-neutral-50/);
    expect(outputHex).not.toHaveClass('text-neutral-900');
  });

  describe('Layout', () => {
    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('renders column layout when container is narrow', () => {
      vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(280);
      renderMenu();

      fireEvent.click(screen.getByTestId('SettingsTrigger'));

      const groups = getGroup('Display format').parentElement as HTMLElement;

      expect(groups).not.toHaveClass('flex-row');
      expect(groups.querySelector('.h-px')).toBeInTheDocument();
    });

    it('renders row layout when container is wide', () => {
      vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(400);
      renderMenu();

      fireEvent.click(screen.getByTestId('SettingsTrigger'));

      const groups = getGroup('Display format').parentElement as HTMLElement;

      expect(groups).toHaveClass('flex-row');
      expect(groups).toHaveClass('justify-center');
      expect(groups.querySelector('.h-px')).not.toBeInTheDocument();
    });
  });
});
