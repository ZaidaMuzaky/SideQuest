import type { PropsWithChildren } from 'react';
import { fireEvent, render } from '@testing-library/react-native';

import { ThemeProvider } from '@/theme';

import { Button } from './button';
import { Chip } from './chip';
import { Input } from './input';

function TestTheme({ children }: PropsWithChildren) {
  return <ThemeProvider initialPreference="light">{children}</ThemeProvider>;
}

describe('SQ-0002 UI primitives', () => {
  it('does not fire a disabled Button', async () => {
    const onPress = jest.fn();

    const { getByRole } = await render(
      <Button disabled onPress={onPress}>
        Unavailable
      </Button>,
      { wrapper: TestTheme },
    );

    fireEvent.press(getByRole('button', { name: 'Unavailable' }));

    expect(onPress).not.toHaveBeenCalled();
    expect(
      getByRole('button', { name: 'Unavailable' }).props.accessibilityState,
    ).toMatchObject({ disabled: true, busy: false });
  });

  it('blocks a loading Button and exposes its busy state', async () => {
    const onPress = jest.fn();

    const { getByRole } = await render(
      <Button accessibilityLabel="Preparing" loading onPress={onPress}>
        Preparing
      </Button>,
      { wrapper: TestTheme },
    );

    const button = getByRole('button', { name: 'Preparing' });
    fireEvent.press(button);

    expect(onPress).not.toHaveBeenCalled();
    expect(button.props.accessibilityState).toMatchObject({
      busy: true,
      disabled: true,
    });
  });

  it('exposes selected and disabled Chip states', async () => {
    const onPress = jest.fn();

    const { getByRole } = await render(
      <>
        <Chip label="Explore" selected />
        <Chip disabled label="Unavailable" onPress={onPress} />
      </>,
      { wrapper: TestTheme },
    );

    expect(
      getByRole('button', { name: 'Explore' }).props.accessibilityState,
    ).toMatchObject({ selected: true, disabled: false });

    const disabledChip = getByRole('button', { name: 'Unavailable' });
    fireEvent.press(disabledChip);

    expect(onPress).not.toHaveBeenCalled();
    expect(disabledChip.props.accessibilityState).toMatchObject({
      selected: false,
      disabled: true,
    });
  });

  it('renders an Input error as text and an accessibility hint', async () => {
    const { getByLabelText, getByText } = await render(
      <Input
        errorMessage="Enter at least 2 characters."
        label="Display name"
        value="A"
      />,
      { wrapper: TestTheme },
    );

    expect(getByText('Enter at least 2 characters.')).toBeTruthy();
    expect(getByLabelText('Display name').props.accessibilityHint).toBe(
      'Enter at least 2 characters.',
    );
  });
});
