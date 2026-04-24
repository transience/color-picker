import { ReactNode } from 'react';

import AlphaSlider from './AlphaSlider';
import ChannelInputs from './ChannelInputs';
import ChannelSliders from './ChannelSliders';
import ColorInput from './ColorInput';
import GradientSlider from './components/GradientSlider';
import { hslHueGradient, oklchHueGradient } from './constants';
import EyeDropper from './EyeDropper';
import GamutWarning from './GamutWarning';
import useColorPicker from './hooks/useColorPicker';
import ModeSelector from './ModeSelector';
import { cn } from './modules/helpers';
import OKLCHPanel from './OKLCHPanel';
import SaturationPanel from './SaturationPanel';
import SettingsMenu from './SettingsMenu';
import Swatch from './Swatch';
import Toolbar from './Toolbar';
import type { ChannelsConfig, ColorFormat, ColorMode, ColorPickerClassNames } from './types';

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
  const picker = useColorPicker(props);
  const {
    alpha,
    containerRef,
    currentHue,
    displayFormat,
    displayValue,
    handleChangeAlpha,
    handleChangeColorInput,
    handleChangeDisplayFormat,
    handleChangeHsvHue,
    handleChangeOklchHue,
    handleChangeOklchPanel,
    handleChangeOutputFormat,
    handleChangeSaturationPanel,
    handleClickMode,
    hsv,
    isOklch,
    mode,
    oklch,
    outputFormat,
    rootRef,
    showGamutWarning,
    solidColor,
    swatchColor,
  } = picker;
  const {
    channels,
    classNames,
    modes,
    showAlpha,
    showColorInput,
    showEyeDropper,
    showHueBar,
    showInputs,
    showModeSelector,
    showPanel,
    showSettings,
    showSliders,
    showSwatch,
  } = picker.props;

  const hueConfig = channels?.h;
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
    content.swatch = <Swatch aria-hidden classNames={classNames?.swatch} color={swatchColor} />;
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
        classNames={classNames?.channelInputs}
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
        classNames={classNames?.modeSelector}
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
