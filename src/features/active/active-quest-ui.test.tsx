import { fireEvent, render } from '@testing-library/react-native';
import type { ReactNode } from 'react';

import { ThemeProvider } from '@/theme';
import { ActiveQuestUi } from './active-quest-ui';
import type { ActiveQuestDetail } from './types';

const wrapper = ({ children }: { children: ReactNode }) => <ThemeProvider initialPreference="light">{children}</ThemeProvider>;
const quest: ActiveQuestDetail = { id: 'q1', title: 'Sunset sketch', category: '5', snapshot: {}, description: 'Draw the view.',
  instructions: ['Find a public spot', 'Sketch three shapes'], categorySlug: 'creative', durationMinutes: { min: 20, max: 30 },
  estimatedCost: { min: 0, max: 0, currency: 'IDR' }, difficulty: 'easy', baseXp: 50,
  physicalDemand: 'Low', safetyNotes: 'Stay in a public place.' };

test('SQ-0402 renders the immutable Active snapshot and accessible actions', async () => {
  const addProof = jest.fn();
  const { getByText, getByRole } = await render(<ActiveQuestUi state={{ kind: 'active', quest }} onAddProof={addProof} />, { wrapper });
  expect(getByRole('header', { name: 'Sunset sketch' })).toBeTruthy();
  expect(getByText('1. Find a public spot')).toBeTruthy();
  expect(getByText('Stay in a public place.')).toBeTruthy();
  fireEvent.press(getByRole('button', { name: 'Add proof' }));
  expect(addProof).toHaveBeenCalledTimes(1);
  expect(getByRole('button', { name: 'Complete Quest' }).props.accessibilityState.disabled).toBe(true);
});

test('SQ-0402 preserves the cached snapshot offline and disables authoritative actions', async () => {
  const { getByText, getByRole } = await render(<ActiveQuestUi state={{ kind: 'active', quest, offline: true }}
    onAddProof={jest.fn()} onComplete={jest.fn()} onAbandon={jest.fn()} />, { wrapper });
  expect(getByText('Sunset sketch')).toBeTruthy();
  expect(getByText('You’re offline')).toBeTruthy();
  for (const name of ['Add proof','Complete Quest','Abandon Quest'])
    expect(getByRole('button', { name }).props.accessibilityState.disabled).toBe(true);
});

test('SQ-0402 renders a loading state', async () => {
  const loading = await render(<ActiveQuestUi state={{ kind: 'loading' }} />, { wrapper });
  expect(loading.getByLabelText('Loading your Active Quest')).toBeTruthy();
});

test('SQ-0402 renders a retryable recovery error', async () => {
  const retry = jest.fn();
  const error = await render(<ActiveQuestUi state={{ kind: 'error', retry }} />, { wrapper });
  fireEvent.press(error.getByRole('button', { name: 'Try again' }));
  expect(retry).toHaveBeenCalledTimes(1);
});

test('SQ-0402 renders the no-Active recovery state', async () => {
  const empty = await render(<ActiveQuestUi state={{ kind: 'empty' }} />, { wrapper });
  expect(empty.getByText('No Active Quest')).toBeTruthy();
});
