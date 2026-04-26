import { ComponentProps } from 'react';

import { fireEvent, mockRect, render, screen } from '~/test-utils';

import Floater from '~/components/Floater';

function renderFloater(overrides: Partial<ComponentProps<typeof Floater>> = {}) {
  render(
    <Floater content="Tooltip body" {...overrides}>
      <button data-testid="trigger" type="button">
        trigger
      </button>
    </Floater>,
  );

  return screen.getByTestId('trigger');
}

describe('Floater', () => {
  it('does not render the floater when closed', () => {
    renderFloater();

    expect(screen.queryByTestId('Floater')).not.toBeInTheDocument();
  });

  it('shows on mouse pointerenter and hides on pointerleave', () => {
    const view = renderFloater();

    fireEvent.pointerEnter(view, { pointerType: 'mouse' });
    expect(screen.getByTestId('Floater')).toHaveTextContent('Tooltip body');

    fireEvent.pointerLeave(view, { pointerType: 'mouse' });
    expect(screen.queryByTestId('Floater')).not.toBeInTheDocument();
  });

  it('ignores touch pointerenter (click is the touch path)', () => {
    const view = renderFloater();

    fireEvent.pointerEnter(view, { pointerType: 'touch' });
    expect(screen.queryByTestId('Floater')).not.toBeInTheDocument();
  });

  it('toggles on click', () => {
    const view = renderFloater();

    fireEvent.click(view);
    expect(screen.getByTestId('Floater')).toBeInTheDocument();

    fireEvent.click(view);
    expect(screen.queryByTestId('Floater')).not.toBeInTheDocument();
  });

  it('shows on focus and hides on blur (hover mode)', () => {
    const view = renderFloater();

    fireEvent.focus(view);
    expect(screen.getByTestId('Floater')).toBeInTheDocument();

    fireEvent.blur(view);
    expect(screen.queryByTestId('Floater')).not.toBeInTheDocument();
  });

  it('does not bind hover handlers in click mode', () => {
    const view = renderFloater({ eventType: 'click' });

    fireEvent.pointerEnter(view, { pointerType: 'mouse' });
    expect(screen.queryByTestId('Floater')).not.toBeInTheDocument();

    fireEvent.click(view);
    expect(screen.getByTestId('Floater')).toBeInTheDocument();
  });

  it('closes on Escape', () => {
    const view = renderFloater();

    fireEvent.click(view);
    expect(screen.getByTestId('Floater')).toBeInTheDocument();

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByTestId('Floater')).not.toBeInTheDocument();
  });

  it('closes on outside mousedown', () => {
    render(
      <>
        <button data-testid="outside" type="button">
          outside
        </button>
        <Floater content="Tooltip body">
          <button data-testid="trigger" type="button">
            trigger
          </button>
        </Floater>
      </>,
    );

    fireEvent.click(screen.getByTestId('trigger'));
    expect(screen.getByTestId('Floater')).toBeInTheDocument();

    fireEvent.mouseDown(screen.getByTestId('outside'));
    expect(screen.queryByTestId('Floater')).not.toBeInTheDocument();
  });

  it('stays open when interacting inside the floater content', () => {
    const view = renderFloater();

    fireEvent.click(view);
    fireEvent.mouseDown(screen.getByTestId('Floater'));

    expect(screen.getByTestId('Floater')).toBeInTheDocument();
  });

  it('sets aria-describedby to the floater id when open', () => {
    const view = renderFloater();

    expect(view).not.toHaveAttribute('aria-describedby');

    fireEvent.click(view);
    const floater = screen.getByTestId('Floater');

    expect(view).toHaveAttribute('aria-describedby', floater.id);
  });

  it('applies placement coords and contentClassName', () => {
    const view = renderFloater({
      placement: 'bottom',
      contentClassName: 'my-floater',
    });

    mockRect(view, { left: 100, top: 100, width: 20, height: 20 });

    fireEvent.click(view);
    const floater = screen.getByTestId('Floater');

    expect(floater).toHaveClass('fixed');
    expect(floater.style.top).not.toBe('');
    expect(floater.style.left).not.toBe('');
    expect(floater).toHaveClass('my-floater');
  });

  it('repositions on window scroll', () => {
    const view = renderFloater({ placement: 'bottom' });

    mockRect(view, { left: 100, top: 100, width: 20, height: 20 });
    fireEvent.click(view);

    const initialTop = screen.getByTestId('Floater').style.top;

    mockRect(view, { left: 100, top: 400, width: 20, height: 20 });
    fireEvent.scroll(window);

    expect(screen.getByTestId('Floater').style.top).not.toBe(initialTop);
  });

  it('chains an onClick on the child trigger with the toggle', () => {
    const onClick = vi.fn();

    render(
      <Floater content="Tooltip body" eventType="click">
        <button data-testid="trigger" onClick={onClick} type="button">
          trigger
        </button>
      </Floater>,
    );

    fireEvent.click(screen.getByTestId('trigger'));

    expect(onClick).toHaveBeenCalled();
    expect(screen.getByTestId('Floater')).toBeInTheDocument();
  });

  describe('controlled (click mode)', () => {
    it('renders when open=true and hides when open=false', () => {
      const { rerender } = render(
        <Floater content="Tooltip body" eventType="click" open={false}>
          <button data-testid="trigger" type="button">
            trigger
          </button>
        </Floater>,
      );

      expect(screen.queryByTestId('Floater')).not.toBeInTheDocument();

      rerender(
        <Floater content="Tooltip body" eventType="click" open>
          <button data-testid="trigger" type="button">
            trigger
          </button>
        </Floater>,
      );

      expect(screen.getByTestId('Floater')).toBeInTheDocument();
    });

    it('fires onOpenChange without mutating internal state when controlled', () => {
      const onOpenChange = vi.fn();

      render(
        <Floater content="Tooltip body" eventType="click" onOpenChange={onOpenChange} open={false}>
          <button data-testid="trigger" type="button">
            trigger
          </button>
        </Floater>,
      );

      fireEvent.click(screen.getByTestId('trigger'));

      expect(onOpenChange).toHaveBeenCalledWith(true);
      expect(screen.queryByTestId('Floater')).not.toBeInTheDocument();
    });

    it('fires onOpenChange alongside internal state when uncontrolled', () => {
      const onOpenChange = vi.fn();

      render(
        <Floater content="Tooltip body" eventType="click" onOpenChange={onOpenChange}>
          <button data-testid="trigger" type="button">
            trigger
          </button>
        </Floater>,
      );

      fireEvent.click(screen.getByTestId('trigger'));

      expect(onOpenChange).toHaveBeenCalledWith(true);
      expect(screen.getByTestId('Floater')).toBeInTheDocument();
    });
  });
});
