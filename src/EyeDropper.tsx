import Button from './components/Button';
import EyeDropperIcon from './components/EyeDropperIcon';

interface EyeDropperProps {
  /** Extra classes appended to the trigger button. */
  className?: string;
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
  const { className, onChange } = props;

  if (!isSupported()) {
    return null;
  }

  const handleClick = async () => {
    const dropper = new (window as unknown as EyeDropperWindow).EyeDropper();

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
      className={className}
      data-testid="EyeDropper"
      onClick={handleClick}
    >
      <EyeDropperIcon />
    </Button>
  );
}
