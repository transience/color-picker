import EyeDropperIcon from './components/EyeDropperIcon';
import { cn } from './modules/helpers';

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
    <button
      aria-label="Pick color from screen"
      className={cn(
        'flex size-8 shrink-0 items-center justify-center rounded-md text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 focus-visible:outline-2 focus-visible:outline-blue-500',
        className,
      )}
      data-testid="EyeDropper"
      onClick={handleClick}
      type="button"
    >
      <EyeDropperIcon />
    </button>
  );
}
