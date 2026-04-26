import { fireEvent, render, screen } from 'tests/__setup__/test-utils';

import GamutWarning from '../../src/components/GamutWarning';

let mockIdCounter = 0;

vi.mock('~/modules/helpers', async importOriginal => {
  const actual = await importOriginal<typeof import('src/modules/helpers')>();

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

    fireEvent.click(a);
    const aDescribedBy = a.getAttribute('aria-describedby');

    fireEvent.click(a); // close to avoid two open tooltips simultaneously
    fireEvent.click(b);
    const bDescribedBy = b.getAttribute('aria-describedby');

    expect(aDescribedBy).toBeTruthy();
    expect(bDescribedBy).toBeTruthy();
    expect(aDescribedBy).not.toBe(bDescribedBy);
  });
});
