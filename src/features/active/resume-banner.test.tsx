import { fireEvent, render } from '@testing-library/react-native';
import { ThemeProvider } from '@/theme';
import type { ReactNode } from 'react';
import { ResumeBanner } from './resume-banner';

describe('ResumeBanner', () => {
  const wrapper = ({ children }: { children: ReactNode }) => <ThemeProvider initialPreference="light">{children}</ThemeProvider>;
  it('shows the active quest and resumes it on press', async () => {
    const onResume = jest.fn();
    const { getByText, getByRole } = await render(<ResumeBanner quest={{ id: 'quest-1', title: 'Sunset sketch', category: '1', snapshot: {} }} onResume={onResume} />, { wrapper });
    expect(getByText('Continue your Active Quest')).toBeTruthy();
    expect(getByText('Sunset sketch')).toBeTruthy();
    fireEvent.press(getByRole('button', { name: 'Resume Active Quest' }));
    expect(onResume).toHaveBeenCalledTimes(1);
  });
});
