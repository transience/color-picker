import HueSlider from '~/HueSlider';
import { fireEvent, render, screen } from '~/test-utils';

describe('HueSlider', () => {
  it('renders correctly', () => {
    render(<HueSlider />);
    expect(screen.getByTestId('GlobalHueSlider')).toMatchSnapshot();
  });

  it('uses a different gradient for hsl and rgb than for oklch', () => {
    const { rerender } = render(<HueSlider mode="oklch" value={180} />);
    const oklchBackground = screen.getByRole('slider').parentElement!.style.background;

    rerender(<HueSlider mode="hsl" value={180} />);
    const hslBackground = screen.getByRole('slider').parentElement!.style.background;

    rerender(<HueSlider mode="rgb" value={180} />);
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

  it('forwards native HTML attrs to the GradientSlider root', () => {
    render(<HueSlider data-foo="bar" id="custom-hue" mode="oklch" value={180} />);
    const root = screen.getByTestId('GlobalHueSlider');

    expect(root).toHaveAttribute('data-foo', 'bar');
    expect(root).toHaveAttribute('id', 'custom-hue');
  });

  it('honors a consumer-supplied aria-label', () => {
    render(<HueSlider aria-label="Hue angle" mode="oklch" value={180} />);

    expect(screen.getByRole('slider', { name: 'Hue angle' })).toBeInTheDocument();
  });
});
