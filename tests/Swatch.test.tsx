import Swatch from '~/Swatch';
import { fireEvent, render, screen } from '~/test-utils';

describe('Swatch', () => {
  it('renders correctly', () => {
    render(<Swatch color="#ff0044" />);

    expect(screen.getByTestId('Swatch')).toMatchSnapshot();
  });

  it('applies classNames to root and color elements', () => {
    render(<Swatch classNames={{ root: 'extra-root', color: 'extra-color' }} color="#000" />);

    expect(screen.getByTestId('Swatch')).toMatchSnapshot();
  });

  it('renders as a button when as="button"', () => {
    const handleClick = vi.fn();

    render(<Swatch aria-label="Pick color" as="button" color="#ff0044" onClick={handleClick} />);

    const root = screen.getByTestId('Swatch');

    expect(root.tagName).toBe('BUTTON');
    expect(root).toHaveAttribute('type', 'button');
    expect(root).toHaveAttribute('aria-label', 'Pick color');

    fireEvent.click(root);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('forwards disabled to the button', () => {
    render(<Swatch as="button" color="#000" disabled />);

    expect(screen.getByTestId('Swatch')).toBeDisabled();
  });

  it('renders as an anchor when as="a"', () => {
    render(<Swatch as="a" color="#21ff00" href="/colors/green" target="_blank" />);

    const root = screen.getByTestId('Swatch');

    expect(root.tagName).toBe('A');
    expect(root).toHaveAttribute('href', '/colors/green');
    expect(root).toHaveAttribute('target', '_blank');
  });

  it('does not set aria-hidden by default', () => {
    render(<Swatch color="#ff0044" />);

    expect(screen.getByTestId('Swatch')).not.toHaveAttribute('aria-hidden');
  });

  it('forwards aria-hidden when provided', () => {
    render(<Swatch aria-hidden color="#ff0044" />);

    expect(screen.getByTestId('Swatch')).toHaveAttribute('aria-hidden', 'true');
  });

  it('renders inner element as a span', () => {
    render(<Swatch color="#ff0044" />);

    const root = screen.getByTestId('Swatch');

    expect(root.firstElementChild?.tagName).toBe('SPAN');
  });
});
