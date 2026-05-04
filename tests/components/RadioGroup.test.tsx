import { fireEvent, render, screen } from '~/test-utils';

import RadioGroup from '~/components/RadioGroup';

import type { SettingsOption } from '~/types';

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

const OPTIONS: SettingsOption[] = [
  { label: 'Auto', value: 'auto' },
  { label: 'Hex', value: 'hex' },
  { label: 'RGB', value: 'rgb' },
];

describe('RadioGroup', () => {
  it('renders the title and one button per option', () => {
    render(<RadioGroup options={OPTIONS} title="Format" value="auto" />);

    expect(screen.getByTestId('RadioGroup')).toMatchSnapshot();
  });

  it('fires onChange with the selected option value on click', () => {
    const onChange = vi.fn();

    render(<RadioGroup onChange={onChange} options={OPTIONS} title="Format" value="auto" />);

    fireEvent.click(screen.getByRole('radio', { name: 'Hex' }));

    expect(onChange).toHaveBeenCalledWith('hex');
  });

  it('visually distinguishes the selected option from the others', () => {
    render(<RadioGroup options={OPTIONS} title="Format" value="hex" />);

    const selected = screen.getByRole('radio', { name: 'Hex' });
    const unselected = screen.getByRole('radio', { name: 'Auto' });

    // Selected gets a darker text color class.
    expect(selected).toHaveClass(/text-neutral-900|text-neutral-50/);
    expect(unselected).not.toHaveClass('text-neutral-900');
  });

  describe('ARIA semantics', () => {
    it('renders role=radiogroup with aria-labelledby pointing at the title', () => {
      render(<RadioGroup options={OPTIONS} title="Format" value="auto" />);

      const group = screen.getByRole('radiogroup');
      const labelledBy = group.getAttribute('aria-labelledby');

      expect(labelledBy).toBeTruthy();
      expect(document.getElementById(labelledBy!)).toHaveTextContent('Format');
    });

    it('marks the selected option with aria-checked=true and others with false', () => {
      render(<RadioGroup options={OPTIONS} title="Format" value="hex" />);

      expect(screen.getByRole('radio', { name: 'Auto' })).toHaveAttribute('aria-checked', 'false');
      expect(screen.getByRole('radio', { name: 'Hex' })).toHaveAttribute('aria-checked', 'true');
      expect(screen.getByRole('radio', { name: 'RGB' })).toHaveAttribute('aria-checked', 'false');
    });

    it('makes the selected option the single tab stop (roving tabindex)', () => {
      render(<RadioGroup options={OPTIONS} title="Format" value="hex" />);

      expect(screen.getByRole('radio', { name: 'Auto' })).toHaveAttribute('tabindex', '-1');
      expect(screen.getByRole('radio', { name: 'Hex' })).toHaveAttribute('tabindex', '0');
      expect(screen.getByRole('radio', { name: 'RGB' })).toHaveAttribute('tabindex', '-1');
    });

    it('falls back to the first option as tab stop when nothing matches the value', () => {
      render(<RadioGroup options={OPTIONS} title="Format" value={'unknown' as never} />);

      expect(screen.getByRole('radio', { name: 'Auto' })).toHaveAttribute('tabindex', '0');
    });
  });

  describe('Keyboard navigation', () => {
    it('ArrowDown moves focus + selection to the next option', () => {
      const onChange = vi.fn();

      render(<RadioGroup onChange={onChange} options={OPTIONS} title="Format" value="auto" />);

      const group = screen.getByRole('radiogroup');

      fireEvent.keyDown(group, { key: 'ArrowDown' });

      expect(onChange).toHaveBeenCalledWith('hex');
      expect(document.activeElement).toBe(screen.getByRole('radio', { name: 'Hex' }));
    });

    it('ArrowRight behaves like ArrowDown', () => {
      const onChange = vi.fn();

      render(<RadioGroup onChange={onChange} options={OPTIONS} title="Format" value="auto" />);

      fireEvent.keyDown(screen.getByRole('radiogroup'), { key: 'ArrowRight' });

      expect(onChange).toHaveBeenCalledWith('hex');
    });

    it('ArrowUp moves selection to the previous option', () => {
      const onChange = vi.fn();

      render(<RadioGroup onChange={onChange} options={OPTIONS} title="Format" value="hex" />);

      fireEvent.keyDown(screen.getByRole('radiogroup'), { key: 'ArrowUp' });

      expect(onChange).toHaveBeenCalledWith('auto');
    });

    it('ArrowLeft behaves like ArrowUp', () => {
      const onChange = vi.fn();

      render(<RadioGroup onChange={onChange} options={OPTIONS} title="Format" value="hex" />);

      fireEvent.keyDown(screen.getByRole('radiogroup'), { key: 'ArrowLeft' });

      expect(onChange).toHaveBeenCalledWith('auto');
    });

    it('wraps from last back to first on ArrowDown', () => {
      const onChange = vi.fn();

      render(<RadioGroup onChange={onChange} options={OPTIONS} title="Format" value="rgb" />);

      fireEvent.keyDown(screen.getByRole('radiogroup'), { key: 'ArrowDown' });

      expect(onChange).toHaveBeenCalledWith('auto');
    });

    it('wraps from first back to last on ArrowUp', () => {
      const onChange = vi.fn();

      render(<RadioGroup onChange={onChange} options={OPTIONS} title="Format" value="auto" />);

      fireEvent.keyDown(screen.getByRole('radiogroup'), { key: 'ArrowUp' });

      expect(onChange).toHaveBeenCalledWith('rgb');
    });

    it('Home jumps to the first option', () => {
      const onChange = vi.fn();

      render(<RadioGroup onChange={onChange} options={OPTIONS} title="Format" value="rgb" />);

      fireEvent.keyDown(screen.getByRole('radiogroup'), { key: 'Home' });

      expect(onChange).toHaveBeenCalledWith('auto');
    });

    it('End jumps to the last option', () => {
      const onChange = vi.fn();

      render(<RadioGroup onChange={onChange} options={OPTIONS} title="Format" value="auto" />);

      fireEvent.keyDown(screen.getByRole('radiogroup'), { key: 'End' });

      expect(onChange).toHaveBeenCalledWith('rgb');
    });

    it('ignores unrelated keys', () => {
      const onChange = vi.fn();

      render(<RadioGroup onChange={onChange} options={OPTIONS} title="Format" value="auto" />);

      fireEvent.keyDown(screen.getByRole('radiogroup'), { key: 'a' });

      expect(onChange).not.toHaveBeenCalled();
    });
  });

  describe('Disabled', () => {
    it('sets aria-disabled on the radiogroup container', () => {
      render(<RadioGroup disabled options={OPTIONS} title="Format" value="auto" />);

      expect(screen.getByRole('radiogroup')).toHaveAttribute('aria-disabled', 'true');
    });

    it('omits aria-disabled when not disabled', () => {
      render(<RadioGroup options={OPTIONS} title="Format" value="auto" />);

      expect(screen.getByRole('radiogroup')).not.toHaveAttribute('aria-disabled');
    });

    it('sets the native disabled attribute on every option button', () => {
      render(<RadioGroup disabled options={OPTIONS} title="Format" value="auto" />);

      for (const option of OPTIONS) {
        expect(screen.getByRole('radio', { name: option.label })).toBeDisabled();
      }
    });

    it('does not fire onChange when an option is clicked', () => {
      const onChange = vi.fn();

      render(
        <RadioGroup disabled onChange={onChange} options={OPTIONS} title="Format" value="auto" />,
      );

      fireEvent.click(screen.getByRole('radio', { name: 'Hex' }));

      expect(onChange).not.toHaveBeenCalled();
    });

    it('does not fire onChange on arrow/Home/End keys', () => {
      const onChange = vi.fn();

      render(
        <RadioGroup disabled onChange={onChange} options={OPTIONS} title="Format" value="auto" />,
      );

      const group = screen.getByRole('radiogroup');

      fireEvent.keyDown(group, { key: 'ArrowDown' });
      fireEvent.keyDown(group, { key: 'Home' });
      fireEvent.keyDown(group, { key: 'End' });

      expect(onChange).not.toHaveBeenCalled();
    });

    it('collapses every option tabIndex to -1 (no roving tab stop)', () => {
      render(<RadioGroup disabled options={OPTIONS} title="Format" value="hex" />);

      for (const option of OPTIONS) {
        expect(screen.getByRole('radio', { name: option.label })).toHaveAttribute('tabindex', '-1');
      }
    });
  });
});
