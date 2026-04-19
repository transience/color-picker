import { getP3MaxChroma } from 'colorizr';

import { oklchHueToHsvHue } from '~/modules/colorSpace';
import { lcToPointer, pointerToLC, pointsToSmoothPath } from '~/modules/oklchCanvas';

const maxChromaFn = (l: number, h: number) => getP3MaxChroma({ l, c: 0, h });

// Test hues covering different gamut shapes
const testHues = [30, 80, 160, 265, 300];

describe('oklchCanvas', () => {
  describe('pointerToLC', () => {
    it.each(testHues)('should return achromatic at x=0 for hue %d', hue => {
      const hsvHue = oklchHueToHsvHue(hue);
      const result = pointerToLC(hsvHue, hue, 0, 0.5, maxChromaFn);

      expect(result.c).toBeCloseTo(0, 3);
      expect(result.l).toBeGreaterThan(0);
    });

    it.each(testHues)('should return black at y=1 for hue %d', hue => {
      const hsvHue = oklchHueToHsvHue(hue);
      const result = pointerToLC(hsvHue, hue, 0.5, 1, maxChromaFn);

      expect(result.l).toBeCloseTo(0, 2);
    });

    it.each(testHues)('should clamp chroma to P3 max at hue %d', hue => {
      const hsvHue = oklchHueToHsvHue(hue);
      const result = pointerToLC(hsvHue, hue, 1, 0, maxChromaFn);
      const maxC = maxChromaFn(result.l, hue);

      expect(result.c).toBeLessThanOrEqual(maxC + 1e-6);
    });
  });

  describe('lcToPointer', () => {
    it.each(testHues)('should return x=0 for achromatic at hue %d', hue => {
      const result = lcToPointer(hue, 0.5, 0, maxChromaFn);

      expect(result.x).toBeCloseTo(0, 1);
    });

    it.each(testHues)('should return y=100 for black at hue %d', hue => {
      const result = lcToPointer(hue, 0, 0, maxChromaFn);

      expect(result.y).toBeCloseTo(100, 1);
    });

    it.each(testHues)('should reach right edge at max chroma for hue %d', hue => {
      const l = 0.5;
      const maxC = maxChromaFn(l, hue);
      const result = lcToPointer(hue, l, maxC, maxChromaFn);

      expect(result.x).toBeGreaterThan(99);
    });

    it.each(testHues)('should be monotonic in chroma at hue %d', hue => {
      const l = 0.5;
      const maxC = maxChromaFn(l, hue);
      const steps = 20;
      let previousX = -1;

      for (let index = 0; index <= steps; index++) {
        const c = (index / steps) * maxC;
        const { x } = lcToPointer(hue, l, c, maxChromaFn);

        expect(x).toBeGreaterThanOrEqual(previousX - 0.01);
        previousX = x;
      }
    });
  });

  describe('pointerToLC → lcToPointer round-trip', () => {
    it.each(testHues)('should round-trip x position at hue %d', hue => {
      const hsvHue = oklchHueToHsvHue(hue);

      for (const xNorm of [0, 0.25, 0.5, 0.75, 1]) {
        const { c, l } = pointerToLC(hsvHue, hue, xNorm, 0.3, maxChromaFn);
        const { x } = lcToPointer(hue, l, c, maxChromaFn);

        expect(x).toBeCloseTo(xNorm * 100, 0);
      }
    });
  });

  describe('max chroma positioning', () => {
    const cases = [
      { c: 0.29154, h: 265.33, l: 0.51196 },
      { c: 0.29614, h: 299.86, l: 0.53274 },
      { c: 0.19434, h: 80.399, l: 0.81605 },
    ];

    it.each(cases)('oklch($l, $c, $h) should reach right edge', ({ c, h, l }) => {
      const result = lcToPointer(h, l, c, maxChromaFn);

      expect(result.x).toBeGreaterThan(99);
    });
  });

  describe('pointsToSmoothPath', () => {
    it('returns empty string for empty array', () => {
      expect(pointsToSmoothPath([])).toBe('');
    });

    it('returns empty string for single point', () => {
      expect(pointsToSmoothPath([{ x: 1, y: 2 }])).toBe('');
    });

    it('starts with M command for the first point', () => {
      const path = pointsToSmoothPath([
        { x: 0, y: 0 },
        { x: 10, y: 10 },
      ]);

      expect(path.startsWith('M0,0')).toBe(true);
    });

    it('includes a cubic bezier for each segment', () => {
      const path = pointsToSmoothPath([
        { x: 0, y: 0 },
        { x: 10, y: 10 },
        { x: 20, y: 5 },
      ]);

      // Two segments → two C commands
      expect(path.match(/C/g)).toHaveLength(2);
    });

    it('terminates at the last point', () => {
      const path = pointsToSmoothPath([
        { x: 0, y: 0 },
        { x: 10, y: 10 },
        { x: 20, y: 5 },
      ]);

      expect(path).toMatch(/20,5$/);
    });

    it('uses tension parameter to scale control points', () => {
      const points = [
        { x: 0, y: 0 },
        { x: 10, y: 10 },
        { x: 20, y: 0 },
      ];
      const low = pointsToSmoothPath(points, 0);
      const high = pointsToSmoothPath(points, 1);

      expect(low).not.toBe(high);
    });
  });
});
