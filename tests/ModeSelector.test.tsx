import ModeSelector from '~/ModeSelector';
import { fireEvent, render, screen } from '~/test-utils';

const mockOnClick = vi.fn();

describe('ModeSelector', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all modes by default', () => {
    render(<ModeSelector />);

    expect(screen.getByTestId('ModeSelector')).toMatchSnapshot();
  });

  it('renders only the provided modes', () => {
    render(<ModeSelector mode="hsl" modes={['hsl', 'rgb']} onClick={mockOnClick} />);

    expect(screen.getByTestId('ModeSelector')).toMatchSnapshot();
  });

  it('invokes onClick with the selected mode', () => {
    render(<ModeSelector mode="hsl" onClick={mockOnClick} />);

    fireEvent.click(screen.getByRole('button', { name: 'Switch to OKLCH' }));

    expect(mockOnClick).toHaveBeenCalledWith('oklch');
  });

  it('marks the current mode button with the active background class', () => {
    render(<ModeSelector mode="rgb" onClick={mockOnClick} />);

    const rgb = screen.getByRole('button', { name: 'Switch to RGB' });
    const hsl = screen.getByRole('button', { name: 'Switch to HSL' });

    expect(rgb).toHaveClass('bg-black/20');
    expect(hsl).not.toHaveClass('bg-black/20');
  });

  it('exposes aria-pressed reflecting the current mode', () => {
    render(<ModeSelector mode="rgb" onClick={mockOnClick} />);

    expect(screen.getByRole('button', { name: 'Switch to RGB' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByRole('button', { name: 'Switch to HSL' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
    expect(screen.getByRole('button', { name: 'Switch to OKLCH' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
  });

  it('forwards native HTML attrs to the root', () => {
    render(<ModeSelector data-foo="bar" id="custom-mode" mode="oklch" onClick={mockOnClick} />);
    const root = screen.getByTestId('ModeSelector');

    expect(root).toHaveAttribute('data-foo', 'bar');
    expect(root).toHaveAttribute('id', 'custom-mode');
  });
});
