import type { PointerEvent } from 'react';
import clsx, { type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
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
