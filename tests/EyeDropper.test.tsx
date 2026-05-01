import EyeDropper from '~/EyeDropper';
import { fireEvent, render, screen, waitFor } from '~/test-utils';

type EyeDropperConstructor = new () => { open: () => Promise<{ sRGBHex: string }> };

function makeResolving(hex: string): EyeDropperConstructor {
  return function EyeDropperMock() {
    return {
      open: () => Promise.resolve({ sRGBHex: hex }),
    };
  } as unknown as EyeDropperConstructor;
}

function setEyeDropper(ctor: EyeDropperConstructor | undefined) {
  if (ctor === undefined) {
    delete (globalThis as unknown as { EyeDropper?: unknown }).EyeDropper;
  } else {
    (globalThis as unknown as { EyeDropper: EyeDropperConstructor }).EyeDropper = ctor;
  }
}

describe('EyeDropper', () => {
  const original = (globalThis as unknown as { EyeDropper?: unknown }).EyeDropper;

  afterEach(() => {
    setEyeDropper(original as EyeDropperConstructor | undefined);
  });

  it('returns null when the EyeDropper API is not available', () => {
    setEyeDropper(undefined);

    render(<EyeDropper />);

    expect(screen.queryByTestId('EyeDropper')).not.toBeInTheDocument();
  });

  it('renders a button when the EyeDropper API is available', () => {
    setEyeDropper(makeResolving('#112233'));

    render(<EyeDropper />);

    expect(screen.getByTestId('EyeDropper')).toMatchSnapshot();
  });

  it('emits the selected hex color', async () => {
    setEyeDropper(makeResolving('#abcdef'));

    const onChange = vi.fn();

    render(<EyeDropper onChange={onChange} />);
    fireEvent.click(screen.getByTestId('EyeDropper'));

    await waitFor(() => expect(onChange).toHaveBeenCalledWith('#abcdef'));
  });

  it('swallows errors when the user dismisses the picker', async () => {
    let rejectOpen: (reason?: unknown) => void = () => {};

    const openPromise = new Promise<{ sRGBHex: string }>((_resolve, reject) => {
      rejectOpen = reject;
    });
    const ctor: EyeDropperConstructor = function EyeDropperMock() {
      return { open: () => openPromise };
    } as unknown as EyeDropperConstructor;

    setEyeDropper(ctor);

    const onChange = vi.fn();

    render(<EyeDropper onChange={onChange} />);
    fireEvent.click(screen.getByTestId('EyeDropper'));

    rejectOpen(new Error('user cancelled'));
    await openPromise.catch(() => {});
    // Flush the microtask queue so the component's .catch handler runs.
    await Promise.resolve();

    expect(onChange).not.toHaveBeenCalled();
  });

  it('forwards native HTML attrs to the trigger button', () => {
    setEyeDropper(makeResolving('#000000'));

    render(<EyeDropper data-foo="bar" id="custom-eyedropper" />);
    const button = screen.getByTestId('EyeDropper');

    expect(button).toHaveAttribute('data-foo', 'bar');
    expect(button).toHaveAttribute('id', 'custom-eyedropper');
  });
});
