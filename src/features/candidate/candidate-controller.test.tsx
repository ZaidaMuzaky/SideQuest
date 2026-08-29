import { render, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';

import { ThemeProvider } from '@/theme';
import { CandidateController } from './candidate-controller';

const wrapper = ({ children }: { children: ReactNode }) => <ThemeProvider initialPreference="light">{children}</ThemeProvider>;
const candidate = { title: 'Sunset sketch', description: 'Draw a view nearby.', category: 'Creative', duration: '30 minutes', cost: 'Free', difficulty: 'Easy', xp: 20, instructions: 'Sketch three shapes.', safety: 'Stay in a public place.' };

test('SQ-0305 connects the Candidate expiry to an authenticated server-time anchor', async () => {
  const rpc = jest.fn(async () => ({ data: '2026-08-29T10:00:00Z', error: null }));
  const { getByText } = await render(
    <CandidateController client={{ rpc } as never} state={{ kind: 'candidate', candidate, candidateExpiresAt: '2026-08-29T10:30:00Z' }} />,
    { wrapper },
  );
  await waitFor(() => expect(getByText('Offer expires in 30 minutes')).toBeTruthy());
  expect(rpc).toHaveBeenCalledWith('quest_server_time');
});

test('SQ-0305 keeps the Candidate usable when the optional clock request fails', async () => {
  const rpc = jest.fn(async () => ({ data: null, error: new Error('offline') }));
  const { getByText, queryByText } = await render(
    <CandidateController client={{ rpc } as never} state={{ kind: 'candidate', candidate, candidateExpiresAt: '2026-08-29T10:30:00Z' }} />,
    { wrapper },
  );
  await waitFor(() => expect(rpc).toHaveBeenCalled());
  expect(getByText('Accept Quest')).toBeTruthy();
  expect(getByText('Find another')).toBeTruthy();
  expect(queryByText(/Offer expires/)).toBeNull();
});
