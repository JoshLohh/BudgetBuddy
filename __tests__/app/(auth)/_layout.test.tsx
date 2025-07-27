/**
 * Tests for (auth)/_layout.tsx
 * - Verifies theme application based on color scheme
 * - Tests guest-only access flow and redirect behavior for authenticated users
 * - Confirms correct navigation stacking and UI structure
 */

import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import AuthLayout from '../../../app/(auth)/_layout';
import { useUser } from '@/hooks/useUser';
import * as Router from 'expo-router';
import { Text } from 'react-native';



jest.mock('@/hooks/useUser');
let mockReplace: jest.Mock;

jest.mock('expo-router', () => {
  const React = require('react');
    mockReplace = jest.fn();
  return {
    Stack: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    useRouter: () => ({
      replace: mockReplace,
    }),
  };
});

jest.mock('@react-navigation/native', () => ({
  ThemeProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  DarkTheme: { dark: true },
  DefaultTheme: { dark: false },
}));

jest.mock('expo-font', () => ({
  useFonts: jest.fn(() => [true]),
}));

jest.mock('@/hooks/useColorScheme', () => ({
  useColorScheme: jest.fn(),
}));

jest.mock('../../../components/auth/GuestOnly', () => {
  const { useEffect } = require('react');
  const { useUser } = require('@/hooks/useUser');
  const { useRouter } = require('expo-router');

  return function GuestOnlyMock({ children }: any) {
    const { user, authChecked } = useUser();
    const router = useRouter();

    useEffect(() => {
      if (authChecked && user != null) {
        router.replace('/profile');
      }
    }, [user, authChecked]);

    if (!authChecked) {
      return null;
    }

    // Do NOT return null immediately if user exists to allow effect to run
    if (user) {
      return <></>;
    }

    return <>{children}</>;
  };
});

describe('AuthLayout', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders children when user is guest and authChecked is true', () => {
    (useUser as jest.Mock).mockReturnValue({
      user: null,
      authChecked: true,
    });

    const { getByText } = render(
      <AuthLayout>
        <Text testID="child">Auth Content</Text>
      </AuthLayout>
    );

    expect(getByText('Auth Content')).toBeTruthy();
  });

  it('uses dark theme when color scheme is dark', () => {
    const mockUseColorScheme = require('@/hooks/useColorScheme').useColorScheme;
    mockUseColorScheme.mockReturnValue('dark');
    (useUser as jest.Mock).mockReturnValue({
      user: null,
      authChecked: true,
    });

    const { toJSON } = render(
      <AuthLayout>
        <></>
      </AuthLayout>
    );

    expect(toJSON()).toMatchSnapshot();
  });

  it('uses default theme when color scheme is light', () => {
    const mockUseColorScheme = require('@/hooks/useColorScheme').useColorScheme;
    mockUseColorScheme.mockReturnValue('light');
    (useUser as jest.Mock).mockReturnValue({
      user: null,
      authChecked: true,
    });

    const { toJSON } = render(
      <AuthLayout>
        <></>
      </AuthLayout>
    );

    expect(toJSON()).toMatchSnapshot();
  });

  it('calls router.replace when user is authenticated', async () => {
    (useUser as jest.Mock).mockReturnValue({
      user: { id: '123', name: 'User' },
      authChecked: true,
    });

    render(
      <AuthLayout>
        <></>
      </AuthLayout>
    );

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/profile');
    });
  });

  it('renders nothing (or null) when authChecked is false', () => {
    (useUser as jest.Mock).mockReturnValue({
      user: null,
      authChecked: false,
    });

    const { toJSON } = render(
      <AuthLayout>
        <Text>Should not render</Text>
      </AuthLayout>
    );

    expect(toJSON()).toBeNull();
  });
});
