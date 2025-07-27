/**
 * Tests for GroupLayout component.
 * Covers authentication gating via UserOnly and navigation stack setup.
 * Uses mocks for user hook and router to isolate behavior.
 */

import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import { useUser } from '@/hooks/useUser';
import { useRouter } from 'expo-router';
import { Text } from 'react-native';

import GroupLayout from '@/app/(tabs)/group/_layout';

// Mocks
jest.mock('@/hooks/useUser');
jest.mock('expo-router', () => ({
  Stack: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useRouter: jest.fn(),
}));

describe('GroupLayout', () => {
  const mockUseUser = useUser as jest.Mock;
  const mockUseRouter = useRouter as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders children when user is authenticated', async () => {
    mockUseUser.mockReturnValue({
      user: { id: '123', name: 'Test User' },
      authChecked: true,
    });

    const { getByText } = render(
      <GroupLayout>
        <Text>Group Content</Text>
      </GroupLayout>
    );

    expect(getByText('Group Content')).toBeTruthy();
  });

  it('redirects to login when user is not authenticated', async () => {
    const replaceMock = jest.fn();
    mockUseUser.mockReturnValue({ user: null, authChecked: true });
    mockUseRouter.mockReturnValue({ replace: replaceMock });

    render(
      <GroupLayout>
        <Text>Group Content</Text>
      </GroupLayout>
    );

    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith('/login');
    });
  });

  it('renders loading state when auth is not checked yet', () => {
    mockUseUser.mockReturnValue({ user: null, authChecked: false });

    const tree = render(
      <GroupLayout>
        <Text>Group Content</Text>
      </GroupLayout>
    );

    // Expect some fallback or loader - depending on UserOnly implementation (here tested via absence of children)
    expect(tree.queryByText('Group Content')).toBeNull();
  });

  //Snapshot
  it('matches snapshot when user is authenticated', () => {
    mockUseUser.mockReturnValue({
      user: { id: '456', name: 'Snapshot User' },
      authChecked: true,
    });

    const tree = render(
      <GroupLayout>
        <Text>Snapshot Content</Text>
      </GroupLayout>
    );

    expect(tree.toJSON()).toMatchSnapshot();
  });

});
