import type { ColorMode } from './types';

export const DEFAULT_COLOR = 'oklch(54% 0.194 250)';
export const DEFAULT_MODES: ColorMode[] = ['oklch', 'hsl', 'rgb'];

/**
 * English defaults for every slot in `ColorPickerLabels`.
 *
 * Each subcomponent reads only its own slot from `labels` and falls back
 * here at the use site. Per-key, not per-component — splitting alpha/hue
 * defaults from the channel slider defaults is intentional (each rendered
 * component is independent).
 */
export const DEFAULT_LABELS = {
  eyeDropper: 'Pick color from screen',
  colorInput: 'Color value',
  settingsMenu: {
    trigger: 'Color format settings',
    title: 'Settings',
    close: 'Close settings',
    done: 'Done',
    displayFormat: 'Display format',
    outputFormat: 'Output format',
  },
  modeSelector: {
    visible: (mode: ColorMode) => mode.toLocaleUpperCase(),
    ariaLabel: (mode: ColorMode) => `Switch to ${mode.toLocaleUpperCase()}`,
  },
  hueSlider: { label: undefined, ariaLabel: 'GlobalHue' },
  alphaSlider: { label: undefined, ariaLabel: 'Alpha' },
  rgbSliders: {
    r: { label: 'R', ariaLabel: 'Red' },
    g: { label: 'G', ariaLabel: 'Green' },
    b: { label: 'B', ariaLabel: 'Blue' },
  },
  hslSliders: {
    h: { label: 'H', ariaLabel: 'Hue' },
    s: { label: 'S', ariaLabel: 'Saturation' },
    l: { label: 'L', ariaLabel: 'Lightness' },
  },
  oklchSliders: {
    l: { label: 'L', ariaLabel: 'Lightness' },
    c: { label: 'C', ariaLabel: 'Chroma' },
    h: { label: 'H', ariaLabel: 'Hue' },
  },
  channelInputs: {
    r: { label: 'R', ariaLabel: 'Red' },
    g: { label: 'G', ariaLabel: 'Green' },
    b: { label: 'B', ariaLabel: 'Blue' },
    h: { label: 'H', ariaLabel: 'Hue' },
    s: { label: 'S', ariaLabel: 'Saturation' },
    l: { label: 'L', ariaLabel: 'Lightness' },
    c: { label: 'C', ariaLabel: 'Chroma' },
    a: { label: 'A', ariaLabel: 'Alpha' },
  },
} as const;

export const panelClasses = {
  root: 'relative h-32 w-full cursor-crosshair overflow-hidden',
  thumb:
    'pointer-events-none absolute size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border border-black ring-2 ring-white/20',
} as const;

export const hslHueGradient =
  'linear-gradient(to right, hsl(0 100% 50%), hsl(60 100% 50%), hsl(120 100% 50%), hsl(180 100% 50%), hsl(240 100% 50%), hsl(300 100% 50%), hsl(360 100% 50%))';

export const oklchHueGradient =
  'linear-gradient(to right, oklch(0.7 0.4 0), oklch(0.7 0.4 60), oklch(0.7 0.4 120), oklch(0.7 0.4 180), oklch(0.7 0.4 240), oklch(0.7 0.4 300), oklch(0.7 0.4 360))';
