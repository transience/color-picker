import ModeSelector from '~/ModeSelector';
import { fireEvent, render, screen } from '~/test-utils';

const mockOnClick = vi.fn();

describe('ModeSelector', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all modes by default', () => {
    render(<ModeSelector mode="hsl" onClick={mockOnClick} />);

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

    expect(rgb).toHaveClass('bg-neutral-200');
    expect(hsl).not.toHaveClass('bg-neutral-200');
  });
});
