import { useState } from 'react';

import ColorInput from '~/ColorInput';
import { fireEvent, render, screen } from '~/test-utils';

const mockOnChange = vi.fn();

function Controlled({ initial }: { initial: string }) {
  const [value, setValue] = useState(initial);

  return (
    <ColorInput
      onChange={next => {
        mockOnChange(next);
        setValue(next);
      }}
      value={value}
    />
  );
}

describe('ColorInput', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Render', () => {
    it('renders the controlled value', () => {
      render(<ColorInput onChange={mockOnChange} value="#ff0044" />);

      expect(screen.getByTestId('ColorInput')).toMatchSnapshot();
    });

    it('renders startContent next to the input', () => {
      render(
        <ColorInput
          onChange={mockOnChange}
          startContent={<span data-testid="color-swatch">C</span>}
          value="#ff0044"
        />,
      );

      expect(screen.getByTestId('ColorInput')).toMatchSnapshot();
    });

    it('renders endContent next to the input', () => {
      render(
        <ColorInput
          endContent={<span data-testid="gamut-icon">!</span>}
          onChange={mockOnChange}
          value="#ff0044"
        />,
      );

      expect(screen.getByTestId('ColorInput')).toMatchSnapshot();
    });
  });

  describe('Edit mode', () => {
    it('enters edit mode on focus', () => {
      render(<ColorInput onChange={mockOnChange} value="#ff0044" />);
      const input = screen.getByLabelText('Color value');

      fireEvent.focus(input);
      fireEvent.change(input, { target: { value: 'typing' } });

      // In edit mode the displayed value reflects local state
      expect(screen.getByDisplayValue('typing')).toBeInTheDocument();
    });

    it('reverts to controlled value on blur', () => {
      render(<ColorInput onChange={mockOnChange} value="#ff0044" />);
      const input = screen.getByLabelText('Color value');

      fireEvent.focus(input);
      fireEvent.change(input, { target: { value: 'garbage' } });
      fireEvent.blur(input);

      expect(screen.getByDisplayValue('#ff0044')).toBeInTheDocument();
    });
  });

  describe('Bare hex auto-prefix', () => {
    it('prefixes 6-digit bare hex with #', () => {
      render(<ColorInput onChange={mockOnChange} value="" />);
      const input = screen.getByLabelText('Color value');

      fireEvent.focus(input);
      fireEvent.change(input, { target: { value: 'ff0044' } });

      expect(mockOnChange).toHaveBeenCalledWith('#ff0044');
    });

    it('prefixes 3-digit bare hex with #', () => {
      render(<ColorInput onChange={mockOnChange} value="" />);
      const input = screen.getByLabelText('Color value');

      fireEvent.focus(input);
      fireEvent.change(input, { target: { value: 'abc' } });

      expect(mockOnChange).toHaveBeenCalledWith('#abc');
    });

    it('accepts uppercase bare hex', () => {
      render(<ColorInput onChange={mockOnChange} value="" />);
      const input = screen.getByLabelText('Color value');

      fireEvent.focus(input);
      fireEvent.change(input, { target: { value: 'FF0044' } });

      expect(mockOnChange).toHaveBeenCalledWith('#FF0044');
    });
  });

  describe('Incomplete hex', () => {
    it('does not emit at intermediate hex lengths (2, 3, 5, 6 chars)', () => {
      render(<ColorInput onChange={mockOnChange} value="" />);
      const input = screen.getByLabelText('Color value');

      fireEvent.focus(input);
      fireEvent.change(input, { target: { value: '#f' } });
      fireEvent.change(input, { target: { value: '#ff' } });
      fireEvent.change(input, { target: { value: '#ff00' } });
      fireEvent.change(input, { target: { value: '#ff001' } });

      expect(mockOnChange).not.toHaveBeenCalled();
    });

    it('emits once hex reaches 7 characters (#rrggbb)', () => {
      render(<Controlled initial="" />);
      const input = screen.getByLabelText('Color value');

      fireEvent.focus(input);
      fireEvent.change(input, { target: { value: '#ff00' } });
      fireEvent.change(input, { target: { value: '#ff0044' } });

      expect(mockOnChange).toHaveBeenCalledTimes(1);
      expect(mockOnChange).toHaveBeenCalledWith('#ff0044');
    });

    it('emits once hex reaches 4 characters (#rgb)', () => {
      render(<Controlled initial="" />);
      const input = screen.getByLabelText('Color value');

      fireEvent.focus(input);
      fireEvent.change(input, { target: { value: '#f' } });
      fireEvent.change(input, { target: { value: '#f04' } });

      expect(mockOnChange).toHaveBeenCalledWith('#f04');
    });
  });

  describe('CSS color formats', () => {
    it('emits valid rgb() string', () => {
      render(<ColorInput onChange={mockOnChange} value="" />);
      const input = screen.getByLabelText('Color value');

      fireEvent.focus(input);
      fireEvent.change(input, { target: { value: 'rgb(255 0 68)' } });

      expect(mockOnChange).toHaveBeenCalledWith('rgb(255 0 68)');
    });

    it('emits valid hsl() string', () => {
      render(<ColorInput onChange={mockOnChange} value="" />);
      const input = screen.getByLabelText('Color value');

      fireEvent.focus(input);
      fireEvent.change(input, { target: { value: 'hsl(345 100% 50%)' } });

      expect(mockOnChange).toHaveBeenCalledWith('hsl(345 100% 50%)');
    });

    it('emits valid oklch() string', () => {
      render(<ColorInput onChange={mockOnChange} value="" />);
      const input = screen.getByLabelText('Color value');

      fireEvent.focus(input);
      fireEvent.change(input, { target: { value: 'oklch(0.6 0.2 25)' } });

      expect(mockOnChange).toHaveBeenCalledWith('oklch(0.6 0.2 25)');
    });

    it('emits named colors', () => {
      render(<ColorInput onChange={mockOnChange} value="" />);
      const input = screen.getByLabelText('Color value');

      fireEvent.focus(input);
      fireEvent.change(input, { target: { value: 'red' } });

      expect(mockOnChange).toHaveBeenCalledWith('red');
    });
  });

  describe('Invalid input', () => {
    it('does not emit for garbage strings', () => {
      render(<ColorInput onChange={mockOnChange} value="#ff0044" />);
      const input = screen.getByLabelText('Color value');

      fireEvent.focus(input);
      fireEvent.change(input, { target: { value: 'not-a-color' } });

      expect(mockOnChange).not.toHaveBeenCalled();
    });

    it('does not emit when blurring with garbage (display-only revert)', () => {
      render(<ColorInput onChange={mockOnChange} value="#ff0044" />);
      const input = screen.getByLabelText('Color value');

      fireEvent.focus(input);
      fireEvent.change(input, { target: { value: 'garbage' } });
      fireEvent.blur(input);

      expect(mockOnChange).not.toHaveBeenCalled();
      expect(screen.getByDisplayValue('#ff0044')).toBeInTheDocument();
    });

    it('trims whitespace before validating', () => {
      render(<ColorInput onChange={mockOnChange} value="" />);
      const input = screen.getByLabelText('Color value');

      fireEvent.focus(input);
      fireEvent.change(input, { target: { value: '  #ff0044  ' } });

      expect(mockOnChange).toHaveBeenCalledWith('#ff0044');
    });
  });
});
