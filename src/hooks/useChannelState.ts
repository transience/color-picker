import { useCallback, useState } from 'react';

interface ChannelState<T> {
  channels: T;
  color: string;
  emitted?: string;
}

/**
 * Local channel values derived from a CSS `color` string. The string can't
 * carry everything the controls show (fractions lost to hex, hue lost at
 * zero chroma/saturation), so `derive` receives the previous values to keep
 * what the new string doesn't express. `isEcho` tells it the incoming color
 * is the string last passed to `setChannels`, i.e. our own emission.
 *
 * Re-derives during render (not in an effect) so the controls never paint
 * one frame behind the incoming color.
 */
export default function useChannelState<T>(
  color: string,
  derive: (color: string, previous?: T, isEcho?: boolean) => T,
): [T, (channels: T, emitted?: string) => void] {
  const [state, setState] = useState<ChannelState<T>>(() => ({ color, channels: derive(color) }));
  let current = state;

  if (state.color !== color) {
    current = {
      color,
      channels: derive(color, state.channels, color === state.emitted),
      emitted: state.emitted,
    };
    setState(current);
  }

  const setChannels = useCallback((channels: T, emitted?: string) => {
    setState(previous => ({ ...previous, channels, emitted: emitted ?? previous.emitted }));
  }, []);

  return [current.channels, setChannels];
}
