import { deriveHsl, deriveOklch, deriveRgb } from '~/modules/channels';

describe('channels', () => {
  describe('deriveHsl', () => {
    it('parses the color without previous channels', () => {
      expect(deriveHsl('#ff0000')).toEqual({ h: 0, s: 100, l: 50 });
    });

    it('keeps the previous channels when the hex is the same', () => {
      const previous = { h: 120, s: 0, l: 0 };

      expect(deriveHsl('#000000', previous)).toBe(previous);
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
});
