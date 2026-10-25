import { convertCSS, formatCSS, type HSL, type LCH, parseCSS, type RGB } from 'colorizr';

import { preserveHslHue, preserveOklchHue } from './colorSpace';

/**
 * `derive` functions for `useChannelState`. Each turns a CSS color into the
 * channel values a control shows, keeping from `previous` what the string
 * can't express.
 */

function isSameHex(color: string, previous: HSL | RGB): boolean {
  return convertCSS(color, 'hex') === formatCSS(previous, { format: 'hex' });
}

// Hex-bound modes: an incoming color with the same hex is the same color
// (usually our own echo), so the more precise local values win.
export function deriveHsl(color: string, previous?: HSL): HSL {
  if (!previous) return parseCSS(color, 'hsl');
  if (isSameHex(color, previous)) return previous;

  return preserveHslHue(parseCSS(color, 'hsl'), previous);
}

// OKLCH strings write hue as `none` at zero chroma.
export function deriveOklch(color: string, previous?: LCH): LCH {
  const next = parseCSS(color, 'oklch');

  return previous ? preserveOklchHue(next, previous) : next;
}

export function deriveRgb(color: string, previous?: RGB): RGB {
  if (previous && isSameHex(color, previous)) return previous;

  return parseCSS(color, 'rgb');
}
