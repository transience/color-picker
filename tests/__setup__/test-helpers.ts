import { fireEvent } from '@testing-library/react';
import type { MockInstance } from 'vitest';

type Rect = { height: number; left?: number; top?: number; width: number };

export interface MockedCanvasContext {
  context: CanvasRenderingContext2D;
  fillRect: ReturnType<typeof vi.fn>;
  restore: () => void;
  spy: MockInstance;
}

/**
 * Pointer drag helper. Ensures `hasPointerCapture` returns true between the
 * down and up events so the component's move handler doesn't short-circuit.
 */
export function firePointerDrag(
  element: Element,
  points: Array<{ x: number; y: number }>,
  options: { pointerId?: number } = {},
): void {
  const pointerId = options.pointerId ?? 1;
  const originalHasCapture = element.hasPointerCapture;

  element.hasPointerCapture = () => true;

  const [first, ...rest] = points;

  fireEvent.pointerDown(element, { clientX: first.x, clientY: first.y, pointerId });

  for (const point of rest) {
    fireEvent.pointerMove(element, { clientX: point.x, clientY: point.y, pointerId });
  }

  const last = rest.at(-1) ?? first;

  fireEvent.pointerUp(element, { clientX: last.x, clientY: last.y, pointerId });

  element.hasPointerCapture = originalHasCapture;
}

/**
 * Mock a CanvasRenderingContext2D for OKLCHPanel-style tests. Returns a spy
 * that tracks whether the canvas was rendered and all fillRect calls.
 */
export function mockCanvasContext(): MockedCanvasContext {
  const fillRect = vi.fn();
  const clearRect = vi.fn();
  const putImageData = vi.fn();
  const drawImage = vi.fn();
  const context = {
    fillRect,
    clearRect,
    putImageData,
    drawImage,
    fillStyle: '',
    createImageData: vi.fn(() => ({ data: new Uint8ClampedArray(4) })),
    getImageData: vi.fn(() => ({ data: new Uint8ClampedArray(4) })),
  } as unknown as CanvasRenderingContext2D;

  const spy = vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(context);

  return {
    context,
    fillRect,
    spy,
    restore: () => spy.mockRestore(),
  };
}

/**
 * Replace requestAnimationFrame with a synchronous executor for the duration
 * of a test. Returns a cleanup function.
 */
export function mockRAFSync(): () => void {
  const original = globalThis.requestAnimationFrame;

  globalThis.requestAnimationFrame = (callback: FrameRequestCallback) => {
    callback(0);

    return 0;
  };

  return () => {
    globalThis.requestAnimationFrame = original;
  };
}

/**
 * Force `element.getBoundingClientRect()` to return a fixed rect so pointer
 * coordinates produce deterministic values.
 */
export function mockRect(element: Element, rect: Rect): void {
  const { height, left = 0, top = 0, width } = rect;

  element.getBoundingClientRect = () =>
    ({
      bottom: top + height,
      height,
      left,
      right: left + width,
      top,
      width,
      x: left,
      y: top,
      toJSON: () => ({}),
    }) as DOMRect;
}
