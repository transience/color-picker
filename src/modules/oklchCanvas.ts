import { hsvToRgb, isP3HSVInSRGB, oklchHueToHsvHue, p3HsvToOKLCH } from './colorSpace';
import { clamp } from './helpers';

export interface OKLCHCanvasResult {
  hsvHue: number;
  srgbBoundary: Array<{ x: number; y: number }>;
}

/**
 * OKLCH (l, c) → canvas pointer position (0-100%).
 * X: chroma normalized by OKLCH max chroma → x=100% at max chroma.
 * Y: binary search for the canvas V that produces the target lightness at the
 *    canvas hue, ensuring exact round-trip with pointerToLC on both axes.
 */
export function lcToPointer(
  oklchHue: number,
  l: number,
  c: number,
  maxChromaFn: (l: number, h: number) => number,
): { x: number; y: number } {
  const hsvHue = oklchHueToHsvHue(oklchHue);
  const maxC = maxChromaFn(l, oklchHue);
  const x = maxC > 1e-6 ? c / maxC : 0;

  // Binary search for v at canvas hue: p3HsvToOKLCH(hsvHue, x, v).l ≈ l
  // l is monotonically increasing with v (proven: RGB scales linearly with v)
  let lo = 0;
  let hi = 1;

  for (let index = 0; index < 12; index++) {
    const mid = (lo + hi) / 2;

    if (p3HsvToOKLCH(hsvHue, x, mid).l < l) {
      lo = mid;
    } else {
      hi = mid;
    }
  }

  const v = (lo + hi) / 2;

  return {
    x: clamp(x * 100, 0, 100),
    y: clamp((1 - v) * 100, 0, 100),
  };
}

/**
 * Canvas pointer position → OKLCH (l, c).
 * Lightness from P3 HSV→OKLCH at canvas hue. Chroma from X × OKLCH max chroma
 * (matching lcToPointer's normalization for consistent round-trips).
 */
export function pointerToLC(
  hsvHue: number,
  oklchHue: number,
  xNorm: number,
  yNorm: number,
  maxChromaFn: (l: number, h: number) => number,
): { c: number; l: number } {
  const { l } = p3HsvToOKLCH(hsvHue, xNorm, 1 - yNorm);
  const maxC = maxChromaFn(l, oklchHue);

  return { c: Math.min(xNorm * maxC, maxC), l };
}

/**
 * Convert boundary points to a smooth SVG path using Catmull-Rom → cubic bezier.
 */
export function pointsToSmoothPath(points: Array<{ x: number; y: number }>, tension = 0.2): string {
  if (points.length < 2) return '';

  const t = tension;
  const parts: string[] = [`M${points[0].x},${points[0].y}`];

  for (let index = 0; index < points.length - 1; index++) {
    const p0 = points[Math.max(0, index - 1)];
    const p1 = points[index];
    const p2 = points[index + 1];
    const p3 = points[Math.min(points.length - 1, index + 2)];

    const cp1x = p1.x + ((p2.x - p0.x) / 6) * t;
    const cp1y = p1.y + ((p2.y - p0.y) / 6) * t;
    const cp2x = p2.x - ((p3.x - p1.x) / 6) * t;
    const cp2y = p2.y - ((p3.y - p1.y) / 6) * t;

    parts.push(`C${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`);
  }

  return parts.join(' ');
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
  let coarseX = 0;
  const rowCount = 80;
  const coarseSteps = 80;

  for (let index = 0; index <= rowCount; index++) {
    const yNorm = index / rowCount;
    const value = 1 - yNorm;

    if (value < 0.01) continue;

    // Coarse scan to find the first out-of-gamut saturation
    let found = false;

    for (let sx = coarseX; sx <= coarseSteps; sx++) {
      const saturation = sx / coarseSteps;

      if (!isP3HSVInSRGB(hsvHue, saturation, value)) {
        coarseX = sx;

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

    if (!found) continue;
  }

  // Extend to panel edges
  if (srgbBoundary.length > 1) {
    const first = srgbBoundary[0];
    const last = srgbBoundary[srgbBoundary.length - 1];

    if (first.y > 0) {
      srgbBoundary.unshift({ x: first.x, y: 0 });
    }

    if (last.x < 100) {
      srgbBoundary.push({ x: 100, y: last.y });
    }
  }

  return { hsvHue, srgbBoundary };
}
