import { type HTMLAttributes } from 'react';

import { cn } from '~/modules/helpers';

import useInteractionAttribute from '../hooks/useInteractionAttribute';
import type {
  ChannelsConfig,
  ColorMode,
  GradientSliderClassNames,
  NumericInputClassNames,
} from '../types';

import HSLSliders from './HSLSliders';
import OKLCHSliders from './OKLCHSliders';
import RGBSliders from './RGBSliders';

interface ChannelSlidersProps extends Omit<HTMLAttributes<HTMLDivElement>, 'color'> {
  /**
   * Per-channel overrides (label, hidden, disabled). Only keys matching the
   * active `mode` are used.
   */
  channels?: ChannelsConfig;
  /** Per-part className overrides forwarded to each channel's `GradientSlider`. */
  channelSliderClassNames?: GradientSliderClassNames;
  /** Extra classes appended to the wrapper that stacks the three sliders. */
  className?: string;
  /** Current color as any CSS string parseable by `colorizr`. */
  color: string;
  /** Active color mode; selects which slider set renders (RGB / HSL / OKLCH). */
  mode: ColorMode;
  /** Per-part className overrides forwarded to each channel's `NumericInput`. */
  numericInputClassNames?: NumericInputClassNames;
  /** Called with an OKLCH CSS string whenever a slider changes. */
  onChangeColor: (value: string) => void;
  /**
   * Render a `NumericInput` as each slider's `endContent`. Turn off for a
   * sliders-only layout (e.g. when a standalone inputs row is shown elsewhere).
   * @default true
   */
  showInputs?: boolean;
}

export default function ChannelSliders(props: ChannelSlidersProps) {
  const {
    channels,
    channelSliderClassNames,
    className,
    color,
    mode,
    numericInputClassNames,
    onChangeColor,
    showInputs = true,
    ...rest
  } = props;
  const rootRef = useInteractionAttribute();

  return (
    <div
      {...rest}
      ref={rootRef}
      className={cn('flex flex-col gap-3', className)}
      data-testid="ChannelSliders"
    >
      {mode === 'hsl' && (
        <HSLSliders
          channelSliderClassNames={channelSliderClassNames}
          channels={channels}
          color={color}
          numericInputClassNames={numericInputClassNames}
          onChangeColor={onChangeColor}
          showInputs={showInputs}
        />
      )}
      {mode === 'rgb' && (
        <RGBSliders
          channelSliderClassNames={channelSliderClassNames}
          channels={channels}
          color={color}
          numericInputClassNames={numericInputClassNames}
          onChangeColor={onChangeColor}
          showInputs={showInputs}
        />
      )}
      {mode === 'oklch' && (
        <OKLCHSliders
          channelSliderClassNames={channelSliderClassNames}
          channels={channels}
          color={color}
          numericInputClassNames={numericInputClassNames}
          onChangeColor={onChangeColor}
          showInputs={showInputs}
        />
      )}
    </div>
  );
}
