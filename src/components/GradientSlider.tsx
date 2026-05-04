import {
  type HTMLAttributes,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
  useEffect,
  useRef,
  useState,
} from 'react';

import useEmitLifecycle from '../hooks/useEmitLifecycle';
import useRafCommit from '../hooks/useRafCommit';
import { clamp, cn, quantize, relativePosition } from '../modules/helpers';
import type { GradientSliderClassNames } from '../types';

const DEFAULT_GRADIENT = 'linear-gradient(to right, black, white)';

interface GradientSliderProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  'aria-label' | 'onChange'
> {
  /**
   * Accessible label for the slider thumb.
   * @default 'Slider'
   */
  'aria-label'?: string;
  /** Per-part className overrides (`root`, `track`, `thumb`). */
  classNames?: GradientSliderClassNames;
  /** Content rendered to the right of the track (e.g. a `NumericInput`). */
  endContent?: ReactNode;
  /**
   * CSS `background` value painted on the track. Supports any valid `background`
   * shorthand, including layered backgrounds (comma-separated) — used by
   * `AlphaSlider` to combine a color gradient with a checkerboard tile.
   * @default 'linear-gradient(to right, black, white)'
   */
  gradient?: string;
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
  /**
   * Called with the new value on drag, click, or keyboard step.
   * @default noop
   */
  onChange?: (value: number) => void;
  /**
   * Called once when an interaction ends — pointer release, or 600 ms after the
   * last keyboard step (whichever applies). Receives the final value. Use to
   * commit expensive side effects (URL sync, autosave) only on release.
   */
  onChangeEnd?: (value: number) => void;
  /**
   * Called once when an interaction begins — `pointerdown` or first
   * value-changing keydown after idle. Receives the value at the start of the
   * interaction (useful for undo snapshots).
   */
  onChangeStart?: (value: number) => void;
  /** Content rendered to the left of the track (e.g. a channel letter label). */
  startContent?: ReactNode;
  /**
   * Step size used when quantizing drag/keyboard values. Arrow keys step by
   * `step`, `Shift`+arrow steps by `step * 10`.
   * @default 1
   */
  step?: number;
  /**
   * Current value as a number in `[minValue, maxValue]`.
   * @default 0
   */
  value?: number;
}

const trackClassName = cn(
  'relative h-3 w-full rounded-full cursor-pointer',
  'aria-disabled:cursor-not-allowed aria-disabled:opacity-50',
);

const thumbClassName = cn(
  'pointer-events-none absolute top-1/2 size-5 -translate-y-1/2',
  'rounded-full border-2 border-black dark:border-white bg-white dark:bg-black shadow-md',
  'transition-transform',
  'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-black dark:focus-visible:ring-white',
);

const thumbPressedClassName = 'ring-1 ring-black dark:ring-white';

export default function GradientSlider(props: GradientSliderProps) {
  const {
    'aria-label': ariaLabel = 'Slider',
    className,
    classNames,
    endContent,
    gradient = DEFAULT_GRADIENT,
    isDisabled,
    maxValue = 100,
    minValue = 0,
    onChange,
    onChangeEnd,
    onChangeStart,
    startContent,
    step = 1,
    style,
    value = 0,
    ...rest
  } = props;

  const trackRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  // Width of the thumb in pixels, divided by 100. Drives the inset-thumb math
  // in the `left` style below so the thumb stays inside the track at both ends
  // regardless of the consumer's size override.
  const [thumbOffset, setThumbOffset] = useState(0.2);

  const { emit, notifyBlur, notifyEnd, notifyKeyboardActivity, notifyStart } =
    useEmitLifecycle<number>({
      isDisabled,
      onChange,
      onChangeEnd,
      onChangeStart,
      value,
    });
  const { flush, schedule } = useRafCommit<number>(emit);

  useEffect(() => {
    const thumb = thumbRef.current;

    if (!thumb) return undefined;

    const update = () => {
      const width = thumb.offsetWidth;

      if (width > 0) setThumbOffset(width / 100);
    };

    update();

    if (typeof ResizeObserver === 'undefined') {
      return undefined;
    }

    const observer = new ResizeObserver(update);

    observer.observe(thumb);

    return () => observer.disconnect();
  }, []);

  const handleMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!trackRef.current || isDisabled) return;

    const rect = trackRef.current.getBoundingClientRect();
    const { x } = relativePosition(event, rect);
    const raw = minValue + x * (maxValue - minValue);
    const next = clamp(quantize(raw, step, minValue), minValue, maxValue);

    schedule(next);
  };

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (isDisabled) return;

    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    notifyStart();
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
    flush();
    notifyEnd();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (isDisabled || isDragging) return;

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

    const clamped = clamp(quantize(next, step), minValue, maxValue);

    if (clamped === value) return;

    notifyKeyboardActivity();
    emit(clamped);
  };

  const handleBlur = () => {
    notifyBlur();
  };

  const percentage = clamp(((value - minValue) / (maxValue - minValue)) * 100, 0, 100);
  const left = `calc(${percentage.toFixed(3)}% - ${(percentage * thumbOffset).toFixed(3)}px)`;

  return (
    <div
      className={cn('flex items-center gap-2', className, classNames?.root)}
      data-testid="GradientSlider"
      style={style}
      {...rest}
    >
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
          aria-orientation="horizontal"
          aria-valuemax={maxValue}
          aria-valuemin={minValue}
          aria-valuenow={value}
          className={cn(thumbClassName, isDragging && thumbPressedClassName, classNames?.thumb)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          role="slider"
          style={{ left }}
          tabIndex={isDisabled ? -1 : 0}
        />
      </div>
      {endContent}
    </div>
  );
}
