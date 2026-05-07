import { useCallback, useRef } from 'react';

import { KEYBOARD_IDLE_MS } from '~/constants';

const ATTR = 'data-interacting';

function isInteractiveTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;

  return target.matches('[role="slider"], input');
}

/**
 * Manages `data-interacting="true"` on a root element via event delegation.
 * Host apps observe the attribute to pause side effects (URL sync, autosave)
 * while the user is actively interacting with a descendant.
 *
 * Pointer: explicit begin (pointerdown) / end (pointerup, pointercancel).
 * Keyboard: set on keydown, cleared after a short idle or when focus leaves.
 * Pointer and keyboard are tracked independently — a drag's implicit focus
 * on the thumb does not keep the signal held after release.
 *
 * Cleanup is tracked via a closure ref so detach disposes listeners under
 * both React 19 (cleanup-return) and React <19 (null-call) ref semantics.
 */
export default function useInteractionAttribute() {
  const cleanupRef = useRef<(() => void) | null>(null);

  return useCallback((node: HTMLDivElement | null) => {
    cleanupRef.current?.();
    cleanupRef.current = null;

    if (!node) return undefined;

    let pointerActive = false;
    let keyboardTimer: ReturnType<typeof setTimeout> | null = null;

    const setFlag = (on: boolean) => {
      if (on) {
        node.setAttribute(ATTR, 'true');
      } else {
        node.removeAttribute(ATTR);
      }
    };

    const clearKeyboardTimer = () => {
      if (keyboardTimer !== null) {
        clearTimeout(keyboardTimer);
        keyboardTimer = null;
      }
    };

    const handlePointerDown = () => {
      pointerActive = true;
      clearKeyboardTimer();
      setFlag(true);
    };

    const handlePointerEnd = () => {
      pointerActive = false;
      setFlag(false);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (pointerActive || !isInteractiveTarget(event.target)) return;

      clearKeyboardTimer();
      setFlag(true);
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      if (pointerActive || !isInteractiveTarget(event.target)) return;

      clearKeyboardTimer();
      keyboardTimer = setTimeout(() => {
        keyboardTimer = null;
        setFlag(false);
      }, KEYBOARD_IDLE_MS);
    };

    const handleFocusOut = (event: FocusEvent) => {
      const next = event.relatedTarget as Node | null;

      if (next && node.contains(next)) return;

      clearKeyboardTimer();

      if (!pointerActive) setFlag(false);
    };

    node.addEventListener('pointerdown', handlePointerDown);
    node.addEventListener('pointerup', handlePointerEnd);
    node.addEventListener('pointercancel', handlePointerEnd);
    node.addEventListener('keydown', handleKeyDown);
    node.addEventListener('keyup', handleKeyUp);
    node.addEventListener('focusout', handleFocusOut);

    const cleanup = () => {
      node.removeEventListener('pointerdown', handlePointerDown);
      node.removeEventListener('pointerup', handlePointerEnd);
      node.removeEventListener('pointercancel', handlePointerEnd);
      node.removeEventListener('keydown', handleKeyDown);
      node.removeEventListener('keyup', handleKeyUp);
      node.removeEventListener('focusout', handleFocusOut);
      clearKeyboardTimer();
      setFlag(false);
      cleanupRef.current = null;
    };

    cleanupRef.current = cleanup;

    return cleanup;
  }, []);
}
