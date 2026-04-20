import { type PointerEvent, useEffect, useMemo, useRef, useState } from 'react';

import { clamp, cn, relativePosition } from './modules/helpers';
import {
  lcToPointer,
  type OKLCHCanvasResult,
  pointerToLC,
  pointsToSmoothPath,
  renderOKLCHCanvas,
} from './modules/oklchCanvas';
import type { PanelClassNames } from './types';

const CANVAS_WIDTH = 256;
const CANVAS_HEIGHT = 128;

interface OKLCHPanelProps {
  /** OKLCH chroma as an absolute value (typical sRGB range: `[0, ~0.4]`). */
  chroma: number;
  /** Per-part className overrides (`root`, `thumb`). */
  classNames?: PanelClassNames;
  /** OKLCH hue in degrees `[0, 360)`. Drives the rendered panel's color space. */
  hue: number;
  /** OKLCH lightness as a float in `[0, 1]`. */
  lightness: number;
  /**
   * Called during drag with the new lightness (float `[0, 1]`) and chroma
   * (absolute value, clamped to the P3 gamut for the current hue).
   */
  onChange: (l: number, c: number) => void;
}

export default function OKLCHPanel(props: OKLCHPanelProps) {
  const { chroma, classNames, hue, lightness, onChange } = props;
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const renderRef = useRef<OKLCHCanvasResult>({ hsvHue: 0, srgbBoundary: [] });
  const [canvasResult, setCanvasResult] = useState<OKLCHCanvasResult>({
    hsvHue: 0,
    srgbBoundary: [],
  });

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) return;

    const result = renderOKLCHCanvas(canvas, CANVAS_WIDTH, CANVAS_HEIGHT, hue);

    renderRef.current = result;
    setCanvasResult(result);
  }, [hue]);

  const boundaryPath = useMemo(() => pointsToSmoothPath(canvasResult.srgbBoundary), [canvasResult]);

  const labelPosition = useMemo(() => {
    const points = canvasResult.srgbBoundary;

    if (points.length <= 2) return null;

    return points[points.length - 2];
  }, [canvasResult]);

  const rafRef = useRef(0);

  const handleMove = (event: PointerEvent) => {
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const { x, y } = relativePosition(event, rect);
    const { c, l } = pointerToLC(hue, x, y);

    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      onChange(clamp(l, 0, 1), Math.max(0, c));
    });
  };

  const handlePointerDown = (event: PointerEvent) => {
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    handleMove(event);
  };

  const handlePointerMove = (event: PointerEvent) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      handleMove(event);
    }
  };

  const thumb = lcToPointer(hue, lightness, chroma);

  return (
    <div
      ref={containerRef}
      className={cn('relative h-32 w-full cursor-crosshair overflow-hidden', classNames?.root)}
      data-testid="OKLCHPanel"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      style={{ touchAction: 'none' }}
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 size-full"
        height={CANVAS_HEIGHT}
        width={CANVAS_WIDTH}
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
              className="pointer-events-none absolute text-[12px] leading-none text-white/50 transition-transform"
              style={{
                left: `${labelPosition.x}%`,
                top: `${labelPosition.y}%`,
                transform: `translate(-${hue > 144 && hue < 230 ? '180' : '150'}%, -100%)`,
              }}
            >
              sRGB
            </span>
          )}
        </>
      )}
      <div
        className={cn(
          'pointer-events-none absolute size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-md',
          classNames?.thumb,
        )}
        style={{
          left: `${thumb.x}%`,
          top: `${thumb.y}%`,
        }}
      />
    </div>
  );
}
