import { render } from '@testing-library/react-native';
import type { ReactNode } from 'react';

import { ThemeProvider } from '@/theme';
import { advanceCandidateElapsed, CandidateExpiryCountdown, formatCandidateRemainingTime, getCandidateRemainingSeconds } from './candidate-expiry-countdown';

const wrapper = ({ children }: { children: ReactNode }) => <ThemeProvider initialPreference="light">{children}</ThemeProvider>;

test('SQ-0305 derives a display countdown from the server time anchor', () => {
  expect(getCandidateRemainingSeconds('2026-08-29T10:30:00Z', '2026-08-29T10:00:00Z', 60_000)).toBe(1740);
  expect(formatCandidateRemainingTime(1740)).toBe('Offer expires in 29 minutes');
});

test('SQ-0305 never moves elapsed display time backward after a device clock adjustment', () => {
  expect(advanceCandidateElapsed(60_000, 100_000, 90_000)).toBe(60_000);
  expect(advanceCandidateElapsed(60_000, 100_000, 190_000)).toBe(90_000);
});

test('SQ-0305 presents a non-authoritative accessible stale hint at zero', async () => {
  const { getByLabelText, getByText } = await render(
    <CandidateExpiryCountdown expiresAt="2026-08-29T10:00:00Z" serverTime="2026-08-29T10:00:00Z" />,
    { wrapper },
  );
  const label = 'Offer may have expired. Confirm with the server to continue.';
  expect(getByText(label)).toBeTruthy();
  expect(getByLabelText(label)).toBeTruthy();
});

test('SQ-0305 omits an invalid server time instead of using the device clock', async () => {
  const { queryByText } = await render(
    <CandidateExpiryCountdown expiresAt="2026-08-29T10:30:00Z" serverTime="invalid" />,
    { wrapper },
  );
  expect(queryByText(/Offer expires/)).toBeNull();
});
