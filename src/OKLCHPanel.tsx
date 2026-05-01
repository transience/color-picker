import {
  type HTMLAttributes,
  type PointerEvent,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { parseCSS } from 'colorizr';

import { DEFAULT_COLOR, panelClasses } from './constants';
import useInteractionLifecycle from './hooks/useInteractionLifecycle';
import { clamp, cn, relativePosition } from './modules/helpers';
import {
  lcToPointer,
  type OKLCHCanvasResult,
  pointerToLC,
  pointsToPath,
  renderOKLCHCanvas,
} from './modules/oklchCanvas';
import type { PanelClassNames } from './types';

const CANVAS_WIDTH = 256;
const CANVAS_HEIGHT = 128;

const DEFAULTS = parseCSS(DEFAULT_COLOR, 'oklch');

interface OKLCHPanelProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onChange'> {
  /**
   * OKLCH chroma as an absolute value (typical sRGB range: `[0, ~0.4]`).
   * @default DEFAULT_COLOR's OKLCH chroma
   */
  chroma?: number;
  /** Per-part className overrides (`root`, `thumb`). */
  classNames?: PanelClassNames;
  /**
   * OKLCH hue in degrees `[0, 360)`. Drives the rendered panel's color space.
   * @default DEFAULT_COLOR's OKLCH hue
   */
  hue?: number;
  /**
   * OKLCH lightness as a float in `[0, 1]`.
   * @default DEFAULT_COLOR's OKLCH lightness
   */
  lightness?: number;
  /**
   * Called during drag with the new lightness (float `[0, 1]`) and chroma
   * (absolute value, clamped to the P3 gamut for the current hue).
   */
  onChange?: (l: number, c: number) => void;
  /**
   * Called once when an interaction ends (pointer release). Receives the
   * current lightness and chroma.
   */
  onChangeEnd?: (l: number, c: number) => void;
  /**
   * Called once when an interaction begins (`pointerdown`). Receives the
   * lightness and chroma at the start of the interaction.
   */
  onChangeStart?: (l: number, c: number) => void;
}

export default function OKLCHPanel(props: OKLCHPanelProps) {
  const {
    chroma = DEFAULTS.c,
    className,
    classNames,
    hue = DEFAULTS.h,
    lightness = DEFAULTS.l,
    onChange,
    onChangeEnd,
    onChangeStart,
    style,
    ...rest
  } = props;
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const renderRef = useRef<OKLCHCanvasResult>({ hsvHue: 0, srgbBoundary: [] });
  const [canvasResult, setCanvasResult] = useState<OKLCHCanvasResult>({
    hsvHue: 0,
    srgbBoundary: [],
  });
  const [width, setWidth] = useState(CANVAS_WIDTH);

  useLayoutEffect(() => {
    const container = containerRef.current;

    if (!container) return undefined;
    if (typeof ResizeObserver === 'undefined') return undefined;

    const observer = new ResizeObserver(entries => {
      const next = Math.round(entries[0].contentRect.width);

      if (next > 0) setWidth(next);
    });

    observer.observe(container);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) return;

    const result = renderOKLCHCanvas(canvas, width, CANVAS_HEIGHT, hue);

    renderRef.current = result;
    setCanvasResult(result);
  }, [hue, width]);

  const boundaryPath = useMemo(() => pointsToPath(canvasResult.srgbBoundary), [canvasResult]);

  const labelPosition = useMemo(() => {
    const points = canvasResult.srgbBoundary;

    if (points.length <= 2) return null;

    // Anchor the label at the left-most boundary point in the panel's lower band.
    // Skipping higher rows avoids the curve's vertical segment at the purple
    // cusp; picking the left-most avoids the synthetic right-edge fill points
    // that the scanner adds when the default epsilon misses a row.
    const bandMinY = 85;
    let anchor: { x: number; y: number } | null = null;

    for (const point of points) {
      if (point.y < bandMinY) continue;
      if (!anchor || point.x < anchor.x) anchor = point;
    }

    return anchor;
  }, [canvasResult]);

  const rafRef = useRef(0);
  const valuesRef = useRef({ l: lightness, c: chroma });

  valuesRef.current = { l: lightness, c: chroma };

  const lifecycle = useInteractionLifecycle({
    onStart: () => onChangeStart?.(valuesRef.current.l, valuesRef.current.c),
    onEnd: () => onChangeEnd?.(valuesRef.current.l, valuesRef.current.c),
  });

  const handleMove = (event: PointerEvent) => {
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const { x, y } = relativePosition(event, rect);
    const { c, l } = pointerToLC(hue, x, y);

    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      onChange?.(clamp(l, 0, 1), Math.max(0, c));
    });
  };

  const handlePointerDown = (event: PointerEvent) => {
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    lifecycle.notifyPointerStart();
    handleMove(event);
  };

  const handlePointerMove = (event: PointerEvent) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      handleMove(event);
    }
  };

  const handleLostPointerCapture = () => {
    cancelAnimationFrame(rafRef.current);
    lifecycle.notifyPointerEnd();
  };

  const thumb = lcToPointer(hue, lightness, chroma);

  return (
    <div
      ref={containerRef}
      className={cn(panelClasses.root, className, classNames?.root)}
      data-testid="OKLCHPanel"
      onLostPointerCapture={handleLostPointerCapture}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      style={{ ...style, touchAction: 'none' }}
      {...rest}
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 size-full"
        height={CANVAS_HEIGHT}
        width={width}
      />
      {boundaryPath && (
        <>
          <svg
            className="pointer-events-none absolute inset-0 size-full"
            preserveAspectRatio="none"
            viewBox="0 0 100 100"
          >
            <path
              d={boundaryPath}
              fill="none"
              stroke="rgba(255, 255, 255, 0.5)"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.5"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
          {labelPosition && (
            <span
              className="pointer-events-none absolute text-sm leading-none text-white/50"
              style={{
                right: `${Math.round(100 - labelPosition.x)}%`,
                bottom: 4,
                marginRight: 10,
              }}
            >
              sRGB
            </span>
          )}
        </>
      )}
      <div
        className={cn(panelClasses.thumb, classNames?.thumb)}
        style={{
          left: `${thumb.x}%`,
          top: `${thumb.y}%`,
        }}
      />
    </div>
  );
}
