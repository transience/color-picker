import { parseCSS } from 'colorizr';

import {
  colorToHsv,
  hsvToHex,
  isOklchInSRGB,
  oklchHueToHsvHue,
  oklchToP3Hsv,
  p3HsvToOKLCH,
} from '~/modules/colorSpace';

// Test hues covering different gamut shapes
const testHues = [30, 80, 160, 265, 300];

describe('colorSpace', () => {
  describe('oklchToP3Hsv / p3HsvToOKLCH round-trip', () => {
    it.each(testHues)('should round-trip at hue %d for mid-range values', hue => {
      const l = 0.6;
      const c = 0.1;

      const hsv = oklchToP3Hsv(l, c, hue);
      const oklch = p3HsvToOKLCH(hsv.h, hsv.s, hsv.v);

      expect(oklch.l).toBeCloseTo(l, 3);
      expect(oklch.c).toBeCloseTo(c, 3);
    });
  });

  describe('colorToHsv', () => {
    it('parses a hex string', () => {
      const hsv = colorToHsv('#ff0000');

      expect(hsv.h).toBeCloseTo(0, 1);
      expect(hsv.s).toBeCloseTo(1, 3);
      expect(hsv.v).toBeCloseTo(1, 3);
    });

    it('parses an rgb() string', () => {
      const hsv = colorToHsv('rgb(0, 255, 0)');

      expect(hsv.h).toBeCloseTo(120, 1);
      expect(hsv.s).toBeCloseTo(1, 3);
      expect(hsv.v).toBeCloseTo(1, 3);
    });

    it('parses an hsl() string', () => {
      const hsv = colorToHsv('hsl(240 100% 50%)');

      expect(hsv.h).toBeCloseTo(240, 1);
      expect(hsv.s).toBeCloseTo(1, 3);
      expect(hsv.v).toBeCloseTo(1, 3);
    });

    it('parses an oklch() string', () => {
      const hsv = colorToHsv('oklch(0.5 0 0)');

      expect(hsv.s).toBeCloseTo(0, 2);
      expect(hsv.v).toBeGreaterThan(0);
      expect(hsv.v).toBeLessThan(1);
    });

    it('returns s=0 for achromatic grey', () => {
      const hsv = colorToHsv('#808080');

      expect(hsv.s).toBeCloseTo(0, 3);
    });

    it('returns v=0 for black', () => {
      const hsv = colorToHsv('#000000');

      expect(hsv.v).toBe(0);
      expect(hsv.s).toBe(0);
    });
  });

  describe('hsvToHex', () => {
    it('formats red at full saturation and value', () => {
      expect(hsvToHex({ h: 0, s: 1, v: 1 })).toBe('#ff0000');
    });

    it('formats green', () => {
      expect(hsvToHex({ h: 120, s: 1, v: 1 })).toBe('#00ff00');
    });

    it('formats blue', () => {
      expect(hsvToHex({ h: 240, s: 1, v: 1 })).toBe('#0000ff');
    });

    it('formats black', () => {
      expect(hsvToHex({ h: 0, s: 0, v: 0 })).toBe('#000000');
    });

    it('formats white', () => {
      expect(hsvToHex({ h: 0, s: 0, v: 1 })).toBe('#ffffff');
    });

    it('round-trips with colorToHsv at primaries', () => {
      const original = { h: 0, s: 1, v: 1 };
      const hex = hsvToHex(original);
      const back = colorToHsv(hex);

      expect(back.h).toBeCloseTo(original.h, 0);
      expect(back.s).toBeCloseTo(original.s, 2);
      expect(back.v).toBeCloseTo(original.v, 2);
    });
  });

  describe('isOklchInSRGB', () => {
    it('returns true for black', () => {
      expect(isOklchInSRGB(0, 0, 0)).toBe(true);
    });

    it('returns true for white', () => {
      expect(isOklchInSRGB(1, 0, 0)).toBe(true);
    });

    it('returns true for a color parsed from an sRGB hex', () => {
      const { c, h, l } = parseCSS('#ff0044', 'oklch');

      expect(isOklchInSRGB(l, c, h)).toBe(true);
    });

    it('returns false for a high-chroma red outside P3', () => {
      expect(isOklchInSRGB(0.7, 0.3, 20)).toBe(false);
    });
  });

  describe('oklchHueToHsvHue', () => {
    it('returns a value in [0, 360)', () => {
      for (const hue of testHues) {
        const result = oklchHueToHsvHue(hue);

        expect(result).toBeGreaterThanOrEqual(0);
        expect(result).toBeLessThan(360);
      }
    });

    it('is deterministic (same input → same output)', () => {
      expect(oklchHueToHsvHue(120)).toBe(oklchHueToHsvHue(120));
    });

    it('maps different OKLCH hues to different HSV hues', () => {
      const h1 = oklchHueToHsvHue(30);
      const h2 = oklchHueToHsvHue(200);

      expect(h1).not.toBeCloseTo(h2, 0);
    });
  });
});
