import { render, screen } from '~/test-utils';

import GamutWarning from '../src/GamutWarning';

let mockIdCounter = 0;

vi.mock('~/modules/helpers', async importOriginal => {
  const actual = await importOriginal<typeof import('~/modules/helpers')>();

  return {
    ...actual,
    createId: (prefix: string) => {
      mockIdCounter += 1;

      return `${prefix}-${mockIdCounter}`;
    },
  };
});

beforeEach(() => {
  mockIdCounter = 0;
});

describe('GamutWarning', () => {
  it('renders correctly', () => {
    render(<GamutWarning />);

    expect(screen.getByTestId('GamutWarning')).toMatchSnapshot();
  });

  it('appends custom className', () => {
    render(<GamutWarning className="extra-gamut" />);

    expect(screen.getByTestId('GamutWarning')).toHaveClass('extra-gamut');
  });

  it('generates unique ids per instance', () => {
    render(
      <>
        <GamutWarning />
        <GamutWarning />
      </>,
    );
    const [a, b] = screen.getAllByTestId('GamutWarning');

    expect(a.getAttribute('popovertarget')).not.toBe(b.getAttribute('popovertarget'));
  });
});
