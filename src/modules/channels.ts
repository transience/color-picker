import { convertCSS, formatCSS, type HSL, isHex, type LCH, parseCSS, type RGB } from 'colorizr';

import { ACHROMATIC_CHROMA, preserveHslHue, preserveOklchHue } from './colorSpace';

/**
 * `derive` functions for `useChannelState`. Each turns a CSS color into the
 * channel values a control shows, keeping from `previous` what the string
 * can't express.
 */

// The more precise local values win over our own echo, and over a hex string
// that matches them: hex can't carry their fractions. Any other string is an
// external color that may carry more precision than its hex, so it's parsed.
function isOwnColor(color: string, previous: HSL | RGB, isEcho: boolean): boolean {
  return (
    isEcho || (isHex(color) && convertCSS(color, 'hex') === formatCSS(previous, { format: 'hex' }))
  );
}

export function deriveHsl(color: string, previous?: HSL, isEcho = false): HSL {
  if (!previous) return parseCSS(color, 'hsl');
  if (isOwnColor(color, previous, isEcho)) return previous;

  return preserveHslHue(parseCSS(color, 'hsl'), previous);
}

// OKLCH strings write hue as `none` at zero chroma.
export function deriveOklch(color: string, previous?: LCH): LCH {
  const next = parseCSS(color, 'oklch');

  return previous ? preserveOklchHue(next, previous) : next;
}

export function deriveRgb(color: string, previous?: RGB, isEcho = false): RGB {
  if (previous && isOwnColor(color, previous, isEcho)) return previous;

  return parseCSS(color, 'rgb');
}

/**
 * Gray once rounded to 8-bit hex. Local HSL channels can keep a saturation
 * the color no longer shows.
 */
export function isGrayColor(color: string): boolean {
  const { b, g, r } = parseCSS(convertCSS(color, 'hex'), 'rgb');

  return r === g && g === b;
}

export function isGrayHsl({ l, s }: HSL): boolean {
  return s === 0 || l === 0 || l === 100;
}

export function isGrayOklch({ c }: LCH): boolean {
  return c < ACHROMATIC_CHROMA;
}

/**
 * A gray carries no hue, so while `isGray` the owner's `hue` (when given)
 * replaces the local one. Keeps every control on a single hue source.
 */
export function withHue<T extends { h: number }>(channels: T, isGray: boolean, hue?: number): T {
  return isGray && hue !== undefined && hue !== channels.h ? { ...channels, h: hue } : channels;
}
