import HueSlider from '~/HueSlider';
import { fireEvent, render, screen } from '~/test-utils';

describe('HueSlider', () => {
  it('renders with GlobalHue aria-label and [0, 360] bounds', () => {
    render(<HueSlider mode="oklch" onChange={() => {}} value={180} />);
    const slider = screen.getByRole('slider', { name: 'GlobalHue' });

    expect(slider).toHaveAttribute('aria-valuemin', '0');
    expect(slider).toHaveAttribute('aria-valuemax', '360');
    expect(slider).toHaveAttribute('aria-valuenow', '180');
  });

  it('uses the OKLCH gradient when mode is oklch', () => {
    render(<HueSlider mode="oklch" onChange={() => {}} value={180} />);
    const track = screen.getByRole('slider').parentElement!;

    // JSDOM keeps oklch() as-is since it doesn't recognize it as a color to normalize.
    expect(track.style.background).toContain('oklch');
  });

  it('uses a different gradient for hsl and rgb than for oklch', () => {
    const { rerender } = render(<HueSlider mode="oklch" onChange={() => {}} value={180} />);
    const oklchBackground = screen.getByRole('slider').parentElement!.style.background;

    rerender(<HueSlider mode="hsl" onChange={() => {}} value={180} />);
    const hslBackground = screen.getByRole('slider').parentElement!.style.background;

    rerender(<HueSlider mode="rgb" onChange={() => {}} value={180} />);
    const rgbBackground = screen.getByRole('slider').parentElement!.style.background;

    expect(hslBackground).not.toEqual(oklchBackground);
    expect(rgbBackground).toEqual(hslBackground);
  });

  it('forwards ArrowRight to onChange', () => {
    const onChange = vi.fn();

    render(<HueSlider mode="oklch" onChange={onChange} value={180} />);
    fireEvent.keyDown(screen.getByRole('slider', { name: 'GlobalHue' }), { key: 'ArrowRight' });

    expect(onChange).toHaveBeenCalledWith(181);
  });

  it('respects isDisabled', () => {
    const onChange = vi.fn();

    render(<HueSlider isDisabled mode="oklch" onChange={onChange} value={180} />);
    const slider = screen.getByRole('slider', { name: 'GlobalHue' });

    expect(slider).toHaveAttribute('aria-disabled', 'true');
    fireEvent.keyDown(slider, { key: 'ArrowRight' });
    expect(onChange).not.toHaveBeenCalled();
  });
});
