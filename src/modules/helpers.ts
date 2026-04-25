import type { PointerEvent, ReactNode } from 'react';
import clsx, { type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * An object without excluded types.
 */
type RemoveType<TObject, TExclude = undefined> = {
  [Key in keyof TObject as TObject[Key] extends TExclude ? never : Key]: TObject[Key];
};

type Simplify<T> = { [K in keyof T]: T[K] } & {};

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Remove properties with undefined value from an object
 */
export function cleanUpObject<T extends Record<string, unknown>>(input: T) {
  const output: Record<string, unknown> = {};

  for (const key in input) {
    if (input[key] !== undefined) {
      output[key] = input[key];
    }
  }

  return output as RemoveType<T>;
}

/**
 * Extend the tailwind merge to handle custom classes, like `text-sm` and override them.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function createId(prefix: string): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}-${crypto.randomUUID().slice(0, 8)}`;
  }

  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Merges the defaultProps with literal values with the incoming props, removing undefined values from it that would override the defaultProps.
 * The result is a type-safe object with the defaultProps as required properties.
 */
export function mergeProps<
  TDefaultProps extends Record<string, any>,
  TProps extends Record<string, any>,
>(defaultProps: TDefaultProps, props: TProps) {
  const cleanProps = cleanUpObject(props);

  return { ...defaultProps, ...cleanProps } as unknown as Simplify<
    TProps & Required<Pick<TProps, keyof TDefaultProps & string>>
  >;
}

/**
 * Snap a value to a step, with an optional origin offset.
 */
export function quantize(value: number, step: number, origin = 0): number {
  if (step <= 0) return value;

  const decimals = (step.toString().split('.')[1] ?? '').length;
  const snapped = Math.round((value - origin) / step) * step + origin;

  return Number(snapped.toFixed(decimals));
}

export function relativePosition(event: PointerEvent, rect: DOMRect): { x: number; y: number } {
  return {
    x: clamp((event.clientX - rect.left) / rect.width, 0, 1),
    y: clamp((event.clientY - rect.top) / rect.height, 0, 1),
  };
}

export function resolveLabel(fallback: string, value?: ReactNode): ReactNode {
  if (value !== undefined) {
    return value;
  }

  return fallback;
}
