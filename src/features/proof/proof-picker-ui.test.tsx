import { fireEvent, render } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import { ThemeProvider } from '@/theme';
import { ProofPickerUi } from './proof-picker-ui';

const wrapper = ({ children }: { children: ReactNode }) => <ThemeProvider initialPreference="light">{children}</ThemeProvider>;
const asset = { uri: 'file:///normalized.jpg', mimeType: 'image/jpeg', byteSize: 100, width: 100, height: 100 };

test('SQ-0501 presents camera/picker choices and a removable local preview', async () => {
  const selected = jest.fn();
  const view = await render(<ProofPickerUi onSelected={selected} camera={async () => ({ kind: 'selected', asset })} library={async () => ({ kind: 'cancelled' })} />, { wrapper });
  fireEvent.press(view.getByRole('button', { name: 'Take photo' }));
  expect(await view.findByLabelText('Selected Quest proof preview')).toBeTruthy();
  expect(selected).toHaveBeenCalledWith(asset);
  fireEvent.press(view.getByRole('button', { name: 'Remove photo' }));
});

test('SQ-0501 exposes settings recovery on permission denial', async () => {
  const view = await render(<ProofPickerUi onSelected={jest.fn()} camera={async () => ({ kind: 'permission-denied', source: 'camera' })} />, { wrapper });
  fireEvent.press(view.getByRole('button', { name: 'Take photo' }));
  expect(await view.findByText('Camera or photo access is unavailable. You can try the other option or open Settings.')).toBeTruthy();
  expect(view.getByText('Open Settings')).toBeTruthy();
});
