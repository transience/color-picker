import { createRef } from 'react';

import { fireEvent, render, screen } from '~/test-utils';

import Button from '~/components/Button';

describe('Button', () => {
  it('renders a button with type="button"', () => {
    render(<Button>click</Button>);

    expect(screen.getByRole('button', { name: 'click' })).toHaveAttribute('type', 'button');
  });

  it('renders the icon variant', () => {
    render(<Button>icon</Button>);

    expect(screen.getByRole('button', { name: 'icon' })).toMatchSnapshot();
  });

  it('renders the segmented variant', () => {
    render(<Button variant="segmented">hsl</Button>);

    expect(screen.getByRole('button', { name: 'hsl' })).toMatchSnapshot();
  });

  it('renders the segmented variant in the active state', () => {
    render(
      <Button isActive variant="segmented">
        active
      </Button>,
    );

    expect(screen.getByRole('button', { name: 'active' })).toMatchSnapshot();
  });

  it('merges the caller className over the defaults', () => {
    render(<Button className="custom-class">custom</Button>);

    expect(screen.getByRole('button', { name: 'custom' })).toHaveClass('custom-class');
  });

  it('forwards the ref to the underlying button', () => {
    const ref = createRef<HTMLButtonElement>();

    render(<Button ref={ref}>ref</Button>);

    expect(ref.current).toBe(screen.getByRole('button', { name: 'ref' }));
  });

  it('forwards onClick and extra props', () => {
    const onClick = vi.fn();

    render(
      <Button data-testid="TestButton" onClick={onClick}>
        click
      </Button>,
    );

    fireEvent.click(screen.getByTestId('TestButton'));

    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
