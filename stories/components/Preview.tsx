import { useMemo, useState } from 'react';
import { readableColor } from 'colorizr';

import GradientSlider from '../../src/components/GradientSlider';

interface PreviewProps {
  color: string;
}

export default function Preview({ color }: PreviewProps) {
  const [value, setValue] = useState(0.5);

  const contrastColor = readableColor(color, 'apca');

  const gradient = useMemo(() => `linear-gradient(to right, transparent, ${color})`, [color]);

  return (
    <div className="w-full max-w-5xl flex gap-6 p-4">
      <section className="flex-1">
        <h3 className="text-xl font-bold mb-4 text-default-700">Typography</h3>
        <div className="space-y-3">
          <div className="flex items-baseline gap-4">
            <span className="text-xs text-default-400 w-16 shrink-0">Display</span>
            <span className="text-4xl font-bold" style={{ color }}>
              Aa Bb Cc
            </span>
          </div>
          <div className="flex items-baseline gap-4">
            <span className="text-xs text-default-400 w-16 shrink-0">Heading</span>
            <span className="text-2xl font-semibold" style={{ color }}>
              Aa Bb Cc
            </span>
          </div>
          <div className="flex items-baseline gap-4">
            <span className="text-xs text-default-400 w-16 shrink-0">Body</span>
            <span className="text-base" style={{ color }}>
              Aa Bb Cc
            </span>
          </div>
          <div className="flex items-baseline gap-4">
            <span className="text-xs text-default-400 w-16 shrink-0">Caption</span>
            <span className="text-sm text-default-500" style={{ color }}>
              Aa Bb Cc
            </span>
          </div>
          <div className="flex items-baseline gap-4">
            <span className="text-xs text-default-400 w-16 shrink-0">Mono</span>
            <span className="text-sm font-mono" style={{ color }}>
              console.log()
            </span>
          </div>
        </div>
      </section>
      <section className="flex-1">
        <h3 className="text-xl font-bold mb-4 text-default-700">Components</h3>
        <div className="flex flex-col items-start gap-4">
          <button
            className="px-4 py-2 leading-none rounded-2xl"
            style={{ backgroundColor: color, color: contrastColor }}
            type="button"
          >
            Button
          </button>
          <div
            className="size-12 rounded-full flex items-center justify-center"
            style={{ backgroundColor: color, color: contrastColor }}
          >
            UN
          </div>

          <div
            className="h-6 inline-flex items-center px-2 py-0.5 leading-none text-xs rounded-2xl"
            style={{ backgroundColor: color, color: contrastColor }}
          >
            new
          </div>

          <GradientSlider
            aria-label="Accent"
            classNames={{
              root: 'w-full max-w-sm flex-col items-start',
            }}
            gradient={gradient}
            maxValue={1}
            minValue={0}
            onValueChange={setValue}
            startContent={<span style={{ color }}>Accent</span>}
            step={0.1}
            value={value}
          />
        </div>
      </section>
      <section className="flex-1">
        <h3 className="text-xl font-bold mb-4 text-default-700">Card</h3>
        <div
          className="flex flex-col gap-3 w-full rounded-lg p-3"
          style={{ backgroundColor: color }}
        >
          <div className="flex items-start gap-3">
            <div
              className="size-20 shrink-0 rounded-md opacity-20"
              style={{ backgroundColor: contrastColor }}
            />
            <div className="flex flex-col gap-1 min-w-0">
              <p className="text-xl font-bold" style={{ color: contrastColor }}>
                OKLCH-first
              </p>
              <p className="text-sm" style={{ color: contrastColor }}>
                Perceptually uniform color picking.
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <div
              className="size-20 shrink-0 rounded-md opacity-20"
              style={{ backgroundColor: contrastColor }}
            />
            <div className="flex flex-col gap-1 min-w-0">
              <p className="text-xl font-bold" style={{ color: contrastColor }}>
                Gamut-aware
              </p>
              <p className="text-sm" style={{ color: contrastColor }}>
                P3 panel with sRGB boundary overlay.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
