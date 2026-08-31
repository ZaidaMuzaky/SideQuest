import { render, fireEvent } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import { ThemeProvider } from '@/theme';
import { CompletionCelebration } from './completion-celebration';

const wrapper = ({ children }: { children: ReactNode }) => <ThemeProvider initialPreference="light">{children}</ThemeProvider>;

const result = { status: 'completed' as const, outcome: 'completed' as const, completionId: 'c', instanceId: 'i', xpAwarded: 150, totalXp: 250, levelBefore: 2, levelAfter: 3, completedCount: 4, completedAt: '2026-08-31T10:00:00Z' };

test('SQ-0504 presents immutable XP and level-up result with both actions', async () => {
  const find = jest.fn(); const history = jest.fn();
  const view = await render(<CompletionCelebration result={result} onFindAnother={find} onViewHistory={history} />, { wrapper });
  expect(view.getByText('Quest complete')).toBeTruthy();
  expect(view.getByText('XP gained: +150 XP')).toBeTruthy();
  expect(view.getByText('Level up!')).toBeTruthy();
  fireEvent.press(view.getByText('Find Another Quest')); fireEvent.press(view.getByText('View History'));
  expect(find).toHaveBeenCalledTimes(1); expect(history).toHaveBeenCalledTimes(1);
});

test('SQ-0504 does not show level-up treatment when level is unchanged', async () => {
  const view = await render(<CompletionCelebration result={{ ...result, levelAfter: 2 }} onFindAnother={jest.fn()} onViewHistory={jest.fn()} />, { wrapper });
  expect(view.queryByText('Level up!')).toBeNull();
});
