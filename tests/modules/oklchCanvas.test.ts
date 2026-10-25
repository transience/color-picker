import { hsvToRgb, oklchHueToHsvHue, oklchToP3Hsv } from '~/modules/colorSpace';
import {
  computeSRGBBoundary,
  lcToPointer,
  pointerToLC,
  pointsToPath,
  renderOKLCHCanvas,
} from '~/modules/oklchCanvas';

// Test hues covering different gamut shapes
const testHues = [30, 80, 160, 265, 300];

describe('oklchCanvas', () => {
  describe('pointerToLC', () => {
    it.each(testHues)('should return achromatic at x=0 for hue %d', hue => {
      const hsvHue = oklchHueToHsvHue(hue);
      const result = pointerToLC(hsvHue, 0, 0.5);

      expect(result.c).toBeCloseTo(0, 3);
      expect(result.l).toBeGreaterThan(0);
    });

    it.each(testHues)('should return black at y=1 for hue %d', hue => {
      const hsvHue = oklchHueToHsvHue(hue);
      const result = pointerToLC(hsvHue, 0.5, 1);

      expect(result.l).toBeCloseTo(0, 2);
    });

    it.each(testHues)('returns a P3-gamut chroma at sat=1, val=1 for hue %d', hue => {
      const hsvHue = oklchHueToHsvHue(hue);
      const result = pointerToLC(hsvHue, 1, 0);

      expect(result.c).toBeGreaterThan(0);
      expect(result.l).toBeGreaterThan(0);
      expect(result.l).toBeLessThanOrEqual(1);
    });
  });

  describe('lcToPointer', () => {
    it.each(testHues)('should return x=0 for achromatic at hue %d', hue => {
      const result = lcToPointer(hue, 0.5, 0);

      expect(result.x).toBeCloseTo(0, 1);
    });

    it.each(testHues)('should return y=100 for black at hue %d', hue => {
      const result = lcToPointer(hue, 0, 0);

      expect(result.y).toBeCloseTo(100, 1);
    });

    it.each(testHues)('matches raw P3 HSV conversion (Chrome parity) at hue %d', hue => {
      const l = 0.5;
      const c = 0.1;
      const { s, v } = oklchToP3Hsv(l, c, hue);
      const result = lcToPointer(hue, l, c);

      expect(result.x).toBeCloseTo(s * 100, 5);
      expect(result.y).toBeCloseTo((1 - v) * 100, 5);
    });

    it.each(testHues)('should be monotonic in chroma at hue %d', hue => {
      const l = 0.5;
      const steps = 20;
      let previousX = -1;

      for (let index = 0; index <= steps; index++) {
        const c = (index / steps) * 0.3;
        const { x } = lcToPointer(hue, l, c);

        expect(x).toBeGreaterThanOrEqual(previousX - 0.01);
        previousX = x;
      }
    });
  });

  describe('pointsToPath', () => {
    it('returns empty string for empty array', () => {
      expect(pointsToPath([])).toBe('');
    });

    it('returns empty string for single point', () => {
      expect(pointsToPath([{ x: 1, y: 2 }])).toBe('');
    });

    it('starts with M command for the first point', () => {
      const path = pointsToPath([
        { x: 0, y: 0 },
        { x: 10, y: 10 },
      ]);

      expect(path.startsWith('M0,0')).toBe(true);
    });

    it('emits an L command for each additional point', () => {
      const path = pointsToPath([
        { x: 0, y: 0 },
        { x: 10, y: 10 },
        { x: 20, y: 5 },
      ]);

      expect(path.match(/L/g)).toHaveLength(2);
    });

    it('terminates at the last point', () => {
      const path = pointsToPath([
        { x: 0, y: 0 },
        { x: 10, y: 10 },
        { x: 20, y: 5 },
      ]);

      expect(path).toMatch(/20,5$/);
    });
  });

  describe('computeSRGBBoundary', () => {
    it.each(testHues)('returns points within 0-100 for hue %i', hue => {
      const points = computeSRGBBoundary(oklchHueToHsvHue(hue), 128);

      expect(points.length).toBeGreaterThan(2);

      for (const { x, y } of points) {
        expect(x).toBeGreaterThanOrEqual(0);
        expect(x).toBeLessThanOrEqual(100);
        expect(y).toBeGreaterThanOrEqual(0);
        expect(y).toBeLessThanOrEqual(100);
      }
    });

    it('closes the polyline at the right edge', () => {
      const points = computeSRGBBoundary(oklchHueToHsvHue(30), 128);

      expect(points[points.length - 1].x).toBe(100);
    });
  });

  describe('renderOKLCHCanvas', () => {
    const WIDTH = 4;
    const HEIGHT = 3;

    function fakeCanvas(colorSpace?: PredefinedColorSpace) {
      const image = { data: new Uint8ClampedArray(WIDTH * HEIGHT * 4) };
      const context = {
        createImageData: vi.fn(() => image),
        fillRect: vi.fn(),
        fillStyle: '',
        putImageData: vi.fn(),
        ...(colorSpace && { getContextAttributes: () => ({ colorSpace }) }),
      };
      const canvas = { getContext: vi.fn(() => context) } as unknown as HTMLCanvasElement;

      return { canvas, context, image };
    }

    it('returns false without a 2D context', () => {
      const canvas = { getContext: () => null } as unknown as HTMLCanvasElement;

      expect(renderOKLCHCanvas(canvas, WIDTH, HEIGHT, 250)).toBe(false);
    });

    it('writes P3 pixels in one putImageData call on a display-p3 canvas', () => {
      const { canvas, context, image } = fakeCanvas('display-p3');

      expect(renderOKLCHCanvas(canvas, WIDTH, HEIGHT, 250)).toBe(true);
      expect(context.createImageData).toHaveBeenCalledWith(WIDTH, HEIGHT, {
        colorSpace: 'display-p3',
      });
      expect(context.putImageData).toHaveBeenCalledWith(image, 0, 0);
      expect(context.fillRect).not.toHaveBeenCalled();

      const pixel = (x: number, y: number) => {
        const index = (y * WIDTH + x) * 4;

        return [0, 1, 2, 3].map(offset => image.data[index + offset]);
      };

      const saturated = hsvToRgb(oklchHueToHsvHue(250), 1, 1).map(c => Math.round(c * 255));

      expect(pixel(0, 0)).toEqual([255, 255, 255, 255]);
      expect(pixel(WIDTH - 1, 0)).toEqual([...saturated, 255]);
      expect(pixel(0, HEIGHT - 1)).toEqual([0, 0, 0, 255]);
      expect(pixel(WIDTH - 1, HEIGHT - 1)).toEqual([0, 0, 0, 255]);
    });

    it.each([
      ['an sRGB canvas', 'srgb' as const],
      ['a canvas without getContextAttributes', undefined],
    ])('falls back to per-pixel fills on %s', (_, colorSpace) => {
      const { canvas, context } = fakeCanvas(colorSpace);

      expect(renderOKLCHCanvas(canvas, WIDTH, HEIGHT, 250)).toBe(true);
      expect(context.putImageData).not.toHaveBeenCalled();
      expect(context.fillRect).toHaveBeenCalledTimes(WIDTH * HEIGHT);
    });
  });
});
