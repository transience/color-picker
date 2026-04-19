import WarningIcon from './components/WarningIcon';
import { cn } from './modules/helpers';

interface GamutWarningProps {
  /** Extra classes appended to the icon wrapper. */
  className?: string;
}

const TOOLTIP = 'This color is displayed in a narrow sRGB format (hex/rgb/hsl) and may be clipped.';

export default function GamutWarning(props: GamutWarningProps) {
  const { className } = props;

  return (
    <span
      className={cn('inline-flex shrink-0 text-orange-400', className)}
      data-testid="GamutWarning"
      title={TOOLTIP}
    >
      <WarningIcon />
    </span>
  );
}
