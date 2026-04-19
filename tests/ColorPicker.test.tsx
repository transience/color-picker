/* eslint-disable testing-library/no-container */
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
      const { container } = render(<Controlled />);

      // OKLCHPanel (canvas) present; SaturationPanel crosshair still rendered on the shared panel root
      expect(container.querySelector('canvas')).toBeInTheDocument();
    });

    it('renders HSL mode when defaultMode is hsl', () => {
      const { container } = render(<Controlled defaultMode="hsl" />);

      expect(container.querySelector('.cursor-crosshair')).toBeInTheDocument();
      expect(container.querySelector('canvas')).not.toBeInTheDocument();
    });

    it('renders RGB mode with SaturationPanel', () => {
      const { container } = render(<Controlled defaultMode="rgb" />);

      expect(container.querySelector('.cursor-crosshair')).toBeInTheDocument();
      expect(container.querySelector('canvas')).not.toBeInTheDocument();
    });

    it('renders mode toggle buttons', () => {
      render(<Controlled />);

      expect(screen.getByRole('button', { name: 'Switch to OKLCH' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Switch to HSL' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Switch to RGB' })).toBeInTheDocument();
    });

    it('renders hue slider by default', () => {
      render(<Controlled />);

      expect(screen.getByRole('slider', { name: /hue/i })).toBeInTheDocument();
    });

    it('hides hue slider when channels.h.hidden is true', () => {
      render(<Controlled channels={{ h: { hidden: true } }} />);

      expect(screen.queryByRole('slider', { name: /hue/i })).not.toBeInTheDocument();
    });

    it('disables hue slider when channels.h.disabled is true', () => {
      render(<Controlled channels={{ h: { disabled: true } }} />);

      expect(screen.getByRole('slider', { name: /hue/i })).toHaveAttribute('aria-disabled', 'true');
    });

    it('renders the swatch by default', () => {
      render(<Controlled />);

      expect(screen.getByTestId('Swatch')).toBeInTheDocument();
    });

    it('hides the swatch when showSwatch is false', () => {
      render(<ColorPicker color="#ff0044" onChange={() => {}} showSwatch={false} />);

      expect(screen.queryByTestId('Swatch')).not.toBeInTheDocument();
    });

    it('hides the hue bar when showHueBar is false', () => {
      render(<ColorPicker color="#ff0044" onChange={() => {}} showHueBar={false} />);

      expect(screen.queryByRole('slider', { name: /hue/i })).not.toBeInTheDocument();
    });

    it('hides the 2D panel when showPicker is false', () => {
      const { container } = render(
        <ColorPicker color="#ff0044" onChange={() => {}} showPicker={false} />,
      );

      expect(container.querySelector('.cursor-crosshair')).not.toBeInTheDocument();
    });

    it('limits the mode switcher to the provided modes', () => {
      render(<ColorPicker color="#ff0044" modes={['hsl', 'rgb']} onChange={() => {}} />);

      expect(screen.queryByRole('button', { name: 'Switch to OKLCH' })).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Switch to HSL' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Switch to RGB' })).toBeInTheDocument();
    });

    it('omits the middle layer when swatch and hue bar are both hidden', () => {
      render(
        <ColorPicker color="#ff0044" onChange={() => {}} showHueBar={false} showSwatch={false} />,
      );

      expect(screen.queryByTestId('ColorPickerMiddleLayer')).not.toBeInTheDocument();
    });

    it('renders the alpha slider when showAlpha is true', () => {
      render(<ColorPicker color="#ff0044" onChange={() => {}} showAlpha />);

      expect(screen.getByRole('slider', { name: 'Alpha' })).toBeInTheDocument();
    });

    it('does not render the alpha slider by default', () => {
      render(<ColorPicker color="#ff0044" onChange={() => {}} />);

      expect(screen.queryByRole('slider', { name: 'Alpha' })).not.toBeInTheDocument();
    });

    it('renders the eyedropper when showEyeDropper is true and the API is supported', () => {
      (globalThis as unknown as { EyeDropper: unknown }).EyeDropper = function EyeDropperMock() {
        return { open: () => Promise.resolve({ sRGBHex: '#000000' }) };
      };

      render(<ColorPicker color="#ff0044" onChange={() => {}} showEyeDropper />);

      expect(screen.getByTestId('EyeDropper')).toBeInTheDocument();

      delete (globalThis as unknown as { EyeDropper?: unknown }).EyeDropper;
    });

    it('omits the eyedropper when the API is not supported', () => {
      delete (globalThis as unknown as { EyeDropper?: unknown }).EyeDropper;

      render(<ColorPicker color="#ff0044" onChange={() => {}} showEyeDropper />);

      expect(screen.queryByTestId('EyeDropper')).not.toBeInTheDocument();
    });

    it('renders ChannelSliders when showSliders is true', () => {
      render(<ColorPicker color="#ff0044" onChange={() => {}} showSliders />);

      expect(screen.getByTestId('ChannelSliders')).toBeInTheDocument();
    });

    it('does not render ChannelSliders by default', () => {
      render(<ColorPicker color="#ff0044" onChange={() => {}} />);

      expect(screen.queryByTestId('ChannelSliders')).not.toBeInTheDocument();
    });

    it('passes showInputs through to ChannelSliders when showSliders is true', () => {
      const { rerender } = render(
        <ColorPicker color="#ff0044" defaultMode="hsl" onChange={() => {}} showSliders />,
      );

      expect(screen.queryByDisplayValue('100')).not.toBeInTheDocument();

      rerender(
        <ColorPicker
          color="#ff0044"
          defaultMode="hsl"
          onChange={() => {}}
          showInputs
          showSliders
        />,
      );

      expect(screen.getAllByRole('textbox').length).toBeGreaterThan(1);
    });

    it('renders ChannelInputs when showInputs is true and showSliders is false', () => {
      render(<ColorPicker color="#ff0044" onChange={() => {}} showInputs />);

      expect(screen.getByTestId('ChannelInputs')).toBeInTheDocument();
    });

    it('does not render ChannelInputs when showSliders is true', () => {
      render(<ColorPicker color="#ff0044" onChange={() => {}} showInputs showSliders />);

      expect(screen.queryByTestId('ChannelInputs')).not.toBeInTheDocument();
    });

    it('renders the settings menu trigger when showSettings is true', () => {
      render(<ColorPicker color="#ff0044" onChange={() => {}} showSettings />);

      expect(screen.getByTestId('SettingsTrigger')).toBeInTheDocument();
    });

    it('does not render the settings menu trigger by default', () => {
      render(<ColorPicker color="#ff0044" onChange={() => {}} />);

      expect(screen.queryByTestId('SettingsTrigger')).not.toBeInTheDocument();
    });

    it('shows the gamut warning in OKLCH mode when displayFormat is narrow', () => {
      render(
        <ColorPicker color="#ff0044" defaultMode="oklch" displayFormat="hex" onChange={() => {}} />,
      );

      expect(screen.getByTestId('GamutWarning')).toBeInTheDocument();
    });

    it('hides the gamut warning when displayFormat is oklch', () => {
      render(<ColorPicker color="#ff0044" defaultMode="oklch" onChange={() => {}} />);

      expect(screen.queryByTestId('GamutWarning')).not.toBeInTheDocument();
    });

    it('hides the gamut warning outside OKLCH mode', () => {
      render(
        <ColorPicker color="#ff0044" defaultMode="hsl" displayFormat="hex" onChange={() => {}} />,
      );

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
      const { container } = render(
        <ColorPicker
          classNames={{
            root: 'slot-root',
            panel: { root: 'slot-panel-root', thumb: 'slot-panel-thumb' },
            colorInputWrapper: 'slot-colorinput-wrapper',
            colorInput: { root: 'slot-colorinput-root', input: 'slot-colorinput-input' },
            controls: 'slot-controls',
            hueSlider: { thumb: 'slot-hue-thumb' },
            swatch: { root: 'slot-swatch-root', color: 'slot-swatch-color' },
            eyeDropper: 'slot-eyedropper',
            modeSelector: 'slot-mode-selector',
          }}
          color="oklch(0.5 0.1 120)"
          defaultMode="oklch"
          onChange={() => {}}
          showEyeDropper
        />,
      );

      expect(container.firstElementChild?.className).toMatch(/slot-root/);
      expect(container.querySelector('.slot-panel-root')).toBeInTheDocument();
      expect(container.querySelector('.slot-panel-thumb')).toBeInTheDocument();
      expect(container.querySelector('.slot-colorinput-wrapper')).toBeInTheDocument();
      expect(container.querySelector('.slot-colorinput-root')).toBeInTheDocument();
      expect(container.querySelector('.slot-colorinput-input')).toBeInTheDocument();
      expect(container.querySelector('.slot-controls')).toBeInTheDocument();
      expect(screen.getByRole('slider', { name: /hue/i }).className).toMatch(/slot-hue-thumb/);
      expect(screen.getByTestId('Swatch').className).toMatch(/slot-swatch-root/);
      expect((screen.getByTestId('Swatch').firstChild as HTMLElement).className).toMatch(
        /slot-swatch-color/,
      );
      expect(screen.getByTestId('EyeDropper').className).toMatch(/slot-eyedropper/);
    });

    it('applies channel and numeric input classNames when sliders are shown', () => {
      const { container } = render(
        <ColorPicker
          classNames={{
            channelSliders: 'slot-channel-sliders',
            channelSlider: { thumb: 'slot-channel-thumb' },
            numericInput: { input: 'slot-numeric-input' },
          }}
          color="oklch(0.5 0.1 120)"
          defaultMode="oklch"
          onChange={() => {}}
          showInputs
          showSliders
        />,
      );

      expect(screen.getByTestId('ChannelSliders').className).toMatch(/slot-channel-sliders/);
      expect(container.querySelectorAll('.slot-channel-thumb').length).toBeGreaterThan(0);
      expect(container.querySelectorAll('.slot-numeric-input').length).toBeGreaterThan(0);
    });

    it('applies settingsMenu slots when the menu opens', () => {
      render(
        <ColorPicker
          classNames={{
            settingsMenu: { trigger: 'slot-settings-trigger', menu: 'slot-settings-menu' },
          }}
          color="#ff0044"
          onChange={() => {}}
          showSettings
        />,
      );

      const trigger = screen.getByTestId('SettingsTrigger');

      expect(trigger.className).toMatch(/slot-settings-trigger/);
      fireEvent.click(trigger);
      expect(screen.getByTestId('SettingsMenu').className).toMatch(/slot-settings-menu/);
    });
  });

  describe('Mode change callback', () => {
    it('fires onChangeMode when the switcher changes mode', () => {
      const onChangeMode = vi.fn();

      render(
        <ColorPicker
          color="#ff0044"
          defaultMode="hsl"
          onChange={() => {}}
          onChangeMode={onChangeMode}
        />,
      );

      fireEvent.click(screen.getByRole('button', { name: 'Switch to OKLCH' }));

      expect(onChangeMode).toHaveBeenCalledWith('oklch');
    });

    it('does not fire onChangeMode when clicking the current mode', () => {
      const onChangeMode = vi.fn();

      render(
        <ColorPicker
          color="#ff0044"
          defaultMode="hsl"
          onChange={() => {}}
          onChangeMode={onChangeMode}
        />,
      );

      fireEvent.click(screen.getByRole('button', { name: 'Switch to HSL' }));

      expect(onChangeMode).not.toHaveBeenCalled();
    });
  });

  describe('Display format', () => {
    it('displays hex when displayFormat="hex" regardless of mode', () => {
      render(
        <ColorPicker color="#ff0044" defaultMode="oklch" displayFormat="hex" onChange={() => {}} />,
      );

      const input = screen.getByLabelText('Color value') as HTMLInputElement;

      expect(input.value).toMatch(/^#[\da-f]{6}$/i);
    });

    it('displays oklch in OKLCH mode with displayFormat="auto"', () => {
      render(<ColorPicker color="#ff0044" defaultMode="oklch" onChange={() => {}} />);

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
  });

  describe('Mode switching', () => {
    it('switches from HSL to OKLCH on button click', () => {
      const { container } = render(<Controlled />);

      fireEvent.click(screen.getByRole('button', { name: 'Switch to OKLCH' }));

      expect(container.querySelector('canvas')).toBeInTheDocument();
    });

    it('switches from OKLCH back to HSL', () => {
      const { container } = render(<Controlled defaultMode="oklch" />);

      fireEvent.click(screen.getByRole('button', { name: 'Switch to HSL' }));

      expect(container.querySelector('canvas')).not.toBeInTheDocument();
      expect(container.querySelector('.cursor-crosshair')).toBeInTheDocument();
    });

    it('clicking the current mode is a no-op', () => {
      const { container } = render(<Controlled />);

      fireEvent.click(screen.getByRole('button', { name: 'Switch to HSL' }));

      expect(container.querySelector('canvas')).not.toBeInTheDocument();
    });
  });

  describe('Emission (output follows resolved format)', () => {
    it('emits hex in HSL mode with default (auto) output format', () => {
      const { container } = render(<Controlled defaultMode="hsl" />);
      const panel = container.querySelector('.cursor-crosshair') as HTMLElement;

      mockRect(panel, { left: 0, top: 0, width: 200, height: 100 });
      fireEvent.pointerDown(panel, { clientX: 100, clientY: 50, pointerId: 1 });

      expect(mockOnChange).toHaveBeenCalled();
      expect(mockOnChange.mock.calls[0][0]).toMatch(/^#[\da-f]{6}$/i);
    });

    it('emits OKLCH when OKLCHPanel is dragged in OKLCH mode', () => {
      const { container } = render(<Controlled defaultMode="oklch" />);
      const panel = container.querySelector('.cursor-crosshair') as HTMLElement;

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
      render(<Controlled defaultMode="oklch" />);

      fireEvent.keyDown(screen.getByRole('slider', { name: /hue/i }), { key: 'ArrowRight' });

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
      render(
        <ColorPicker
          color="#ff0044"
          defaultMode="oklch"
          onChange={mockOnChange}
          outputFormat="rgb"
        />,
      );

      fireEvent.keyDown(screen.getByRole('slider', { name: /hue/i }), { key: 'ArrowRight' });

      expect(mockOnChange.mock.calls[0][0]).toMatch(/^rgb\(/);
    });

    it('respects precision on emitted oklch output', () => {
      render(
        <ColorPicker
          color="#ff0044"
          defaultMode="oklch"
          onChange={mockOnChange}
          outputFormat="oklch"
          precision={2}
        />,
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
        <ColorPicker
          color="#ff0044"
          defaultMode="oklch"
          onChange={mockOnChange}
          outputFormat="oklch"
          precision={0}
        />,
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
    it('firing a full drag on the SaturationPanel emits multiple OKLCH values', () => {
      const { container } = render(<Controlled />);
      const panel = container.querySelector('.cursor-crosshair') as HTMLElement;

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
