import {
  deriveHsl,
  deriveOklch,
  deriveRgb,
  isGrayColor,
  isGrayHsl,
  isGrayOklch,
  withHue,
} from '~/modules/channels';

describe('channels', () => {
  describe('deriveHsl', () => {
    it('parses the color without previous channels', () => {
      expect(deriveHsl('#ff0000')).toEqual({ h: 0, s: 100, l: 50 });
    });

    it('keeps the previous channels when the hex is the same', () => {
      const previous = { h: 120, s: 0, l: 0 };

      expect(deriveHsl('#000000', previous)).toBe(previous);
    });

    it('keeps the previous channels for its own echo', () => {
      const previous = { h: 208, s: 80, l: 50 };

      expect(deriveHsl('oklch(60% 0.15 250)', previous, true)).toBe(previous);
    });

    it('parses a non-hex color even when the hex is the same', () => {
      expect(deriveHsl('hsl(120 100% 0.05%)', { h: 0, s: 0, l: 0 })).toEqual({
        h: 120,
        s: 100,
        l: 0.05,
      });
    });

    it('re-parses a different color, keeping the hue for grays', () => {
      expect(deriveHsl('#ff0000', { h: 120, s: 0, l: 0 })).toEqual({ h: 0, s: 100, l: 50 });
      expect(deriveHsl('#808080', { h: 208, s: 100, l: 50 })).toEqual({ h: 208, s: 0, l: 50.2 });
    });
  });

  describe('deriveRgb', () => {
    it('keeps the previous channels when the hex is the same', () => {
      const previous = { r: 0.4, g: 0, b: 0 };

      expect(deriveRgb('#000000', previous)).toBe(previous);
    });

    it('keeps the previous channels for its own echo', () => {
      const previous = { r: 0.4, g: 0, b: 0 };

      expect(deriveRgb('oklch(0% 0 none)', previous, true)).toBe(previous);
    });

    it('parses a non-hex color even when the hex is the same', () => {
      expect(deriveRgb('rgb(10.4 0 0)', { r: 10, g: 0, b: 0 })).toEqual({ r: 10.4, g: 0, b: 0 });
    });

    it('re-parses a different color', () => {
      expect(deriveRgb('#00ff00', { r: 0.4, g: 0, b: 0 })).toEqual({ r: 0, g: 255, b: 0 });
      expect(deriveRgb('#00ff00')).toEqual({ r: 0, g: 255, b: 0 });
    });
  });

  describe('deriveOklch', () => {
    it('keeps the previous hue when the hue is `none`', () => {
      expect(deriveOklch('oklch(60% 0 none)', { l: 0.6, c: 0.15, h: 250 })).toEqual({
        l: 0.6,
        c: 0,
        h: 250,
      });
    });

    it('parses chromatic colors as-is', () => {
      expect(deriveOklch('oklch(60% 0.1 30)', { l: 0.6, c: 0.15, h: 250 })).toEqual({
        l: 0.6,
        c: 0.1,
        h: 30,
      });
      expect(deriveOklch('oklch(60% 0.1 30)')).toEqual({ l: 0.6, c: 0.1, h: 30 });
    });
  });

  describe('isGrayColor', () => {
    it('is true when the color rounds to a gray hex', () => {
      expect(isGrayColor('hsl(208 1% 11%)')).toBe(true);
      expect(isGrayColor('#808080')).toBe(true);
      expect(isGrayColor('hsl(208 10% 50%)')).toBe(false);
    });
  });

  describe('isGrayHsl', () => {
    it('is true at zero saturation, black, or white', () => {
      expect(isGrayHsl({ h: 200, s: 0, l: 50 })).toBe(true);
      expect(isGrayHsl({ h: 200, s: 80, l: 0 })).toBe(true);
      expect(isGrayHsl({ h: 200, s: 80, l: 100 })).toBe(true);
      expect(isGrayHsl({ h: 200, s: 80, l: 50 })).toBe(false);
    });
  });

  describe('isGrayOklch', () => {
    it('is true below the achromatic chroma threshold', () => {
      expect(isGrayOklch({ l: 0.5, c: 1e-10, h: 200 })).toBe(true);
      expect(isGrayOklch({ l: 0.5, c: 0.01, h: 200 })).toBe(false);
    });
  });

  describe('withHue', () => {
    const channels = { l: 0.5, c: 0, h: 30 };

    it('replaces the hue only while gray and a hue is given', () => {
      expect(withHue(channels, true, 120)).toEqual({ l: 0.5, c: 0, h: 120 });
      expect(withHue(channels, false, 120)).toBe(channels);
      expect(withHue(channels, true)).toBe(channels);
    });

    it('keeps the same object when the hue already matches', () => {
      expect(withHue(channels, true, 30)).toBe(channels);
    });
  });
});
