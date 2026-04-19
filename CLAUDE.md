# CLAUDE.md

## Project Overview

`@transience/color-picker` is a modern React color picker supporting OKLCH, HSL, and RGB. It was built to pair with [colorizr](https://github.com/gilbarbara/colorizr) (same author) — `colorizr` handles all color math, this package provides the UI. The picker is used by the `color-lab` and `colormeup` apps.

- Peer: React 16.8 – 19.
- Styled with Tailwind CSS v4 utilities; class merging via `clsx` + `tailwind-merge`.
- ESM + CJS output via `tsup`, size-limited (25 kB ESM / 30 kB CJS).
- Tested with Vitest: unit tests in jsdom + Storybook interaction/E2E tests in headless Chromium via Playwright.

## Commands

```bash
pnpm install              # Install dependencies
pnpm build                # Clean and build with tsup
pnpm watch                # Build in watch mode

pnpm test                 # Run all tests (unit + storybook)
pnpm test:watch           # Interactive test watching
pnpm test:coverage        # Run tests with coverage (90% threshold)

pnpm lint                 # ESLint with auto-fix
pnpm typecheck            # TypeScript check
pnpm typevalidation       # Validate published types with arethetypeswrong

pnpm storybook            # Start Storybook on port 6006
pnpm build-storybook      # Build static Storybook

pnpm size                 # Check bundle size with size-limit
pnpm validate             # Full pipeline: lint + typecheck + test:coverage + build + size + typevalidation
```

## Architecture

### Source Structure (`src/`)

- **Entry point**: `index.ts` exports `ColorPicker`, `AlphaSlider`, `ChannelSliders`, `GradientSlider`, `ModeSelector`, `Swatch`, plus all constants and types.
- **Path alias**: `~/*` maps to `src/*`.

Top-level components:

- `ColorPicker.tsx` — top-level composition. Owns HSV and OKLCH state, alpha, display/output format resolution, and the `onChange` emit pipeline.
- `SaturationPanel.tsx` / `OKLCHPanel.tsx` — 2D drag panels. HSV for HSL/RGB modes, OKLCH (L × C over fixed hue) for OKLCH mode.
- `ChannelSliders/` — per-mode slider group: `HSLSliders`, `OKLCHSliders`, `RGBSliders`, picked by the active `mode`.
- `ChannelInputs.tsx` — standalone numeric input row (shown when `showInputs` is on and `showSliders` is off).
- `ColorInput.tsx` — text color input; parses any CSS color via `colorizr.isValidColor`.
- `Controls.tsx` — middle layer row (eye-dropper, swatch, hue bar, alpha bar).
- `AlphaSlider.tsx`, `EyeDropper.tsx`, `GamutWarning.tsx`, `ModeSelector.tsx`, `SettingsMenu.tsx`, `Swatch.tsx` — named building blocks.
- `useInteractionAttribute.ts` — sets a `data-interacting` attribute on the root during pointer drags (for styling hooks).

Low-level primitives:

- `components/GradientSlider.tsx` — 1D slider with a gradient track. Used for hue, alpha, and every channel slider.
- `components/NumericInput.tsx`, `RadioGroup.tsx`, `EyeDropperIcon.tsx`, `ThreeDotsVerticalIcon.tsx`, `WarningIcon.tsx`.

Modules (`src/modules/`):

- `colorSpace.ts` — HSV ↔ RGB conversion, OKLCH ↔ P3-HSV conversion (wide-gamut bridge used by the OKLCH panel), and `isP3HSVInSRGB` gamut check.
- `format.ts` — `formatColor`, `isNarrowFormat`, `resolveDisplayFormat`, `resolveOutputFormat`.
- `oklchCanvas.ts` — OKLCH 2D panel canvas rendering.
- `helpers.ts` — `cn` (clsx + tailwind-merge), `clamp`, `quantize`, `relativePosition`.

Other:

- `types.ts` — `ColorMode`, `ColorFormat`, `ChannelsConfig`, `ChannelConfig`, `ColorPickerClassNames` slot map, plus per-part classNames types.
- `constants.tsx` — `DEFAULT_COLOR` (`#ff0044`), `DEFAULT_MODES`, `hslHueGradient`, `oklchHueGradient`.

### State Model

`ColorPicker` keeps two parallel pieces of state: `hsv` (for the HSL/RGB saturation panel) and `oklch` (for the OKLCH panel). When the controlled `color` prop changes, both are re-derived from the new value. All emissions go through a single `emit()` callback that:

1. Resolves the output format via `resolveOutputFormat(outputFormat, displayFormat, mode)`.
2. Appends alpha only when `showAlpha && alpha < 1`.
3. Calls `onChange` with the final string and stores it in `lastEmittedRef` so the `color`-prop effect can skip self-induced updates.

Refs (`hsvRef`, `oklchRef`, `alphaRef`, etc.) shadow the state so pointer-driven callbacks stay stable without stale closures.

### Styling

- Tailwind CSS v4. For Storybook, `@tailwindcss/vite` is configured. Consumers of the published package must configure Tailwind themselves.
- All override points are on the `ColorPickerClassNames` slot map (`src/types.ts`). Every internal className composition goes through `cn()` so Tailwind utilities override defaults correctly.

### Tests

Two Vitest projects (`vitest.config.mts`):

- **`unit`** — jsdom, globals enabled. Setup file: `tests/__setup__/vitest.setup.ts`. Files in `tests/` mirror `src/` (e.g. `tests/ColorPicker.test.tsx`).
- **`storybook`** — runs `.stories.tsx` via `@storybook/addon-vitest` in headless Chromium (Playwright). Use these for interaction and keyboard E2E tests; see `stories/ColorPicker.stories.tsx` (`KeyboardE2E` story) for the pattern.

Coverage thresholds are 90% across statements, branches, functions, and lines. `src/index.ts`, `src/types.ts`, and `src/images/*` are excluded.

## Code Style

- ESLint: `@gilbarbara/eslint-config` (+ `vitest` + `testing-library` presets).
- Prettier: `@gilbarbara/prettier-config`.
- TypeScript: `@gilbarbara/tsconfig`.
- Prefer `~/` import alias for intra-`src` imports.

## Dependencies

Runtime deps are deliberately minimal: `clsx`, `colorizr`, `tailwind-merge`. React is a peer. The package is size-limited (25 kB ESM / 30 kB CJS) — do not add new runtime dependencies without a strong reason.
