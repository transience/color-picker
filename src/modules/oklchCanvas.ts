import {
  hsvToRgb,
  isP3HSVInSRGB,
  oklchHueToHsvHue,
  oklchToP3Hsv,
  p3HsvToOKLCH,
} from './colorSpace';
import { clamp } from './helpers';

export interface OKLCHCanvasResult {
  hsvHue: number;
  srgbBoundary: Array<{ x: number; y: number }>;
}

/**
 * OKLCH (l, c, h) → canvas pointer position (0-100%).
 * Mirrors Chrome DevTools' Spectrum picker: convert to P3 HSV and place the
 * thumb at raw (saturation, value) with no normalization.
 */
export function lcToPointer(oklchHue: number, l: number, c: number): { x: number; y: number } {
  const { s, v } = oklchToP3Hsv(l, c, oklchHue);

  return {
    x: clamp(s * 100, 0, 100),
    y: clamp((1 - v) * 100, 0, 100),
  };
}

/**
 * Canvas pointer position → OKLCH (l, c) that round-trips exactly with
 * `lcToPointer` at the given oklchHue.
 *
 * A naive `p3HsvToOKLCH(canvasHue, ...)` would drift: the OKLCH hue returned
 * by the conversion is not the user's oklchHue (the canvas HSV hue comes from
 * a fixed reference, not the color's actual HSV hue). Feeding that (l, c)
 * back through `lcToPointer(oklchHue, l, c)` lands the thumb at a different
 * x than the cursor — visible as drag acceleration and sticking near the
 * gamut edge.
 *
 * Instead, binary-search for the HSV hue that, at cursor (x, y), converts to
 * an OKLCH color with exactly `oklchHue`. This guarantees the round-trip.
 */
export function pointerToLC(
  oklchHue: number,
  xNorm: number,
  yNorm: number,
): { c: number; l: number } {
  const v = 1 - yNorm;
  const target = ((oklchHue % 360) + 360) % 360;

  const hueDelta = (h: number) => {
    const result = p3HsvToOKLCH(((h % 360) + 360) % 360, xNorm, v).h;

    return ((result - target + 540) % 360) - 180;
  };

  // Bracket around the reference-point HSV hue (a much better initial guess
  // than oklchHue itself, whose offset from its HSV hue varies up to ~40°).
  const estimate = oklchHueToHsvHue(oklchHue);
  let lo = estimate - 40;
  let hi = estimate + 40;

  for (let index = 0; index < 16; index++) {
    const mid = (lo + hi) / 2;

    if (hueDelta(mid) < 0) {
      lo = mid;
    } else {
      hi = mid;
    }
  }

  const hsvHue = ((((lo + hi) / 2) % 360) + 360) % 360;
  const { c, l } = p3HsvToOKLCH(hsvHue, xNorm, v);

  return { c, l };
}

/**
 * Convert boundary points to an SVG polyline path (M + L commands).
 * Matches Chrome DevTools' sRGB overlay, which uses straight segments.
 */
export function pointsToPath(points: Array<{ x: number; y: number }>): string {
  if (points.length < 2) return '';

  const [first, ...rest] = points;

  return `M${first.x},${first.y} ${rest.map(p => `L${p.x},${p.y}`).join(' ')}`;
}

/**
 * Render the OKLCH panel using P3 HSV (Chrome DevTools approach):
 * - X = saturation (0 left → 1 right)
 * - Y = value (1 top → 0 bottom)
 * - HSV treated as Display P3 colors
 * - sRGB boundary via P3 → XYZ → linear sRGB check
 */
// eslint-disable-next-line sonarjs/cognitive-complexity
export function renderOKLCHCanvas(
  canvas: HTMLCanvasElement,
  width: number,
  height: number,
  oklchHue: number,
): OKLCHCanvasResult {
  const context = canvas.getContext('2d', {
    colorSpace: 'display-p3',
  });

  if (!context) return { hsvHue: 0, srgbBoundary: [] };

  const hsvHue = oklchHueToHsvHue(oklchHue);

  // Render pixels as P3 HSV
  for (let y = 0; y < height; y++) {
    const value = 1 - y / (height - 1);

    for (let x = 0; x < width; x++) {
      const saturation = x / (width - 1);
      const [r, g, b] = hsvToRgb(hsvHue, saturation, value);

      context.fillStyle = `color(display-p3 ${r} ${g} ${b})`;
      context.fillRect(x, y, 1, 1);
    }
  }

  // Compute sRGB boundary with binary search refinement per row
  const srgbBoundary: Array<{ x: number; y: number }> = [];
  const rowCount = height;
  const coarseSteps = 80;

  for (let index = 0; index <= rowCount; index++) {
    const yNorm = index / rowCount;
    const value = 1 - yNorm;

    // coarseX resets per row: near the P3-HSV purple cusp the boundary
    // saturation is non-monotonic in y, so persisting sx across rows would
    // skip real crossings.
    let found = false;

    for (let sx = 0; sx <= coarseSteps; sx++) {
      const saturation = sx / coarseSteps;

      if (!isP3HSVInSRGB(hsvHue, saturation, value)) {
        // Binary search between previous (in-gamut) and current (out-of-gamut) for exact boundary
        let lo = Math.max(0, (sx - 1) / coarseSteps);
        let hi = saturation;

        for (let iter = 0; iter < 16; iter++) {
          const mid = (lo + hi) / 2;

          if (isP3HSVInSRGB(hsvHue, mid, value)) {
            lo = mid;
          } else {
            hi = mid;
          }
        }

        srgbBoundary.push({
          x: clamp(((lo + hi) / 2) * 100, 0, 100),
          y: clamp(yNorm * 100, 0, 100),
        });
        found = true;
        break;
      }
    }

    // Near the blue-violet cusp (≈ hue 282), saturated P3 blue sits inside the
    // default GAMUT_EPSILON of sRGB blue, so the loose check misses every
    // mid/low-value row. Fall back to a strict (epsilon=0) check at sat=1:
    // if strictly out-of-gamut, anchor the boundary at the right edge so the
    // overlay traces down the edge instead of terminating mid-panel.
    if (!found && !isP3HSVInSRGB(hsvHue, 1, value, 0)) {
      srgbBoundary.push({ x: 100, y: clamp(yNorm * 100, 0, 100) });
    }
  }

  // Close off the polyline to the right edge if the last detected point
  // stopped before saturation = 1. Mirrors Chromium DevTools' overlay.
  if (srgbBoundary.length > 0) {
    const last = srgbBoundary[srgbBoundary.length - 1];

    if (last.x < 100) {
      srgbBoundary.push({ x: 100, y: last.y });
    }
  }

  return { hsvHue, srgbBoundary };
}
