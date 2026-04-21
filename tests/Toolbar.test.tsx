import { render, screen } from '~/test-utils';
import Toolbar from '~/Toolbar';

describe('Toolbar', () => {
  it('renders the hue bar slot', () => {
    render(<Toolbar hueBar={<span data-testid="hue">h</span>} />);

    expect(screen.getByTestId('Toolbar')).toBeInTheDocument();
    expect(screen.getByTestId('hue')).toBeInTheDocument();
  });

  it('renders the alpha bar slot', () => {
    render(<Toolbar alphaBar={<span data-testid="alpha">a</span>} />);

    expect(screen.getByTestId('Toolbar')).toBeInTheDocument();
    expect(screen.getByTestId('alpha')).toBeInTheDocument();
  });

  it('renders both bars with hue before alpha', () => {
    render(
      <Toolbar
        alphaBar={<span data-testid="alpha">a</span>}
        hueBar={<span data-testid="hue">h</span>}
      />,
    );

    const wrapper = screen.getByTestId('Toolbar');

    expect(wrapper.children[0]).toBe(screen.getByTestId('hue'));
    expect(wrapper.children[1]).toBe(screen.getByTestId('alpha'));
  });

  it('renders an empty wrapper when no slots are provided', () => {
    render(<Toolbar />);

    const wrapper = screen.getByTestId('Toolbar');

    expect(wrapper).toBeInTheDocument();
    expect(wrapper.children).toHaveLength(0);
  });

  it('appends custom className to the wrapper', () => {
    render(<Toolbar className="extra-wrapper" hueBar={<span>h</span>} />);

    expect(screen.getByTestId('Toolbar')).toHaveClass('extra-wrapper');
  });
});
