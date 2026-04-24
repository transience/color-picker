import { type HTMLAttributes, type PointerEvent, useRef } from 'react';

import { panelClasses } from './constants';
import { cn, relativePosition } from './modules/helpers';
import type { PanelClassNames } from './types';

interface SaturationPanelProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onChange'> {
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
  const { className, classNames, hue, onChange, saturation, style, value, ...rest } = props;
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
      className={cn(panelClasses.root, className, classNames?.root)}
      data-testid="SaturationPanel"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      style={{
        background: `linear-gradient(to bottom, transparent, #000), linear-gradient(to right, #fff, transparent), hsl(${hue}, 100%, 50%)`,
        ...style,
        touchAction: 'none',
      }}
      {...rest}
    >
      <div
        className={cn(panelClasses.thumb, classNames?.thumb)}
        style={{
          left: `${saturation * 100}%`,
          top: `${(1 - value) * 100}%`,
        }}
      />
    </div>
  );
}
