import { fireEvent, render } from '@testing-library/react-native';
import type { ReactNode } from 'react';

import { ThemeProvider } from '@/theme';
import { CandidateUi } from './candidate-ui';

const wrapper = ({ children }: { children: ReactNode }) => <ThemeProvider initialPreference="light">{children}</ThemeProvider>;

test('SQ-0304 offers Find Another recovery for a server-expired Candidate', async () => {
  const findAnother = jest.fn();
  const { getByText } = await render(<CandidateUi state={{ kind: 'expired' }} onFindAnother={findAnother} />, { wrapper });
  expect(getByText('This Candidate expired')).toBeTruthy();
  fireEvent.press(getByText('Find Another Quest'));
  expect(findAnother).toHaveBeenCalledTimes(1);
});
