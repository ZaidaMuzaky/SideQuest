import { fireEvent, render } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import { ThemeProvider } from '@/theme';
import { CandidateUi, type CandidateUiState } from './index';

const wrapper = ({ children }: { children: ReactNode }) => <ThemeProvider initialPreference="light">{children}</ThemeProvider>;
const candidate = { title: 'Sunset sketch', description: 'Draw a view nearby.', category: 'Creative', duration: '30 minutes', cost: 'Free', difficulty: 'Easy', xp: 20, instructions: 'Sketch three shapes.', safety: 'Stay in a public, well-lit place.' };

describe('SQ-0203 Candidate UI', () => {
  it.each<CandidateUiState>([{ kind: 'loading' }, { kind: 'no-match' }, { kind: 'exhausted' }])('renders %s state', async (state) => {
    const { getByText } = await render(<CandidateUi state={state} />, { wrapper });
    expect(getByText(state.kind === 'loading' ? 'Finding a Quest that fits your filters…' : state.kind === 'no-match' ? 'No matching Quest yet' : 'You’ve seen every option')).toBeTruthy();
  });
  it('renders candidate details and dispatches accept/reroll', async () => {
    const accept = jest.fn(); const reroll = jest.fn();
    const { getByText } = await render(<CandidateUi state={{ kind: 'candidate', candidate }} onAccept={accept} onReroll={reroll} />, { wrapper });
    expect(getByText('Sunset sketch')).toBeTruthy(); fireEvent.press(getByText('Accept Quest')); fireEvent.press(getByText('Find another'));
    expect(accept).toHaveBeenCalledTimes(1); expect(reroll).toHaveBeenCalledTimes(1);
  });
});
