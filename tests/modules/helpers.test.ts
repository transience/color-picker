import type { PointerEvent as ReactPointerEvent } from 'react';

import { clamp, quantize, relativePosition } from '~/modules/helpers';

describe('helpers', () => {
  describe('clamp', () => {
    it('returns value unchanged when inside range', () => {
      expect(clamp(5, 0, 10)).toBe(5);
    });

    it('clamps to min when below', () => {
      expect(clamp(-3, 0, 10)).toBe(0);
    });

    it('clamps to max when above', () => {
      expect(clamp(11, 0, 10)).toBe(10);
    });

    it('accepts the min boundary', () => {
      expect(clamp(0, 0, 10)).toBe(0);
    });

    it('accepts the max boundary', () => {
      expect(clamp(10, 0, 10)).toBe(10);
    });

    it('handles floats', () => {
      expect(clamp(0.55, 0, 1)).toBe(0.55);
      expect(clamp(1.5, 0, 1)).toBe(1);
    });
  });

  describe('quantize', () => {
    it('strips float noise from subtraction with fractional step', () => {
      expect(quantize(300.48 - 0.001, 0.001)).toBe(300.479);
    });

    it('strips float noise from 0.1 + 0.2', () => {
      expect(quantize(0.1 + 0.2, 0.1)).toBe(0.3);
    });

    it('returns value unchanged when step is 0', () => {
      expect(quantize(1.23456, 0)).toBe(1.23456);
    });

    it('snaps to nearest grid point using origin', () => {
      expect(quantize(10.23, 0.5, 10)).toBe(10);
      expect(quantize(10.3, 0.5, 10)).toBe(10.5);
    });

    it('snaps to integer step', () => {
      expect(quantize(179.7, 1)).toBe(180);
    });
  });

  describe('relativePosition', () => {
    const rect = { left: 10, top: 20, width: 100, height: 50 } as DOMRect;

    const buildEvent = (clientX: number, clientY: number) =>
      ({ clientX, clientY }) as ReactPointerEvent;

    it('returns 0,0 at the top-left corner', () => {
      expect(relativePosition(buildEvent(10, 20), rect)).toEqual({ x: 0, y: 0 });
    });

    it('returns 1,1 at the bottom-right corner', () => {
      expect(relativePosition(buildEvent(110, 70), rect)).toEqual({ x: 1, y: 1 });
    });

    it('returns 0.5,0.5 at the center', () => {
      expect(relativePosition(buildEvent(60, 45), rect)).toEqual({ x: 0.5, y: 0.5 });
    });

    it('clamps values below the rect to 0', () => {
      expect(relativePosition(buildEvent(-100, -100), rect)).toEqual({ x: 0, y: 0 });
    });

    it('clamps values beyond the rect to 1', () => {
      expect(relativePosition(buildEvent(1000, 1000), rect)).toEqual({ x: 1, y: 1 });
    });
  });
});
