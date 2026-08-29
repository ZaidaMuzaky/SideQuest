import { act, fireEvent, render } from '@testing-library/react-native';
import type { ReactNode } from 'react';

import { ThemeProvider } from '@/theme';
import { ActiveQuestUi } from './active-quest-ui';
import type { ActiveQuestDetail } from './types';

const wrapper = ({ children }: { children: ReactNode }) => <ThemeProvider initialPreference="light">{children}</ThemeProvider>;
const quest: ActiveQuestDetail = { id: 'q1', title: 'Sunset sketch', category: '5', snapshot: {}, description: 'Draw the view.',
  instructions: ['Find a public spot', 'Sketch three shapes'], categorySlug: 'creative', durationMinutes: { min: 20, max: 30 },
  estimatedCost: { min: 0, max: 0, currency: 'IDR' }, difficulty: 'easy', baseXp: 50,
  physicalDemand: 'Low', safetyNotes: 'Stay in a public place.', locationMode: 'none' };

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

test('SQ-0403 opens maps only for a valid snapshotted place', async () => {
  const openMap = jest.fn(async () => true);
  const placeQuest = { ...quest, locationMode: 'place' as const, location: { name: 'Museum', latitude: -6.2, longitude: 106.8, address: 'Public square' } };
  const view = await render(<ActiveQuestUi state={{ kind: 'active', quest: placeQuest }} onOpenMap={openMap} />, { wrapper });
  await act(async () => { fireEvent.press(view.getByRole('button', { name: 'Open Maps' })); });
  expect(openMap).toHaveBeenCalledWith('https://www.google.com/maps/search/?api=1&query=-6.2%2C106.8%20(Museum)');
  expect(view.getByText('Address: Public square')).toBeTruthy();
});

test('SQ-0403 shows fallback copy when no supported map app opens', async () => {
  const placeQuest = { ...quest, locationMode: 'place' as const, location: { name: 'Museum', externalMapUrl: 'https://maps.apple.com/?q=Museum' } };
  const view = await render(<ActiveQuestUi state={{ kind: 'active', quest: placeQuest }} onOpenMap={async () => false} />, { wrapper });
  await act(async () => { fireEvent.press(view.getByRole('button', { name: 'Open Maps' })); });
  expect(await view.findByText('No supported map app is available. Use the address and instructions instead.')).toBeTruthy();
});

test('SQ-0403 shows no map dependency for a non-location Quest', async () => {
  const view = await render(<ActiveQuestUi state={{ kind: 'active', quest }} />, { wrapper });
  expect(view.queryByRole('button', { name: 'Open Maps' })).toBeNull();
});
