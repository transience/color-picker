import { type HTMLAttributes, type ReactNode, useCallback, useMemo } from 'react';
import { formatCSS, getP3MaxChroma, type HSL, type LCH, parseCSS, type RGB } from 'colorizr';

import { cn, resolveLabel } from '~/modules/helpers';

import NumericInput from './components/NumericInput';
import { DEFAULT_LABELS } from './constants';
import type {
  ChannelInputsClassNames,
  ColorMode,
  ColorPickerLabels,
  NumericInputClassNames,
} from './types';

type ChannelInputKey = 'a' | 'b' | 'c' | 'g' | 'h' | 'l' | 'r' | 's';

interface ChannelInputsProps extends Omit<HTMLAttributes<HTMLDivElement>, 'color'> {
  /** Current alpha value as a float in `[0, 1]`. Rendered as the 4th input when `showAlpha` is on. */
  alpha: number;
  /** Per-part className overrides. */
  classNames?: ChannelInputsClassNames;
  /**
   * Current color as a CSS string (any format parseable by `colorizr`). The
   * component derives the per-channel values for the active `mode` from it.
   */
  color: string;
  /**
   * Per-channel label/aria overrides for this input row.
   *
   * Keys: `r`, `g`, `b`, `h`, `s`, `l`, `c`, `a` (alpha). Each falls back
   * to the corresponding `DEFAULT_LABELS.channelInputs` entry.
   */
  labels?: ColorPickerLabels['channelInputs'];
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
    className,
    classNames,
    color,
    labels,
    mode,
    numericInputClassNames,
    onAlphaChange,
    onChangeColor,
    showAlpha,
    ...rest
  } = props;

  const mergedNumericClassNames: NumericInputClassNames = {
    root: cn('justify-center', numericInputClassNames?.root),
    input: cn('w-full text-center', numericInputClassNames?.input),
    suffix: numericInputClassNames?.suffix,
  };

  const slot = useCallback(
    (key: ChannelInputKey) => {
      const fallback = DEFAULT_LABELS.channelInputs[key];

      return {
        label: resolveLabel(fallback.label, labels?.[key]?.label),
        ariaLabel: labels?.[key]?.ariaLabel ?? fallback.ariaLabel,
      };
    },
    [labels],
  );

  const fields = useMemo<FieldDefinition[]>(() => {
    if (mode === 'rgb') {
      const rgb = parseCSS(color, 'rgb');
      const emit = (next: RGB) => onChangeColor(formatCSS(next, { format: 'oklch' }));

      return [
        {
          ...slot('r'),
          key: 'r',
          max: 255,
          min: 0,
          onChange: v => emit({ ...rgb, r: v }),
          value: `${Math.round(rgb.r)}`,
        },
        {
          ...slot('g'),
          key: 'g',
          max: 255,
          min: 0,
          onChange: v => emit({ ...rgb, g: v }),
          value: `${Math.round(rgb.g)}`,
        },
        {
          ...slot('b'),
          key: 'b',
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
          ...slot('l'),
          key: 'l',
          max: 100,
          min: 0,
          onChange: v => emit({ ...lch, l: v / 100 }),
          step: 0.1,
          suffix: '%',
          value: (lch.l * 100).toFixed(1),
        },
        {
          ...slot('c'),
          key: 'c',
          max: maxC,
          min: 0,
          onChange: v => emit({ ...lch, c: v }),
          step: 0.001,
          value: lch.c.toFixed(3),
        },
        {
          ...slot('h'),
          key: 'h',
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
        ...slot('h'),
        key: 'h',
        max: 360,
        min: 0,
        onChange: v => emit({ ...hsl, h: v }),
        suffix: '°',
        value: `${Math.round(hsl.h)}`,
      },
      {
        ...slot('s'),
        key: 's',
        max: 100,
        min: 0,
        onChange: v => emit({ ...hsl, s: v }),
        suffix: '%',
        value: `${Math.round(hsl.s)}`,
      },
      {
        ...slot('l'),
        key: 'l',
        max: 100,
        min: 0,
        onChange: v => emit({ ...hsl, l: v }),
        suffix: '%',
        value: `${Math.round(hsl.l)}`,
      },
    ];
  }, [color, mode, slot, onChangeColor]);

  const labelClassName = cn(
    'text-xs text-neutral-500 dark:text-neutral-400 leading-none',
    classNames?.label,
  );

  return (
    <div
      className={cn('flex items-start justify-center gap-3', className, classNames?.root)}
      data-testid="ChannelInputs"
      {...rest}
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
          <span className={labelClassName}>{field.label}</span>
        </div>
      ))}
      {showAlpha && (
        <div className="flex flex-col items-center gap-1">
          <NumericInput
            aria-label={slot('a').ariaLabel}
            classNames={mergedNumericClassNames}
            max={1}
            min={0}
            onChange={onAlphaChange}
            step={0.01}
            value={alpha.toFixed(2)}
          />
          <span className={labelClassName}>{slot('a').label}</span>
        </div>
      )}
    </div>
  );
}
