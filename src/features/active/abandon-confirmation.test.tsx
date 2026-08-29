import { fireEvent, render } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import { ThemeProvider } from '@/theme';
import { AbandonConfirmation } from './abandon-confirmation';

const wrapper = ({ children }: { children: ReactNode }) => <ThemeProvider initialPreference="light">{children}</ThemeProvider>;

test('SQ-0404 requires explicit confirmation and supports cancel', async () => {
  const confirm=jest.fn(); const cancel=jest.fn();
  const view=await render(<AbandonConfirmation onConfirm={confirm} onCancel={cancel} />, { wrapper });
  expect(view.getByText('This Quest will end without XP. Any uploaded proof will be queued for private cleanup.')).toBeTruthy();
  fireEvent.press(view.getByRole('button',{name:'Keep Quest'}));
  expect(cancel).toHaveBeenCalledTimes(1); expect(confirm).not.toHaveBeenCalled();
});

test('SQ-0404 locks duplicate actions while submitting and exposes retryable failure', async () => {
  const view=await render(<AbandonConfirmation loading error onConfirm={jest.fn()} onCancel={jest.fn()} />, { wrapper });
  expect(view.getByRole('button',{name:'Keep Quest'}).props.accessibilityState.disabled).toBe(true);
  expect(view.getByRole('button',{name:'Abandon Quest'}).props.accessibilityState.busy).toBe(true);
  expect(view.getByText('Unable to abandon this Quest. It may have changed; reconnect and try again.')).toBeTruthy();
});
