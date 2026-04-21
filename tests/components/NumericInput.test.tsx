import { useState } from 'react';

import { fireEvent, render, screen } from '~/test-utils';

import NumericInput from '~/components/NumericInput';

const mockOnChange = vi.fn();

interface ControlledProps {
  initial: string;
  max?: number;
  min?: number;
  step?: number;
}

function Controlled(props: ControlledProps) {
  const { initial, max = 360, min = 0, step = 1 } = props;
  const [current, setCurrent] = useState(initial);

  return (
    <NumericInput
      max={max}
      min={min}
      onChange={next => {
        mockOnChange(next);
        setCurrent(String(next));
      }}
      step={step}
      value={current}
    />
  );
}

function createDefaultProps(overrides: Partial<Parameters<typeof NumericInput>[0]> = {}) {
  return {
    max: 360,
    min: 0,
    onChange: mockOnChange,
    value: '180',
    ...overrides,
  };
}

describe('NumericInput', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Render', () => {
    it('renders the value in the input', () => {
      render(<NumericInput {...createDefaultProps({ suffix: '°' })} />);

      expect(screen.getByDisplayValue('180')).toBeInTheDocument();
    });

    it('renders a visible suffix when one is provided', () => {
      render(<NumericInput {...createDefaultProps({ suffix: '°' })} />);

      const suffix = screen.getByText('°');

      expect(suffix).toBeInTheDocument();
      expect(suffix).not.toHaveStyle({ visibility: 'hidden' });
    });

    it('hides a whitespace suffix (used as alignment spacer)', () => {
      render(<NumericInput {...createDefaultProps({ suffix: ' ' })} />);
      const suffix = screen.getByTestId('NumericInput').querySelector('span');

      expect(suffix).toHaveStyle({ visibility: 'hidden' });
    });

    it('omits the suffix element when no suffix is provided', () => {
      render(<NumericInput {...createDefaultProps()} />);

      // eslint-disable-next-line testing-library/prefer-presence-queries
      expect(screen.getByTestId('NumericInput').querySelector('span')).toBeNull();
    });

    it('applies per-part classNames', () => {
      render(
        <NumericInput
          {...createDefaultProps({
            classNames: { root: 'slot-root', input: 'slot-input', suffix: 'slot-suffix' },
            suffix: '%',
          })}
        />,
      );

      const input = screen.getByDisplayValue('180');
      const root = screen.getByTestId('NumericInput');
      const suffix = root.querySelector('span');

      expect(root).toHaveClass('slot-root');
      expect(input).toHaveClass('slot-input');
      expect(suffix).toHaveClass('slot-suffix');
    });
  });

  describe('Behavior', () => {
    it('displays the value', () => {
      render(<NumericInput {...createDefaultProps()} />);

      expect(screen.getByDisplayValue('180')).toBeInTheDocument();
    });

    it('filters non-numeric characters', () => {
      render(<NumericInput {...createDefaultProps()} />);

      const input = screen.getByDisplayValue('180');

      fireEvent.focus(input);
      fireEvent.change(input, { target: { value: 'abc' } });

      expect(screen.getByDisplayValue('')).toBeInTheDocument();
    });

    it('allows decimal point', () => {
      render(<NumericInput {...createDefaultProps({ value: '0.5' })} />);

      const input = screen.getByDisplayValue('0.5');

      fireEvent.change(input, { target: { value: '0.75' } });

      expect(mockOnChange).toHaveBeenCalledWith(0.75);
    });

    it('replaces comma with period', () => {
      render(<NumericInput {...createDefaultProps({ value: '0.5' })} />);

      const input = screen.getByDisplayValue('0.5');

      fireEvent.change(input, { target: { value: '0,75' } });

      expect(mockOnChange).toHaveBeenCalledWith(0.75);
    });

    it('skips commit when value ends with period', () => {
      render(<NumericInput {...createDefaultProps()} />);

      const input = screen.getByDisplayValue('180');

      fireEvent.change(input, { target: { value: '1.' } });

      expect(mockOnChange).not.toHaveBeenCalled();
    });

    it('clamps value to max', () => {
      render(<NumericInput {...createDefaultProps()} />);

      const input = screen.getByDisplayValue('180');

      fireEvent.change(input, { target: { value: '782' } });

      expect(mockOnChange).toHaveBeenCalledWith(360);
    });

    it('clamps value to min', () => {
      render(<NumericInput {...createDefaultProps({ min: 10 })} />);

      const input = screen.getByDisplayValue('180');

      fireEvent.change(input, { target: { value: '5' } });

      expect(mockOnChange).toHaveBeenCalledWith(10);
    });

    it('increments on ArrowUp', () => {
      render(<NumericInput {...createDefaultProps({ step: 1 })} />);

      const input = screen.getByDisplayValue('180');

      fireEvent.keyDown(input, { key: 'ArrowUp' });

      expect(mockOnChange).toHaveBeenCalledWith(181);
    });

    it('decrements on ArrowDown', () => {
      render(<NumericInput {...createDefaultProps({ step: 1 })} />);

      const input = screen.getByDisplayValue('180');

      fireEvent.keyDown(input, { key: 'ArrowDown' });

      expect(mockOnChange).toHaveBeenCalledWith(179);
    });

    it('increments by 10 on Shift+ArrowUp', () => {
      render(<NumericInput {...createDefaultProps({ step: 1 })} />);

      const input = screen.getByDisplayValue('180');

      fireEvent.keyDown(input, { key: 'ArrowUp', shiftKey: true });

      expect(mockOnChange).toHaveBeenCalledWith(190);
    });

    it('clamps ArrowUp at max', () => {
      render(<NumericInput {...createDefaultProps({ value: '359' })} />);

      const input = screen.getByDisplayValue('359');

      fireEvent.keyDown(input, { key: 'ArrowUp', shiftKey: true });

      expect(mockOnChange).toHaveBeenCalledWith(360);
    });

    it('reverts to prop value on blur with invalid input', () => {
      render(<NumericInput {...createDefaultProps()} />);

      const input = screen.getByDisplayValue('180');

      fireEvent.change(input, { target: { value: '' } });
      fireEvent.blur(input);

      expect(screen.getByDisplayValue('180')).toBeInTheDocument();
    });

    it('commits clamped value on blur', () => {
      render(<NumericInput {...createDefaultProps()} />);

      const input = screen.getByDisplayValue('180');

      fireEvent.change(input, { target: { value: '500' } });
      fireEvent.blur(input);

      expect(mockOnChange).toHaveBeenCalledWith(360);
    });

    it('steps through consecutive ArrowUps when focused', () => {
      render(<Controlled initial="180" />);

      const input = screen.getByDisplayValue('180');

      fireEvent.focus(input);
      fireEvent.keyDown(input, { key: 'ArrowUp' });
      fireEvent.keyDown(input, { key: 'ArrowUp' });
      fireEvent.keyDown(input, { key: 'ArrowUp' });

      expect(mockOnChange.mock.calls.map(arguments_ => arguments_[0])).toEqual([181, 182, 183]);
      expect(screen.getByDisplayValue('183')).toBeInTheDocument();
    });

    it('has no float noise after multiple presses with fractional step', () => {
      render(<Controlled initial="300.48" step={0.001} />);

      const input = screen.getByDisplayValue('300.48');

      fireEvent.focus(input);
      fireEvent.keyDown(input, { key: 'ArrowUp' });
      fireEvent.keyDown(input, { key: 'ArrowUp' });

      expect(mockOnChange).toHaveBeenNthCalledWith(1, 300.481);
      expect(mockOnChange).toHaveBeenNthCalledWith(2, 300.482);
    });

    it('clamps ArrowDown at min', () => {
      render(<NumericInput {...createDefaultProps({ value: '1', min: 0, step: 1 })} />);

      const input = screen.getByDisplayValue('1');

      fireEvent.keyDown(input, { key: 'ArrowDown', shiftKey: true });

      expect(mockOnChange).toHaveBeenCalledWith(0);
    });

    it('updates display after ArrowUp while focused', () => {
      render(<NumericInput {...createDefaultProps({ step: 1 })} />);

      const input = screen.getByDisplayValue('180');

      fireEvent.focus(input);
      fireEvent.keyDown(input, { key: 'ArrowUp' });

      expect(screen.getByDisplayValue('181')).toBeInTheDocument();
    });

    it('snaps to step on non-aligned start value', () => {
      render(<Controlled initial="179.7" step={1} />);

      const input = screen.getByDisplayValue('179.7');

      fireEvent.focus(input);
      fireEvent.keyDown(input, { key: 'ArrowUp' });

      expect(mockOnChange).toHaveBeenCalledWith(181);
    });

    it('ignores non-arrow keys', () => {
      render(<NumericInput {...createDefaultProps()} />);

      const input = screen.getByDisplayValue('180');

      fireEvent.keyDown(input, { key: 'Enter' });

      expect(mockOnChange).not.toHaveBeenCalled();
    });

    it('re-seeds edit buffer from latest prop on refocus', () => {
      const { rerender } = render(<NumericInput {...createDefaultProps({ value: '100' })} />);

      const input = screen.getByDisplayValue('100');

      fireEvent.focus(input);
      fireEvent.blur(input);

      rerender(<NumericInput {...createDefaultProps({ value: '200' })} />);
      fireEvent.focus(screen.getByDisplayValue('200'));

      expect(screen.getByDisplayValue('200')).toBeInTheDocument();
    });
  });
});
