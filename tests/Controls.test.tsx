import Controls from '~/Controls';
import { render, screen } from '~/test-utils';

describe('Controls', () => {
  it('returns null when no children are provided', () => {
    const { container } = render(<Controls />);

    expect(container.firstChild).toBeNull();
    expect(screen.queryByTestId('Controls')).not.toBeInTheDocument();
  });

  it('renders the wrapper when at least one slot is provided', () => {
    render(<Controls swatch={<span data-testid="swatch-child">swatch</span>} />);

    expect(screen.getByTestId('Controls')).toBeInTheDocument();
    expect(screen.getByTestId('swatch-child')).toBeInTheDocument();
  });

  it('renders each slot when all are provided', () => {
    render(
      <Controls
        alphaBar={<span data-testid="alpha">a</span>}
        eyeDropper={<span data-testid="eye">e</span>}
        hueBar={<span data-testid="hue">h</span>}
        swatch={<span data-testid="swatch">s</span>}
      />,
    );

    expect(screen.getByTestId('eye')).toBeInTheDocument();
    expect(screen.getByTestId('swatch')).toBeInTheDocument();
    expect(screen.getByTestId('hue')).toBeInTheDocument();
    expect(screen.getByTestId('alpha')).toBeInTheDocument();
  });

  it('skips the bars column when neither hueBar nor alphaBar is provided', () => {
    render(
      <Controls
        eyeDropper={<span data-testid="eye">e</span>}
        swatch={<span data-testid="swatch">s</span>}
      />,
    );

    const barsColumn = screen.getByTestId('Controls').querySelector('.flex-1.flex-col');

    expect(barsColumn).toBeNull();
  });

  it('renders the bars column when only one bar is provided', () => {
    render(<Controls hueBar={<span data-testid="hue">h</span>} />);

    const barsColumn = screen.getByTestId('Controls').querySelector('.flex-1.flex-col');

    expect(barsColumn).not.toBeNull();
    expect(screen.getByTestId('hue')).toBeInTheDocument();
  });

  it('appends custom className to the wrapper', () => {
    render(
      <Controls className="extra-wrapper" swatch={<span data-testid="swatch-child">s</span>} />,
    );

    expect(screen.getByTestId('Controls').className).toMatch(/extra-wrapper/);
  });
});
