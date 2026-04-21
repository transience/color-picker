import { ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import { convertCSS, formatCSS, opacity, parseCSS } from 'colorizr';

import AlphaSlider from './AlphaSlider';
import ChannelInputs from './ChannelInputs';
import ChannelSliders from './ChannelSliders';
import ColorInput from './ColorInput';
import GradientSlider from './components/GradientSlider';
import { DEFAULT_COLOR, DEFAULT_MODES, hslHueGradient, oklchHueGradient } from './constants';
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
import Toolbar from './Toolbar';
import type { ChannelsConfig, ColorFormat, ColorMode, ColorPickerClassNames } from './types';
import useInteractionAttribute from './useInteractionAttribute';

interface OKLCHState {
  c: number;
  h: number;
  l: number;
}

export interface ColorPickerProps {
  /**
   * Per-channel overrides for label, hidden, and disabled state.
   *
   * Keys not relevant to the active mode are ignored.
   */
  channels?: ChannelsConfig;
  /**
   * Slot-based className overrides for every internal element.
   *
   * See `ColorPickerClassNames` for the full slot map.
   */
  classNames?: ColorPickerClassNames;
  /**
   * Controlled color value.
   *
   * Accepts any CSS color string (hex, `rgb()`, `hsl()`, `oklch()`, `oklab()`, named colors, etc.).
   * Falls back to the internal default when `undefined`.
   */
  color?: string;
  /**
   * Initial mode for the 2D panel and channel controls.
   * @default 'oklch'
   */
  defaultMode?: ColorMode;
  /**
   * Initial text format for the `ColorInput`.
   *
   * `'auto'` → `'oklch'` in OKLCH mode, else `'hex'`.
   * @default 'auto'
   */
  displayFormat?: ColorFormat;
  /**
   * Modes available in the mode switcher.
   * @default ['oklch', 'hsl', 'rgb']
   */
  modes?: ColorMode[];
  /**
   * Called on every color change.
   *
   * Format follows the resolved `outputFormat`. Alpha is appended when
   * `showAlpha` is on and the current alpha is `< 1`.
   */
  onChange?: (value: string) => void;
  /** Called when the user changes mode via the switcher. */
  onChangeMode?: (mode: ColorMode) => void;
  /**
   * Initial format `onChange` emits.
   *
   * `'auto'` follows the resolved `displayFormat`.
   * @default 'auto'
   */
  outputFormat?: ColorFormat;
  /**
   * Decimal digits of precision for non-hex output.
   *
   * Ignored for hex output.
   * @default 5
   */
  precision?: number;
  /**
   * Adds an alpha slider and includes alpha in the emitted color.
   *
   * When `false`, any alpha on the incoming `color` prop is ignored.
   * @default false
   */
  showAlpha?: boolean;
  /**
   * Shows a text input with the current color value, formatted per `displayFormat`.
   * @default true
   */
  showColorInput?: boolean;
  /**
   * Adds an EyeDropper button to the toolbar.
   *
   * Silently omitted when `window.EyeDropper` is unavailable.
   * @default true
   */
  showEyeDropper?: boolean;
  /**
   * Shows the hue bar in the toolbar.
   * @default false
   */
  showHueBar?: boolean;
  /**
   * Shows numeric input fields for each channel.
   *
   * Renders inline with each slider when `showSliders` is on, as a standalone row otherwise.
   * @default true
   */
  showInputs?: boolean;
  /**
   * Show the color mode selector.
   * @default true
   */
  showModeSelector?: boolean;
  /**
   * Shows the 2D color panel.
   * @default true
   */
  showPanel?: boolean;
  /**
   * Adds a settings menu exposing display and output format controls.
   * @default false
   */
  showSettings?: boolean;
  /**
   * Shows a block of channel sliders matching the active mode.
   * @default true
   */
  showSliders?: boolean;
  /**
   * Shows a circular color preview in the toolbar.
   * @default true
   */
  showSwatch?: boolean;
}

// eslint-disable-next-line sonarjs/cognitive-complexity
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
    showColorInput = true,
    showEyeDropper = true,
    showHueBar = false,
    showInputs = true,
    showModeSelector = true,
    showPanel = true,
    showSettings = false,
    showSliders = true,
    showSwatch = true,
  } = props;
  const initialColor = color ?? DEFAULT_COLOR;

  const [alpha, setAlpha] = useState<number>(() => (showAlpha ? opacity(initialColor) : 1));
  const [displayFormat, setDisplayFormat] = useState<ColorFormat>(displayFormatProp);
  const [hsv, setHsv] = useState<HSV>(() => colorToHsv(initialColor));
  const [mode, setMode] = useState<ColorMode>(defaultMode);
  const [oklch, setOklch] = useState<OKLCHState>(() => parseCSS(initialColor, 'oklch'));
  const [outputFormat, setOutputFormat] = useState<ColorFormat>(outputFormatProp);
  const interactionRef = useInteractionAttribute();
  const containerRef = useRef<HTMLDivElement | null>(null);

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

  const rootRef = useCallback(
    (node: HTMLDivElement | null) => {
      containerRef.current = node;
      interactionRef(node);
    },
    [interactionRef],
  );

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

  const handleChangeAlpha = useCallback(
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

  const handleChangeColorInput = useCallback(
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

  const handleChangeDisplayFormat = useCallback((format: ColorFormat) => {
    setDisplayFormat(format);
    displayFormatRef.current = format;
  }, []);

  const handleChangeHsvHue = useCallback(
    (h: number) => {
      const next = { ...hsvRef.current, h };

      setHsv(next);
      emit(convertCSS(hsvToHex(next), 'oklch'));
    },
    [emit],
  );

  const handleChangeOklchHue = useCallback(
    (h: number) => {
      const next = { ...oklchRef.current, h };

      setOklch(next);
      emit(formatCSS(next, 'oklch'));
    },
    [emit],
  );

  const handleChangeOklchPanel = useCallback(
    (l: number, c: number) => {
      const next = { ...oklchRef.current, c, l };

      setOklch(next);
      emit(formatCSS(next, 'oklch'));
    },
    [emit],
  );

  const handleChangeOutputFormat = useCallback((format: ColorFormat) => {
    setOutputFormat(format);
    outputFormatRef.current = format;
  }, []);

  const handleChangeSaturationPanel = useCallback(
    (s: number, v: number) => {
      const next = { h: hsvRef.current.h, s, v };

      setHsv(next);
      emit(convertCSS(hsvToHex(next), 'oklch'));
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

  const content: Record<string, ReactNode> = {};

  if (showPanel) {
    content.panel = isOklch ? (
      <OKLCHPanel
        chroma={oklch.c}
        classNames={classNames?.panel}
        hue={oklch.h}
        lightness={oklch.l}
        onChange={handleChangeOklchPanel}
      />
    ) : (
      <SaturationPanel
        classNames={classNames?.panel}
        hue={hsv.h}
        onChange={handleChangeSaturationPanel}
        saturation={hsv.s}
        value={hsv.v}
      />
    );
  }

  if (showColorInput) {
    content.colorInput = (
      <ColorInput
        classNames={classNames?.colorInput}
        endContent={showGamutWarning ? <GamutWarning className={classNames?.gamutWarning} /> : null}
        onChange={handleChangeColorInput}
        value={displayValue}
      />
    );
  }

  if (showSwatch) {
    content.swatch = <Swatch classNames={classNames?.swatch} color={swatchColor} />;
  }

  if (showColorInput || showSwatch) {
    content.colorValue = (
      <div className={cn('flex items-center gap-2', classNames?.colorValue)}>
        {content.swatch}
        {content.colorInput}
      </div>
    );
  }

  if (showAlpha) {
    content.alphaSlider = (
      <AlphaSlider
        classNames={classNames?.alphaSlider}
        color={solidColor}
        onChange={handleChangeAlpha}
        value={alpha}
      />
    );
  }

  if (showHueBar) {
    content.hueBar = (
      <GradientSlider
        aria-label="HueBar"
        classNames={classNames?.hueSlider}
        gradient={isOklch ? oklchHueGradient : hslHueGradient}
        isDisabled={hueConfig?.disabled}
        maxValue={360}
        onValueChange={isOklch ? handleChangeOklchHue : handleChangeHsvHue}
        startContent="H"
        value={currentHue}
      />
    );
  }

  if (showAlpha || showHueBar) {
    content.toolbar = (
      <Toolbar
        alphaBar={content.alphaSlider}
        className={classNames?.toolbar}
        hueBar={content.hueBar}
      />
    );
  }

  if (showSliders) {
    content.sliders = (
      <ChannelSliders
        channelSliderClassNames={classNames?.channelSlider}
        channels={channels}
        className={classNames?.channelSliders}
        color={solidColor}
        mode={mode}
        numericInputClassNames={classNames?.numericInput}
        onChangeColor={handleChangeColorInput}
        showInputs={showInputs}
      />
    );
  } else if (showInputs) {
    content.inputs = (
      <ChannelInputs
        alpha={alpha}
        channels={channels}
        className={classNames?.channelInputs}
        color={solidColor}
        mode={mode}
        numericInputClassNames={classNames?.numericInput}
        onAlphaChange={handleChangeAlpha}
        onChangeColor={handleChangeColorInput}
        showAlpha={showAlpha}
      />
    );
  }

  if (showEyeDropper) {
    content.eyeDropper = (
      <EyeDropper
        key="eyeDropper"
        className={classNames?.eyeDropper}
        onChange={handleChangeColorInput}
      />
    );
  }

  if (showModeSelector) {
    content.modeSelector = (
      <ModeSelector
        key="modeSelector"
        className={classNames?.modeSelector}
        mode={mode}
        modes={modes}
        onClick={handleClickMode}
      />
    );
  }

  if (showSettings) {
    content.settings = (
      <SettingsMenu
        key="settings"
        classNames={classNames?.settingsMenu}
        containerRef={containerRef}
        displayFormat={displayFormat}
        onChangeDisplayFormat={handleChangeDisplayFormat}
        onChangeOutputFormat={handleChangeOutputFormat}
        outputFormat={outputFormat}
      />
    );
  }

  const options = [content.eyeDropper, content.modeSelector, content.settings].filter(Boolean);

  if (options.length) {
    content.options = (
      <div
        className={cn(
          'flex items-center gap-2 justify-between',
          { 'justify-center': options.length === 1 },
          classNames?.options,
        )}
        data-testid="Options"
      >
        {options}
      </div>
    );
  }

  return (
    <div
      ref={rootRef}
      className={cn(
        'relative overflow-hidden flex w-full max-w-xs flex-col gap-4 p-3',
        classNames?.root,
      )}
      data-testid="ColorPicker"
    >
      {content.panel}
      {content.colorValue}
      {content.toolbar}
      {content.sliders}
      {content.inputs}
      {content.options}
    </div>
  );
}
