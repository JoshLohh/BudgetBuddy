import React from 'react';
import { render } from '@testing-library/react-native';
import GuestOnly from '../../../components/auth/GuestOnly';
import * as UserHook from '@/hooks/useUser';
import { Text } from 'react-native';


//mock expo-router's useRouter to avoid navigation errors
jest.mock('expo-router', () => ({
  useRouter: () => ({
    replace: jest.fn()
  }),
}));

describe('GuestOnly', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders children when user is not authenticated (guest)', () => {
    jest.spyOn(UserHook, 'useUser').mockReturnValue({
      user: null,
      profile: null,
      login: jest.fn(),
      register: jest.fn(),
      logout: jest.fn(),
      updateProfile: jest.fn(),
      authChecked: true,
      refetchProfile: jest.fn(),
    });

    const { getByText } = render(
      <GuestOnly>
        <Text>Guest Content</Text>
      </GuestOnly>
    );
    expect(getByText('Guest Content')).toBeTruthy();
  });

  it('renders null when user is authenticated', () => {
    jest.spyOn(UserHook, 'useUser').mockReturnValue({
      user: { id: '123', name: 'Alice' },
      profile: {},
      login: jest.fn(),
      register: jest.fn(),
      logout: jest.fn(),
      updateProfile: jest.fn(),
      authChecked: true,
      refetchProfile: jest.fn(),
    });

    const { queryByText } = render(
      <GuestOnly>
        <Text>Guest Content</Text>
      </GuestOnly>
    );
    expect(queryByText('Guest Content')).toBeNull();
  });

  it('renders null when user data is loading', () => {
    jest.spyOn(UserHook, 'useUser').mockReturnValue({
      user: null,
      profile: null,
      login: jest.fn(),
      register: jest.fn(),
      logout: jest.fn(),
      updateProfile: jest.fn(),
      authChecked: false,
      refetchProfile: jest.fn(),
    });

    const { queryByText } = render(
      <GuestOnly>
        <Text>Guest Content</Text>
      </GuestOnly>
    );
    expect(queryByText('Guest Content')).toBeNull();
  });

  it('matches snapshot when rendering guest content', () => {
    jest.spyOn(UserHook, 'useUser').mockReturnValue({
      user: null,
      profile: null,
      login: jest.fn(),
      register: jest.fn(),
      logout: jest.fn(),
      updateProfile: jest.fn(),
      authChecked: true,
      refetchProfile: jest.fn(),
    });

    const { toJSON } = render(
      <GuestOnly>
        <Text>Guest Content</Text>
      </GuestOnly>
    );

    expect(toJSON()).toMatchSnapshot();
  });

  it('matches snapshot when user is authenticated (renders null)', () => {
    jest.spyOn(UserHook, 'useUser').mockReturnValue({
      user: { id: '123', name: 'Alice' },
      profile: {},
      login: jest.fn(),
      register: jest.fn(),
      logout: jest.fn(),
      updateProfile: jest.fn(),
      authChecked: true,
      refetchProfile: jest.fn(),
    });

    const { toJSON } = render(
      <GuestOnly>
        <Text>Guest Content</Text>
      </GuestOnly>
    );

    expect(toJSON()).toMatchSnapshot();
  });
});

/**
 * Test summary:
 * - Verifies GuestOnly renders children only for unauthenticated users.
 * - Ensures it returns null for authenticated users and during loading state.
 * - Snapshot tests catch structural regressions.
 * - Uses jest.spyOn and mocks to mimic different authentication states.
 */
