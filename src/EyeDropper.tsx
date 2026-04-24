import type { ButtonHTMLAttributes, MouseEvent } from 'react';

import Button from './components/Button';
import EyeDropperIcon from './components/EyeDropperIcon';

interface EyeDropperProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'onChange' | 'children' | 'type'
> {
  /**
   * Called with the picked color as an `sRGB` hex string (e.g. `#aabbcc`) when
   * the user selects a color. Not called if the user dismisses the picker.
   */
  onChange: (color: string) => void;
}

interface EyeDropperWindow {
  EyeDropper: new () => { open: () => Promise<{ sRGBHex: string }> };
}

function isSupported(): boolean {
  return typeof window !== 'undefined' && 'EyeDropper' in window;
}

export default function EyeDropper(props: EyeDropperProps) {
  const { onChange, onClick, ...rest } = props;

  if (!isSupported()) {
    return null;
  }

  const handleClick = async (event: MouseEvent<HTMLButtonElement>) => {
    const dropper = new (window as unknown as EyeDropperWindow).EyeDropper();

    onClick?.(event);

    try {
      const result = await dropper.open();

      onChange(result.sRGBHex);
    } catch {
      // User dismissed the picker — no-op.
    }
  };

  return (
    <Button
      aria-label="Pick color from screen"
      data-testid="EyeDropper"
      onClick={handleClick}
      {...rest}
    >
      <EyeDropperIcon />
    </Button>
  );
}
