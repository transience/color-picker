import { fireEvent, render, screen } from '~/test-utils';

import RadioGroup from '~/components/RadioGroup';

import type { SettingsOption } from '~/types';

const OPTIONS: SettingsOption[] = [
  { label: 'Auto', value: 'auto' },
  { label: 'Hex', value: 'hex' },
  { label: 'RGB', value: 'rgb' },
];

describe('RadioGroup', () => {
  it('renders the title and one button per option', () => {
    render(
      <RadioGroup
        onChange={() => {}}
        onInteractionEnd={() => {}}
        options={OPTIONS}
        title="Format"
        value="auto"
      />,
    );

    expect(screen.getByTestId('RadioGroup')).toMatchSnapshot();
  });

  it('fires onChange with the selected option value on click', () => {
    const onChange = vi.fn();

    render(
      <RadioGroup
        onChange={onChange}
        onInteractionEnd={() => {}}
        options={OPTIONS}
        title="Format"
        value="auto"
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Hex' }));

    expect(onChange).toHaveBeenCalledWith('hex');
  });

  it('fires onInteractionEnd after onChange', () => {
    const calls: string[] = [];

    render(
      <RadioGroup
        onChange={() => calls.push('change')}
        onInteractionEnd={() => calls.push('end')}
        options={OPTIONS}
        title="Format"
        value="auto"
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'RGB' }));

    expect(calls).toEqual(['change', 'end']);
  });

  it('prevents the mousedown default to keep focus on the current element', () => {
    render(
      <RadioGroup
        onChange={() => {}}
        onInteractionEnd={() => {}}
        options={OPTIONS}
        title="Format"
        value="auto"
      />,
    );

    const button = screen.getByRole('button', { name: 'Hex' });
    const event = fireEvent.mouseDown(button);

    // fireEvent returns false when preventDefault was called during dispatch.
    expect(event).toBe(false);
  });

  it('visually distinguishes the selected option from the others', () => {
    render(
      <RadioGroup
        onChange={() => {}}
        onInteractionEnd={() => {}}
        options={OPTIONS}
        title="Format"
        value="hex"
      />,
    );

    const selected = screen.getByRole('button', { name: 'Hex' });
    const unselected = screen.getByRole('button', { name: 'Auto' });

    // Selected gets a darker text color class.
    expect(selected).toHaveClass(/text-neutral-900|text-neutral-50/);
    expect(unselected).not.toHaveClass('text-neutral-900');
  });
});
