import { useRef } from 'react';

export default function useId(prefix: string): string {
  const idRef = useRef<string | null>(null);

  idRef.current ??=
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? `${prefix}-${crypto.randomUUID().slice(0, 8)}`
      : `${prefix}-${Math.random().toString(36).slice(2, 10)}`;

  return idRef.current;
}
