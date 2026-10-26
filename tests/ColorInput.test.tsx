import { useState } from 'react';

import ColorInput from '~/ColorInput';
import { DEFAULT_COLOR } from '~/constants';
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

// A browser paste fires `input` with `inputType: 'insertFromPaste'`.
function paste(input: HTMLElement, value: string) {
  fireEvent.input(input, { inputType: 'insertFromPaste', target: { value } });
}

// Simulates a parent that reformats the emitted color to a canonical form
// (e.g. converting any input to OKLCH) — uppercase stands in for reformat.
function Reformatting({ initial }: { initial: string }) {
  const [value, setValue] = useState(initial);

  return (
    <ColorInput
      onChange={next => {
        mockOnChange(next);
        setValue(next.toUpperCase());
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
    it('renders correctly', () => {
      render(<ColorInput />);

      expect(screen.getByTestId('ColorInput')).toMatchSnapshot();
    });

    it('renders startContent next to the input', () => {
      render(
        <ColorInput
          onChange={mockOnChange}
          startContent={<span data-testid="color-swatch">C</span>}
        />,
      );

      expect(screen.getByTestId('ColorInput')).toMatchSnapshot();
    });

    it('renders endContent next to the input', () => {
      render(
        <ColorInput endContent={<span data-testid="gamut-icon">!</span>} onChange={mockOnChange} />,
      );

      expect(screen.getByTestId('ColorInput')).toMatchSnapshot();
    });
  });

  describe('Edit mode', () => {
    it('enters edit mode on focus', () => {
      render(<ColorInput onChange={mockOnChange} />);
      const input = screen.getByLabelText('Color value');

      fireEvent.focus(input);
      fireEvent.change(input, { target: { value: 'typing' } });

      // In edit mode the displayed value reflects local state
      expect(screen.getByDisplayValue('typing')).toBeInTheDocument();
    });

    it('reverts to controlled value on blur', () => {
      render(<ColorInput onChange={mockOnChange} />);
      const input = screen.getByLabelText('Color value');

      fireEvent.focus(input);
      fireEvent.change(input, { target: { value: 'garbage' } });
      fireEvent.blur(input);

      expect(screen.getByDisplayValue(DEFAULT_COLOR)).toBeInTheDocument();
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

    it('emits 8-digit hex with alpha (#rrggbbaa)', () => {
      render(<Controlled initial="" />);
      const input = screen.getByLabelText('Color value');

      fireEvent.focus(input);
      fireEvent.change(input, { target: { value: '#ff00448' } });
      fireEvent.change(input, { target: { value: '#ff004480' } });

      expect(mockOnChange).toHaveBeenCalledTimes(1);
      expect(mockOnChange).toHaveBeenCalledWith('#ff004480');
    });

    it('prefixes 8-digit bare hex with #', () => {
      render(<ColorInput onChange={mockOnChange} value="" />);
      const input = screen.getByLabelText('Color value');

      fireEvent.focus(input);
      fireEvent.change(input, { target: { value: 'ff004480' } });

      expect(mockOnChange).toHaveBeenCalledWith('#ff004480');
      expect(input).toHaveValue('#ff004480');
    });

    it('emits pasted 4-digit hex (#rgba)', () => {
      render(<ColorInput onChange={mockOnChange} value="" />);
      const input = screen.getByLabelText('Color value');

      fireEvent.focus(input);
      paste(input, 'f048');

      expect(mockOnChange).toHaveBeenCalledWith('#f048');
    });

    it('holds typed 4-digit hex until Enter', () => {
      render(<Reformatting initial="" />);
      const input = screen.getByLabelText('Color value');

      fireEvent.focus(input);
      fireEvent.change(input, { target: { value: '#f048' } });

      expect(mockOnChange).not.toHaveBeenCalled();

      fireEvent.keyDown(input, { key: 'Enter' });

      expect(mockOnChange).toHaveBeenCalledWith('#f048');
      expect(input).toHaveValue('#F048');
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

  describe('Commit sync', () => {
    it('syncs display to parent-reformatted value after paste', () => {
      render(<Reformatting initial="#ff0044" />);
      const input = screen.getByLabelText('Color value');

      fireEvent.focus(input);
      paste(input, 'oklab(0.75 -0.21 0.18)');

      expect(mockOnChange).toHaveBeenCalledWith('oklab(0.75 -0.21 0.18)');
      expect(screen.getByDisplayValue('OKLAB(0.75 -0.21 0.18)')).toBeInTheDocument();
    });

    it('syncs display to parent value on Enter', () => {
      render(<Reformatting initial="" />);
      const input = screen.getByLabelText('Color value');

      fireEvent.focus(input);
      fireEvent.change(input, { target: { value: 'red' } });
      // Mid-type emit fired, but editValue still shows the typed text.
      expect(screen.getByDisplayValue('red')).toBeInTheDocument();

      fireEvent.keyDown(input, { key: 'Enter' });

      expect(screen.getByDisplayValue('RED')).toBeInTheDocument();
    });

    it('does not sync display while typing (no paste/Enter)', () => {
      render(<Reformatting initial="" />);
      const input = screen.getByLabelText('Color value');

      fireEvent.focus(input);
      fireEvent.change(input, { target: { value: 'red' } });

      // Parent has the reformatted 'RED', but the input still shows the typed
      // text — live typing must not be stomped by the sync path.
      expect(mockOnChange).toHaveBeenCalledWith('red');
      expect(screen.getByDisplayValue('red')).toBeInTheDocument();
    });
  });

  describe('Commit lifecycle', () => {
    // eslint-disable-next-line unicorn/consistent-function-scoping
    function ExternalValue({ initial }: { initial: string }) {
      const [value, setValue] = useState(initial);

      return (
        <>
          <ColorInput
            onChange={next => {
              mockOnChange(next);
              setValue(next);
            }}
            value={value}
          />
          <button onClick={() => setValue('#00ff00')} type="button">
            external
          </button>
        </>
      );
    }

    it('does not overwrite editValue if paste was invalid and parent value later changes', () => {
      render(<ExternalValue initial="#ff0044" />);
      const input = screen.getByLabelText('Color value');

      fireEvent.focus(input);
      paste(input, 'garbage');
      // Invalid paste — no emit, parent value unchanged. User keeps editing:
      fireEvent.change(input, { target: { value: 'still-typing' } });
      expect(screen.getByDisplayValue('still-typing')).toBeInTheDocument();

      // Parent value updates from elsewhere (slider, format switch, etc.).
      fireEvent.click(screen.getByText('external'));

      // editValue must NOT be stomped by the late sync.
      expect(screen.getByDisplayValue('still-typing')).toBeInTheDocument();
    });

    it('keeps typed text after completing a partial hex paste', () => {
      render(<Reformatting initial="#ff0044" />);
      const input = screen.getByLabelText('Color value');

      fireEvent.focus(input);
      paste(input, '#ab');
      // User finishes typing the pasted fragment.
      fireEvent.change(input, { target: { value: '#abc' } });

      expect(mockOnChange).toHaveBeenCalledWith('#abc');
      expect(screen.getByDisplayValue('#abc')).toBeInTheDocument();
    });

    it('holds a typed 4-digit hex after an incomplete hex paste', () => {
      render(<Controlled initial="#ff0044" />);
      const input = screen.getByLabelText('Color value');

      fireEvent.focus(input);
      paste(input, '#12');
      fireEvent.change(input, { target: { value: '#1234' } });

      expect(mockOnChange).not.toHaveBeenCalled();
    });

    it('does not treat typing after a no-op paste as a whole value', () => {
      render(<ColorInput onChange={mockOnChange} value="#aabbcc" />);
      const input = screen.getByLabelText('Color value');

      fireEvent.focus(input);
      // Same color as `value`, so the parent's value doesn't change.
      paste(input, '#abc');
      mockOnChange.mockClear();
      fireEvent.change(input, { target: { value: '#abcd' } });

      expect(mockOnChange).not.toHaveBeenCalled();
    });

    it('does not overwrite typing after an Enter that left the value unchanged', () => {
      const expand = (hex: string) => hex.replace(/^#(\w)(\w)(\w)(\w)?$/, '#$1$1$2$2$3$3$4$4');

      function Expanding() {
        const [value, setValue] = useState('#aabbccdd');

        return <ColorInput onChange={next => setValue(expand(next))} value={value} />;
      }

      render(<Expanding />);
      const input = screen.getByLabelText('Color value');

      fireEvent.focus(input);
      fireEvent.change(input, { target: { value: '#abcd' } });
      fireEvent.keyDown(input, { key: 'Enter' });
      expect(input).toHaveValue('#aabbccdd');

      fireEvent.change(input, { target: { value: '#abc' } });

      expect(input).toHaveValue('#abc');
    });

    it('shows external value changes after a commit until the next keystroke', () => {
      render(<ExternalValue initial="#ff0044" />);
      const input = screen.getByLabelText('Color value');

      fireEvent.focus(input);
      paste(input, '#123456');
      fireEvent.click(screen.getByText('external'));

      expect(input).toHaveValue('#00ff00');
    });

    it('does not re-emit the committed text on Enter after a commit', () => {
      render(<ExternalValue initial="#ff0044" />);
      const input = screen.getByLabelText('Color value');

      fireEvent.focus(input);
      paste(input, '#abcd');
      expect(mockOnChange).toHaveBeenCalledTimes(1);

      fireEvent.click(screen.getByText('external'));
      fireEvent.keyDown(input, { key: 'Enter' });

      expect(mockOnChange).toHaveBeenCalledTimes(1);
      expect(input).toHaveValue('#00ff00');
    });

    it('does not overwrite typed text when the value changes externally', () => {
      render(<ExternalValue initial="#ff0044" />);
      const input = screen.getByLabelText('Color value');

      fireEvent.focus(input);
      fireEvent.change(input, { target: { value: 'typing' } });
      fireEvent.click(screen.getByText('external'));

      expect(screen.getByDisplayValue('typing')).toBeInTheDocument();
    });
  });

  describe('Invalid input', () => {
    it('does not emit for garbage strings', () => {
      render(<ColorInput onChange={mockOnChange} />);
      const input = screen.getByLabelText('Color value');

      fireEvent.focus(input);
      fireEvent.change(input, { target: { value: 'not-a-color' } });

      expect(mockOnChange).not.toHaveBeenCalled();
    });

    it('does not emit when blurring with garbage (display-only revert)', () => {
      render(<ColorInput onChange={mockOnChange} />);
      const input = screen.getByLabelText('Color value');

      fireEvent.focus(input);
      fireEvent.change(input, { target: { value: 'garbage' } });
      fireEvent.blur(input);

      expect(mockOnChange).not.toHaveBeenCalled();
      expect(screen.getByDisplayValue(DEFAULT_COLOR)).toBeInTheDocument();
    });

    it('trims whitespace before validating', () => {
      render(<ColorInput onChange={mockOnChange} value="" />);
      const input = screen.getByLabelText('Color value');

      fireEvent.focus(input);
      fireEvent.change(input, { target: { value: '  #ff0044  ' } });

      expect(mockOnChange).toHaveBeenCalledWith('#ff0044');
    });
  });

  describe('Native attribute forwarding', () => {
    it('forwards native HTML attrs to the root', () => {
      render(<ColorInput data-foo="bar" id="custom-input" onChange={mockOnChange} value="" />);
      const root = screen.getByTestId('ColorInput');

      expect(root).toHaveAttribute('data-foo', 'bar');
      expect(root).toHaveAttribute('id', 'custom-input');
    });
  });
});
