import {
  Children,
  cloneElement,
  type FocusEvent,
  type MouseEvent,
  type PointerEvent,
  type ReactElement,
  type ReactNode,
  type Ref,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';

import useId from '~/hooks/useId';
import { clamp, cn } from '~/modules/helpers';

interface Coords {
  left: number;
  top: number;
}

interface FloaterProps {
  /** Single element with forwarded ref. Receives merged handlers + ref via cloneElement. */
  children: ReactElement;
  /** Floating panel content. */
  content: ReactNode;
  /** Classes merged onto the floating panel. Caller fully styles padding/bg/width. */
  contentClassName?: string;
  /** @default 'hover' */
  eventType?: 'hover' | 'click';
  /** Click-mode only; required when `open` is set. */
  onOpenChange?: (open: boolean) => void;
  /** Click-mode only. Omit for uncontrolled. Hover-mode ignores. */
  open?: boolean;
  /** @default 'top' */
  placement?: FloaterPlacement;
}

export type FloaterPlacement =
  | 'bottom'
  | 'bottom-start'
  | 'bottom-end'
  | 'top'
  | 'top-start'
  | 'top-end';

const GAP = 4;
const EDGE_MARGIN = 4;

function chain<E>(...handlers: Array<((event: E) => void) | undefined>) {
  return (event: E) => {
    for (const handler of handlers) handler?.(event);
  };
}

function computeCoords(
  placement: FloaterPlacement,
  triggerRect: DOMRect,
  contentRect: DOMRect,
): Coords {
  const isTop = placement.startsWith('top');
  const top = isTop ? triggerRect.top - contentRect.height - GAP : triggerRect.bottom + GAP;

  const alignment = getAlignment(placement);
  let left: number;

  if (alignment === '-start') {
    left = triggerRect.left;
  } else if (alignment === '-end') {
    left = triggerRect.right - contentRect.width;
  } else {
    left = triggerRect.left + (triggerRect.width - contentRect.width) / 2;
  }

  const maxLeft = window.innerWidth - contentRect.width - EDGE_MARGIN;
  const maxTop = window.innerHeight - contentRect.height - EDGE_MARGIN;

  return {
    left: clamp(left, EDGE_MARGIN, Math.max(maxLeft, EDGE_MARGIN)),
    top: clamp(top, EDGE_MARGIN, Math.max(maxTop, EDGE_MARGIN)),
  };
}

function getAlignment(placement: FloaterPlacement): '' | '-end' | '-start' {
  if (placement.endsWith('-start')) return '-start';
  if (placement.endsWith('-end')) return '-end';

  return '';
}

function resolvePlacement(
  preferred: FloaterPlacement,
  triggerRect: DOMRect,
  contentRect: DOMRect,
): FloaterPlacement {
  const fitsTop = triggerRect.top - GAP >= contentRect.height;
  const fitsBottom = window.innerHeight - triggerRect.bottom - GAP >= contentRect.height;
  const isTop = preferred.startsWith('top');
  const alignment = getAlignment(preferred);

  if (isTop && !fitsTop && fitsBottom) return `bottom${alignment}` as FloaterPlacement;
  if (!isTop && !fitsBottom && fitsTop) return `top${alignment}` as FloaterPlacement;

  return preferred;
}

function setRef<T>(target: Ref<T> | undefined, node: T | null) {
  if (typeof target === 'function') {
    target(node);
  } else if (target) {
    // eslint-disable-next-line no-param-reassign
    (target as { current: T | null }).current = node;
  }
}

export default function Floater(props: FloaterProps) {
  const {
    children,
    content,
    contentClassName,
    eventType = 'hover',
    onOpenChange,
    open: openProp,
    placement = 'top',
  } = props;
  const isControlled = eventType === 'click' && openProp !== undefined;
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const isOpen = isControlled ? openProp : uncontrolledOpen;
  const [coords, setCoords] = useState<Coords | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [hoverCapable, setHoverCapable] = useState(true);
  const internalTriggerRef = useRef<HTMLElement | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const id = useId('floater');
  const useHover = eventType === 'hover' && hoverCapable;

  const setOpen = useCallback(
    (next: boolean | ((current: boolean) => boolean)) => {
      const resolved = typeof next === 'function' ? next(isOpen) : next;

      if (!isControlled) {
        setUncontrolledOpen(resolved);
      }

      onOpenChange?.(resolved);
    },
    [isControlled, isOpen, onOpenChange],
  );

  const reposition = useCallback(() => {
    if (!internalTriggerRef.current || !contentRef.current) {
      return;
    }

    const triggerRect = internalTriggerRef.current.getBoundingClientRect();
    const contentRect = contentRef.current.getBoundingClientRect();
    const resolved = resolvePlacement(placement, triggerRect, contentRect);

    setCoords(computeCoords(resolved, triggerRect, contentRect));
  }, [placement]);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return undefined;
    }

    const mql = window.matchMedia('(hover: hover) and (pointer: fine)');

    setHoverCapable(mql.matches);

    const handleChange = (event: MediaQueryListEvent) => setHoverCapable(event.matches);

    mql.addEventListener('change', handleChange);

    return () => mql.removeEventListener('change', handleChange);
  }, []);

  useLayoutEffect(() => {
    if (!isOpen) {
      setCoords(null);

      return;
    }

    reposition();
  }, [isOpen, reposition]);

  useEffect(() => {
    if (!isOpen) {
      setIsVisible(false);

      return undefined;
    }

    const frame = requestAnimationFrame(() => setIsVisible(true));

    return () => cancelAnimationFrame(frame);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    window.addEventListener('scroll', reposition, { capture: true, passive: true });
    window.addEventListener('resize', reposition);

    return () => {
      window.removeEventListener('scroll', reposition, { capture: true });
      window.removeEventListener('resize', reposition);
    };
  }, [isOpen, reposition]);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const handlePointerDown = (event: Event) => {
      const target = event.target as Node;

      if (internalTriggerRef.current?.contains(target) || contentRef.current?.contains(target)) {
        return;
      }

      setOpen(false);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, setOpen]);

  const child = Children.only(children) as ReactElement<{
    'aria-describedby'?: string;
    onBlur?: (event: FocusEvent) => void;
    onClick?: (event: MouseEvent) => void;
    onFocus?: (event: FocusEvent) => void;
    onPointerEnter?: (event: PointerEvent) => void;
    onPointerLeave?: (event: PointerEvent) => void;
    ref?: Ref<HTMLElement>;
  }>;
  // React 19 puts ref on props; React 18 and below put it on the element.
  // Only fall through to element.ref when props.ref is absent — accessing
  // element.ref on React 19 logs a deprecation warning.
  const propsRef = child.props.ref;
  const childRef =
    propsRef !== undefined ? propsRef : (child as unknown as { ref?: Ref<HTMLElement> }).ref;

  const mergedRef = useCallback(
    (node: HTMLElement | null) => {
      internalTriggerRef.current = node;
      setRef(childRef, node);
    },
    [childRef],
  );

  const triggerProps: Record<string, unknown> = {
    ref: mergedRef,
    onClick: chain(child.props.onClick, () => setOpen(current => !current)),
    'aria-describedby': isOpen
      ? (child.props['aria-describedby'] ?? id)
      : child.props['aria-describedby'],
  };

  if (useHover) {
    triggerProps.onPointerEnter = chain(child.props.onPointerEnter, event => {
      if (event.pointerType === 'mouse') {
        setOpen(true);
      }
    });
    triggerProps.onPointerLeave = chain(child.props.onPointerLeave, event => {
      if (event.pointerType === 'mouse') {
        setOpen(false);
      }
    });
    triggerProps.onFocus = chain(child.props.onFocus, () => setOpen(true));
    triggerProps.onBlur = chain(child.props.onBlur, () => setOpen(false));
  }

  return (
    <>
      {cloneElement(child, triggerProps)}
      {isOpen &&
        createPortal(
          <div
            ref={contentRef}
            className={cn(
              'fixed z-50 w-max',
              'transition-opacity duration-150',
              coords && isVisible ? 'opacity-100' : 'opacity-0',
              contentClassName,
            )}
            data-color-picker-portal={id}
            data-state={coords && isVisible ? 'open' : 'closed'}
            data-testid="Floater"
            id={id}
            style={{ left: coords?.left ?? 0, top: coords?.top ?? 0 }}
          >
            {content}
          </div>,
          document.body,
        )}
    </>
  );
}
