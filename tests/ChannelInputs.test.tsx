import { formatCSS, parseCSS } from 'colorizr';

import ChannelInputs from '~/ChannelInputs';
import { fireEvent, render, screen } from '~/test-utils';

describe('ChannelInputs', () => {
  describe('Render', () => {
    it('renders correctly in HSL mode', () => {
      render(
        <ChannelInputs
          alpha={1}
          color="hsl(180 50% 40%)"
          mode="hsl"
          onAlphaChange={() => {}}
          onChangeColor={() => {}}
        />,
      );

      expect(screen.getByTestId('ChannelInputs')).toMatchSnapshot();
    });

    it('renders correctly in RGB mode', () => {
      render(
        <ChannelInputs
          alpha={1}
          color="rgb(100 150 200)"
          mode="rgb"
          onAlphaChange={() => {}}
          onChangeColor={() => {}}
        />,
      );

      expect(screen.getByTestId('ChannelInputs')).toMatchSnapshot();
    });

    it('renders correctly in OKLCH mode', () => {
      render(
        <ChannelInputs
          alpha={1}
          color="oklch(0.5 0.12 120)"
          mode="oklch"
          onAlphaChange={() => {}}
          onChangeColor={() => {}}
        />,
      );

      expect(screen.getByTestId('ChannelInputs')).toMatchSnapshot();
    });

    it('displays rounded HSL values', () => {
      render(
        <ChannelInputs
          alpha={1}
          color="hsl(180 50% 40%)"
          mode="hsl"
          onAlphaChange={() => {}}
          onChangeColor={() => {}}
        />,
      );

      expect(screen.getByDisplayValue('180')).toBeInTheDocument();
      expect(screen.getByDisplayValue('50')).toBeInTheDocument();
      expect(screen.getByDisplayValue('40')).toBeInTheDocument();
    });

    it('displays rounded RGB values', () => {
      render(
        <ChannelInputs
          alpha={1}
          color="rgb(100 150 200)"
          mode="rgb"
          onAlphaChange={() => {}}
          onChangeColor={() => {}}
        />,
      );

      expect(screen.getByDisplayValue('100')).toBeInTheDocument();
      expect(screen.getByDisplayValue('150')).toBeInTheDocument();
      expect(screen.getByDisplayValue('200')).toBeInTheDocument();
    });

    it('does not render an alpha input by default', () => {
      render(
        <ChannelInputs
          alpha={0.5}
          color="#ff0044"
          mode="hsl"
          onAlphaChange={() => {}}
          onChangeColor={() => {}}
        />,
      );

      expect(screen.getAllByRole('textbox')).toHaveLength(3);
      expect(screen.queryByText('A')).not.toBeInTheDocument();
    });

    it('adds a 4th alpha input labelled A when showAlpha is true', () => {
      render(
        <ChannelInputs
          alpha={0.5}
          color="#ff0044"
          mode="hsl"
          onAlphaChange={() => {}}
          onChangeColor={() => {}}
          showAlpha
        />,
      );

      expect(screen.getAllByRole('textbox')).toHaveLength(4);
      expect(screen.getByText('A')).toBeInTheDocument();
    });

    it('displays alpha with 2-decimal precision', () => {
      render(
        <ChannelInputs
          alpha={0.5}
          color="#ff0044"
          mode="hsl"
          onAlphaChange={() => {}}
          onChangeColor={() => {}}
          showAlpha
        />,
      );

      expect(screen.getByDisplayValue('0.50')).toBeInTheDocument();
    });

    it('renders custom channel labels from the channels prop', () => {
      render(
        <ChannelInputs
          alpha={1}
          channels={{
            h: { label: 'Hue' },
            s: { label: 'Sat' },
            l: { label: 'Lum' },
          }}
          color="#ff0044"
          mode="hsl"
          onAlphaChange={() => {}}
          onChangeColor={() => {}}
        />,
      );

      expect(screen.getByText('Hue')).toBeInTheDocument();
      expect(screen.getByText('Sat')).toBeInTheDocument();
      expect(screen.getByText('Lum')).toBeInTheDocument();
      expect(screen.queryByText('H')).not.toBeInTheDocument();
    });
  });

  describe('Behavior', () => {
    it.each([
      ['hsl', 'hsl(0 100% 50%)', 0, '180'],
      ['hsl', 'hsl(0 100% 50%)', 1, '40'],
      ['hsl', 'hsl(0 100% 50%)', 2, '30'],
      ['rgb', 'rgb(100 100 100)', 0, '200'],
      ['rgb', 'rgb(100 100 100)', 1, '150'],
      ['rgb', 'rgb(100 100 100)', 2, '50'],
      ['oklch', 'oklch(0.5 0.1 120)', 0, '75'],
      ['oklch', 'oklch(0.5 0.1 120)', 1, '0.05'],
      ['oklch', 'oklch(0.5 0.1 120)', 2, '200'],
    ] as const)(
      'emits an OKLCH string when the %s channel at index %d changes',
      (mode, color, index, typed) => {
        const onChangeColor = vi.fn();

        render(
          <ChannelInputs
            alpha={1}
            color={color}
            mode={mode}
            onAlphaChange={() => {}}
            onChangeColor={onChangeColor}
          />,
        );

        const input = screen.getAllByRole('textbox')[index];

        fireEvent.focus(input);
        fireEvent.change(input, { target: { value: typed } });

        expect(onChangeColor).toHaveBeenCalled();
        expect(onChangeColor.mock.calls.at(-1)?.[0]).toMatch(/^oklch\(/);
      },
    );

    it('emits the concrete OKLCH conversion when an RGB channel changes', () => {
      const onChangeColor = vi.fn();
      const startColor = 'rgb(100 100 100)';
      const startRgb = parseCSS(startColor, 'rgb');
      const expected = formatCSS({ ...startRgb, r: 200 }, { format: 'oklch' });

      render(
        <ChannelInputs
          alpha={1}
          color={startColor}
          mode="rgb"
          onAlphaChange={() => {}}
          onChangeColor={onChangeColor}
        />,
      );

      const rInput = screen.getAllByRole('textbox')[0];

      fireEvent.focus(rInput);
      fireEvent.change(rInput, { target: { value: '200' } });

      expect(onChangeColor).toHaveBeenLastCalledWith(expected);
    });

    it('emits the concrete OKLCH conversion when an HSL channel changes', () => {
      const onChangeColor = vi.fn();
      const startColor = 'hsl(0 100% 50%)';
      const startHsl = parseCSS(startColor, 'hsl');
      const expected = formatCSS({ ...startHsl, h: 180 }, { format: 'oklch' });

      render(
        <ChannelInputs
          alpha={1}
          color={startColor}
          mode="hsl"
          onAlphaChange={() => {}}
          onChangeColor={onChangeColor}
        />,
      );

      const hInput = screen.getAllByRole('textbox')[0];

      fireEvent.focus(hInput);
      fireEvent.change(hInput, { target: { value: '180' } });

      expect(onChangeColor).toHaveBeenLastCalledWith(expected);
    });

    it('emits the concrete OKLCH conversion when an OKLCH channel changes (L=75% → l=0.75)', () => {
      const onChangeColor = vi.fn();
      const startColor = 'oklch(0.5 0.1 120)';
      const startLch = parseCSS(startColor, 'oklch');
      const expected = formatCSS({ ...startLch, l: 0.75 }, { format: 'oklch' });

      render(
        <ChannelInputs
          alpha={1}
          color={startColor}
          mode="oklch"
          onAlphaChange={() => {}}
          onChangeColor={onChangeColor}
        />,
      );

      const lInput = screen.getAllByRole('textbox')[0];

      fireEvent.focus(lInput);
      fireEvent.change(lInput, { target: { value: '75' } });

      expect(onChangeColor).toHaveBeenLastCalledWith(expected);
    });

    it('emits onAlphaChange with the parsed alpha value', () => {
      const onAlphaChange = vi.fn();

      render(
        <ChannelInputs
          alpha={1}
          color="#ff0044"
          mode="hsl"
          onAlphaChange={onAlphaChange}
          onChangeColor={() => {}}
          showAlpha
        />,
      );

      const alphaInput = screen.getAllByRole('textbox')[3];

      fireEvent.focus(alphaInput);
      fireEvent.change(alphaInput, { target: { value: '0.5' } });

      expect(onAlphaChange).toHaveBeenCalledWith(0.5);
    });

    it('clamps the alpha input above 1 back to 1', () => {
      const onAlphaChange = vi.fn();

      render(
        <ChannelInputs
          alpha={0.5}
          color="#ff0044"
          mode="hsl"
          onAlphaChange={onAlphaChange}
          onChangeColor={() => {}}
          showAlpha
        />,
      );

      const alphaInput = screen.getAllByRole('textbox')[3];

      fireEvent.focus(alphaInput);
      fireEvent.change(alphaInput, { target: { value: '2' } });

      expect(onAlphaChange).toHaveBeenLastCalledWith(1);
    });

    it('filters non-numeric characters instead of emitting', () => {
      const onChangeColor = vi.fn();

      render(
        <ChannelInputs
          alpha={1}
          color="hsl(0 100% 50%)"
          mode="hsl"
          onAlphaChange={() => {}}
          onChangeColor={onChangeColor}
        />,
      );

      const hueInput = screen.getAllByRole('textbox')[0];

      fireEvent.focus(hueInput);
      fireEvent.change(hueInput, { target: { value: 'abc' } });

      expect(onChangeColor).not.toHaveBeenCalled();
    });
  });

  describe('Styling', () => {
    it('appends className to the root wrapper', () => {
      render(
        <ChannelInputs
          alpha={1}
          className="extra-wrapper"
          color="#ff0044"
          mode="hsl"
          onAlphaChange={() => {}}
          onChangeColor={() => {}}
        />,
      );

      expect(screen.getByTestId('ChannelInputs')).toHaveClass('extra-wrapper');
    });

    it('forwards numericInputClassNames to every NumericInput', () => {
      render(
        <ChannelInputs
          alpha={1}
          color="#ff0044"
          mode="hsl"
          numericInputClassNames={{ input: 'custom-numeric-input' }}
          onAlphaChange={() => {}}
          onChangeColor={() => {}}
          showAlpha
        />,
      );

      const inputs = screen.getAllByRole('textbox');

      expect(inputs).toHaveLength(4);

      for (const input of inputs) {
        expect(input).toHaveClass('custom-numeric-input');
      }
    });
  });
});
