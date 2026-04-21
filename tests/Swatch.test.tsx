import Swatch from '~/Swatch';
import { render, screen } from '~/test-utils';

describe('Swatch', () => {
  it('renders correctly', () => {
    render(<Swatch color="#ff0044" />);

    expect(screen.getByTestId('Swatch')).toMatchSnapshot();
  });

  it('applies classNames to root and color elements', () => {
    render(<Swatch classNames={{ root: 'extra-root', color: 'extra-color' }} color="#000" />);

    expect(screen.getByTestId('Swatch')).toMatchSnapshot();
  });
});
