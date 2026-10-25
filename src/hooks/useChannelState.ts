import { useCallback, useState } from 'react';

interface ChannelState<T> {
  channels: T;
  color: string;
}

/**
 * Local channel values derived from a CSS `color` string. The string can't
 * carry everything the controls show (fractions lost to hex, hue lost at
 * zero chroma/saturation), so `derive` receives the previous values to keep
 * what the new string doesn't express.
 *
 * Re-derives during render (not in an effect) so the controls never paint
 * one frame behind the incoming color.
 */
export default function useChannelState<T>(
  color: string,
  derive: (color: string, previous?: T) => T,
): [T, (channels: T) => void] {
  const [state, setState] = useState<ChannelState<T>>(() => ({ color, channels: derive(color) }));
  let current = state;

  if (state.color !== color) {
    current = { color, channels: derive(color, state.channels) };
    setState(current);
  }

  const setChannels = useCallback((channels: T) => {
    setState(previous => ({ ...previous, channels }));
  }, []);

  return [current.channels, setChannels];
}
