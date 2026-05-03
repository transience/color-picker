import type { CSSProperties, ReactNode, RefObject } from 'react';

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
 * Per-channel toggles. Omitted fields fall back to component defaults.
 *
 * Visible labels and screen-reader text are configured through the top-level
 * `labels` prop on `ColorPicker` — see `ColorPickerLabels`.
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

/**
 * Slot-based text overrides for every internal element of `ColorPicker`.
 * Each rendered component reads only its own slot — no shared fallback chain.
 *
 * Per-key fields fall back to built-in English defaults when omitted.
 */
export interface ColorPickerLabels {
  /** Toolbar alpha slider. */
  alphaSlider?: LabelSlot;
  /**
   * Standalone numeric-input rows (rendered when `showSliders` is off).
   * Use the `'a'` key to label the alpha row when `showAlpha` is on.
   */
  channelInputs?: Partial<Record<ChannelKey | 'a', LabelSlot>>;
  /** ColorInput aria-label. @default 'Color value' */
  colorInput?: string;
  /** EyeDropper button aria-label. @default 'Pick color from screen' */
  eyeDropper?: string;
  /** Inline HSL sliders. */
  hslSliders?: Partial<Record<'h' | 's' | 'l', LabelSlot>>;
  /** Toolbar global hue slider (independent from the per-mode hue inside `hslSliders`/`oklchSliders`). */
  hueSlider?: LabelSlot;
  /**
   * Mode-switcher buttons. Each entry sets the visible label + aria-label for
   * one mode button. Omitted modes fall back to the uppercased mode value
   * (visible) and `Switch to {MODE}` (aria).
   */
  modeSelector?: Partial<Record<ColorMode, LabelSlot>>;
  /** Inline OKLCH sliders. */
  oklchSliders?: Partial<Record<'l' | 'c' | 'h', LabelSlot>>;
  /** Inline RGB sliders (slider + numeric input share the slot). */
  rgbSliders?: Partial<Record<'r' | 'g' | 'b', LabelSlot>>;
  /** SettingsMenu chrome strings. */
  settingsMenu?: {
    /**
     * Close-button aria-label.
     * @default 'Close settings'
     */
    close?: string;
    /**
     * Display-format radio-group title.
     * @default 'Display format'
     */
    displayFormat?: ReactNode;
    /**
     * Visible Done-button text.
     * @default 'Done'
     */
    done?: ReactNode;
    /**
     * Output-format radio-group title.
     * @default 'Output format'
     */
    outputFormat?: ReactNode;
    /**
     * Visible heading.
     * @default 'Settings'
     */
    title?: ReactNode;
    /**
     * Trigger aria-label.
     * @default 'Color format settings'
     */
    trigger?: string;
  };
}

export interface ColorPickerProps {
  /**
   * Per-channel toggles (`hidden`, `disabled`).
   *
   * Keys not relevant to the active mode are ignored. Visible labels and
   * screen-reader text are configured through the `labels` prop.
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
   * Slot-based text overrides for aria-labels and visible chrome strings.
   *
   * See `ColorPickerLabels` for the full slot map. Each rendered component
   * reads only its own slot — no shared fallback chain.
   */
  labels?: ColorPickerLabels;
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
  /**
   * Called once when the user finishes interacting with any slider, panel, or
   * channel input — pointer release, 600 ms after the last keystroke, or on
   * input blur. Receives the final color
   * formatted per the resolved `outputFormat`. Use to commit expensive side
   * effects (URL sync, autosave) only on release.
   *
   * Scope: sliders, panels, and `ChannelInputs`. `ColorInput` and `EyeDropper`
   * emit only `onChange` — treat each as a complete commit (no Start/End pair).
   */
  onChangeEnd?: (value: string) => void;
  /** Called when the user changes mode via the switcher. */
  onChangeMode?: (mode: ColorMode) => void;
  /**
   * Called once when the user begins interacting with any slider, panel, or
   * channel input — `pointerdown`, first value-changing keydown after idle,
   * or first typed keystroke after idle. Receives the color before any change,
   * formatted per the resolved `outputFormat`.
   *
   * Scope: sliders, panels, and `ChannelInputs`. `ColorInput` and `EyeDropper`
   * emit only `onChange` — treat each as a complete commit (no Start/End pair).
   */
  onChangeStart?: (value: string) => void;
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
  style?: CSSProperties;
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

/**
 * Visible content + screen-reader text for a single label-bearing element.
 * Both fields are optional; each falls back to a component-level default.
 */
export interface LabelSlot {
  /**
   * Screen-reader text for the underlying input/slider/button.
   */
  ariaLabel?: string;
  /**
   * Visible content rendered at the slot's leading edge — e.g. a one-letter
   * glyph for a channel slider, or an icon node.
   */
  label?: ReactNode;
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
  /**
   * Fire on a child slider/panel's `onChangeEnd`. Emits the consumer's
   * `onChangeEnd` with the current color in the resolved `outputFormat`.
   */
  handleInteractionEnd: () => void;
  /**
   * Fire on a child slider/panel's `onChangeStart`. Emits the consumer's
   * `onChangeStart` with the current color in the resolved `outputFormat`.
   */
  handleInteractionStart: () => void;
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
