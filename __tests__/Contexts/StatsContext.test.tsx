import React from 'react';
import { render, waitFor, act, fireEvent } from '@testing-library/react-native';
import { Text, Button } from 'react-native';

import { StatsProvider, useStats } from '@/contexts/StatsContext';
import { UserContext } from '@/contexts/UserContext';

jest.mock('@/lib/appwrite', () => ({
  databases: {
    listDocuments: jest.fn(),
  },
}));

const TEST_USER = { $id: 'u1', email: 'user@test.com' };

const mockListDocuments = require('@/lib/appwrite').databases.listDocuments as jest.Mock;

// ✅ Defines the full UserContext shape to make rendering safe
function mockUserContextValue(user: { $id: string; email: string } | null = TEST_USER) {
  return {
    user,
    profile: null,
    login: jest.fn(),
    register: jest.fn(),
    logout: jest.fn(),
    updateProfile: jest.fn(),
    authChecked: true,
    refetchProfile: jest.fn(),
  };
}

function renderWithUser(children: React.ReactNode, user: any = TEST_USER) {
  return render(
    <UserContext.Provider value={mockUserContextValue(user)}>
      <StatsProvider>{children}</StatsProvider>
    </UserContext.Provider>
  );
}

function StatsConsumerComponent() {
  const stats = useStats();
  return (
    <>
      <Text testID="groups-count">{stats.groupsCount}</Text>
      <Text testID="user-expenses-count">{stats.userExpensesCount}</Text>
      <Text testID="user-total-spent">{stats.userTotalSpent}</Text>
      <Text testID="loading">{String(stats.loading)}</Text>
      <Button testID="refetch" title="refetch" onPress={stats.refetchStats} />
    </>
  );
}

describe('StatsContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('throws error if useStats is used outside provider', () => {
    function Broken() {
      useStats();
      return null;
    }

    expect(() => render(<Broken />)).toThrow(
      'useStats must be used within StatsProvider'
    );
  });

  it('provides zeros when no user is present', async () => {
    const { getByTestId } = renderWithUser(<StatsConsumerComponent />, null);
    

    await waitFor(() => {
      expect(getByTestId('groups-count').props.children).toBe(0);
      expect(getByTestId('user-expenses-count').props.children).toBe(0);
      expect(getByTestId('user-total-spent').props.children).toBe(0);
      expect(getByTestId('loading').props.children).toBe('false');
    });
  });

  it('fetches and aggregates stats when user is present', async () => {
    mockListDocuments
      // Groups result
      .mockResolvedValueOnce({
        documents: [
          { $id: 'g1', members: [TEST_USER.$id] },
          { $id: 'g2', members: [TEST_USER.$id] },
        ],
      })
      // Expenses result
      .mockResolvedValueOnce({
        documents: [
          { groupId: 'g1', paidBy: TEST_USER.$id, amount: '12.5' },
          { groupId: 'g1', paidBy: TEST_USER.$id, amount: 13 },
          { groupId: 'g2', paidBy: TEST_USER.$id, amount: 'notanumber' },
        ],
      });

    const { getByTestId } = renderWithUser(<StatsConsumerComponent />);

    await waitFor(() => {
      expect(getByTestId('groups-count').props.children).toBe(2);
      expect(getByTestId('user-expenses-count').props.children).toBe(3);
      expect(getByTestId('user-total-spent').props.children).toBe(25.5);
      expect(getByTestId('loading').props.children).toBe('false');
    });
  });

  it('sets stats to zero if user has no groups', async () => {
    mockListDocuments.mockResolvedValueOnce({ documents: [] });

    const { getByTestId } = renderWithUser(<StatsConsumerComponent />);

    await waitFor(() => {
      expect(getByTestId('groups-count').props.children).toBe(0);
      expect(getByTestId('user-expenses-count').props.children).toBe(0);
      expect(getByTestId('user-total-spent').props.children).toBe(0);
    });
  });

  it('sets stats to zero and loading false on error', async () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {}); // <-- suppress error output
    mockListDocuments.mockRejectedValueOnce(new Error('Failed'));
    

    const { getByTestId } = renderWithUser(<StatsConsumerComponent />);

    await waitFor(() => {
      expect(getByTestId('groups-count').props.children).toBe(0);
      expect(getByTestId('user-expenses-count').props.children).toBe(0);
      expect(getByTestId('user-total-spent').props.children).toBe(0);
      expect(getByTestId('loading').props.children).toBe('false');
    });

    errorSpy.mockRestore(); // <-- restore normal console.error after test
  });

  it('manual refetchStats works', async () => {
    mockListDocuments
      .mockResolvedValueOnce({ documents: [{ $id: 'g1', members: [TEST_USER.$id] }] })
      .mockResolvedValueOnce({ documents: [{ groupId: 'g1', paidBy: TEST_USER.$id, amount: 10 }] })
      .mockResolvedValueOnce({ documents: [{ $id: 'g1', members: [TEST_USER.$id, 'u2'] }] })
      .mockResolvedValueOnce({ documents: [{ groupId: 'g1', paidBy: TEST_USER.$id, amount: 20 }] });

    const { getByTestId } = renderWithUser(<StatsConsumerComponent />);

    await waitFor(() => {
      expect(getByTestId('user-total-spent').props.children).toBe(10);
    });

    // Manually refetch
    await act(async () => {
      fireEvent.press(getByTestId('refetch'));
    });

    await waitFor(() => {
      expect(getByTestId('user-total-spent').props.children).toBe(20);
    });
  });

  it('reacts to user logout and login', async () => {
    mockListDocuments
      .mockResolvedValueOnce({ documents: [{ $id: 'g1', members: [TEST_USER.$id] }] })
      .mockResolvedValueOnce({ documents: [{ groupId: 'g1', paidBy: TEST_USER.$id, amount: 5 }] })
      .mockResolvedValueOnce({ documents: [] }); // after logout

    const { rerender, getByTestId } = render(
      <UserContext.Provider value={mockUserContextValue(TEST_USER)}>
        <StatsProvider>
          <StatsConsumerComponent />
        </StatsProvider>
      </UserContext.Provider>
    );

    await waitFor(() => {
      expect(getByTestId('user-total-spent').props.children).toBe(5);
    });

    // Simulate logout
    rerender(
      <UserContext.Provider value={mockUserContextValue(null)}>
        <StatsProvider>
          <StatsConsumerComponent />
        </StatsProvider>
      </UserContext.Provider>
    );

    await waitFor(() => {
      expect(getByTestId('user-total-spent').props.children).toBe(0);
    });
  });
});
