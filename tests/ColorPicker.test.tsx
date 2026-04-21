import { useState } from 'react';

import ColorPicker from '~/ColorPicker';
import {
  fireEvent,
  firePointerDrag,
  mockCanvasContext,
  mockRAFSync,
  mockRect,
  render,
  screen,
  within,
} from '~/test-utils';

const mockOnChange = vi.fn();

function Controlled(props: {
  channels?: Parameters<typeof ColorPicker>[0]['channels'];
  defaultMode?: Parameters<typeof ColorPicker>[0]['defaultMode'];
  initial?: string;
}) {
  const { channels, defaultMode, initial } = props;
  const [color, setColor] = useState(initial ?? '#ff0044');

  return (
    <ColorPicker
      channels={channels}
      color={color}
      defaultMode={defaultMode}
      onChange={next => {
        mockOnChange(next);
        setColor(next);
      }}
    />
  );
}

describe('ColorPicker', () => {
  let restoreRAF: () => void;
  let canvas: ReturnType<typeof mockCanvasContext>;

  beforeEach(() => {
    vi.clearAllMocks();
    restoreRAF = mockRAFSync();
    canvas = mockCanvasContext();
  });

  afterEach(() => {
    restoreRAF();
    canvas.restore();
  });

  describe('Render', () => {
    it('renders OKLCH mode by default', () => {
      render(<Controlled />);

      expect(screen.getByTestId('ColorPicker')).toMatchSnapshot();
    });

    it('renders HSL mode when defaultMode is "hsl"', () => {
      render(<Controlled defaultMode="hsl" />);

      expect(screen.getByTestId('ColorPicker')).toMatchSnapshot();
    });

    it('renders RGB mode with defaultMode is "rgb""', () => {
      render(<Controlled defaultMode="rgb" />);

      expect(screen.getByTestId('ColorPicker')).toMatchSnapshot();
    });

    it('hides the swatch when showSwatch is false', () => {
      render(<ColorPicker color="#ff0044" showSwatch={false} />);

      expect(screen.queryByTestId('Swatch')).not.toBeInTheDocument();
    });

    it('render the hue bar when showHueBar is true', () => {
      render(<ColorPicker color="#ff0044" showHueBar />);

      expect(screen.getByRole('slider', { name: 'HueBar' })).toBeInTheDocument();
    });

    it('hides the 2D panel when showPanel is false', () => {
      render(<ColorPicker color="#ff0044" showPanel={false} />);

      expect(screen.queryByTestId('OKLCHPanel')).not.toBeInTheDocument();
      expect(screen.queryByTestId('SaturationPanel')).not.toBeInTheDocument();
    });

    it('limits the mode switcher to the provided modes', () => {
      render(<ColorPicker color="#ff0044" modes={['hsl', 'rgb']} />);

      expect(screen.queryByRole('button', { name: 'Switch to OKLCH' })).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Switch to HSL' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Switch to RGB' })).toBeInTheDocument();
    });

    it('omits the toolbar when all elements are hidden', () => {
      render(<ColorPicker color="#ff0044" />);

      expect(screen.queryByTestId('Toolbar')).not.toBeInTheDocument();
    });

    it('renders the toolbar when showAlpha is true', () => {
      render(<ColorPicker color="#ff0044" showAlpha />);

      expect(screen.getByTestId('Toolbar')).toBeInTheDocument();
    });

    it('renders the toolbar when showHueBar is true', () => {
      render(<ColorPicker color="#ff0044" showHueBar />);

      expect(screen.getByTestId('Toolbar')).toBeInTheDocument();
    });

    it('renders the alpha slider when showAlpha is true', () => {
      render(<ColorPicker color="#ff0044" showAlpha />);

      expect(screen.getByRole('slider', { name: 'Alpha' })).toBeInTheDocument();
    });

    it('does not render the alpha slider by default', () => {
      render(<ColorPicker color="#ff0044" />);

      expect(screen.queryByRole('slider', { name: 'Alpha' })).not.toBeInTheDocument();
    });

    it('renders the eyedropper when showEyeDropper is true and the API is supported', () => {
      (globalThis as unknown as { EyeDropper: unknown }).EyeDropper = function EyeDropperMock() {
        return { open: () => Promise.resolve({ sRGBHex: '#000000' }) };
      };

      render(<ColorPicker color="#ff0044" showEyeDropper />);

      expect(screen.getByTestId('EyeDropper')).toBeInTheDocument();

      delete (globalThis as unknown as { EyeDropper?: unknown }).EyeDropper;
    });

    it('omits the eyedropper when the API is not supported', () => {
      delete (globalThis as unknown as { EyeDropper?: unknown }).EyeDropper;

      render(<ColorPicker color="#ff0044" showEyeDropper />);

      expect(screen.queryByTestId('EyeDropper')).not.toBeInTheDocument();
    });

    it('renders ChannelSliders by default', () => {
      render(<ColorPicker color="#ff0044" />);

      expect(screen.getByTestId('ChannelSliders')).toBeInTheDocument();
    });

    it('passes showInputs through to ChannelSliders when showSliders is true', () => {
      render(<ColorPicker color="#ff0044" defaultMode="hsl" />);

      expect(screen.getByDisplayValue('100')).toBeInTheDocument();

      expect(within(screen.getByTestId('ChannelSliders')).getAllByRole('textbox')).toHaveLength(3);
    });

    it('renders ChannelInputs when showInputs is true and showSliders is false', () => {
      render(<ColorPicker color="#ff0044" showInputs showSliders={false} />);

      expect(screen.getByTestId('ChannelInputs')).toBeInTheDocument();
    });

    it('does not render ChannelInputs when showSliders is true', () => {
      render(<ColorPicker color="#ff0044" showInputs showSliders />);

      expect(screen.queryByTestId('ChannelInputs')).not.toBeInTheDocument();
    });

    it('renders the settings menu trigger when showSettings is true', () => {
      render(<ColorPicker color="#ff0044" showSettings />);

      expect(screen.getByTestId('SettingsTrigger')).toBeInTheDocument();
    });

    it('does not render the settings menu trigger by default', () => {
      render(<ColorPicker color="#ff0044" />);

      expect(screen.queryByTestId('SettingsTrigger')).not.toBeInTheDocument();
    });

    it('centers the options row when only one of eyeDropper/modeSelector/settings is visible', () => {
      render(
        <ColorPicker
          color="#ff0044"
          showEyeDropper
          showModeSelector={false}
          showSettings={false}
        />,
      );

      expect(screen.getByTestId('Options')).toHaveClass('justify-center');
    });

    it('uses justify-between for the options row when two or three options are visible', () => {
      render(<ColorPicker color="#ff0044" showEyeDropper showModeSelector />);

      const options = screen.getByTestId('Options');

      expect(options).toHaveClass('justify-between');
      expect(options).not.toHaveClass('justify-center');
    });

    it('does not render the options row when all three options are hidden', () => {
      render(
        <ColorPicker
          color="#ff0044"
          showEyeDropper={false}
          showModeSelector={false}
          showSettings={false}
        />,
      );

      expect(screen.queryByTestId('Options')).not.toBeInTheDocument();
    });

    it('shows the gamut warning for an out-of-sRGB OKLCH color when displayFormat is narrow', () => {
      render(<ColorPicker color="oklch(0.7 0.3 20)" displayFormat="hex" />);

      expect(screen.getByTestId('GamutWarning')).toBeInTheDocument();
    });

    it('hides the gamut warning for an in-sRGB color even when displayFormat is narrow', () => {
      render(<ColorPicker color="#ff0044" displayFormat="hex" />);

      expect(screen.queryByTestId('GamutWarning')).not.toBeInTheDocument();
    });

    it('hides the gamut warning when displayFormat is oklch', () => {
      render(<ColorPicker color="oklch(0.7 0.3 20)" />);

      expect(screen.queryByTestId('GamutWarning')).not.toBeInTheDocument();
    });

    it('hides the gamut warning outside OKLCH mode', () => {
      render(<ColorPicker color="#ff0044" defaultMode="hsl" displayFormat="hex" />);

      expect(screen.queryByTestId('GamutWarning')).not.toBeInTheDocument();
    });
  });

  describe('classNames', () => {
    beforeEach(() => {
      (globalThis as unknown as { EyeDropper: unknown }).EyeDropper = function EyeDropperMock() {
        return { open: () => Promise.resolve({ sRGBHex: '#000000' }) };
      };
    });

    it('lands each slot on the expected element', () => {
      render(
        <ColorPicker
          classNames={{
            root: 'slot-root',
            panel: { root: 'slot-panel-root', thumb: 'slot-panel-thumb' },
            colorInput: { root: 'slot-colorinput-root', input: 'slot-colorinput-input' },
            toolbar: 'slot-toolbar',
            hueSlider: { thumb: 'slot-hue-thumb' },
            swatch: { root: 'slot-swatch-root', color: 'slot-swatch-color' },
            eyeDropper: 'slot-eyedropper',
            modeSelector: 'slot-mode-selector',
          }}
          color="oklch(0.5 0.1 120)"
          showAlpha
          showHueBar
        />,
      );

      expect(screen.getByTestId('ColorPicker')).toHaveClass('slot-root');
      expect(screen.getByTestId('OKLCHPanel')).toHaveClass('slot-panel-root');
      expect(
        screen.getByTestId('OKLCHPanel').querySelector('.slot-panel-thumb'),
      ).toBeInTheDocument();
      expect(screen.getByTestId('ColorInput')).toHaveClass('slot-colorinput-root');
      expect(screen.getByTestId('ColorInput').querySelector('input')).toHaveClass(
        'slot-colorinput-input',
      );
      expect(screen.getByTestId('Toolbar')).toHaveClass('slot-toolbar');
      expect(screen.getByRole('slider', { name: 'HueBar' })).toHaveClass('slot-hue-thumb');
      expect(screen.getByTestId('Swatch')).toHaveClass('slot-swatch-root');
      expect(screen.getByTestId('Swatch').firstChild as HTMLElement).toHaveClass(
        'slot-swatch-color',
      );
      expect(screen.getByTestId('EyeDropper')).toHaveClass('slot-eyedropper');
    });

    it('applies channel and numeric input classNames when sliders are shown', () => {
      render(
        <ColorPicker
          classNames={{
            channelSliders: 'slot-channel-sliders',
            channelSlider: { thumb: 'slot-channel-thumb' },
            numericInput: { input: 'slot-numeric-input' },
          }}
          color="oklch(0.5 0.1 120)"
          showInputs
          showSliders
        />,
      );
      const sliders = screen.getByTestId('ChannelSliders');

      expect(sliders).toHaveClass('slot-channel-sliders');
      expect(sliders.querySelectorAll('.slot-channel-thumb')).toHaveLength(3);
      expect(sliders.querySelectorAll('.slot-numeric-input')).toHaveLength(3);
    });

    it('updates displayFormat and outputFormat through the settings menu', () => {
      render(<ColorPicker color="#ff0044" onChange={mockOnChange} showSettings />);

      fireEvent.click(screen.getByTestId('SettingsTrigger'));

      const displayGroup = screen
        .getByText('Display format')
        .closest('[data-testid="RadioGroup"]') as HTMLElement;
      const outputGroup = screen
        .getByText('Output format')
        .closest('[data-testid="RadioGroup"]') as HTMLElement;

      fireEvent.click(within(displayGroup).getByRole('button', { name: 'Hex' }));
      expect(screen.getByLabelText('Color value')).toHaveValue('#ff0044');

      mockOnChange.mockClear();
      fireEvent.click(within(outputGroup).getByRole('button', { name: 'RGB' }));
      fireEvent.keyDown(screen.getByRole('slider', { name: /hue/i }), { key: 'ArrowRight' });

      expect(mockOnChange.mock.calls[0][0]).toMatch(/^rgb\(/);
    });

    it('applies settingsMenu slots when the menu opens', () => {
      render(
        <ColorPicker
          classNames={{
            settingsMenu: { trigger: 'slot-settings-trigger', menu: 'slot-settings-menu' },
          }}
          color="#ff0044"
          showSettings
        />,
      );

      const trigger = screen.getByTestId('SettingsTrigger');

      expect(trigger).toHaveClass('slot-settings-trigger');
      fireEvent.click(trigger);
      expect(screen.getByTestId('SettingsMenu')).toHaveClass('slot-settings-menu');
    });
  });

  describe('Mode change callback', () => {
    it('fires onChangeMode when the switcher changes mode', () => {
      const onChangeMode = vi.fn();

      render(<ColorPicker color="#ff0044" defaultMode="hsl" onChangeMode={onChangeMode} />);

      fireEvent.click(screen.getByRole('button', { name: 'Switch to OKLCH' }));

      expect(onChangeMode).toHaveBeenCalledWith('oklch');
    });

    it('does not fire onChangeMode when clicking the current mode', () => {
      const onChangeMode = vi.fn();

      render(<ColorPicker color="#ff0044" defaultMode="hsl" onChangeMode={onChangeMode} />);

      fireEvent.click(screen.getByRole('button', { name: 'Switch to HSL' }));

      expect(onChangeMode).not.toHaveBeenCalled();
    });
  });

  describe('Display format', () => {
    it('displays hex when displayFormat="hex" regardless of mode', () => {
      render(<ColorPicker color="#ff0044" displayFormat="hex" />);

      const input = screen.getByLabelText('Color value') as HTMLInputElement;

      expect(input.value).toMatch(/^#[\da-f]{6}$/i);
    });

    it('displays oklch in OKLCH mode with displayFormat="auto"', () => {
      render(<ColorPicker color="#ff0044" />);

      const input = screen.getByLabelText('Color value') as HTMLInputElement;

      expect(input.value).toMatch(/^oklch\(/);
    });
  });

  describe('Alpha', () => {
    it('emits a color with alpha suffix when alpha is dragged below 1', () => {
      const onChange = vi.fn();

      render(<ColorPicker color="#ff0044" onChange={onChange} showAlpha />);
      const slider = screen.getByRole('slider', { name: 'Alpha' });

      fireEvent.keyDown(slider, { key: 'Home' });

      expect(onChange).toHaveBeenCalled();
      const last = onChange.mock.calls.at(-1)?.[0] as string;

      expect(last).toMatch(/\/\s*0/);
    });

    it('emits without alpha when alpha is 1', () => {
      const onChange = vi.fn();

      render(<ColorPicker color="#ff0044" onChange={onChange} showAlpha />);
      const slider = screen.getByRole('slider', { name: 'Alpha' });

      fireEvent.keyDown(slider, { key: 'End' });

      const last = onChange.mock.calls.at(-1)?.[0] as string;

      expect(last).not.toMatch(/\/\s*/);
    });

    it('ignores alpha in external color when showAlpha is false', () => {
      const onChange = vi.fn();

      render(<ColorPicker color="rgb(255 0 68 / 0.5)" onChange={onChange} />);

      fireEvent.keyDown(screen.getByRole('slider', { name: /hue/i }), { key: 'ArrowRight' });

      const last = onChange.mock.calls.at(-1)?.[0] as string;

      expect(last).not.toMatch(/\/\s*0\.5/);
    });

    it('reflects alpha from the color prop when the prop changes under showAlpha', () => {
      const { rerender } = render(<ColorPicker color="rgb(255 0 68 / 1)" showAlpha />);

      expect(screen.getByRole('slider', { name: 'Alpha' })).toHaveAttribute('aria-valuenow', '1');

      rerender(<ColorPicker color="rgb(255 0 68 / 0.5)" showAlpha />);

      expect(screen.getByRole('slider', { name: 'Alpha' })).toHaveAttribute('aria-valuenow', '0.5');
    });
  });

  describe('Mode switching', () => {
    it('switches from HSL to OKLCH on button click', () => {
      render(<Controlled defaultMode="hsl" />);

      fireEvent.click(screen.getByRole('button', { name: 'Switch to OKLCH' }));

      expect(screen.getByTestId('OKLCHPanel')).toBeInTheDocument();
      expect(screen.queryByTestId('SaturationPanel')).not.toBeInTheDocument();
    });

    it('switches from OKLCH back to HSL', () => {
      render(<Controlled />);

      fireEvent.click(screen.getByRole('button', { name: 'Switch to HSL' }));

      expect(screen.queryByTestId('OKLCHPanel')).not.toBeInTheDocument();
      expect(screen.getByTestId('SaturationPanel')).toBeInTheDocument();
    });
  });

  describe('Emission (output follows resolved format)', () => {
    it('emits hex in HSL mode with default (auto) output format', () => {
      render(<Controlled defaultMode="hsl" />);
      const panel = screen.getByTestId('SaturationPanel');

      mockRect(panel, { left: 0, top: 0, width: 200, height: 100 });
      fireEvent.pointerDown(panel, { clientX: 100, clientY: 50, pointerId: 1 });

      expect(mockOnChange).toHaveBeenCalled();
      expect(mockOnChange.mock.calls[0][0]).toMatch(/^#[\da-f]{6}$/i);
    });

    it('emits OKLCH when OKLCHPanel is dragged in OKLCH mode', () => {
      render(<Controlled />);
      const panel = screen.getByTestId('OKLCHPanel');

      mockRect(panel, { left: 0, top: 0, width: 256, height: 128 });
      fireEvent.pointerDown(panel, { clientX: 128, clientY: 64, pointerId: 1 });

      expect(mockOnChange.mock.calls[0][0]).toMatch(/^oklch\(/);
    });

    it('emits hex when the hue slider changes in HSL mode', () => {
      render(<Controlled defaultMode="hsl" />);

      fireEvent.keyDown(screen.getByRole('slider', { name: /hue/i }), { key: 'ArrowRight' });

      expect(mockOnChange.mock.calls[0][0]).toMatch(/^#[\da-f]{6}$/i);
    });

    it('emits OKLCH when the hue slider changes in OKLCH mode', () => {
      render(<Controlled />);

      fireEvent.keyDown(screen.getByRole('slider', { name: /hue/i }), { key: 'ArrowRight' });

      expect(mockOnChange.mock.calls[0][0]).toMatch(/^oklch\(/);
    });

    it('emits hex when the toolbar hue bar changes in HSL mode', () => {
      render(
        <ColorPicker
          color="#ff0044"
          defaultMode="hsl"
          onChange={mockOnChange}
          showHueBar
          showSliders={false}
        />,
      );

      fireEvent.keyDown(screen.getByRole('slider', { name: 'HueBar' }), { key: 'ArrowRight' });

      expect(mockOnChange.mock.calls[0][0]).toMatch(/^#[\da-f]{6}$/i);
    });

    it('emits OKLCH when the toolbar hue bar changes in OKLCH mode', () => {
      render(
        <ColorPicker
          color="oklch(0.5 0.1 120)"
          onChange={mockOnChange}
          showHueBar
          showSliders={false}
        />,
      );

      fireEvent.keyDown(screen.getByRole('slider', { name: 'HueBar' }), { key: 'ArrowRight' });

      expect(mockOnChange.mock.calls[0][0]).toMatch(/^oklch\(/);
    });

    it('emits hex when ColorInput is used in HSL mode', () => {
      render(<Controlled defaultMode="hsl" />);
      const input = screen.getByLabelText('Color value');

      fireEvent.focus(input);
      fireEvent.change(input, { target: { value: '#00ff00' } });

      expect(mockOnChange.mock.calls[0][0]).toMatch(/^#[\da-f]{6}$/i);
    });

    it('respects outputFormat="oklch" override in HSL mode', () => {
      render(
        <ColorPicker
          color="#ff0044"
          defaultMode="hsl"
          onChange={mockOnChange}
          outputFormat="oklch"
        />,
      );

      fireEvent.keyDown(screen.getByRole('slider', { name: /hue/i }), { key: 'ArrowRight' });

      expect(mockOnChange.mock.calls[0][0]).toMatch(/^oklch\(/);
    });

    it('respects outputFormat="rgb" in OKLCH mode', () => {
      render(<ColorPicker color="#ff0044" onChange={mockOnChange} outputFormat="rgb" />);

      fireEvent.keyDown(screen.getByRole('slider', { name: /hue/i }), { key: 'ArrowRight' });

      expect(mockOnChange.mock.calls[0][0]).toMatch(/^rgb\(/);
    });

    it('respects precision on emitted oklch output', () => {
      render(
        <ColorPicker color="#ff0044" onChange={mockOnChange} outputFormat="oklch" precision={2} />,
      );

      fireEvent.keyDown(screen.getByRole('slider', { name: /hue/i }), { key: 'ArrowRight' });

      const emitted = mockOnChange.mock.calls[0][0] as string;

      expect(emitted).toMatch(/^oklch\(/);
      const numbers = emitted.match(/\d+(?:\.\d+)?/g) ?? [];

      for (const token of numbers) {
        const decimals = token.split('.')[1]?.length ?? 0;

        expect(decimals).toBeLessThanOrEqual(2);
      }
    });

    it('respects precision=0 (integer output)', () => {
      render(
        <ColorPicker color="#ff0044" onChange={mockOnChange} outputFormat="oklch" precision={0} />,
      );

      fireEvent.keyDown(screen.getByRole('slider', { name: /hue/i }), { key: 'ArrowRight' });

      const emitted = mockOnChange.mock.calls[0][0] as string;

      expect(emitted).toMatch(/^oklch\(/);
      expect(emitted).not.toMatch(/\./);
    });

    it('ignores precision for hex output', () => {
      render(
        <ColorPicker
          color="#ff0044"
          defaultMode="hsl"
          onChange={mockOnChange}
          outputFormat="hex"
          precision={2}
        />,
      );

      fireEvent.keyDown(screen.getByRole('slider', { name: /hue/i }), { key: 'ArrowRight' });

      expect(mockOnChange.mock.calls[0][0]).toMatch(/^#[\da-f]{6}$/i);
    });
  });

  describe('External prop sync', () => {
    it('updates internal state when color prop changes', () => {
      const { rerender } = render(
        <ColorPicker color="#ff0000" defaultMode="hsl" onChange={mockOnChange} />,
      );
      const input = screen.getByLabelText('Color value');

      expect((input as HTMLInputElement).value).toBe('#ff0000');

      rerender(<ColorPicker color="#00ff00" defaultMode="hsl" onChange={mockOnChange} />);

      expect((input as HTMLInputElement).value).toBe('#00ff00');
    });

    it('does not re-emit when the prop matches the last emitted value', () => {
      const { rerender } = render(<ColorPicker color="#ff0000" onChange={mockOnChange} />);

      // A drag emits a new OKLCH value and sets lastEmittedRef
      fireEvent.keyDown(screen.getByRole('slider', { name: /hue/i }), { key: 'ArrowRight' });
      const emitted = mockOnChange.mock.calls[0][0];

      mockOnChange.mockClear();

      // Parent "echoes" that value back as the color prop
      rerender(<ColorPicker color={emitted} onChange={mockOnChange} />);

      // No re-emit should occur
      expect(mockOnChange).not.toHaveBeenCalled();
    });
  });

  describe('Hue continuity across modes', () => {
    it('preserves hue when switching HSL → OKLCH', () => {
      render(<Controlled defaultMode="hsl" initial="hsl(120 100% 50%)" />);
      const hueBefore = screen.getByRole('slider', { name: /hue/i }).getAttribute('aria-valuenow');

      fireEvent.click(screen.getByRole('button', { name: 'Switch to OKLCH' }));

      const hueAfter = screen.getByRole('slider', { name: /hue/i }).getAttribute('aria-valuenow');

      // HSL hue and OKLCH hue are not the same number, but both should be non-null
      // and reflect a green-ish hue (OKLCH green is ~142).
      expect(hueBefore).not.toBeNull();
      expect(hueAfter).not.toBeNull();
      expect(Number(hueAfter)).toBeGreaterThan(100);
      expect(Number(hueAfter)).toBeLessThan(180);
    });
  });

  describe('Drag integration', () => {
    it('firing a full drag on the OKLCHPanel emits multiple OKLCH values', () => {
      render(<Controlled />);
      const panel = screen.getByTestId('OKLCHPanel');

      mockRect(panel, { left: 0, top: 0, width: 200, height: 100 });

      firePointerDrag(panel, [
        { x: 0, y: 100 },
        { x: 100, y: 50 },
        { x: 200, y: 0 },
      ]);

      expect(mockOnChange.mock.calls.length).toBeGreaterThanOrEqual(3);

      for (const [value] of mockOnChange.mock.calls) {
        expect(value).toMatch(/^oklch\(/);
      }
    });
  });
});
