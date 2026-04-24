# useColorPicker

`useColorPicker` is the state engine behind `<ColorPicker>`. It owns the HSV/OKLCH color state, the emit pipeline, format resolution, and the callbacks wired to every interactive sub-component. Consumers reach for it when the default layout doesn't fit — to build a horizontal picker, embed controls inside an existing toolbar, render only a subset of the parts, or wrap the picker in a different shell without losing the state semantics.

`<ColorPicker>` is a thin JSX wrapper around this hook. Everything the component does, the hook exposes.

Pairs with:

- [`README.md`](../README.md) — installation, `<ColorPicker>` props, styling.
- [`ARCHITECTURE.md`](./ARCHITECTURE.md) — how the hook is organized (emit pipeline, ref-shadow state, OKLCH panel math).

---

## Signature

```ts
import { useColorPicker } from '@transience/color-picker';
import type { ColorPickerProps, UseColorPickerReturn } from '@transience/color-picker';

function useColorPicker(props: ColorPickerProps): UseColorPickerReturn;
```

The `props` argument is the same `ColorPickerProps` that `<ColorPicker>` accepts. Controlled (`color` + `onChange`) and uncontrolled (`color` omitted) modes behave identically to the component.

---

## Return reference

Grouped by concern. Every field is stable across renders except the state values and derived strings, which update as the user interacts.

### Refs

- **`rootRef`** — callback ref to attach to the outermost element. Wires up the `data-interacting` attribute that host apps observe to pause autosave / URL sync during drags and keyboard input.
- **`containerRef`** — imperative ref to the same element after mount. Forwarded to `SettingsMenu` for positioning; useful when a consumer needs to measure or position overlays against the picker root.

### State

Raw color and UI state. Read these to render thumbs, slider values, and selected modes.

- **`mode`** (`ColorMode`) — active color space driving the 2D panel and channel controls.
- **`hsv`** (`HSV`) — HSV triplet feeding `SaturationPanel` and the HSL/RGB sliders.
- **`oklch`** (`OklchColor`) — OKLCH triplet feeding `OKLCHPanel` and the OKLCH sliders.
- **`alpha`** (`number`, 0–1) — only used when `showAlpha` is on. Appended to emitted values when `< 1`.
- **`displayFormat`** / **`outputFormat`** (`ColorFormat`) — resolved formats for the text input and `onChange` emission respectively.

### Handlers

Pre-bound callbacks to pass to the corresponding controls. Each handler updates the relevant state **and** runs the emit pipeline — consumers should wire them directly, not wrap them in extra `onChange` layers.

- **`handleChangeOklchPanel(l, c)`** — for `<OKLCHPanel onChange>`.
- **`handleChangeSaturationPanel(s, v)`** — for `<SaturationPanel onChange>`.
- **`handleChangeOklchHue(h)`** / **`handleChangeHsvHue(h)`** — for hue sliders; dispatch by `isOklch`.
- **`handleChangeAlpha(next)`** — for `<AlphaSlider onChange>`.
- **`handleChangeColorInput(value)`** — for `<ColorInput onChange>` (accepts any CSS color string), the eye dropper, and `<ChannelSliders onChangeColor>` / `<ChannelInputs onChangeColor>`.
- **`handleChangeDisplayFormat(format)`** / **`handleChangeOutputFormat(format)`** — for `<SettingsMenu>`.
- **`handleClickMode(value)`** — for `<ModeSelector onClick>`.

### Derived

Computed from state on every render. Most sub-components expect these shapes directly.

- **`isOklch`** (`boolean`) — true when `mode === 'oklch'`. Dispatches between OKLCH and HSV panels/sliders.
- **`currentHue`** (`number`) — hue of the active mode (`oklch.h` or `hsv.h`).
- **`solidColor`** (`string`) — current color as an opaque CSS string. Feeds `<AlphaSlider color>`, `<ChannelSliders color>`, `<ChannelInputs color>`.
- **`displayValue`** (`string`) — current color formatted per `displayFormat`. Feeds `<ColorInput value>`.
- **`swatchColor`** (`string`) — alias of `displayValue`. Feeds `<Swatch color>`.
- **`showGamutWarning`** (`boolean`) — true when the OKLCH color falls outside sRGB and a narrow format is active. Use to render `<GamutWarning>` inside `<ColorInput endContent>`.
- **`props`** (`ColorPickerProps`) — input props merged with defaults. Useful when forwarding flags (`channels`, `classNames`, `showAlpha`, etc.) to sub-components.

---

## Composition

Each return field maps directly onto the props of a built-in sub-component. The table below covers the common wirings — the full pattern lives in `src/ColorPicker.tsx`.

| Hook field                           | Sub-component                  | Prop                             |
|--------------------------------------|--------------------------------|----------------------------------|
| `rootRef`                            | root `<div>`                   | `ref`                            |
| `oklch.{l,c,h}` + `handleChangeOklchPanel` | `OKLCHPanel`             | `lightness` / `chroma` / `hue` / `onChange` |
| `hsv.{h,s,v}` + `handleChangeSaturationPanel` | `SaturationPanel`     | `hue` / `saturation` / `value` / `onChange` |
| `mode` + `currentHue` + hue handler  | `HueSlider`                    | `mode` / `value` / `onChange` (`isOklch ? handleChangeOklchHue : handleChangeHsvHue`) |
| `alpha` + `solidColor` + `handleChangeAlpha` | `AlphaSlider`          | `value` / `color` / `onChange`   |
| `displayValue` + `handleChangeColorInput` | `ColorInput`              | `value` / `onChange`             |
| `swatchColor`                        | `Swatch`                       | `color` (optional `children` for icon overlay) |
| `mode` + `handleClickMode`           | `ModeSelector`                 | `mode` / `onClick`               |
| `displayFormat` / `outputFormat` + handlers | `SettingsMenu`          | `displayFormat` / `outputFormat` / `onChangeDisplayFormat` / `onChangeOutputFormat` |
| `solidColor` + `mode` + `handleChangeColorInput` | `ChannelSliders`   | `color` / `mode` / `onChangeColor` |
| `showGamutWarning`                   | `ColorInput endContent`        | render `<GamutWarning />` conditionally |

---

## Examples

### Custom layout

Horizontal picker: panel on the left, swatch + input + mode selector stacked on the right.

```tsx
import {
  useColorPicker,
  ColorInput,
  ModeSelector,
  OKLCHPanel,
  SaturationPanel,
  Swatch,
} from '@transience/color-picker';
import { useState } from 'react';

export function HorizontalPicker() {
  const [color, setColor] = useState('oklch(0.7 0.15 250)');
  const picker = useColorPicker({ color, onChange: setColor });

  return (
    <div ref={picker.rootRef} className="flex gap-4 p-3">
      {picker.isOklch ? (
        <OKLCHPanel
          chroma={picker.oklch.c}
          hue={picker.oklch.h}
          lightness={picker.oklch.l}
          onChange={picker.handleChangeOklchPanel}
        />
      ) : (
        <SaturationPanel
          hue={picker.hsv.h}
          onChange={picker.handleChangeSaturationPanel}
          saturation={picker.hsv.s}
          value={picker.hsv.v}
        />
      )}

      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <Swatch color={picker.swatchColor} />
          <ColorInput onChange={picker.handleChangeColorInput} value={picker.displayValue} />
        </div>
        <ModeSelector mode={picker.mode} onClick={picker.handleClickMode} />
      </div>
    </div>
  );
}
```

### Partial picker — OKLCH panel + alpha only

No mode selector, no channel sliders, no color input. A minimal swatch-and-slider surface for apps that want to commit fully to OKLCH.

```tsx
import { useColorPicker, AlphaSlider, OKLCHPanel, Swatch } from '@transience/color-picker';
import { useState } from 'react';

export function OklchOnly() {
  const [color, setColor] = useState('oklch(0.65 0.2 15 / 0.8)');
  const picker = useColorPicker({ color, onChange: setColor, showAlpha: true });

  return (
    <div ref={picker.rootRef} className="flex flex-col gap-3 p-3">
      <OKLCHPanel
        chroma={picker.oklch.c}
        hue={picker.oklch.h}
        lightness={picker.oklch.l}
        onChange={picker.handleChangeOklchPanel}
      />
      <AlphaSlider
        color={picker.solidColor}
        onChange={picker.handleChangeAlpha}
        value={picker.alpha}
      />
      <Swatch color={picker.swatchColor} />
    </div>
  );
}
```

---

## Types

All exported from the package root:

- `ColorPickerProps` — hook input contract.
- `UseColorPickerReturn` — hook return contract.
- `ColorMode` — `'oklch' | 'hsl' | 'rgb'`.
- `ColorFormat` — `'auto' | 'hex' | 'hsl' | 'oklab' | 'oklch' | 'rgb'`.
- `HSV` — `{ h, s, v }`.
- `OklchColor` — `{ l, c, h }`.
- `ChannelsConfig`, `ColorPickerClassNames`, and the per-slot `*ClassNames` interfaces — re-exported from `src/types.ts`.

## Related primitives

`GradientSlider` is also exported — useful when building custom sliders outside the OKLCH/HSL/RGB triad (e.g., a temperature or brightness slider driven by a consumer-supplied CSS gradient). Pair it with the hook's state when the slider's value needs to feed back into the picker's color.
