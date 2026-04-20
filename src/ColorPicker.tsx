import { useCallback, useEffect, useRef, useState } from 'react';
import { convertCSS, formatCSS, opacity, parseCSS } from 'colorizr';

import AlphaSlider from './AlphaSlider';
import ChannelInputs from './ChannelInputs';
import ChannelSliders from './ChannelSliders';
import ColorInput from './ColorInput';
import GradientSlider from './components/GradientSlider';
import { DEFAULT_COLOR, DEFAULT_MODES, hslHueGradient, oklchHueGradient } from './constants';
import Controls from './Controls';
import EyeDropper from './EyeDropper';
import GamutWarning from './GamutWarning';
import ModeSelector from './ModeSelector';
import { colorToHsv, type HSV, hsvToHex, isOklchInSRGB } from './modules/colorSpace';
import {
  formatColor,
  isNarrowFormat,
  resolveDisplayFormat,
  resolveOutputFormat,
} from './modules/format';
import { cn } from './modules/helpers';
import OKLCHPanel from './OKLCHPanel';
import SaturationPanel from './SaturationPanel';
import SettingsMenu from './SettingsMenu';
import Swatch from './Swatch';
import type { ChannelsConfig, ColorFormat, ColorMode, ColorPickerClassNames } from './types';
import useInteractionAttribute from './useInteractionAttribute';

interface OKLCHState {
  c: number;
  h: number;
  l: number;
}

export interface ColorPickerProps {
  /**
   * Per-channel overrides for label, hidden, and disabled state. Keys not
   * relevant to the active mode are ignored (e.g. `s` is a no-op in OKLCH
   * mode). Applies to both the middle-layer hue bar and any channel
   * slider/input rendered for the mode.
   */
  channels?: ChannelsConfig;
  /**
   * Slot-based className overrides for every internal part. Each slot is
   * merged with the component's defaults via `cn()` (`clsx` + `tailwind-merge`)
   * so Tailwind utilities override correctly. See `ColorPickerClassNames` for
   * the full slot map.
   */
  classNames?: ColorPickerClassNames;
  /**
   * Controlled color value. Accepts any CSS color string (hex, `rgb()`,
   * `hsl()`, `oklch()`, named colors, etc.) — parsed via `colorizr`. When
   * `undefined`, the picker falls back to its internal default color.
   */
  color?: string;
  /**
   * Initial mode for the 2D panel and channel controls. Applies only on
   * mount; use the mode switcher (or re-mount) to change mode afterwards.
   * @default 'oklch'
   */
  defaultMode?: ColorMode;
  /**
   * Initial value for the ColorInput's text format. After mount, the settings
   * menu mutates internal state — this prop is read once. `'auto'` resolves
   * to `'oklch'` when `mode === 'oklch'`, otherwise `'hex'`.
   * @default 'auto'
   */
  displayFormat?: ColorFormat;
  /**
   * Modes shown in the bottom mode switcher. Pass a subset to restrict the
   * user to specific color spaces (e.g. `['oklch']` for an OKLCH-only picker).
   * @default ['oklch', 'hsl', 'rgb']
   */
  modes?: ColorMode[];
  /**
   * Called on every color change — 2D panel, hue bar, alpha slider, channel
   * slider/input, text input, or EyeDropper. Format follows the resolved
   * `outputFormat` (defaults to the resolved `displayFormat`). Alpha is
   * appended only when `showAlpha` is on and the current alpha is `< 1`.
   */
  onChange?: (value: string) => void;
  /** Called when the user flips the mode via the switcher. */
  onChangeMode?: (mode: ColorMode) => void;
  /**
   * Initial value for what `onChange` emits. After mount, the settings menu
   * mutates internal state. `'auto'` follows the resolved `displayFormat`.
   * @default 'auto'
   */
  outputFormat?: ColorFormat;
  /**
   * Decimal digits of precision used when emitting non-hex output and
   * rendering the text input. Forwarded to colorizr's `formatCSS` — `0`
   * rounds to integers, larger values give more digits. Unset uses
   * colorizr's default (`5`). Ignored for hex output.
   * @default undefined
   */
  precision?: number;
  /**
   * Adds an alpha slider to the middle layer and includes alpha in the
   * emitted color. When `false`, any alpha on the incoming `color` prop is
   * ignored and output is always fully opaque.
   * @default false
   */
  showAlpha?: boolean;
  /**
   * Adds an EyeDropper button (screen color picker) to the middle layer.
   * Silently omitted in browsers that do not implement `window.EyeDropper`
   * (currently Chromium-only — Firefox and Safari do not support it).
   * @default false
   */
  showEyeDropper?: boolean;
  /**
   * Shows the rainbow hue bar in the middle layer. Disable when a hue
   * channel slider is already surfaced via `showSliders`, or for compact,
   * hue-locked variants of the picker.
   * @default true
   */
  showHueBar?: boolean;
  /**
   * Shows numeric input fields for each channel. When `showSliders` is also
   * on, inputs render inline as each slider's `endContent`; when off, a
   * standalone row of labelled boxed inputs renders below the mode switcher
   * (with an extra alpha input when `showAlpha` is also on).
   * @default false
   */
  showInputs?: boolean;
  /**
   * Shows the 2D color panel (saturation/value for HSL/RGB,
   * chroma/lightness for OKLCH). Disable for a compact picker built around
   * the middle layer and channel sliders/inputs only.
   * @default true
   */
  showPicker?: boolean;
  /**
   * Adds a ⋮ menu at the right of the mode switcher bar exposing display
   * format and output format choices to end users. Off by default — these
   * formats are primarily a developer API.
   * @default false
   */
  showSettings?: boolean;
  /**
   * Shows a block of channel sliders matching the active mode (L/C/H in
   * OKLCH, H/S/L in HSL, R/G/B in RGB). Each slider has a gradient track
   * reflecting its channel's range for the current color.
   * @default false
   */
  showSliders?: boolean;
  /**
   * Shows a circular color preview in the middle layer. The swatch renders
   * the current color over a checkerboard so alpha is visible when
   * `showAlpha` is on.
   * @default true
   */
  showSwatch?: boolean;
}

export default function ColorPicker(props: ColorPickerProps) {
  const {
    channels,
    classNames,
    color,
    defaultMode = 'oklch',
    displayFormat: displayFormatProp = 'auto',
    modes = DEFAULT_MODES,
    onChange,
    onChangeMode,
    outputFormat: outputFormatProp = 'auto',
    precision,
    showAlpha = false,
    showEyeDropper = false,
    showHueBar = true,
    showInputs = false,
    showPicker = true,
    showSettings = false,
    showSliders = false,
    showSwatch = true,
  } = props;
  const initialColor = color ?? DEFAULT_COLOR;

  const [alpha, setAlpha] = useState<number>(() => (showAlpha ? opacity(initialColor) : 1));
  const [displayFormat, setDisplayFormat] = useState<ColorFormat>(displayFormatProp);
  const [hsv, setHsv] = useState<HSV>(() => colorToHsv(initialColor));
  const [mode, setMode] = useState<ColorMode>(defaultMode);
  const [oklch, setOklch] = useState<OKLCHState>(() => parseCSS(initialColor, 'oklch'));
  const [outputFormat, setOutputFormat] = useState<ColorFormat>(outputFormatProp);
  const rootRef = useInteractionAttribute();

  const lastEmittedRef = useRef(initialColor);

  const alphaRef = useRef(alpha);
  const displayFormatRef = useRef(displayFormat);
  const hsvRef = useRef(hsv);
  const modeRef = useRef(mode);
  const oklchRef = useRef(oklch);
  const onChangeRef = useRef(onChange);
  const onChangeModeRef = useRef(onChangeMode);
  const outputFormatRef = useRef(outputFormat);
  const precisionRef = useRef(precision);
  const showAlphaRef = useRef(showAlpha);

  alphaRef.current = alpha;
  displayFormatRef.current = displayFormat;
  hsvRef.current = hsv;
  modeRef.current = mode;
  oklchRef.current = oklch;
  onChangeRef.current = onChange;
  onChangeModeRef.current = onChangeMode;
  outputFormatRef.current = outputFormat;
  precisionRef.current = precision;
  showAlphaRef.current = showAlpha;

  useEffect(() => {
    if (color !== undefined && color !== lastEmittedRef.current) {
      setHsv(colorToHsv(color));
      setOklch(parseCSS(color, 'oklch'));

      if (showAlphaRef.current) {
        setAlpha(opacity(color));
      }
    }
  }, [color]);

  const emit = useCallback((oklchValue: string) => {
    const resolved = resolveOutputFormat(
      outputFormatRef.current,
      displayFormatRef.current,
      modeRef.current,
    );
    const alphaForOutput =
      showAlphaRef.current && alphaRef.current < 1 ? alphaRef.current : undefined;
    const final = formatColor(oklchValue, resolved, alphaForOutput, precisionRef.current);

    lastEmittedRef.current = final;
    onChangeRef.current?.(final);

    return final;
  }, []);

  const handleSaturationChange = useCallback(
    (s: number, v: number) => {
      const next = { h: hsvRef.current.h, s, v };

      setHsv(next);
      emit(convertCSS(hsvToHex(next), 'oklch'));
    },
    [emit],
  );

  const handleHsvHueChange = useCallback(
    (h: number) => {
      const next = { ...hsvRef.current, h };

      setHsv(next);
      emit(convertCSS(hsvToHex(next), 'oklch'));
    },
    [emit],
  );

  const handleOklchPanelChange = useCallback(
    (l: number, c: number) => {
      const next = { ...oklchRef.current, c, l };

      setOklch(next);
      emit(formatCSS(next, 'oklch'));
    },
    [emit],
  );

  const handleOklchHueChange = useCallback(
    (h: number) => {
      const next = { ...oklchRef.current, h };

      setOklch(next);
      emit(formatCSS(next, 'oklch'));
    },
    [emit],
  );

  const handleAlphaChange = useCallback(
    (next: number) => {
      setAlpha(next);
      alphaRef.current = next;

      const base =
        modeRef.current === 'oklch'
          ? formatCSS(oklchRef.current, 'oklch')
          : convertCSS(hsvToHex(hsvRef.current), 'oklch');

      emit(base);
    },
    [emit],
  );

  const handleColorInput = useCallback(
    (value: string) => {
      const oklchValue = convertCSS(value, 'oklch');

      setHsv(colorToHsv(value));
      setOklch(parseCSS(value, 'oklch'));

      if (showAlphaRef.current) {
        const nextAlpha = opacity(value);

        setAlpha(nextAlpha);
        alphaRef.current = nextAlpha;
      }

      emit(oklchValue);
    },
    [emit],
  );

  const handleClickMode = (value: ColorMode) => {
    if (value === mode) {
      return;
    }

    setMode(value);
    onChangeModeRef.current?.(value);
  };

  const handleChangeDisplayFormat = useCallback((format: ColorFormat) => {
    setDisplayFormat(format);
    displayFormatRef.current = format;
  }, []);

  const handleChangeOutputFormat = useCallback((format: ColorFormat) => {
    setOutputFormat(format);
    outputFormatRef.current = format;
  }, []);

  const isOklch = mode === 'oklch';
  const currentHue = isOklch ? oklch.h : hsv.h;
  const hueConfig = channels?.h;

  const solidColor = isOklch ? formatCSS(oklch, { format: 'oklch' }) : hsvToHex(hsv);
  const canonicalOklch = isOklch ? solidColor : convertCSS(solidColor, 'oklch');
  const resolvedDisplayFormat = resolveDisplayFormat(displayFormat, mode);
  const alphaForDisplay = showAlpha && alpha < 1 ? alpha : undefined;
  const displayValue = formatColor(
    canonicalOklch,
    resolvedDisplayFormat,
    alphaForDisplay,
    precision,
  );
  const swatchColor = displayValue;
  const showGamutWarning =
    isOklch && isNarrowFormat(resolvedDisplayFormat) && !isOklchInSRGB(oklch.l, oklch.c, oklch.h);

  const hueBar =
    showHueBar && !hueConfig?.hidden ? (
      <GradientSlider
        aria-label="HueBar"
        classNames={classNames?.hueSlider}
        gradient={isOklch ? oklchHueGradient : hslHueGradient}
        isDisabled={hueConfig?.disabled}
        maxValue={360}
        onValueChange={isOklch ? handleOklchHueChange : handleHsvHueChange}
        value={currentHue}
      />
    ) : null;

  const alphaBar = showAlpha ? (
    <AlphaSlider
      classNames={classNames?.alphaSlider}
      color={solidColor}
      onChange={handleAlphaChange}
      value={alpha}
    />
  ) : null;

  return (
    <div
      ref={rootRef}
      className={cn('flex w-full max-w-xs flex-col gap-3', classNames?.root)}
      data-testid="ColorPicker"
    >
      {showPicker && (
        <div className="pt-3 px-3" data-testid="ColorPanel">
          {isOklch ? (
            <OKLCHPanel
              chroma={oklch.c}
              classNames={classNames?.panel}
              hue={oklch.h}
              lightness={oklch.l}
              onChange={handleOklchPanelChange}
            />
          ) : (
            <SaturationPanel
              classNames={classNames?.panel}
              hue={hsv.h}
              onChange={handleSaturationChange}
              saturation={hsv.s}
              value={hsv.v}
            />
          )}
        </div>
      )}
      <div className={cn('px-3', classNames?.colorInputWrapper)} data-testid="ColorInputWrapper">
        <ColorInput
          classNames={classNames?.colorInput}
          endContent={
            showGamutWarning ? <GamutWarning className={classNames?.gamutWarning} /> : null
          }
          onChange={handleColorInput}
          value={displayValue}
        />
      </div>
      <Controls
        alphaBar={alphaBar}
        className={classNames?.controls}
        eyeDropper={
          showEyeDropper ? (
            <EyeDropper className={classNames?.eyeDropper} onChange={handleColorInput} />
          ) : null
        }
        hueBar={hueBar}
        swatch={showSwatch ? <Swatch classNames={classNames?.swatch} color={swatchColor} /> : null}
      />
      {showSliders && (
        <ChannelSliders
          channelSliderClassNames={classNames?.channelSlider}
          channels={channels}
          className={classNames?.channelSliders}
          color={solidColor}
          mode={mode}
          numericInputClassNames={classNames?.numericInput}
          onChangeColor={handleColorInput}
          showInputs={showInputs}
        />
      )}
      {!showSliders && showInputs && (
        <ChannelInputs
          alpha={alpha}
          channels={channels}
          className={classNames?.channelInputs}
          color={solidColor}
          mode={mode}
          numericInputClassNames={classNames?.numericInput}
          onAlphaChange={handleAlphaChange}
          onChangeColor={handleColorInput}
          showAlpha={showAlpha}
        />
      )}
      <div className="flex items-center justify-between gap-2 pb-3 px-3">
        <ModeSelector
          className={classNames?.modeSelector}
          mode={mode}
          modes={modes}
          onClick={handleClickMode}
        />
        {showSettings && (
          <SettingsMenu
            classNames={classNames?.settingsMenu}
            displayFormat={displayFormat}
            onChangeDisplayFormat={handleChangeDisplayFormat}
            onChangeOutputFormat={handleChangeOutputFormat}
            outputFormat={outputFormat}
          />
        )}
      </div>
    </div>
  );
}
