import type { ReactNode } from 'react';
import { render } from '@testing-library/react-native';
import { ThemeProvider } from '@/theme';
import { ProgressCard } from './progress-ui';
import type { ProgressSummary } from './progress-repository';

const wrapper = ({ children }: { children: ReactNode }) => <ThemeProvider initialPreference="light">{children}</ThemeProvider>;
const progress: ProgressSummary = { userId: 'u', lifetimeXp: 150, level: 2, completedCount: 3, currentLevelXp: 50, nextLevelXp: 200, progressPercent: 25 };
test('SQ-0602 exposes accessible authoritative progress', async () => {
  const view = await render(<ProgressCard progress={progress} />, { wrapper });
  expect(view.getByText('Total XP: 150')).toBeTruthy();
  expect(view.getByText('Quests completed: 3')).toBeTruthy();
  expect(view.getByLabelText('Progress to next level: 25%').props.accessibilityValue).toMatchObject({ now: 25, max: 100 });
});
