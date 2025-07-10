/**
 * @jest-environment jsdom
 */


import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { useColorScheme } from '../../hooks/useColorScheme.web';

// Mock useColorScheme from react-native
jest.mock('react-native', () => ({
  useColorScheme: jest.fn(),
}));

const { useColorScheme: useRNColorScheme } = require('react-native');

function TestComponent() {
  const scheme = useColorScheme();
  return <div data-testid="color-scheme">{scheme}</div>;
}

describe('useColorScheme (web)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Cannot test pre-hydration state due to the nature of jsdom-based tests,
  //causing hydration to occur immediately after render (useEffect runs almost immediately)
  /*it('returns "light" before hydration', () => {
    useRNColorScheme.mockReturnValue('dark'); // Should not matter before hydration
    render(<TestComponent />);
    expect(screen.getByTestId('color-scheme').textContent).toBe('light');
  });*/

  it('returns the system color scheme after hydration', async () => {
    useRNColorScheme.mockReturnValue('dark');
    render(<TestComponent />);
    await waitFor(() => {
      expect(screen.getByTestId('color-scheme').textContent).toBe('dark');
    });
  });

  it('returns the correct value if system color scheme is "light"', async () => {
    useRNColorScheme.mockReturnValue('light');
    render(<TestComponent />);
    await waitFor(() => {
      expect(screen.getByTestId('color-scheme').textContent).toBe('light');
    });
  });
});
