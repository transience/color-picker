import ModeSelector from '~/ModeSelector';
import { fireEvent, render, screen } from '~/test-utils';

const mockOnClick = vi.fn();

describe('ModeSelector', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all modes by default', () => {
    render(<ModeSelector mode="hsl" onClick={mockOnClick} />);

    expect(screen.getByRole('button', { name: 'Switch to OKLCH' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Switch to HSL' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Switch to RGB' })).toBeInTheDocument();
  });

  it('renders only the provided modes', () => {
    render(<ModeSelector mode="hsl" modes={['hsl', 'rgb']} onClick={mockOnClick} />);

    expect(screen.getByRole('button', { name: 'Switch to HSL' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Switch to RGB' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Switch to OKLCH' })).not.toBeInTheDocument();
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

    expect(rgb.className).toMatch(/bg-neutral-200/);
    expect(hsl.className).not.toMatch(/bg-neutral-200/);
  });
});
