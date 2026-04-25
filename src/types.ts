import type { ReactNode, RefObject } from 'react';

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
   * Shows the global (mode-independent) hue slider in the toolbar.
   * @default false
   */
  showGlobalHue?: boolean;
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

export interface GradientSliderClassNames {
  root?: string;
  thumb?: string;
  track?: string;
}

export interface HSV {
  h: number; // 0-360
  s: number; // 0-1
  v: number; // 0-1
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

/**
 * OKLCH color as `{ l, c, h }`. Used by the hook and the OKLCH panel.
 * - `l` — lightness, 0–1
 * - `c` — chroma, 0–0.4 (clamped by gamut)
 * - `h` — hue, 0–360
 */
export interface OklchColor {
  c: number;
  h: number;
  l: number;
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

/**
 * Return shape of `useColorPicker` — the contract consumers use to compose
 * custom layouts. Grouped: refs, state, handlers, derived values.
 *
 * See `docs/HOOK.md` for usage and composition examples.
 */
export interface UseColorPickerReturn {
  /** Alpha (0–1). Only meaningful when `showAlpha` is enabled. */
  alpha: number;
  /** Imperative ref to the same root element, available after mount. */
  containerRef: RefObject<HTMLDivElement | null>;
  /** Hue of the active mode (`oklch.h` in OKLCH mode, else `hsv.h`). */
  currentHue: number;
  /** Resolved display format for the `ColorInput`. */
  displayFormat: ColorFormat;
  /** Current color formatted per resolved `displayFormat`. Feed to `ColorInput`. */
  displayValue: string;
  handleChangeAlpha: (next: number) => void;
  handleChangeColorInput: (value: string) => void;
  handleChangeDisplayFormat: (format: ColorFormat) => void;
  handleChangeHsvHue: (h: number) => void;
  handleChangeOklchHue: (h: number) => void;
  handleChangeOklchPanel: (l: number, c: number) => void;
  handleChangeOutputFormat: (format: ColorFormat) => void;
  handleChangeSaturationPanel: (s: number, v: number) => void;
  handleClickMode: (value: ColorMode) => void;
  /** HSV triplet driving the Saturation panel and HSL/RGB sliders. */
  hsv: HSV;
  /** `true` when `mode === 'oklch'`. */
  isOklch: boolean;
  /** Active color mode (`'oklch' | 'hsl' | 'rgb'`). */
  mode: ColorMode;
  /** OKLCH triplet driving the OKLCH panel and OKLCH sliders. */
  oklch: OklchColor;
  /** Resolved output format for the emitted `onChange` value. */
  outputFormat: ColorFormat;
  /** Input props merged with defaults. Useful when forwarding flags to sub-components. */
  props: ColorPickerProps;
  /** Callback ref for the picker root. Wires up `data-interacting` for host interop. */
  rootRef: (node: HTMLDivElement | null) => void;
  /** `true` when the current OKLCH color falls outside sRGB and a narrow format is active. */
  showGamutWarning: boolean;
  /** Current color as a solid CSS string (no alpha). Feed to panels / backgrounds. */
  solidColor: string;
  /** Alias of `displayValue` — intended for the `Swatch` `color` prop. */
  swatchColor: string;
}
