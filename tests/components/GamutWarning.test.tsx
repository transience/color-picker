import { fireEvent, render, screen } from '~/test-utils';

import GamutWarning from '~/components/GamutWarning';

describe('GamutWarning', () => {
  it('renders correctly', () => {
    render(<GamutWarning />);

    expect(screen.getByTestId('GamutWarning')).toMatchSnapshot();
  });

  it('appends custom className', () => {
    render(<GamutWarning className="extra-gamut" />);

    expect(screen.getByTestId('GamutWarning')).toHaveClass('extra-gamut');
  });

  it('uses a custom label for the tooltip and aria-label', () => {
    render(<GamutWarning label="Fuera de sRGB" />);

    const button = screen.getByRole('button', { name: 'Fuera de sRGB' });

    fireEvent.focus(button);

    expect(screen.getByRole('tooltip')).toHaveTextContent('Fuera de sRGB');
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
