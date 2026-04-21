import type { ColorMode } from './types';

export const DEFAULT_COLOR = 'oklch(54% 0.194 250)';
export const DEFAULT_MODES: ColorMode[] = ['oklch', 'hsl', 'rgb'];

export const panelClasses = {
  root: 'relative h-32 w-full cursor-crosshair overflow-hidden',
  thumb:
    'pointer-events-none absolute size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border border-black ring-2 ring-white/20',
} as const;

export const hslHueGradient =
  'linear-gradient(to right, hsl(0 100% 50%), hsl(60 100% 50%), hsl(120 100% 50%), hsl(180 100% 50%), hsl(240 100% 50%), hsl(300 100% 50%), hsl(360 100% 50%))';

export const oklchHueGradient =
  'linear-gradient(to right, oklch(0.7 0.4 0), oklch(0.7 0.4 60), oklch(0.7 0.4 120), oklch(0.7 0.4 180), oklch(0.7 0.4 240), oklch(0.7 0.4 300), oklch(0.7 0.4 360))';
