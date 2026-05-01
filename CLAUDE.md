# CLAUDE.md

## Project

`@transience/color-picker` — React color picker for OKLCH, HSL, RGB. Pairs with [`colorizr`](https://github.com/gilbarbara/colorizr) (same author), which does the color math. UI for `color-lab` and `colormeup`.

- Peer: React 16.8 – 19. Hooks only.
- Tailwind CSS v4 utilities. Consumers configure Tailwind themselves — no stylesheet ships.
- ESM + CJS via `tsup`. Size-limited: 30 kB ESM / 35 kB CJS.
- Runtime deps: `clsx`, `colorizr`, `tailwind-merge`. **Do not add new runtime deps without discussion.**

## Commands

```bash
pnpm install              # Install dependencies
pnpm build                # Clean and build with tsup
pnpm watch                # Build in watch mode

pnpm test                 # All tests (unit + storybook)
pnpm test:watch           # Interactive
pnpm test:coverage        # With coverage (90% threshold)

pnpm lint                 # ESLint with auto-fix
pnpm typecheck            # tsc --noEmit
pnpm typevalidation       # arethetypeswrong on published types

pnpm storybook            # Storybook on :6006
pnpm build-storybook      # Static build

pnpm size                 # size-limit
pnpm validate             # lint + typecheck + test:coverage + build + size + typevalidation
```

## Entry point

`src/index.ts` exports `ColorPicker`, `useColorPicker`, `AlphaSlider`, `ChannelInputs`, `ChannelSliders`, `ColorInput`, `EyeDropper`, `GamutWarning`, `GradientSlider` (primitive 1D slider), `HueSlider`, `ModeSelector`, `OKLCHPanel`, `SaturationPanel`, `SettingsMenu`, `Swatch`, the `hslHueGradient` / `oklchHueGradient` constants, and everything from `src/types.ts` (where `HSV` is defined; `modules/colorSpace.ts` imports it from there).

Path alias `~/*` → `src/*`. Prefer it for intra-`src` imports.

## Where things live

- `src/ColorPicker.tsx` — thin JSX wrapper around `useColorPicker`. Composes sub-components based on `show*` flags.
- `src/hooks/useColorPicker.ts` — public state hook. Owns HSV + OKLCH state, alpha, format resolution, and the `onChange` emit pipeline. Returns `UseColorPickerReturn`.
- `src/hooks/useInteractionAttribute.ts` — sets `data-interacting` on the root during drags/keys.
- `src/modules/` — pure logic. `colorSpace.ts` (HSV ↔ RGB, OKLCH ↔ P3-HSV, gamut checks), `format.ts` (format resolution + `formatColor`), `oklchCanvas.ts` (OKLCH panel coordinate math), `helpers.ts` (`cn`, `clamp`, `quantize`, `relativePosition`).
- `src/ChannelSliders/` — per-mode slider group (HSL / OKLCH / RGB), dispatched by `mode`.
- `src/types.ts` — public types. `ColorPickerProps`, `UseColorPickerReturn`, `ColorMode`, `ColorFormat`, `OklchColor`, `ChannelsConfig`, `ColorPickerClassNames` slot map.
- `src/constants.tsx` — `DEFAULT_COLOR` (`oklch(54% 0.194 250)`), `DEFAULT_MODES`, hue gradients.

All other component files are building blocks assembled by `ColorPicker` — open them as needed; they're small.

## Styling

- Tailwind v4. `@tailwindcss/vite` wired for Storybook only.
- Every internal `className` composes through `cn()` (`clsx` + `tailwind-merge`). Consumer classes passed via `classNames={...}` win reliably.
- Override points are the slots on `ColorPickerClassNames` — add a new slot there when exposing a new element.

## Tests

Two Vitest projects (`vitest.config.mts`):

- `unit` — jsdom + globals. Setup: `tests/__setup__/vitest.setup.ts`. Files in `tests/` mirror `src/`.
- `storybook` — runs `.stories.tsx` via `@storybook/addon-vitest` in headless Chromium (Playwright). Use for interaction + keyboard E2E.

Coverage: **90%** across statements, branches, functions, lines. Excluded: `src/index.ts`, `src/types.ts`, `src/images/*`.

## Code style

- ESLint: `@gilbarbara/eslint-config` (+ `vitest`, `testing-library`).
- Prettier: `@gilbarbara/prettier-config`.
- TypeScript: `@gilbarbara/tsconfig`.

## Deeper reading

- `docs/ARCHITECTURE.md` — full state model, OKLCH panel math, interaction pipeline, slot map, why the sRGB overlay is drawn the way it is.
- `docs/HOOK.md` — `useColorPicker` return reference, composition map, custom-layout examples.
