import {
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
  useEffect,
  useRef,
  useState,
} from 'react';

import { clamp, cn, quantize, relativePosition } from '../modules/helpers';
import type { GradientSliderClassNames } from '../types';

interface GradientSliderProps {
  /** Accessible label for the slider thumb (required for screen readers). */
  'aria-label': string;
  /** Per-part className overrides (`root`, `track`, `thumb`). */
  classNames?: GradientSliderClassNames;
  /** Content rendered to the right of the track (e.g. a `NumericInput`). */
  endContent?: ReactNode;
  /**
   * CSS `background` value painted on the track. Supports any valid `background`
   * shorthand, including layered backgrounds (comma-separated) — used by
   * `AlphaSlider` to combine a color gradient with a checkerboard tile.
   */
  gradient: string;
  /**
   * Disables pointer + keyboard interaction and dims the track and thumb.
   * @default false
   */
  isDisabled?: boolean;
  /**
   * Upper bound of the slider range. Drag/keyboard values are clamped to this.
   * @default 100
   */
  maxValue?: number;
  /**
   * Lower bound of the slider range. Drag/keyboard values are clamped to this.
   * @default 0
   */
  minValue?: number;
  /** Called with the new value on drag, click, or keyboard step. */
  onValueChange: (value: number) => void;
  /** Content rendered to the left of the track (e.g. a channel letter label). */
  startContent?: ReactNode;
  /**
   * Step size used when quantizing drag/keyboard values. Arrow keys step by
   * `step`, `Shift`+arrow steps by `step * 10`.
   * @default 1
   */
  step?: number;
  /** Current value as a number in `[minValue, maxValue]`. */
  value: number;
}

const trackClassName = cn(
  'relative h-3 w-full rounded-full cursor-pointer',
  'aria-disabled:cursor-not-allowed aria-disabled:opacity-50',
);

const thumbClassName = cn(
  'pointer-events-none absolute top-1/2 size-5 -translate-y-1/2',
  'rounded-full border-2 border-white bg-black shadow-md',
  'transition-transform',
  'focus-visible:outline-2 focus-visible:outline-blue-500 focus-visible:outline-offset-2',
);

const thumbPressedClassName = 'scale-90 border-[3px]';

export default function GradientSlider(props: GradientSliderProps) {
  const {
    'aria-label': ariaLabel,
    classNames,
    endContent,
    gradient,
    isDisabled,
    maxValue = 100,
    minValue = 0,
    onValueChange,
    startContent,
    step = 1,
    value,
  } = props;

  const trackRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef(0);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => () => cancelAnimationFrame(rafRef.current), []);

  const handleMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!trackRef.current || isDisabled) return;

    const rect = trackRef.current.getBoundingClientRect();
    const { x } = relativePosition(event, rect);

    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      const raw = minValue + x * (maxValue - minValue);
      const next = quantize(raw, step, minValue);

      onValueChange(clamp(next, minValue, maxValue));
    });
  };

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (isDisabled) return;

    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    setIsDragging(true);
    handleMove(event);
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      handleMove(event);
    }
  };

  const handleLostPointerCapture = () => {
    setIsDragging(false);
    cancelAnimationFrame(rafRef.current);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (isDisabled) return;

    const large = step * 10;
    let next: number | null = null;

    switch (event.key) {
      case 'ArrowLeft':
      case 'ArrowDown':
        next = value - (event.shiftKey ? large : step);
        break;
      case 'ArrowRight':
      case 'ArrowUp':
        next = value + (event.shiftKey ? large : step);
        break;
      case 'PageDown':
        next = value - large;
        break;
      case 'PageUp':
        next = value + large;
        break;
      case 'Home':
        next = minValue;
        break;
      case 'End':
        next = maxValue;
        break;
      default:
        return;
    }

    event.preventDefault();
    onValueChange(clamp(quantize(next, step), minValue, maxValue));
  };

  const percentage = clamp(((value - minValue) / (maxValue - minValue)) * 100, 0, 100);

  return (
    <div className={cn('flex items-center gap-2', classNames?.root)} data-testid="GradientSlider">
      {startContent}
      <div
        ref={trackRef}
        aria-disabled={isDisabled || undefined}
        className={cn(trackClassName, classNames?.track)}
        onLostPointerCapture={handleLostPointerCapture}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        style={{ background: gradient, touchAction: 'none' }}
      >
        <div
          ref={thumbRef}
          aria-disabled={isDisabled || undefined}
          aria-label={ariaLabel}
          aria-valuemax={maxValue}
          aria-valuemin={minValue}
          aria-valuenow={value}
          className={cn(thumbClassName, isDragging && thumbPressedClassName, classNames?.thumb)}
          onKeyDown={handleKeyDown}
          role="slider"
          style={{ left: `calc(${percentage}% - ${percentage * 0.2}px)` }}
          tabIndex={isDisabled ? -1 : 0}
        />
      </div>
      {endContent}
    </div>
  );
}
