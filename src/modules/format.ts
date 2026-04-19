import { addAlphaToHex, convertCSS, formatCSS, parseCSS } from 'colorizr';

import type { ColorFormat, ColorMode } from '../types';

const NARROW_FORMATS: ReadonlySet<ColorFormat> = new Set(['hex', 'hsl', 'rgb']);

/**
 * Format `color` in the target `format`. Use `alpha` to emit a value with
 * alpha (for hex this yields 8-digit hex; for other formats the
 * `formatCSS`/`alpha` option is used). Omit `alpha` or pass `1` for an opaque
 * result. `precision` forwards to `formatCSS` (decimal digits; no-op for hex).
 *
 * `'auto'` is NOT a valid format here — resolve it via `resolveDisplayFormat`
 * or `resolveOutputFormat` first.
 */
export function formatColor(
  color: string,
  format: Exclude<ColorFormat, 'auto'>,
  alpha?: number,
  precision?: number,
): string {
  const withAlpha = alpha !== undefined && alpha < 1 ? alpha : undefined;

  if (format === 'hex') {
    const hex = convertCSS(color, 'hex');

    return withAlpha !== undefined ? addAlphaToHex(hex, withAlpha) : hex;
  }

  const model = parseCSS(color, format);

  return formatCSS(model, { format, alpha: withAlpha, precision });
}

/**
 * True when the format is sRGB-bound and can't represent wide-gamut colors
 * without clipping.
 */
export function isNarrowFormat(format: ColorFormat): boolean {
  return NARROW_FORMATS.has(format);
}

/**
 * Resolve a `displayFormat` of `'auto'` against the current `mode`. Any other
 * value passes through unchanged.
 */
export function resolveDisplayFormat(
  displayFormat: ColorFormat,
  mode: ColorMode,
): Exclude<ColorFormat, 'auto'> {
  if (displayFormat !== 'auto') {
    return displayFormat;
  }

  return mode === 'oklch' ? 'oklch' : 'hex';
}

/**
 * Resolve an `outputFormat` of `'auto'` to follow the resolved display format.
 */
export function resolveOutputFormat(
  outputFormat: ColorFormat,
  displayFormat: ColorFormat,
  mode: ColorMode,
): Exclude<ColorFormat, 'auto'> {
  if (outputFormat !== 'auto') {
    return outputFormat;
  }

  return resolveDisplayFormat(displayFormat, mode);
}
