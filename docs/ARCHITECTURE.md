# Architecture

Contributor-facing map of `@transience/color-picker`. Pairs with:

- `README.md` — consumer API, props, styling.
- `CLAUDE.md` — Claude Code orientation (project intro, commands, where things live).

This document captures **why** the package is shaped the way it is. It references file paths over duplicating code; open the source for the literal bytes.

---

## 1. Overview

`@transience/color-picker` is a React color picker supporting OKLCH (primary), HSL, and RGB. It was extracted from the `color-lab` app and is now consumed by `color-lab` and `colormeup`.

Key choices:

- **Color math is delegated.** Every matrix, gamut check, and format conversion comes from [`colorizr`](https://github.com/gilbarbara/colorizr). This package owns UI, layout, and the coordinate transforms needed to render/interact with the OKLCH panel — nothing else.
- **Peer React 16.8 – 19.** Hooks-only, no legacy class components.
- **Tailwind v4 styling, no shipped stylesheet.** Consumers bring their own Tailwind setup. Internals use `cn()` (`clsx` + `tailwind-merge`) so slot overrides actually win.
- **ESM + CJS, size-limited** (25 kB ESM / 30 kB CJS). Runtime deps are `clsx`, `colorizr`, `tailwind-merge` only.
- **OKLCH-first UX.** The default mode is OKLCH; the 2D panel renders a P3-HSV canvas at the current hue with an sRGB gamut overlay.

---

## 2. Package shape

Entry point: `src/index.ts` — named exports: `ColorPicker`, `useColorPicker`, `AlphaSlider`, `ChannelInputs`, `ChannelSliders`, `ColorInput`, `EyeDropper`, `GamutWarning`, `HueSlider`, `ModeSelector`, `OKLCHPanel`, `SaturationPanel`, `SettingsMenu`, `Swatch`, `GradientSlider` (the 1D slider primitive behind `AlphaSlider` / `HueSlider` / channel sliders, exported so consumers can build custom gradient-backed sliders); the `hslHueGradient` / `oklchHueGradient` constants; and every type from `src/types.ts` (including `ColorPickerProps`, `UseColorPickerReturn`, `OklchColor`, and `HSV`). `DEFAULT_COLOR` / `DEFAULT_MODES` are internal.

Source layout:

```
src/
  ColorPicker.tsx          Top-level composition + state
  SaturationPanel.tsx      HSV 2D panel (HSL / RGB modes)
  OKLCHPanel.tsx           P3-HSV 2D panel + sRGB boundary (OKLCH mode)
  AlphaSlider.tsx          Checkerboard-backed alpha slider
  HueSlider.tsx            Mode-aware standalone hue slider
  ColorInput.tsx           Free-form CSS color text input
  Swatch.tsx               Circular preview
  ModeSelector.tsx         OKLCH / HSL / RGB switcher
  SettingsMenu.tsx         Display/output format menu (gear trigger)
  EyeDropper.tsx           window.EyeDropper trigger
  ChannelInputs.tsx        Standalone numeric input row
  constants.tsx            DEFAULT_COLOR, DEFAULT_MODES, hue gradients
  types.ts                 Public types and slot maps
  hooks/
    useColorPicker.ts      Public state hook — the engine behind ColorPicker
    useInteractionAttribute.ts  Sets data-interacting on the root during drags/keys
  ChannelSliders/
    index.tsx              Dispatches by mode
    HSLSliders.tsx
    OKLCHSliders.tsx
    RGBSliders.tsx
  components/              Low-level primitives
    GradientSlider.tsx       1D slider (hue, alpha, every channel)
    NumericInput.tsx         Clamped numeric field with arrow/shift stepping
    Button.tsx               Shared icon / segmented button shell
    GamutWarning.tsx         Popover-anchored gamut warning icon
    RadioGroup.tsx           Settings-menu format picker
    EyeDropperIcon.tsx, GearIcon.tsx, WarningIcon.tsx   Inline SVGs
  modules/                 Pure logic
    colorSpace.ts
    format.ts
    oklchCanvas.ts
    helpers.ts
  images/                  Checkerboard tile
```

Path alias: `~/*` → `src/*`. Prefer it for intra-`src` imports.

---

## 3. Render tree

`ColorPicker` assembles up to six sections, always in this fixed order. Each section is built into a `content` map and only included when its prop flag is on, so gating never disturbs the vertical order.

```
<ColorPicker>                                      (root — data-interacting)
├── panel         showPanel        OKLCHPanel | SaturationPanel
├── colorValue    showSwatch || showColorInput
│   ├── Swatch                     showSwatch
│   └── ColorInput                 showColorInput
│       └── GamutWarning           (auto, when narrow format + out-of-gamut OKLCH)
├── toolbar       showGlobalHue || showAlpha
│   ├── hueSlider                  showGlobalHue    → HueSlider → GradientSlider
│   └── alphaSlider                showAlpha        → AlphaSlider → GradientSlider
├── sliders       showSliders                       → ChannelSliders
│   └── HSL / OKLCH / RGB triad of GradientSliders
│       └── optional NumericInput endContent        showInputs
├── inputs        (!showSliders) && showInputs      → ChannelInputs
└── options       showEyeDropper || showModeSelector || showSettings
    ├── EyeDropper                 showEyeDropper
    ├── ModeSelector               showModeSelector
    └── SettingsMenu               showSettings
```

Assembly in `src/ColorPicker.tsx`: sections are collected into the `content` record (declared just before the first `if (showPanel)` block); the JSX return renders `panel → colorValue → toolbar → sliders → inputs → options`.

---

## 4. State model

Anchor file: `src/hooks/useColorPicker.ts`.

Two parallel color states live side by side:

- **`hsv`** — HSV `{ h, s, v }`, used by `SaturationPanel` (HSL/RGB modes). Initialized from the incoming `color` via `colorToHsv`.
- **`oklch`** — `{ l, c, h }`, used by `OKLCHPanel` and OKLCH sliders. Initialized via `colorizr`'s `parseCSS(color, 'oklch')`.

Plus:

- **`alpha`** — only read when `showAlpha` is on; merged into emitted values only when `alpha < 1`.
- **`mode`**, **`displayFormat`**, **`outputFormat`** — UI state.

When the controlled `color` prop changes, an effect re-derives both `hsv` and `oklch` from it (guarded by `lastEmittedRef` so self-induced updates don't loop).

### Refs shadow state

Every piece of state has a matching `*Ref` (`hsvRef`, `oklchRef`, `alphaRef`, `displayFormatRef`, `outputFormatRef`, `modeRef`, `precisionRef`, `showAlphaRef`, `onChangeRef`, `onChangeModeRef`) — updated on every render. This lets the pointer/keyboard callbacks passed to panels and sliders keep an empty dependency array and still read current values without stale closures. Without this, every drag move would tear down and rebuild the handlers.

### The emit pipeline

One function, `emit(oklchValue)`:

1. `resolveOutputFormat(outputFormat, displayFormat, mode)` → concrete format (no `'auto'`).
2. Compute `alphaForOutput` (only when `showAlpha && alpha < 1`).
3. `formatColor(oklchValue, resolved, alphaForOutput, precision)` — final CSS string.
4. Store in `lastEmittedRef` so the `color` prop effect can skip this value.
5. Call `onChange`.

Every interaction (panel drag, channel slider, alpha slider, color input, eyedropper) eventually calls `emit` with an OKLCH CSS string — OKLCH is the internal canonical pivot.

---

## 5. Public API surface

### Props

Full table lives in `README.md` (`## Props`). The `ColorPickerProps` interface is defined in `src/types.ts` and consumed by both `ColorPicker` and `useColorPicker`.

### Hook

`useColorPicker(props: ColorPickerProps): UseColorPickerReturn` (`src/hooks/useColorPicker.ts`) is the same state engine `ColorPicker` uses internally — the component is a thin JSX wrapper. The `UseColorPickerReturn` interface in `src/types.ts` is the stable public contract (refs, state, handlers, derived values). See [`docs/HOOK.md`](./HOOK.md) for the full return reference and composition examples.

### Slot-based classNames

`ColorPickerClassNames` in `src/types.ts` enumerates every override point:

```
root, panel{root, thumb}, colorValue, swatch{root, color}, colorInput{root, input},
gamutWarning, toolbar, hueSlider, alphaSlider (GradientSliderClassNames),
channelSliders, channelSlider, channelInputs, numericInput, eyeDropper,
modeSelector, settingsMenu{trigger, menu}, tooltip, options
```

Each slot's classes merge with the component defaults via `cn()` in `src/modules/helpers.ts` — tailwind-merge ensures a consumer's utility beats an internal one without needing `!important`.

### `channels` config

`ChannelsConfig = Partial<Record<ChannelKey, { label?, hidden?, disabled? }>>` (`src/types.ts`). Keys not relevant to the active mode are silently ignored — you can pass `{ c: {...}, r: {...} }` and both apply when their mode is active. `hidden`/`disabled` apply to sliders; `label` additionally applies to `ChannelInputs`.

### Formats

`ColorFormat = 'auto' | 'hex' | 'hsl' | 'oklab' | 'oklch' | 'rgb'`. Used for both `displayFormat` (what the text input shows) and `outputFormat` (what `onChange` emits). `'auto'` resolves against the current mode in `src/modules/format.ts` — `resolveDisplayFormat` (OKLCH mode → `'oklch'`, else → `'hex'`) and `resolveOutputFormat` (default: follow the resolved display format).

`isNarrowFormat` flags the three sRGB-bound formats (`hex`, `hsl`, `rgb`). `GamutWarning` shows when OKLCH mode is active and a narrow format can't losslessly represent the current color.

---

## 6. Color math (`src/modules/`)

### `colorSpace.ts`

Conversions needed inside this package. `colorizr` supplies the matrix constants and gamma encoders; this module composes them for the panel's coordinate system.

- `colorToHsv(color)` — any CSS → `HSV` (via `parseCSS(_, 'rgb')` then `rgbToHsv`).
- `hsvToHex(hsv)` / `hsvToRgb(h, s, v)` — standard HSV math.
- `oklchToP3Hsv(l, c, h)` — full chain: OKLab → cube-root LMS → LMS → linear sRGB → linear P3 → P3 gamma → HSV. No clamping beyond the gamma step.
- `p3HsvToOKLCH(h, s, v)` — the inverse chain.
- `oklchHueToHsvHue(h)` — maps an OKLCH hue to the HSV hue of a saturated reference point (`l=0.7`, `c=0.15`). Used as the canvas rendering hue.
- `isOklchInSRGB(l, c, h)` — uses the same rule `colorizr` applies when converting OKLCH to hex/rgb/hsl. Drives `GamutWarning`.
- `isP3HSVInSRGB(h, s, v, epsilon)` — used by the panel to trace the sRGB gamut overlay.

### `oklchCanvas.ts` — the OKLCH panel's coordinate math

Three load-bearing exports plus a helper. The OKLCH panel mirrors Chrome DevTools' Spectrum picker: both thumb and sRGB overlay trace in raw P3 HSV coordinates — the same coordinate system as the canvas pixels — so the thumb always sits on the gamut boundary when the color is at the sRGB edge. Many "fixes" were tried before this (OKLCH-native normalization, 2D Newton's method, ratio iteration, linear normalization by `sMax`) — all broke either the thumb/curve alignment or monotonicity. The current approach is the one Chrome ships.

- **`lcToPointer(oklchHue, l, c)`** → `{ x, y }` in 0–100%.
  Raw P3-HSV projection: `oklchToP3Hsv` then `{ s*100, (1-v)*100 }`. This matches Chrome DevTools' Spectrum picker exactly — thumb lives in the same coordinate system as the canvas pixels.

- **`pointerToLC(oklchHue, xNorm, yNorm)`** → `{ l, c }`.
  A naive `p3HsvToOKLCH(canvasHue, x, y)` drifts during drag: the canvas HSV hue comes from the fixed reference point, but the color at the cursor has a different HSV hue (offset up to ~40° at blue/violet). Feeding that `(l, c)` back through `lcToPointer` would land the thumb at a different `x` than the cursor — visible as acceleration and sticking at the gamut edge.
  The fix is a binary search: find the HSV hue whose `p3HsvToOKLCH` at `(x, y)` returns exactly the slider's `oklchHue`. 16 iterations over a ±40° bracket centered on `oklchHueToHsvHue(oklchHue)`. Round-trip error < 0.1% across tested hues (100, 135, 160, 240, 250, 300).

- **`renderOKLCHCanvas(canvas, w, h, oklchHue)`** →
  Pixel-by-pixel P3-HSV fill (`color(display-p3 …)`) at the canvas HSV hue, then a per-row sRGB gamut trace: coarse scan (80 steps) for the first out-of-gamut saturation, then 16-iteration binary search for the exact crossing. Near the blue-violet cusp (~hue 282) the default tolerance lets saturated P3 blue read as in-gamut; the strict (`epsilon=0`) fallback at `s=1` anchors the overlay to the right edge instead of terminating mid-panel.
  Returns an `{ x, y }` polyline; the panel renders it as an SVG `path` (`M … L …`) via `pointsToPath`, with `vectorEffect="non-scaling-stroke"` so the line stays crisp at any canvas width.

### `format.ts`

- `formatColor(color, format, alpha?, precision?)` — wraps `convertCSS`/`parseCSS`/`formatCSS` and handles `addAlphaToHex` for the 8-digit hex case. Rejects `'auto'` — resolve first.
- `isNarrowFormat(format)` — `hex | hsl | rgb`.
- `resolveDisplayFormat` / `resolveOutputFormat` — the `'auto'` resolution rules described above.

### `helpers.ts`

- `cn(...inputs)` — `clsx` then `tailwind-merge`. Sole className composer.
- `clamp(v, min, max)`.
- `quantize(v, step, origin = 0)` — snaps to step respecting decimal precision of the step itself.
- `relativePosition(event, rect)` — pointer → normalized 0–1 xy. Used by all pointer surfaces.

---

## 7. Interaction pipeline

Every draggable surface shares the pointer-capture pattern:

```
onPointerDown  → event.preventDefault()
               → setPointerCapture(pointerId)
               → handle once immediately (so a click registers)
onPointerMove  → hasPointerCapture(pointerId) ? handle : skip
```

The `handle` step:

1. `relativePosition(event, rect)` → `{ x, y }` in 0–1.
2. `cancelAnimationFrame(rafRef.current)`; schedule the value compute + `onChange` in a fresh rAF. This collapses multiple pointer moves per frame into one commit and keeps `onChange` rate-bounded.
3. Sliders additionally `quantize` to `step` before emitting.

`GradientSlider` adds an `onLostPointerCapture` handler that clears `isDragging` and cancels any pending rAF — this is why the slider thumb has a pressed-outline state. The 2D panels (`SaturationPanel`, `OKLCHPanel`) don't install it; the last scheduled rAF still runs once after release (harmless — its output matches the final move) and the panels therefore don't track a dragging visual state.

**Keyboard nav is a `GradientSlider`-only feature.** Its thumb has `role="slider"`, ARIA `min` / `max` / `now`, and supports:

- `ArrowLeft/Down` / `ArrowRight/Up` — step by `step` (×10 with `Shift`).
- `PageUp` / `PageDown` — step by `step * 10`.
- `Home` / `End` — jump to `minValue` / `maxValue`.

The 2D panel thumbs are pointer-only — no role, no ARIA, no key handling. Keyboard-only users adjust L/C/H (or H/S/V) via the channel sliders or the color input.

### `useInteractionAttribute`

`src/hooks/useInteractionAttribute.ts` — sets `data-interacting="true"` on the root element while the user is actively interacting. Pointer and keyboard are tracked independently:

- Pointer: explicit `pointerdown` → begin, `pointerup`/`pointercancel` → end.
- Keyboard: matches `[role="slider"], input` targets; `keydown` begins, `keyup` schedules a 200 ms idle timer; `focusout` (out of the picker) cancels immediately.

**This is the picker's stable cross-package interop channel.** Host apps (e.g. color-lab) attach a `MutationObserver` on the root to pause URL sync, autosave, or any downstream recompute while `data-interacting` is `true`, then flush once on release.

This replaced an older, fragile convention: `data-slot="thumb"` + `dataset.dragging` toggled inside each slider's pointer handlers, with the host app running a `MutationObserver` on `document.body` to catch attribute changes. The convention coupled a magic string to the slider's internal DOM — a rename (or a typo like `data-slot="track"` vs `"thumb"`) silently broke the signal, and drags started getting "stuck" after 10–20 pixels with no obvious cause. The current event-delegation model lives entirely inside the picker and exposes a single documented attribute on the root.

---

## 8. Channel slider internals

`ChannelSliders/index.tsx` dispatches by `mode`. Each per-mode file renders three `GradientSlider`s with per-channel gradient tracks and optional `NumericInput` endContent.

Notable details:

- **OKLCH sliders** (`OKLCHSliders.tsx`) — chroma's `maxValue` is dynamic: `getP3MaxChroma({ l, c: 0, h })`. When lightness or hue changes, the handler preserves *relative* chroma (`c / oldMaxChroma * newMaxChroma`), which keeps the slider thumb's visual position intuitive across mode/L/H changes. The L/C/H gradients are regenerated on every value change; the hue gradient is a static constant (`oklchHueGradient`).
- **HSL / RGB sliders** keep a local `useState` mirror plus a `lastEmittedRef` so their derived channel values survive the OKLCH round-trip the outer `ColorPicker` runs for every emission.
- **Gradient tracks** use the CSS `background` shorthand directly — `AlphaSlider` layers a gradient with a checkerboard tile via a comma-separated value.

---

## 9. SettingsMenu

Trigger is a gear button. The panel is portal'd to `document.body` and anchored to the trigger via `Floater` (`src/components/Floater.tsx`) — a small floating-UI primitive that handles fixed-coordinate positioning, top↔bottom auto-flip (with `start` / `end` alignment preserved), scroll/resize re-positioning, outside-click + Escape dismissal, and an opacity-fade visibility transition.

SettingsMenu uses Floater in click-controlled mode. Default placement is `bottom-end`: the gear sits at the picker's right edge, so the panel right-aligns to the gear and extends left into the picker. Consumers can override via `<SettingsMenu placement>` (`FloaterPlacement` exported from `src/components/Floater.tsx`).

Layout: always two `RadioGroup`s side-by-side. Panel sized by `min-w-70` (≈ 280 px) with intrinsic content driving the final width — no JS measurement, no `ResizeObserver`.

State: SettingsMenu owns `isOpen` and passes it through Floater (`open` / `onOpenChange`). The **Done** button calls `setIsOpen(false)` directly. RadioGroup interactions refocus the gear trigger so ancestor focus-within popovers (HeroUI / React Aria hosts) don't treat the selection as focus leaving the picker.

Dismissal: outside `mousedown` / `touchstart`, `Escape`, or the **Done** button.

Floater is also used by `GamutWarning` (hover + focus tooltip with touch fallback to click).

---

## 10. Styling

- **Tailwind v4.** Storybook wires it via `@tailwindcss/vite`. Consumers configure Tailwind themselves (the README contract). No CSS file ships in the package.
- **Slot map is the only override surface.** Every internal `className={...}` runs through `cn()`. This is what makes consumer utilities actually override defaults; direct string concatenation would lose to Tailwind's later-class-wins rule unpredictably.
- **Dark mode** uses Tailwind's `dark:` variant — the package doesn't ship a toggle, it follows whatever the consumer's Tailwind config resolves to.

---

## 11. Tests

Two Vitest projects (`vitest.config.mts`):

- **`unit`** — jsdom, globals enabled. Setup in `tests/__setup__/vitest.setup.ts`. Files in `tests/` mirror `src/` (e.g. `tests/ColorPicker.test.tsx`, `tests/modules/oklchCanvas.test.ts`). Snapshots live in `tests/__snapshots__/`.
- **`storybook`** — runs `.stories.tsx` via `@storybook/addon-vitest` in headless Chromium (Playwright). Use these for interaction and keyboard E2E; the pattern is in `stories/ColorPicker.stories.tsx` (`KeyboardE2E` story).

Coverage thresholds: **90%** across statements, branches, functions, and lines. Excluded from coverage: `src/index.ts`, `src/types.ts`, `src/images/*`.

---

## 12. Further reading

- `README.md` — consumer-facing API, props, and styling guide.
- `docs/HOOK.md` — `useColorPicker` reference and custom-layout examples.
- `CLAUDE.md` — orientation for Claude Code (project intro, commands, where things live).
- [`colorizr`](https://github.com/gilbarbara/colorizr) — the color-math library this package delegates to.
- Chrome DevTools [`Spectrum.ts`](https://github.com/ChromeDevTools/devtools-frontend/blob/main/front_end/ui/legacy/components/color_picker/Spectrum.ts) and [`SrgbOverlay.ts`](https://github.com/ChromeDevTools/devtools-frontend/blob/main/front_end/ui/components/srgb_overlay/SrgbOverlay.ts) — the reference implementations the OKLCH panel matches.
