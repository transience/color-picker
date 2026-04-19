import { type PointerEvent, useRef } from 'react';

import { cn, relativePosition } from './modules/helpers';
import type { PanelClassNames } from './types';

interface SaturationPanelProps {
  /** Per-part className overrides (`root`, `thumb`). */
  classNames?: PanelClassNames;
  /** HSV hue in degrees `[0, 360)`. Sets the color painted across the panel. */
  hue: number;
  /**
   * Called during drag with the new saturation and value, both as floats in
   * `[0, 1]`.
   */
  onChange: (s: number, v: number) => void;
  /** HSV saturation as a float in `[0, 1]` — drives the thumb's X position. */
  saturation: number;
  /** HSV value (brightness) as a float in `[0, 1]` — drives the thumb's Y position. */
  value: number;
}

export default function SaturationPanel(props: SaturationPanelProps) {
  const { classNames, hue, onChange, saturation, value } = props;
  const containerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef(0);

  const handleMove = (event: PointerEvent) => {
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const { x, y } = relativePosition(event, rect);

    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      onChange(x, 1 - y);
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

  return (
    <div
      ref={containerRef}
      className={cn('relative h-32 w-full cursor-crosshair overflow-hidden', classNames?.root)}
      data-testid="SaturationPanel"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      style={{
        backgroundColor: `hsl(${hue}, 100%, 50%)`,
        touchAction: 'none',
      }}
    >
      <div className="absolute inset-0 bg-linear-to-r from-white to-transparent" />
      <div className="absolute inset-0 bg-linear-to-b from-transparent to-black" />
      <div
        className={cn(
          'pointer-events-none absolute size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-md',
          classNames?.thumb,
        )}
        style={{
          left: `${saturation * 100}%`,
          top: `${(1 - value) * 100}%`,
        }}
      />
    </div>
  );
}
