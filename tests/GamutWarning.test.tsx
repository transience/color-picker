import { render, screen } from '~/test-utils';

import GamutWarning from '../src/GamutWarning';

describe('GamutWarning', () => {
  it('renders with a descriptive tooltip', () => {
    render(<GamutWarning />);

    const node = screen.getByTestId('GamutWarning');

    expect(node).toBeInTheDocument();
    expect(node).toHaveAttribute('title', expect.stringMatching(/narrow srgb format|clipped/i));
  });

  it('renders an icon (svg)', () => {
    render(<GamutWarning />);

    expect(screen.getByTestId('GamutWarning')).toMatchSnapshot();
  });

  it('appends custom className', () => {
    render(<GamutWarning className="extra-gamut" />);

    expect(screen.getByTestId('GamutWarning').className).toMatch(/extra-gamut/);
  });
});
