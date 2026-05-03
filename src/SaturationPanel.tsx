import { type HTMLAttributes, type PointerEvent, useRef } from 'react';

import { DEFAULT_COLOR, panelClasses } from './constants';
import useEmitLifecycle from './hooks/useEmitLifecycle';
import useRafCommit from './hooks/useRafCommit';
import { colorToHsv } from './modules/colorSpace';
import { cn, relativePosition } from './modules/helpers';
import type { PanelClassNames } from './types';

const DEFAULTS = colorToHsv(DEFAULT_COLOR);

interface SaturationPanelProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onChange'> {
  /** Per-part className overrides (`root`, `thumb`). */
  classNames?: PanelClassNames;
  /**
   * HSV hue in degrees `[0, 360)`. Sets the color painted across the panel.
   * @default DEFAULT_COLOR's HSV hue
   */
  hue?: number;
  /**
   * Called during drag with the new saturation and value, both as floats in
   * `[0, 1]`.
   */
  onChange?: (s: number, v: number) => void;
  /**
   * Called once when an interaction ends (pointer release). Receives the
   * current saturation and value.
   */
  onChangeEnd?: (s: number, v: number) => void;
  /**
   * Called once when an interaction begins (`pointerdown`). Receives the
   * saturation and value at the start of the interaction.
   */
  onChangeStart?: (s: number, v: number) => void;
  /**
   * HSV saturation as a float in `[0, 1]` — drives the thumb's X position.
   * @default DEFAULT_COLOR's HSV saturation
   */
  saturation?: number;
  /**
   * HSV value (brightness) as a float in `[0, 1]` — drives the thumb's Y position.
   * @default DEFAULT_COLOR's HSV value
   */
  value?: number;
}

interface SV {
  s: number;
  v: number;
}

const equalsSV = (a: SV, b: SV) => a.s === b.s && a.v === b.v;

export default function SaturationPanel(props: SaturationPanelProps) {
  const {
    className,
    classNames,
    hue = DEFAULTS.h,
    onChange,
    onChangeEnd,
    onChangeStart,
    saturation = DEFAULTS.s,
    style,
    value = DEFAULTS.v,
    ...rest
  } = props;
  const containerRef = useRef<HTMLDivElement>(null);

  const { emit, notifyEnd, notifyStart } = useEmitLifecycle<SV>({
    equals: equalsSV,
    onChange: next => onChange?.(next.s, next.v),
    onChangeEnd: next => onChangeEnd?.(next.s, next.v),
    onChangeStart: next => onChangeStart?.(next.s, next.v),
    value: { s: saturation, v: value },
  });
  const { flush, schedule } = useRafCommit<SV>(emit);

  const handleMove = (event: PointerEvent) => {
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const { x, y } = relativePosition(event, rect);

    schedule({ s: x, v: 1 - y });
  };

  const handlePointerDown = (event: PointerEvent) => {
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    notifyStart();
    handleMove(event);
  };

  const handlePointerMove = (event: PointerEvent) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      handleMove(event);
    }
  };

  const handleLostPointerCapture = () => {
    flush();
    notifyEnd();
  };

  return (
    <div
      ref={containerRef}
      className={cn(panelClasses.root, className, classNames?.root)}
      data-testid="SaturationPanel"
      onLostPointerCapture={handleLostPointerCapture}
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
