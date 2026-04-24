import type { ReactNode } from 'react';

/**
 * Identifiers for every color channel the picker can render.
 * - Shared: `h` (hue)
 * - HSL: `s`, `l`
 * - OKLCH: `c`, `l`
 * - RGB: `r`, `g`, `b`
 */
export type ChannelKey = 'b' | 'c' | 'g' | 'h' | 'l' | 'r' | 's';

/**
 * Map of channel overrides. Channels not listed use defaults.
 * Keys not relevant to the current `mode` are ignored.
 */
export type ChannelsConfig = Partial<Record<ChannelKey, ChannelConfig>>;

/**
 * Text representation for the ColorInput (`displayFormat`) or the emitted
 * `onChange` value (`outputFormat`). `'auto'` resolves based on `mode`:
 * OKLCH mode → `'oklch'`, else → `'hex'`.
 */
export type ColorFormat = 'auto' | 'hex' | 'hsl' | 'oklab' | 'oklch' | 'rgb';

/**
 * Color space the picker operates in. Drives the 2D panel, mode switcher,
 * and which channel slider/input set is rendered.
 */
export type ColorMode = 'hsl' | 'oklch' | 'rgb';

/**
 * Per-channel customization. Omitted fields fall back to component defaults.
 */
export interface ChannelConfig {
  /**
   * Disable the channel's slider and numeric input.
   * @default false
   */
  disabled?: boolean;
  /**
   * Hide the channel entirely (slider + input are not rendered).
   * @default false
   */
  hidden?: boolean;
  /**
   * Override the default one-letter label rendered at the slider's start
   * (e.g. "H", "S", "L"). Useful for wrapping the label in a tooltip, icon,
   * or any consumer-specific decoration.
   */
  label?: ReactNode;
}

export interface ChannelInputsClassNames {
  label?: string;
  root?: string;
}

export interface ColorInputClassNames {
  input?: string;
  root?: string;
}

/**
 * Slot-based className overrides for every internal part of `ColorPicker`.
 * Each slot's classes are merged with the component's defaults via `cn()`
 * (`clsx` + `tailwind-merge`), so Tailwind utilities override correctly.
 */
export interface ColorPickerClassNames {
  /** AlphaSlider (delegates to GradientSlider sub-parts). */
  alphaSlider?: GradientSliderClassNames;
  /** Wrapper row for the ChannelInputs layout (shown when `showInputs` is on and `showSliders` is off). */
  channelInputs?: ChannelInputsClassNames;
  /** Applied to each channel slider's sub-parts (L/C/H, H/S/L, or R/G/B). */
  channelSlider?: GradientSliderClassNames;
  /** Wrapper stacking the channel sliders (shown when `showSliders` is on). */
  channelSliders?: string;
  /** Color value text input (root frame + inner `<input>`). */
  colorInput?: ColorInputClassNames;
  /** Wrapper row for the swatch and the colorInput. */
  colorValue?: string;
  /** Screen color picker button. */
  eyeDropper?: string;
  /** Gamut warning icon shown inside `colorInput` in narrow formats. */
  gamutWarning?: string;
  /** Hue GradientSlider in the toolbar row. */
  hueSlider?: GradientSliderClassNames;
  /** Color mode switcher row (OKLCH/HSL/RGB buttons). */
  modeSelector?: ModeSelectorClassNames;
  /** Applied to every NumericInput (inline slider inputs and standalone rows). */
  numericInput?: NumericInputClassNames;
  /** Wrapper row for the modeSelector and settingsMenu */
  options?: string;
  /** 2D draggable panel (OKLCH or Saturation/Value). */
  panel?: PanelClassNames;
  /** Outermost ColorPicker root element. */
  root?: string;
  /** Settings menu (⋮ trigger + popover menu). */
  settingsMenu?: SettingsMenuClassNames;
  /** Color preview swatch (outer checkerboard + inner color fill). */
  swatch?: SwatchClassNames;
  /** Wrapper column containing the hue bar and alpha bar. */
  toolbar?: string;
  /** Tooltip popover content (applied wherever ColorPicker renders a tooltip). */
  tooltip?: string;
}

export interface GradientSliderClassNames {
  root?: string;
  thumb?: string;
  track?: string;
}

export interface ModeSelectorClassNames {
  activeButton?: string;
  button?: string;
  root?: string;
}

export interface NumericInputClassNames {
  input?: string;
  root?: string;
  suffix?: string;
}

export interface PanelClassNames {
  root?: string;
  thumb?: string;
}

export interface SettingsMenuClassNames {
  menu?: string;
  trigger?: string;
}

export interface SettingsOption {
  label: string;
  value: ColorFormat;
}

export interface SwatchClassNames {
  color?: string;
  root?: string;
}
