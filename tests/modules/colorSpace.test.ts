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

  describe('round-trip edge cases', () => {
    it('round-trips with chroma=0 (achromatic) — hue is arbitrary, l preserved', () => {
      const l = 0.5;
      const hsv = oklchToP3Hsv(l, 0, 200);

      expect(hsv.s).toBeCloseTo(0, 3);

      const oklch = p3HsvToOKLCH(hsv.h, hsv.s, hsv.v);

      expect(oklch.l).toBeCloseTo(l, 3);
      expect(oklch.c).toBeCloseTo(0, 3);
    });

    it.each([0, 1])('round-trips at l=%d (gamut endpoints) with c=0', l => {
      const hsv = oklchToP3Hsv(l, 0, 0);
      const oklch = p3HsvToOKLCH(hsv.h, hsv.s, hsv.v);

      expect(oklch.l).toBeCloseTo(l, 3);
      expect(oklch.c).toBeCloseTo(0, 3);
    });

    it('treats negative oklch hue equivalently to its positive complement', () => {
      const negative = oklchToP3Hsv(0.6, 0.1, -10);
      const positive = oklchToP3Hsv(0.6, 0.1, 350);

      expect(negative.h).toBeCloseTo(positive.h, 1);
      expect(negative.s).toBeCloseTo(positive.s, 3);
      expect(negative.v).toBeCloseTo(positive.v, 3);
    });

    it('treats hue > 360 equivalently to the wrapped value', () => {
      const wrapped = oklchToP3Hsv(0.6, 0.1, 90);
      const overflow = oklchToP3Hsv(0.6, 0.1, 450);

      expect(overflow.h).toBeCloseTo(wrapped.h, 1);
      expect(overflow.s).toBeCloseTo(wrapped.s, 3);
      expect(overflow.v).toBeCloseTo(wrapped.v, 3);
    });

    it('p3HsvToOKLCH always returns hue in [0, 360)', () => {
      const grey = p3HsvToOKLCH(123, 0, 0.5);
      const red = p3HsvToOKLCH(0, 1, 1);

      expect(grey.h).toBeGreaterThanOrEqual(0);
      expect(grey.h).toBeLessThan(360);
      expect(red.h).toBeGreaterThanOrEqual(0);
      expect(red.h).toBeLessThan(360);
    });

    it('hsvToRgb / rgbToHsv round-trip preserves greyscale (s=0)', () => {
      const original = hsvToHex({ h: 200, s: 0, v: 0.5 });
      const back = colorToHsv(original);

      expect(back.s).toBeCloseTo(0, 3);
      expect(back.v).toBeCloseTo(0.5, 2);
    });
  });

  describe('isOklchInSRGB edge cases', () => {
    it('returns true for achromatic colors at any lightness (c=0)', () => {
      expect(isOklchInSRGB(0.25, 0, 0)).toBe(true);
      expect(isOklchInSRGB(0.5, 0, 90)).toBe(true);
      expect(isOklchInSRGB(0.75, 0, 270)).toBe(true);
    });

    it('returns false for a wide-gamut color outside sRGB', () => {
      expect(isOklchInSRGB(0.7, 0.25, 250)).toBe(false);
    });

    it('returns true for a low-chroma color near grey', () => {
      expect(isOklchInSRGB(0.5, 0.01, 180)).toBe(true);
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
