# Color Picker

[![NPM Version](https://img.shields.io/npm/v/%40transience%2Fcolor-picker)](https://www.npmjs.com/package/@transience/color-picker) [![CI](https://github.com/transience/color-picker/actions/workflows/ci.yml/badge.svg)](https://github.com/transience/color-picker/actions/workflows/ci.yml) [![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=transience_color-picker&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=transience_color-picker) [![Coverage](https://sonarcloud.io/api/project_badges/measure?project=transience_color-picker&metric=coverage)](https://sonarcloud.io/summary/new_code?id=transience_color-picker)

A modern, OKLCH-first React/Tailwind color picker.

- 🎨 **OKLCH-first**: Native OKLCH 2D panel with P3 gamut awareness.
- 🌈 **Multi-mode**: Switch between OKLCH, HSL, and RGB color spaces.
- 🎯 **Slot styling**: Every internal element accepts className overrides via a typed `classNames` map.
- 🚨 **Gamut-aware**: Warns when an OKLCH color falls outside the sRGB gamut.

<p align="center">
  <img src="./docs/public/color-picker-default.png" height="350" alt="Default layout" />
  &nbsp;&nbsp;
  <img src="./docs/public/color-picker-customized.png" height="350" alt="Custom layout" />
</p>
<p align="center"><sub>Default layout &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Custom layout</sub></p>

<h3 style="vertical-align: middle;">
    👉 <a href="https://transience.github.io/color-picker/?path=/story/colorpicker--default" target="_blank">Live Demo <img alt="Open story" src="https://cdn.svglogos.dev/logos/storybook-icon.svg" width="16" /></a>
</h3>


## Setup

```bash
npm i @transience/color-picker
```

## Usage

```tsx
import { ColorPicker } from '@transience/color-picker';
import { useState } from 'react';

export function Example() {
  const [color, setColor] = useState('oklch(0.7 0.15 250)');

  return <ColorPicker color={color} onChange={setColor} />;
}
```

`color` accepts any CSS color string (`#ff0044`, `rgb(...)`, `hsl(...)`, `oklch(...)`, named colors, etc.) — parsed via `colorizr`.

### Styles

Your app's Tailwind build must scan the package's compiled source so the utilities are included in the generated CSS.

**Tailwind v4** (CSS-first):

```css
@import "tailwindcss";
@source "../node_modules/@transience/color-picker/dist";
```

**Tailwind v3** (`tailwind.config.js`):

```js
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './src/**/*.{js,jsx,ts,tsx}',
    './node_modules/@transience/color-picker/dist/**/*.{js,cjs}',
  ],
  theme: { extend: {} },
  plugins: [],
};
```

If you are using pnpm, you need to add the following line to your .npmrc file to hoist our packages to the root node_modules.

```shell
public-hoist-pattern[]=*@transience/color-picker/*
```

After modifying the .npmrc file, run `pnpm install` again to ensure the dependencies are installed correctly.

See the [Storybook demo](https://transience.github.io/color-picker/) for layout variants and every prop combination.

## Props

| Prop                                                                                                                                           | Type | Default |
|------------------------------------------------------------------------------------------------------------------------------------------------| --- | --- |
| **channels**<br />Per-channel toggles: `hidden`, `disabled`.<br />Keys irrelevant to the active mode are ignored.                              | `ChannelsConfig` | — |
| **classNames**<br />Slot-based className overrides for every internal part. See [Styling](#styling).                                           | `ColorPickerClassNames` | — |
| **labels**<br />Slot-based text/aria overrides per component. Each rendered component reads only its own slot.                                 | `ColorPickerLabels` | — |
| **color**<br />Controlled color value. Any CSS color string.<br />Falls back to the internal default when `undefined`.                         | `string` | `'oklch(54% 0.194 250)'` |
| **defaultMode**<br />Initial mode for the 2D panel and channel controls.                                                                       | `'oklch'` \| `'hsl'` \| `'rgb'` | `'oklch'` |
| **displayFormat**<br />Initial text format for the `ColorInput`. `'auto'` → `'oklch'` in OKLCH mode, else `'hex'`.                             | `ColorFormat` | `'auto'` |
| **modes**<br />Modes shown in the mode switcher.                                                                                               | `ColorMode[]` | `['oklch', 'hsl', 'rgb']` |
| **onChange**<br />Called on every color change. Format follows the resolved `outputFormat`.                                                    | `(value: string) => void` | — |
| **onChangeStart**<br />Fires once when the user begins interacting with any slider, panel, or `ChannelInputs` field — `pointerdown` or first value-changing keystroke after idle. `ColorInput` and `EyeDropper` emit only `onChange`. | `(value: string) => void` | — |
| **onChangeEnd**<br />Fires once when the user finishes interacting — pointer release, 600 ms after the last keystroke, or numeric-input blur. | `(value: string) => void` | — |
| **onChangeMode**<br />Called when the user flips the mode via the switcher.                                                                    | `(mode: ColorMode) => void` | — |
| **outputFormat**<br />Initial format `onChange` emits. `'auto'` follows the resolved `displayFormat`.                                          | `ColorFormat` | `'auto'` |
| **precision**<br />Decimal digits for non-hex output. Ignored for `hex`.                                                                       | `number` | `5` |
| **showAlpha**<br />Renders an alpha slider and appends alpha to emitted values when `< 1`.                                                     | `boolean` | `false` |
| **showColorInput**<br />Shows the text color input with the current value formatted per `displayFormat`.                                       | `boolean` | `true` |
| **showEyeDropper**<br />Adds a screen color picker button. Silently omitted in browsers without `window.EyeDropper` (currently Chromium-only). | `boolean` | `true` |
| **showGlobalHue**<br />Shows the global (mode-independent) hue slider in the toolbar.                                                          | `boolean` | `false` |
| **showInputs**<br />Shows numeric input fields per channel. Inline when `showSliders` is on, standalone row otherwise.                         | `boolean` | `true` |
| **showModeSelector**<br />Shows the OKLCH/HSL/RGB mode switcher.                                                                               | `boolean` | `true` |
| **showPanel**<br />Shows the 2D color panel (saturation/value for HSL/RGB, chroma/lightness for OKLCH).                                        | `boolean` | `true` |
| **showSettings**<br />Adds a ⋮ menu to expose display and output format choices to end users.                                                  | `boolean` | `false` |
| **showSliders**<br />Shows the per-channel sliders matching the active mode (L/C/H, H/S/L, or R/G/B).                                          | `boolean` | `true` |
| **showSwatch**<br />Shows the circular color preview next to the color input.                                                                  | `boolean` | `true` |

## Color modes and formats

- **`ColorMode`** — `'oklch' | 'hsl' | 'rgb'`. Drives the 2D panel, mode switcher, and which channel slider/input set is rendered.
- **`ColorFormat`** — `'auto' | 'hex' | 'hsl' | 'oklab' | 'oklch' | 'rgb'`. Used for both `displayFormat` (text input value) and `outputFormat` (what `onChange` emits).

`'auto'` resolves against the active mode: OKLCH mode → `'oklch'`, otherwise `'hex'`. `outputFormat` defaults to following the resolved `displayFormat`, so the emitted string matches what the user sees unless you set them independently.

When an OKLCH color doesn't fit inside a narrow format (`hex`, `hsl`, `rgb`), a gamut warning icon appears inside the color input.

## Styling

Every overridable part is exposed via the `ColorPickerClassNames` slot map (see `src/types.ts`). Each slot's classes are merged with the component's defaults via [`tailwind-merge`](https://github.com/dcastil/tailwind-merge), so your overrides win predictably — `classNames={{ swatch: { root: 'rounded-full' } }}` reliably overrides the internal `rounded-md`. Without that merge, both classes would land in the DOM and CSS source order would decide the winner.

Most Tailwind apps already ship `tailwind-merge`, so it dedupes in your bundle. If yours doesn't, it's pulled in automatically with this package.

```tsx
<ColorPicker
  color={color}
  onChange={setColor}
  classNames={{
    root: 'border border-neutral-300 rounded-lg',
    swatch: { root: 'ring-2 ring-offset-2' },
    hueSlider: { track: 'h-3' },
    modeSelector: {
      button: 'first:rounded-none last:rounded-none text-sm',
    },
  }}
/>
```

## Exports

Individual parts are also exported as standalone widgets — drop a swatch, alpha slider, or mode switcher anywhere in your UI.

| Export                                                  | Purpose         |
|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------|
| <a href="https://transience.github.io/color-picker/?path=/story/colorpicker--default" target="_blank">Color Picker</a> | The full picker.                                                                 |
| <a href="https://transience.github.io/color-picker/?path=/story/usecolorpicker--custom-layout" target="_blank">useColorPicker</a> | State hook powering `ColorPicker`. See [Hook](#hook).                            |
| <a href="https://transience.github.io/color-picker/?path=/story/alphaslider--default" target="_blank">AlphaSlider</a> | Checkerboard-backed alpha slider.                                                |
| <a href="https://transience.github.io/color-picker/?path=/story/channelinputs--default" target="_blank">ChannelInputs</a> | Per-mode input group (L/C/H, H/S/L, or R/G/B).                                   |
| <a href="https://transience.github.io/color-picker/?path=/story/channelsliders--default" target="_blank">ChannelSliders</a> | Per-mode slider group (L/C/H, H/S/L, or R/G/B).                                  |
| <a href="https://transience.github.io/color-picker/?path=/story/colorinput--default" target="_blank">ColorInput</a> | CSS color string input with validation.                                          |
| <a href="https://transience.github.io/color-picker/?path=/story/eyedropper--default" target="_blank">EyeDropper</a> | Screen color picker button (omits when `window.EyeDropper` is unavailable).      |
| <a href="https://transience.github.io/color-picker/?path=/story/gamutwarning--default" target="_blank">GamutWarning</a> | Popover-anchored icon shown when an OKLCH color falls outside sRGB.              |
| <a href="https://transience.github.io/color-picker/?path=/story/gradientslider--default" target="_blank">GradientSlider</a> | Low-level 1D slider with a CSS-gradient track.                                   |
| <a href="https://transience.github.io/color-picker/?path=/story/hueslider--default" target="_blank">HueSlider</a> | Standalone mode-aware hue slider (OKLCH or HSL gradient).                        |
| <a href="https://transience.github.io/color-picker/?path=/story/modeselector--default" target="_blank">ModeSelector</a> | OKLCH / HSL / RGB mode switcher.                                                 |
| <a href="https://transience.github.io/color-picker/?path=/story/oklchpanel--default" target="_blank">OKLCHPanel</a> | 2D OKLCH chroma/lightness panel with sRGB gamut overlay.                         |
| <a href="https://transience.github.io/color-picker/?path=/story/saturationpanel--default" target="_blank">SaturationPanel</a> | 2D HSV saturation/value panel (used for HSL and RGB modes).                      |
| <a href="https://transience.github.io/color-picker/?path=/story/settingsmenu--default" target="_blank">SettingsMenu</a> | Display/output format picker popover.                                            |
| <a href="https://transience.github.io/color-picker/?path=/story/swatch--default" target="_blank">Swatch</a>  | Circular color preview over a checkerboard. Accepts `children` for icon overlays. |

The constants (`hslHueGradient`, `oklchHueGradient`) and all types (`ColorPickerProps`, `UseColorPickerReturn`, `ColorMode`, `ColorFormat`, `OklchColor`, `HSV`, `ChannelsConfig`, `ColorPickerClassNames`, etc.) are also exported.

## Hook

The useColorPicker hook is the state engine behind the `ColorPicker` component. It accepts the same props but doesn't render any UI — just returns the state and callbacks needed to build your own custom picker layout or embed the controls inside an existing design.

Reach for it when you need a custom layout, a partial picker, or want to embed the controls inside an existing UI shell.

```tsx
import { useColorPicker } from '@transience/color-picker';

const picker = useColorPicker({ color, onChange: setColor });
```

See [`docs/HOOK.md`](./docs/HOOK.md) for the full return reference, composition map, and working examples.

## Interaction signal

The picker has a `data-interacting` attribute on its root element, set to `"true"` during any interaction. The attribute stays `"true"` for the whole interaction. Drag the panel, then a slider — no flicker off in between. Use it as a single DOM or CSS signal regardless of which slider or panel the user is touching.

```tsx
new MutationObserver(() => {
  const isInteracting = root.hasAttribute('data-interacting');
  // ...
}).observe(root, { attributes: true, attributeFilter: ['data-interacting'] });
```

```css
.color-picker[data-interacting] .live-preview {
  pointer-events: none;
}
```

See [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md#7-interaction-pipeline) for the deeper write-up.

## Color engine

Color parsing, conversion, gamut math, and output formatting are powered by [`colorizr`](https://github.com/gilbarbara/colorizr) (same author). Whatever you pass to `color` is parsed by it; whatever `onChange` emits is formatted by it. It ships as a runtime dependency — no install needed.

If you build a custom layout with [`useColorPicker`](#hook) and need color utilities beyond what the hook returns (e.g., `darken`, `lighten`, `contrast`, `extractColors`), install it directly:

```bash
npm i colorizr
```

It'll dedupe in your bundle.

## References

- [css-color-component](https://github.com/argyleink/css-color-component)
- [oklume](https://github.com/ipatovanton/oklume)
- [react-color](https://github.com/uiwjs/react-color)
- Chrome DevTools color picker (built-in reference for UX and features)

## License

MIT
