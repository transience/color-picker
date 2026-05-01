import ChannelSliders from 'src/ChannelSliders';
import { fireEvent, render, screen } from 'tests/__setup__/test-utils';

const mockOnChange = vi.fn();
const originalRAF = globalThis.requestAnimationFrame;

beforeAll(() => {
  globalThis.requestAnimationFrame = (callback: FrameRequestCallback) => {
    callback(0);

    return 0;
  };
});

afterAll(() => {
  globalThis.requestAnimationFrame = originalRAF;
});

function createDefaultProps(overrides: Partial<Parameters<typeof ChannelSliders>[0]> = {}) {
  return {
    mode: 'hsl' as const,
    onChange: mockOnChange,
    ...overrides,
  };
}

describe('ChannelSliders', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('HSL mode', () => {
    it('renders correctly', () => {
      render(<ChannelSliders {...createDefaultProps({ mode: 'hsl' })} />);

      expect(screen.getByTestId('ChannelSliders')).toMatchSnapshot();
    });

    it('disables saturation slider when channels.s.disabled is true', () => {
      render(
        <ChannelSliders
          {...createDefaultProps({ channels: { s: { disabled: true } }, mode: 'hsl' })}
        />,
      );

      expect(screen.getByRole('slider', { name: /saturation/i })).toHaveAttribute(
        'aria-disabled',
        'true',
      );
    });

    it('slider change calls onChange with OKLCH value', () => {
      render(<ChannelSliders {...createDefaultProps({ mode: 'hsl' })} />);

      const hueSlider = screen.getByRole('slider', { name: /hue/i });

      fireEvent.keyDown(hueSlider, { key: 'ArrowRight' });

      expect(mockOnChange).toHaveBeenCalled();

      const call = mockOnChange.mock.calls[0][0];

      expect(call).toMatch(/^oklch\(/);
    });
  });

  describe('RGB mode', () => {
    it('renders correctly', () => {
      render(<ChannelSliders {...createDefaultProps({ mode: 'rgb' })} />);

      expect(screen.getByTestId('ChannelSliders')).toMatchSnapshot();
    });

    it('ignores channel keys that are not relevant to RGB mode', () => {
      render(
        <ChannelSliders
          {...createDefaultProps({ channels: { s: { disabled: true } }, mode: 'rgb' })}
        />,
      );

      expect(screen.getByRole('slider', { name: /red/i })).not.toHaveAttribute('aria-disabled');
      expect(screen.getByRole('slider', { name: /green/i })).not.toHaveAttribute('aria-disabled');
      expect(screen.getByRole('slider', { name: /blue/i })).not.toHaveAttribute('aria-disabled');
    });

    it('slider change calls onChange with OKLCH value', () => {
      render(<ChannelSliders {...createDefaultProps({ mode: 'rgb' })} />);

      const redSlider = screen.getByRole('slider', { name: /red/i });

      fireEvent.keyDown(redSlider, { key: 'ArrowRight' });

      expect(mockOnChange).toHaveBeenCalled();

      const call = mockOnChange.mock.calls[0][0];

      expect(call).toMatch(/^oklch\(/);
    });
  });

  describe('OKLCH mode', () => {
    it('renders correctly', () => {
      render(<ChannelSliders {...createDefaultProps({ mode: 'oklch' })} />);

      expect(screen.getByTestId('ChannelSliders')).toMatchSnapshot();
    });

    it('disables chroma slider when channels.c.disabled is true', () => {
      render(
        <ChannelSliders
          {...createDefaultProps({ channels: { c: { disabled: true } }, mode: 'oklch' })}
        />,
      );

      expect(screen.getByRole('slider', { name: /chroma/i })).toHaveAttribute(
        'aria-disabled',
        'true',
      );
    });

    it('slider change calls onChange with OKLCH value', () => {
      render(<ChannelSliders {...createDefaultProps({ mode: 'oklch' })} />);

      const hueSlider = screen.getByRole('slider', { name: /hue/i });

      fireEvent.keyDown(hueSlider, { key: 'ArrowRight' });

      expect(mockOnChange).toHaveBeenCalled();

      const call = mockOnChange.mock.calls[0][0];

      expect(call).toMatch(/^oklch\(/);
    });
  });

  describe('data-interacting', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('toggles around a pointer gesture', () => {
      render(<ChannelSliders {...createDefaultProps({ mode: 'hsl' })} />);
      const root = screen.getByTestId('ChannelSliders');
      const hueSlider = screen.getByRole('slider', { name: /hue/i });

      expect(root).not.toHaveAttribute('data-interacting');

      fireEvent.pointerDown(hueSlider);
      expect(root).toHaveAttribute('data-interacting', 'true');

      fireEvent.pointerUp(hueSlider);
      expect(root).not.toHaveAttribute('data-interacting');
    });

    it('pointer release clears the flag even when the thumb retains focus', () => {
      render(<ChannelSliders {...createDefaultProps({ mode: 'hsl' })} />);
      const root = screen.getByTestId('ChannelSliders');
      const hueSlider = screen.getByRole('slider', { name: /hue/i });

      fireEvent.pointerDown(hueSlider);
      hueSlider.focus();
      fireEvent.pointerUp(hueSlider);

      expect(root).not.toHaveAttribute('data-interacting');
    });

    it('sets on keydown and clears after idle', () => {
      render(<ChannelSliders {...createDefaultProps({ mode: 'hsl' })} />);
      const root = screen.getByTestId('ChannelSliders');
      const hueSlider = screen.getByRole('slider', { name: /hue/i });

      hueSlider.focus();
      fireEvent.keyDown(hueSlider, { key: 'ArrowRight' });
      expect(root).toHaveAttribute('data-interacting', 'true');

      fireEvent.keyUp(hueSlider, { key: 'ArrowRight' });
      expect(root).toHaveAttribute('data-interacting', 'true');

      vi.advanceTimersByTime(200);
      expect(root).not.toHaveAttribute('data-interacting');
    });

    it('clears immediately when focus leaves the root', () => {
      render(
        <>
          <button data-testid="outside" type="button">
            outside
          </button>
          <ChannelSliders {...createDefaultProps({ mode: 'hsl' })} />
        </>,
      );
      const root = screen.getByTestId('ChannelSliders');
      const hueSlider = screen.getByRole('slider', { name: /hue/i });
      const outside = screen.getByTestId('outside');

      hueSlider.focus();
      fireEvent.keyDown(hueSlider, { key: 'ArrowRight' });
      expect(root).toHaveAttribute('data-interacting', 'true');

      outside.focus();
      expect(root).not.toHaveAttribute('data-interacting');
    });
  });

  describe('channels prop', () => {
    it('hides a channel when hidden is true', () => {
      render(
        <ChannelSliders
          {...createDefaultProps({ channels: { l: { hidden: true } }, mode: 'hsl' })}
        />,
      );

      expect(screen.queryByRole('slider', { name: /lightness/i })).not.toBeInTheDocument();
      expect(screen.getByRole('slider', { name: /hue/i })).toBeInTheDocument();
      expect(screen.getByRole('slider', { name: /saturation/i })).toBeInTheDocument();
    });

    it('replaces the default label with a custom node via labels prop', () => {
      render(
        <ChannelSliders
          {...createDefaultProps({
            labels: { hslSliders: { h: { label: <span data-testid="custom-h">X</span> } } },
            mode: 'hsl',
          })}
        />,
      );

      expect(screen.getByTestId('custom-h')).toBeInTheDocument();
    });
  });
});
