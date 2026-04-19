import { type ReactNode, useMemo } from 'react';
import { formatCSS, getP3MaxChroma, type HSL, type LCH, parseCSS, type RGB } from 'colorizr';

import { cn } from '~/modules/helpers';

import NumericInput from './components/NumericInput';
import type { ChannelsConfig, ColorMode, NumericInputClassNames } from './types';

interface ChannelInputsProps {
  /** Current alpha value as a float in `[0, 1]`. Rendered as the 4th input when `showAlpha` is on. */
  alpha: number;
  /**
   * Per-channel overrides (label, hidden, disabled). Only the `label` field
   * is honored here; `hidden`/`disabled` apply to sliders, not this input row.
   */
  channels?: ChannelsConfig;
  /** Extra classes appended to the input row wrapper. */
  className?: string;
  /**
   * Current color as a CSS string (any format parseable by `colorizr`). The
   * component derives the per-channel values for the active `mode` from it.
   */
  color: string;
  /** Active color mode; selects which three channels are rendered (RGB / HSL / OKLCH). */
  mode: ColorMode;
  /** Per-part className overrides forwarded to each `NumericInput`. */
  numericInputClassNames?: NumericInputClassNames;
  /** Called with the new alpha in `[0, 1]` when the alpha input changes. */
  onAlphaChange: (alpha: number) => void;
  /** Called with an OKLCH CSS string whenever a channel value changes. */
  onChangeColor: (value: string) => void;
  /**
   * Adds a 4th input labelled `A` for the alpha channel, stepped `0.01`.
   * @default false
   */
  showAlpha?: boolean;
}

interface FieldDefinition {
  ariaLabel: string;
  key: string;
  label: ReactNode;
  max: number;
  min: number;
  onChange: (value: number) => void;
  step?: number;
  suffix?: string;
  value: string;
}

export default function ChannelInputs(props: ChannelInputsProps) {
  const {
    alpha,
    channels,
    className,
    color,
    mode,
    numericInputClassNames,
    onAlphaChange,
    onChangeColor,
    showAlpha,
  } = props;

  const mergedNumericClassNames: NumericInputClassNames = {
    root: cn('justify-center', numericInputClassNames?.root),
    input: cn('w-full text-center', numericInputClassNames?.input),
    suffix: numericInputClassNames?.suffix,
  };

  const fields = useMemo<FieldDefinition[]>(() => {
    if (mode === 'rgb') {
      const rgb = parseCSS(color, 'rgb');
      const emit = (next: RGB) => onChangeColor(formatCSS(next, { format: 'oklch' }));

      return [
        {
          ariaLabel: 'Red',
          key: 'r',
          label: channels?.r?.label ?? 'R',
          max: 255,
          min: 0,
          onChange: v => emit({ ...rgb, r: v }),
          value: `${Math.round(rgb.r)}`,
        },
        {
          ariaLabel: 'Green',
          key: 'g',
          label: channels?.g?.label ?? 'G',
          max: 255,
          min: 0,
          onChange: v => emit({ ...rgb, g: v }),
          value: `${Math.round(rgb.g)}`,
        },
        {
          ariaLabel: 'Blue',
          key: 'b',
          label: channels?.b?.label ?? 'B',
          max: 255,
          min: 0,
          onChange: v => emit({ ...rgb, b: v }),
          value: `${Math.round(rgb.b)}`,
        },
      ];
    }

    if (mode === 'oklch') {
      const lch = parseCSS(color, 'oklch');
      const maxC = getP3MaxChroma({ l: lch.l, c: 0, h: lch.h });
      const emit = (next: LCH) => onChangeColor(formatCSS(next, { format: 'oklch' }));

      return [
        {
          ariaLabel: 'Lightness',
          key: 'l',
          label: channels?.l?.label ?? 'L',
          max: 100,
          min: 0,
          onChange: v => emit({ ...lch, l: v / 100 }),
          step: 0.1,
          suffix: '%',
          value: (lch.l * 100).toFixed(1),
        },
        {
          ariaLabel: 'Chroma',
          key: 'c',
          label: channels?.c?.label ?? 'C',
          max: maxC,
          min: 0,
          onChange: v => emit({ ...lch, c: v }),
          step: 0.001,
          value: lch.c.toFixed(3),
        },
        {
          ariaLabel: 'Hue',
          key: 'h',
          label: channels?.h?.label ?? 'H',
          max: 360,
          min: 0,
          onChange: v => emit({ ...lch, h: v }),
          step: 0.1,
          suffix: '°',
          value: lch.h.toFixed(1),
        },
      ];
    }

    const hsl = parseCSS(color, 'hsl');
    const emit = (next: HSL) => onChangeColor(formatCSS(next, { format: 'oklch' }));

    return [
      {
        ariaLabel: 'Hue',
        key: 'h',
        label: channels?.h?.label ?? 'H',
        max: 360,
        min: 0,
        onChange: v => emit({ ...hsl, h: v }),
        suffix: '°',
        value: `${Math.round(hsl.h)}`,
      },
      {
        ariaLabel: 'Saturation',
        key: 's',
        label: channels?.s?.label ?? 'S',
        max: 100,
        min: 0,
        onChange: v => emit({ ...hsl, s: v }),
        suffix: '%',
        value: `${Math.round(hsl.s)}`,
      },
      {
        ariaLabel: 'Lightness',
        key: 'l',
        label: channels?.l?.label ?? 'L',
        max: 100,
        min: 0,
        onChange: v => emit({ ...hsl, l: v }),
        suffix: '%',
        value: `${Math.round(hsl.l)}`,
      },
    ];
  }, [channels, color, mode, onChangeColor]);

  return (
    <div
      className={cn('flex items-start justify-center gap-3 px-3', className)}
      data-testid="ChannelInputs"
    >
      {fields.map(field => (
        <div key={field.key} className="flex flex-col items-center gap-1">
          <NumericInput
            aria-label={field.ariaLabel}
            classNames={mergedNumericClassNames}
            max={field.max}
            min={field.min}
            onChange={field.onChange}
            step={field.step}
            suffix={field.suffix}
            value={field.value}
          />
          <span className="text-xs text-neutral-500 dark:text-neutral-400">{field.label}</span>
        </div>
      ))}
      {showAlpha && (
        <div className="flex flex-col items-center gap-1">
          <NumericInput
            aria-label="Alpha"
            classNames={mergedNumericClassNames}
            max={1}
            min={0}
            onChange={onAlphaChange}
            step={0.01}
            value={alpha.toFixed(2)}
          />
          <span className="text-xs text-neutral-500 dark:text-neutral-400">A</span>
        </div>
      )}
    </div>
  );
}
