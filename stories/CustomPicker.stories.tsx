import { useMemo, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { formatCSS, readableColor } from 'colorizr';
import { fn } from 'storybook/test';

import {
  ChannelSliders,
  ColorInput,
  EyeDropper,
  GamutWarning,
  HueSlider,
  ModeSelector,
  OKLCHPanel,
  SaturationPanel,
  SettingsMenu,
  Swatch,
  useColorPicker,
} from '../src';
import { DEFAULT_COLOR } from '../src/constants';
import { cn } from '../src/modules/helpers';

type Story = StoryObj<Props>;

interface Props {
  color: string;
  onChange: (value: string) => void;
}

export default {
  title: 'useColorPicker',
  args: {
    color: DEFAULT_COLOR,
    onChange: fn(),
  },
} satisfies Meta<Props>;

const PALETTE_LIGHTNESS = [0.92, 0.82, 0.72, 0.62, 0.52, 0.42, 0.32, 0.22];
const PALETTE_HUES = [0, 30, 60, 90, 120, 180, 240, 300];
const PALETTE_CHROMA = 0.15;

export const CustomLayout: Story = {
  render: function CustomLayoutPicker(props: Props) {
    const { color: initial, onChange } = props;
    const [color, setColor] = useState(initial);
    const picker = useColorPicker({
      color,
      onChange: (next: string) => {
        setColor(next);
        onChange(next);
      },
    });

    const isDark = readableColor(picker.swatchColor, 'apca') === '#ffffff';

    return (
      <div ref={picker.rootRef} className="flex gap-4">
        <div className="w-56">
          {picker.isOklch ? (
            <OKLCHPanel
              chroma={picker.oklch.c}
              classNames={{ root: 'rounded-lg' }}
              hue={picker.oklch.h}
              lightness={picker.oklch.l}
              onChange={picker.handleChangeOklchPanel}
            />
          ) : (
            <SaturationPanel
              classNames={{ root: 'rounded-lg' }}
              hue={picker.hsv.h}
              onChange={picker.handleChangeSaturationPanel}
              saturation={picker.hsv.s}
              value={picker.hsv.v}
            />
          )}
        </div>

        <div className="w-74 flex flex-col justify-between">
          <ColorInput
            classNames={{
              root: 'h-12 px-4',
              input: 'text-lg',
            }}
            endContent={picker.showGamutWarning && <GamutWarning />}
            onChange={picker.handleChangeColorInput}
            value={picker.displayValue}
          />
          <div className="flex items-end gap-4">
            <Swatch classNames={{ root: 'size-16 rounded-lg' }} color={picker.swatchColor}>
              <EyeDropper
                className={cn('bg-transparent! border-none!', {
                  'text-white!': isDark,
                  'text-black!': !isDark,
                })}
                onChange={picker.handleChangeColorInput}
              />
            </Swatch>
            <div className="flex flex-col flex-1 gap-4">
              <HueSlider
                mode={picker.mode}
                onChange={picker.isOklch ? picker.handleChangeOklchHue : picker.handleChangeHsvHue}
                value={picker.currentHue}
              />
              <div className="flex items-center justify-between">
                <ModeSelector
                  classNames={{
                    root: 'gap-3',
                    button: 'rounded-lg!',
                  }}
                  mode={picker.mode}
                  modes={['oklch', 'hsl']}
                  onClick={picker.handleClickMode}
                />
                <SettingsMenu
                  displayFormat={picker.displayFormat}
                  onChangeDisplayFormat={picker.handleChangeDisplayFormat}
                  onChangeOutputFormat={picker.handleChangeOutputFormat}
                  outputFormat={picker.outputFormat}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  },
};

export const PalettePicker: Story = {
  render: function PalettePicker() {
    const [color, setColor] = useState(DEFAULT_COLOR);
    const picker = useColorPicker({
      color,
      defaultMode: 'oklch',
      onChange: setColor,
    });

    const cells = useMemo(
      () =>
        PALETTE_LIGHTNESS.flatMap(l =>
          PALETTE_HUES.map(h => ({
            l,
            h,
            css: formatCSS({ l, c: PALETTE_CHROMA, h }, { format: 'oklch' }),
          })),
        ),
      [],
    );

    return (
      <div
        ref={picker.rootRef}
        className="w-80 flex flex-col gap-4 p-4 bg-blue-100 dark:bg-blue-950"
      >
        <div
          className="grid gap-1"
          style={{ gridTemplateColumns: `repeat(${PALETTE_HUES.length}, minmax(0, 1fr))` }}
        >
          {cells.map(cell => (
            <button
              key={`${cell.l}-${cell.h}`}
              aria-label={`Pick ${cell.css}`}
              className="aspect-square rounded-md transition-transform hover:scale-110 focus:outline-2 focus:outline-white"
              onClick={() => picker.handleChangeColorInput(cell.css)}
              style={{ backgroundColor: cell.css }}
              type="button"
            />
          ))}
        </div>

        <ChannelSliders
          color={picker.solidColor}
          mode="oklch"
          onChangeColor={picker.handleChangeColorInput}
          showInputs
        />

        <div className="flex items-center gap-2 pt-2 border-t border-neutral-500">
          <Swatch color={picker.swatchColor} />
          <span className="text-lg">{picker.displayValue}</span>
        </div>
      </div>
    );
  },
};
