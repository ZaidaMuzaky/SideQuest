import { getFoundationStatus } from './foundation';

describe('SQ-0001 foundation', () => {
  it('loads the Jest environment', () => {
    expect(getFoundationStatus()).toBe('ready');
  });
});
