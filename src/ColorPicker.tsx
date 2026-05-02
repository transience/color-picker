import { ReactNode } from 'react';

import AlphaSlider from './AlphaSlider';
import ChannelInputs from './ChannelInputs';
import ChannelSliders from './ChannelSliders';
import ColorInput from './ColorInput';
import GamutWarning from './components/GamutWarning';
import EyeDropper from './EyeDropper';
import useColorPicker from './hooks/useColorPicker';
import HueSlider from './HueSlider';
import ModeSelector from './ModeSelector';
import { cn } from './modules/helpers';
import OKLCHPanel from './OKLCHPanel';
import SaturationPanel from './SaturationPanel';
import SettingsMenu from './SettingsMenu';
import Swatch from './Swatch';
import type { ColorPickerProps } from './types';

export default function ColorPicker(props: ColorPickerProps) {
  const picker = useColorPicker(props);
  const {
    alpha,
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
    handleInteractionEnd,
    handleInteractionStart,
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
    labels,
    modes,
    showAlpha,
    showColorInput,
    showEyeDropper,
    showGlobalHue,
    showInputs,
    showModeSelector,
    showPanel,
    showSettings,
    showSliders,
    showSwatch,
    style,
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
        onChangeEnd={handleInteractionEnd}
        onChangeStart={handleInteractionStart}
      />
    ) : (
      <SaturationPanel
        classNames={classNames?.panel}
        hue={hsv.h}
        onChange={handleChangeSaturationPanel}
        onChangeEnd={handleInteractionEnd}
        onChangeStart={handleInteractionStart}
        saturation={hsv.s}
        value={hsv.v}
      />
    );
  }

  if (showColorInput) {
    content.colorInput = (
      <ColorInput
        aria-label={labels?.colorInput}
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
        aria-label={labels?.alphaSlider?.ariaLabel}
        classNames={classNames?.alphaSlider}
        color={solidColor}
        label={labels?.alphaSlider?.label}
        onChange={handleChangeAlpha}
        onChangeEnd={handleInteractionEnd}
        onChangeStart={handleInteractionStart}
        value={alpha}
      />
    );
  }

  if (showGlobalHue) {
    content.globalHue = (
      <HueSlider
        aria-label={labels?.hueSlider?.ariaLabel}
        classNames={classNames?.hueSlider}
        isDisabled={hueConfig?.disabled}
        label={labels?.hueSlider?.label}
        mode={mode}
        onChange={isOklch ? handleChangeOklchHue : handleChangeHsvHue}
        onChangeEnd={handleInteractionEnd}
        onChangeStart={handleInteractionStart}
        value={currentHue}
      />
    );
  }

  if (showAlpha || showGlobalHue) {
    content.toolbar = (
      <div className={cn('w-full flex flex-col gap-3', classNames?.toolbar)}>
        {content.globalHue}
        {content.alphaSlider}
      </div>
    );
  }

  if (showSliders) {
    content.sliders = (
      <ChannelSliders
        channelSliderClassNames={classNames?.channelSlider}
        channels={channels}
        className={classNames?.channelSliders}
        color={solidColor}
        labels={labels}
        mode={mode}
        numericInputClassNames={classNames?.numericInput}
        onChange={handleChangeColorInput}
        onChangeEnd={handleInteractionEnd}
        onChangeStart={handleInteractionStart}
        showInputs={showInputs}
      />
    );
  } else if (showInputs) {
    content.inputs = (
      <ChannelInputs
        alpha={alpha}
        classNames={classNames?.channelInputs}
        color={solidColor}
        labels={labels?.channelInputs}
        mode={mode}
        numericInputClassNames={classNames?.numericInput}
        onChange={handleChangeColorInput}
        onChangeAlpha={handleChangeAlpha}
        showAlpha={showAlpha}
      />
    );
  }

  if (showEyeDropper) {
    content.eyeDropper = (
      <EyeDropper
        key="eyeDropper"
        aria-label={labels?.eyeDropper}
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
        labels={labels?.modeSelector}
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
        displayFormat={displayFormat}
        labels={labels?.settingsMenu}
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
      style={style}
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
