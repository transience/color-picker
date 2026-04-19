import Swatch from '~/Swatch';
import { render, screen } from '~/test-utils';

describe('Swatch', () => {
  it('renders with the provided color', () => {
    render(<Swatch color="#ff0044" />);

    const inner = screen.getByTestId('Swatch').firstChild as HTMLElement;

    expect(inner).toHaveStyle({ backgroundColor: '#ff0044' });
  });

  it('applies classNames.root to the outer element', () => {
    render(<Swatch classNames={{ root: 'extra-root' }} color="#000" />);

    expect(screen.getByTestId('Swatch').className).toMatch(/extra-root/);
  });

  it('applies classNames.color to the inner element', () => {
    render(<Swatch classNames={{ color: 'extra-color' }} color="#000" />);

    const inner = screen.getByTestId('Swatch').firstChild as HTMLElement;

    expect(inner.className).toMatch(/extra-color/);
  });
});
