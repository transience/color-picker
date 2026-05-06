import * as exports from '../src';

function getComponentName(value: unknown): string | undefined {
  if (typeof value === 'function') {
    const fn = value as { displayName?: string; name: string };

    return fn.displayName ?? fn.name;
  }

  if (typeof value === 'object' && value !== null) {
    const ref = value as { displayName?: string; render?: { name?: string } };

    return ref.displayName ?? ref.render?.name;
  }

  return undefined;
}

const components = [
  'AlphaSlider',
  'ChannelInputs',
  'ChannelSliders',
  'ColorInput',
  'ColorPicker',
  'EyeDropper',
  'GamutWarning',
  'GradientSlider',
  'HueSlider',
  'ModeSelector',
  'OKLCHPanel',
  'SaturationPanel',
  'SettingsMenu',
  'Swatch',
] as const;

describe('Exports', () => {
  it('public API surface is stable', () => {
    expect(Object.keys(exports).sort()).toMatchInlineSnapshot(`
      [
        "AlphaSlider",
        "ChannelInputs",
        "ChannelSliders",
        "ColorInput",
        "ColorPicker",
        "EyeDropper",
        "GamutWarning",
        "GradientSlider",
        "HueSlider",
        "ModeSelector",
        "OKLCHPanel",
        "SaturationPanel",
        "SettingsMenu",
        "Swatch",
        "hslHueGradient",
        "oklchHueGradient",
        "useColorPicker",
      ]
    `);
  });

  it.each(components)('%s is a named component', name => {
    expect(getComponentName(exports[name])).toBe(name);
  });

  it('useColorPicker is a named hook', () => {
    expect(exports.useColorPicker).toEqual(expect.any(Function));
    expect(exports.useColorPicker.name).toBe('useColorPicker');
  });

  it('hue gradients are valid CSS linear-gradient strings', () => {
    expect(exports.hslHueGradient).toMatch(/^linear-gradient\(to right, hsl\(/);
    expect(exports.oklchHueGradient).toMatch(/^linear-gradient\(to right, oklch\(/);
  });
});
