import {
  formatColor,
  isNarrowFormat,
  resolveDisplayFormat,
  resolveOutputFormat,
} from '~/modules/format';

describe('format', () => {
  describe('formatColor', () => {
    describe('hex', () => {
      it('returns 6-digit hex when alpha is omitted', () => {
        expect(formatColor('rgb(255 0 0)', 'hex')).toBe('#ff0000');
      });

      it('returns 6-digit hex when alpha is 1', () => {
        expect(formatColor('rgb(255 0 0)', 'hex', 1)).toBe('#ff0000');
      });

      it('appends alpha hex pair when alpha < 1', () => {
        const result = formatColor('rgb(255 0 0)', 'hex', 0.5);

        expect(result).toMatch(/^#ff0000[\da-f]{2}$/);
        expect(result).toHaveLength(9);
      });

      it('appends 00 hex pair for fully transparent alpha=0', () => {
        expect(formatColor('rgb(255 0 0)', 'hex', 0)).toBe('#ff000000');
      });

      it('treats alpha values >= 1 as opaque (no alpha appended)', () => {
        expect(formatColor('rgb(255 0 0)', 'hex', 1.5)).toBe('#ff0000');
      });

      it('ignores precision for hex output', () => {
        expect(formatColor('rgb(255 0 0)', 'hex', undefined, 8)).toBe('#ff0000');
      });
    });

    describe('rgb', () => {
      it('returns rgb() string without alpha when omitted', () => {
        const result = formatColor('#ff0000', 'rgb');

        expect(result).toMatch(/^rgb\(/);
        expect(result).not.toMatch(/\//);
      });

      it('includes alpha component when alpha < 1', () => {
        const result = formatColor('#ff0000', 'rgb', 0.4);

        expect(result).toMatch(/\/\s*(0?\.4|40%)/);
      });

      it('omits alpha component when alpha is 1', () => {
        const result = formatColor('#ff0000', 'rgb', 1);

        expect(result).not.toMatch(/\//);
      });

      it('emits zero alpha when alpha=0', () => {
        const result = formatColor('#ff0000', 'rgb', 0);

        expect(result).toMatch(/\/\s*0%?/);
      });
    });

    describe('hsl', () => {
      it('returns hsl() string', () => {
        expect(formatColor('#ff0000', 'hsl')).toMatch(/^hsl\(/);
      });

      it('includes alpha when alpha < 1', () => {
        expect(formatColor('#ff0000', 'hsl', 0.25)).toMatch(/\/\s*(0?\.25|25%)/);
      });
    });

    describe('oklch', () => {
      it('returns oklch() string', () => {
        expect(formatColor('#ff0000', 'oklch')).toMatch(/^oklch\(/);
      });

      it('forwards precision to formatCSS', () => {
        const wide = formatColor('#ff0000', 'oklch', undefined, 5);
        const narrow = formatColor('#ff0000', 'oklch', undefined, 1);

        expect(wide).not.toBe(narrow);
        expect(narrow.length).toBeLessThan(wide.length);
      });

      it('includes alpha when alpha < 1', () => {
        expect(formatColor('#ff0000', 'oklch', 0.5)).toMatch(/\/\s*(0?\.5|50%)/);
      });
    });

    describe('oklab', () => {
      it('returns oklab() string', () => {
        expect(formatColor('#ff0000', 'oklab')).toMatch(/^oklab\(/);
      });
    });
  });

  describe('isNarrowFormat', () => {
    it.each(['hex', 'hsl', 'rgb'] as const)('returns true for narrow format %s', format => {
      expect(isNarrowFormat(format)).toBe(true);
    });

    it.each(['oklch', 'oklab'] as const)('returns false for wide format %s', format => {
      expect(isNarrowFormat(format)).toBe(false);
    });

    it('returns false for "auto" (not yet resolved)', () => {
      expect(isNarrowFormat('auto')).toBe(false);
    });
  });

  describe('resolveDisplayFormat', () => {
    it('resolves "auto" to "oklch" in oklch mode', () => {
      expect(resolveDisplayFormat('auto', 'oklch')).toBe('oklch');
    });

    it('resolves "auto" to "hex" in hsl mode', () => {
      expect(resolveDisplayFormat('auto', 'hsl')).toBe('hex');
    });

    it('resolves "auto" to "hex" in rgb mode', () => {
      expect(resolveDisplayFormat('auto', 'rgb')).toBe('hex');
    });

    it.each(['hex', 'hsl', 'rgb', 'oklch', 'oklab'] as const)(
      'passes through explicit format %s regardless of mode',
      format => {
        expect(resolveDisplayFormat(format, 'oklch')).toBe(format);
        expect(resolveDisplayFormat(format, 'hsl')).toBe(format);
        expect(resolveDisplayFormat(format, 'rgb')).toBe(format);
      },
    );
  });

  describe('resolveOutputFormat', () => {
    it('passes through explicit outputFormat regardless of displayFormat or mode', () => {
      expect(resolveOutputFormat('rgb', 'hex', 'oklch')).toBe('rgb');
      expect(resolveOutputFormat('oklab', 'auto', 'hsl')).toBe('oklab');
    });

    it('falls back to resolved displayFormat when outputFormat is "auto"', () => {
      expect(resolveOutputFormat('auto', 'hex', 'oklch')).toBe('hex');
      expect(resolveOutputFormat('auto', 'oklch', 'oklch')).toBe('oklch');
    });

    it('chains "auto" through to mode-driven default when displayFormat is also "auto"', () => {
      expect(resolveOutputFormat('auto', 'auto', 'oklch')).toBe('oklch');
      expect(resolveOutputFormat('auto', 'auto', 'hsl')).toBe('hex');
      expect(resolveOutputFormat('auto', 'auto', 'rgb')).toBe('hex');
    });
  });
});
