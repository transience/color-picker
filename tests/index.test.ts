import type { ComponentType } from 'react';

import * as exports from '../src';

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

  it.each(components)('%s is a named function component', name => {
    const fn = exports[name] as ComponentType;

    expect(fn).toEqual(expect.any(Function));
    expect(fn.displayName ?? fn.name).toBe(name);
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
