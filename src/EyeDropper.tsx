import type { ButtonHTMLAttributes, MouseEvent } from 'react';

import Button from './components/Button';
import EyeDropperIcon from './components/EyeDropperIcon';
import { DEFAULT_LABELS } from './constants';

interface EyeDropperProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'onChange' | 'children' | 'type'
> {
  /**
   * Accessible label for the trigger button.
   * @default 'Pick color from screen'
   */
  'aria-label'?: string;
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
  const { 'aria-label': ariaLabel = DEFAULT_LABELS.eyeDropper, onChange, onClick, ...rest } = props;

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
    <Button aria-label={ariaLabel} data-testid="EyeDropper" onClick={handleClick} {...rest}>
      <EyeDropperIcon />
    </Button>
  );
}
